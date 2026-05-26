import { useMemo, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Alert, RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
import type { CreateExpenseFormData } from '@features/expenses/types'
import type { ExpenseWithSplits } from '@/types'

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
  const [balancesExpanded, setBalancesExpanded] = useState(true)
  const [settledExpanded, setSettledExpanded] = useState(false)
  const insets = useSafeAreaInsets()

  const balances = useMemo(
    () => calculateBalances(expenses ?? [], collaborators, settlements ?? []),
    [expenses, collaborators, settlements]
  )

  const debtTransactions = useMemo(
    () => calculateDebtResolution(balances),
    [balances]
  )

  const currentUserBalance = balances.find((b) => b.user_id === currentUser?.id)

  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y })

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
      <View style={{ flex: 1 }}>
      {isLoading ? (
        <View className="px-5 pt-4 gap-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <Animated.ScrollView
          contentContainerClassName="px-5 pb-28"
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {/* Summary */}
          {(expenses?.length ?? 0) > 0 && (
            <View className="mt-4">
              <ExpenseSummaryCard
                expenses={expenses ?? []}
                currentUserId={currentUser?.id}
                currentUserBalance={currentUserBalance}
              />
            </View>
          )}

          {/* Ajustes recomendados — sección principal accionable */}
          {debtTransactions.length > 0 && (
            <View className="mt-6 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Ajustes recomendados
                </Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">{debtTransactions.length} pendiente{debtTransactions.length !== 1 ? 's' : ''}</Text>
              </View>
              {debtTransactions.map((tx, i) => {
                const isInvolved = tx.fromUserId === currentUser?.id || tx.toUserId === currentUser?.id
                return (
                  <DebtResolutionCard
                    key={`${tx.fromUserId}-${tx.toUserId}-${i}`}
                    transaction={tx}
                    isCurrentUserFrom={tx.fromUserId === currentUser?.id}
                    isCurrentUserTo={tx.toUserId === currentUser?.id}
                    onSettle={isInvolved && currentUser?.id
                      ? () => settleDebt.mutate({ fromUserId: tx.fromUserId, toUserId: tx.toUserId, amount: tx.amount, settledBy: currentUser.id })
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
            </View>
          )}

          {/* Saldados — historial de payments confirmados */}
          {(settlements?.length ?? 0) > 0 && (
            <View className="mt-6 gap-3">
              <TouchableOpacity
                onPress={() => setSettledExpanded(!settledExpanded)}
                className="flex-row items-center justify-between active:opacity-70"
              >
                <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Saldados
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs text-neutral-500 dark:text-neutral-400">{settlements!.length}</Text>
                  <Ionicons
                    name={settledExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#8d99ae"
                  />
                </View>
              </TouchableOpacity>
              {settledExpanded && settlements!.map((s) => (
                <SettledCard
                  key={s.id}
                  settlement={s}
                  collaborators={collaborators}
                  currentUserId={currentUser?.id}
                />
              ))}
            </View>
          )}

          {/* Balances — colapsable, informacional */}
          {balances.length > 0 && (
            <View className="mt-6 gap-3">
              <TouchableOpacity
                onPress={() => setBalancesExpanded(!balancesExpanded)}
                className="flex-row items-center justify-between active:opacity-70"
              >
                <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Balances
                </Text>
                <Ionicons
                  name={balancesExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#8d99ae"
                />
              </TouchableOpacity>
              {balancesExpanded && balances.map((b) => (
                <BalanceCard
                  key={b.user_id}
                  balance={b}
                  isCurrentUser={b.user_id === currentUser?.id}
                />
              ))}
            </View>
          )}

          {/* Lista de gastos — informacional */}
          <View className="mt-6 gap-3">
            <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              Gastos ({expenses?.length ?? 0})
            </Text>
            {!expenses?.length ? (
              <EmptyState
                icon="wallet-outline"
                title="Sin gastos aún"
                subtitle="Registra los gastos del viaje y divide con el grupo automáticamente"
                actionLabel="Añadir primer gasto"
                onAction={() => setSheetVisible(true)}
              />
            ) : (
              expenses.map((expense) => {
                const isPayer = expense.payer_id === currentUser?.id
                return (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    currentUserId={currentUser?.id}
                    onPress={() => router.push({
                      pathname: '/(app)/trips/expense/[expenseId]' as never,
                      params: { expenseId: expense.id, tripId },
                    })}
                    onEdit={isPayer ? () => handleEdit(expense) : undefined}
                    onDelete={isPayer ? () => handleDelete(expense) : undefined}
                  />
                )
              })
            )}
          </View>
        </Animated.ScrollView>
      )}

      {/* FAB */}
      {!isLoading && (
        <TouchableOpacity
          onPress={() => setSheetVisible(true)}
          className="absolute right-5 w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
          style={{ bottom: insets.bottom + 16, ...fabShadow }}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
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
        initialData={editingExpense ? {
          description: editingExpense.description,
          amount: editingExpense.amount,
          payer_id: editingExpense.payer_id,
          experience_id: editingExpense.experience_id ?? undefined,
          participant_ids: editingExpense.splits.map((s) => s.user_id),
        } : undefined}
      />
      </View>
    </View>
  )
}
