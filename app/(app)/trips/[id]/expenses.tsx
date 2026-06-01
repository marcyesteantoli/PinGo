import { useEffect, useMemo, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Alert, RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { fabShadow } from '@lib/shadows'
import { EmptyState } from '@components/ui/EmptyState'
import { SkeletonCard } from '@components/ui/Skeleton'
import { TripHeader } from '@features/trips/components/TripHeader'
import { useTripContext } from '@features/trips/TripProvider'
import { AddExpenseSheet } from '@features/expenses/components/AddExpenseSheet'
import { BalanceCard } from '@features/expenses/components/BalanceCard'
import { ExpenseCard } from '@features/expenses/components/ExpenseCard'
import { ExpenseSummaryCard } from '@features/expenses/components/ExpenseSummaryCard'
import { DebtResolutionCard } from '@features/expenses/components/DebtResolutionCard'
import { SettledCard } from '@features/expenses/components/SettledCard'
import { SegmentedTabBar } from '@components/ui/SegmentedTabBar'
import { useCreateExpense } from '@features/expenses/hooks/useCreateExpense'
import { useDeleteExpense } from '@features/expenses/hooks/useDeleteExpense'
import { useUpdateExpense } from '@features/expenses/hooks/useUpdateExpense'
import { useExpenses } from '@features/expenses/hooks/useExpenses'
import { useSettleDebt } from '@features/expenses/hooks/useSettleDebt'
import { useSettlements } from '@features/expenses/hooks/useSettlements'
import { calculateBalances } from '@features/expenses/utils/calculateBalances'
import { calculateDebtResolution } from '@features/expenses/utils/calculateDebtResolution'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { useExperiences } from '@features/timeline/hooks/useExperiences'
import { useStaggerEnter } from '@lib/useStaggerEnter'
import { useFabScroll } from '@lib/useFabScroll'
import { EASE_OUT, DURATION } from '@lib/animations'
import type { CreateExpenseFormData } from '@features/expenses/types'
import type { ExpenseWithSplits } from '@/types'

type ActiveTab = 'gastos' | 'ajustes' | 'saldos'

function StaggeredExpenseCard({
  expense,
  index,
  currentUserId,
  onPress,
  onEdit,
  onDelete,
}: {
  expense: ExpenseWithSplits
  index: number
  currentUserId?: string
  onPress: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const staggerStyle = useStaggerEnter(index, { delay: 50, distance: 8 })
  return (
    <Animated.View style={staggerStyle}>
      <ExpenseCard
        expense={expense}
        currentUserId={currentUserId}
        onPress={onPress}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </Animated.View>
  )
}

export default function ExpensesScreen() {
  const { tripId, collaborators } = useTripContext()
  const router = useRouter()
  const { data: currentUser } = useCurrentUser()
  const { data: expenses, isLoading, isFetching, refetch } = useExpenses(tripId)
  const { data: experiences } = useExperiences(tripId)
  const createExpense = useCreateExpense(tripId, collaborators)
  const updateExpense = useUpdateExpense(tripId, collaborators)
  const deleteExpense = useDeleteExpense(tripId)
  const settleDebt = useSettleDebt(tripId)
  const { data: settlements } = useSettlements(tripId)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseWithSplits | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('gastos')

  const balances = useMemo(
    () => calculateBalances(expenses ?? [], collaborators, settlements ?? []),
    [expenses, collaborators, settlements]
  )

  const debtTransactions = useMemo(
    () => calculateDebtResolution(balances),
    [balances]
  )

  const currentUserBalance = balances.find((b) => b.user_id === currentUser?.id)

  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollY = useSharedValue(0)
  const contentOpacity = useSharedValue(1)
  const contentAnimStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }))
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y
  })

  const { fabVisible, fabAnimStyle } = useFabScroll(scrollY)

  const handleTabChange = (key: string) => {
    scrollTo(scrollRef, 0, 0, true)
    fabVisible.value = 1
    contentOpacity.value = withTiming(0, { duration: 100, easing: EASE_OUT })
    setTimeout(() => setActiveTab(key as ActiveTab), 110)
  }

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: DURATION.normal, easing: EASE_OUT })
  }, [activeTab])

  const handleSheetClose = () => {
    setSheetVisible(false)
    setEditingExpense(null)
  }

  const handleSubmit = async (data: CreateExpenseFormData) => {
    try {
      if (editingExpense) {
        await updateExpense.mutateAsync({ expenseId: editingExpense.id, formData: data })
      } else {
        await createExpense.mutateAsync(data)
      }
      setSheetVisible(false)
      setEditingExpense(null)
    } catch {
      // Error visible en el sheet
    }
  }

  const handleEdit = (expense: ExpenseWithSplits) => {
    setEditingExpense(expense)
    setSheetVisible(true)
  }

  const handleDelete = (expense: ExpenseWithSplits) => {
    Alert.alert(
      'Eliminar gasto',
      `¿Eliminar "${expense.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteExpense.mutate({ expenseId: expense.id }),
        },
      ]
    )
  }

  return (
    <View className="flex-1 bg-neutral-100 dark:bg-surface-900">
      <TripHeader scrollY={scrollY} />

      {isLoading ? (
        <View className="px-5 pt-4 gap-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <View className="flex-1">
          <Animated.ScrollView
            ref={scrollRef}
            stickyHeaderIndices={[1]}
            refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />}
            showsVerticalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          >
            {/* index 0: scrolls away with content */}
            {(expenses?.length ?? 0) > 0 ? (
              <View className="px-5 pt-4">
                <ExpenseSummaryCard
                  expenses={expenses ?? []}
                  currentUserId={currentUser?.id}
                  currentUserBalance={currentUserBalance}
                />
              </View>
            ) : (
              <View />
            )}

            {/* index 1: sticky tab bar */}
            <SegmentedTabBar
              tabs={[
                { key: 'gastos', label: 'Gastos' },
                { key: 'ajustes', label: 'Ajustes', badge: debtTransactions.length },
                { key: 'saldos', label: 'Saldos' },
              ]}
              active={activeTab}
              onChange={handleTabChange}
            />

            {/* index 2: tab content */}
            <Animated.View style={contentAnimStyle} className="px-5 pt-2 pb-28 gap-5">
              {/* Tab: Gastos */}
              {activeTab === 'gastos' && (
                !expenses?.length ? (
                  <EmptyState
                    icon="wallet-outline"
                    title="Sin gastos aún"
                    subtitle="Registra los gastos del viaje y divide con el grupo automáticamente"
                    actionLabel="Añadir primer gasto"
                    onAction={() => setSheetVisible(true)}
                  />
                ) : (
                  expenses.map((expense, index) => {
                    const isPayer = expense.payer_id === currentUser?.id
                    return (
                      <StaggeredExpenseCard
                        key={expense.id}
                        expense={expense}
                        index={index}
                        currentUserId={currentUser?.id}
                        onPress={() =>
                          router.push({
                            pathname: '/(app)/trips/expense/[expenseId]' as never,
                            params: { expenseId: expense.id, tripId },
                          })
                        }
                        onEdit={isPayer ? () => handleEdit(expense) : undefined}
                        onDelete={isPayer ? () => handleDelete(expense) : undefined}
                      />
                    )
                  })
                )
              )}

              {/* Tab: Ajustes */}
              {activeTab === 'ajustes' && (
                debtTransactions.length > 0 ? (
                  <>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                        Pendientes
                      </Text>
                      <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                        {debtTransactions.length} pendiente{debtTransactions.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    {debtTransactions.map((tx, i) => {
                      const isInvolved =
                        tx.fromUserId === currentUser?.id || tx.toUserId === currentUser?.id
                      return (
                        <DebtResolutionCard
                          key={`${tx.fromUserId}-${tx.toUserId}-${i}`}
                          transaction={tx}
                          isCurrentUserFrom={tx.fromUserId === currentUser?.id}
                          isCurrentUserTo={tx.toUserId === currentUser?.id}
                          onSettle={
                            isInvolved && currentUser?.id
                              ? () =>
                                  settleDebt.mutate({
                                    fromUserId: tx.fromUserId,
                                    toUserId: tx.toUserId,
                                    amount: tx.amount,
                                    settledBy: currentUser.id,
                                  })
                              : undefined
                          }
                          isSettling={
                            settleDebt.isPending &&
                            settleDebt.variables?.fromUserId === tx.fromUserId &&
                            settleDebt.variables?.toUserId === tx.toUserId
                          }
                        />
                      )
                    })}

                    {(settlements?.length ?? 0) > 0 && (
                      <>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                            Saldados
                          </Text>
                          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                            {settlements!.length}
                          </Text>
                        </View>
                        {settlements!.map((s) => (
                          <SettledCard
                            key={s.id}
                            settlement={s}
                            collaborators={collaborators}
                            currentUserId={currentUser?.id}
                          />
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <EmptyState
                      icon="checkmark-circle-outline"
                      title="Todo en orden"
                      subtitle="No hay deudas pendientes en este viaje"
                    />
                    {(settlements?.length ?? 0) > 0 && (
                      <>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                            Saldados
                          </Text>
                          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                            {settlements!.length}
                          </Text>
                        </View>
                        {settlements!.map((s) => (
                          <SettledCard
                            key={s.id}
                            settlement={s}
                            collaborators={collaborators}
                            currentUserId={currentUser?.id}
                          />
                        ))}
                      </>
                    )}
                  </>
                )
              )}

              {/* Tab: Saldos */}
              {activeTab === 'saldos' && (
                balances.length > 0 ? (
                  <>
                    <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                      Balance por persona
                    </Text>
                    {balances.map((b) => (
                      <BalanceCard
                        key={b.user_id}
                        balance={b}
                        isCurrentUser={b.user_id === currentUser?.id}
                      />
                    ))}
                  </>
                ) : (
                  <EmptyState
                    icon="people-outline"
                    title="Sin balances"
                    subtitle="Los balances aparecerán cuando haya gastos registrados"
                  />
                )
              )}
            </Animated.View>
          </Animated.ScrollView>

          {/* FAB */}
          <Animated.View
            className="absolute right-5"
            style={[fabAnimStyle, { bottom: 16 }]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              onPress={() => setSheetVisible(true)}
              className="w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
              style={fabShadow}
            >
              <Ionicons name="add" size={28} color="#ffffff" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      <AddExpenseSheet
        visible={sheetVisible}
        onClose={handleSheetClose}
        onSubmit={handleSubmit}
        isLoading={createExpense.isPending || updateExpense.isPending}
        error={createExpense.error?.message ?? updateExpense.error?.message}
        currentUserId={currentUser?.id}
        collaborators={collaborators}
        experiences={experiences ?? []}
        initialData={
          editingExpense
            ? {
                description: editingExpense.description,
                amount: editingExpense.amount,
                payer_id: editingExpense.payer_id,
                experience_id: editingExpense.experience_id ?? undefined,
                participant_ids: editingExpense.splits.map((s) => s.user_id),
              }
            : undefined
        }
      />
    </View>
  )
}
