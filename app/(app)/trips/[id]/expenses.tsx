import { useEffect, useMemo, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Alert, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useColorScheme } from 'nativewind'
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
import { formatCurrency } from '@utils/currency'
import {
  getExpenseCategory,
  CATEGORY_ORDER,
  CATEGORY_ICON,
  CATEGORY_BG,
  CATEGORY_ICON_COLORS,
  CATEGORY_LABEL_KEY,
  type ExpenseCategory,
} from '@features/expenses/utils/getExpenseCategory'
import type { CreateExpenseFormData } from '@features/expenses/types'
import type { ExpenseWithSplits } from '@/types'

type ActiveTab = 'gastos' | 'ajustes' | 'saldos'

type ExpenseGroup = {
  category: ExpenseCategory
  expenses: ExpenseWithSplits[]
  subtotal: number
}

function CategoryExpenseCard({
  group,
  index,
  currency,
  currentUserId,
  onExpensePress,
  onExpenseEdit,
  onExpenseDelete,
}: {
  group: ExpenseGroup
  index: number
  currency: string
  currentUserId?: string
  onExpensePress: (expense: ExpenseWithSplits) => void
  onExpenseEdit: (expense: ExpenseWithSplits) => void
  onExpenseDelete: (expense: ExpenseWithSplits) => void
}) {
  const staggerStyle = useStaggerEnter(index, { delay: 80, distance: 12 })
  const { colorScheme } = useColorScheme()
  const { t } = useTranslation()

  return (
    <Animated.View style={staggerStyle}>
      <View
        className="rounded-2xl overflow-hidden"
        style={Platform.select({
          android: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.10)' },
          default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
        })}
      >
        <View className="flex-row items-center gap-3 px-4 py-3 bg-white dark:bg-surface-800">
          <View className={`w-9 h-9 rounded-xl items-center justify-center ${CATEGORY_BG[group.category]}`}>
            <Ionicons
              name={CATEGORY_ICON[group.category]}
              size={20}
              color={CATEGORY_ICON_COLORS[group.category][colorScheme === 'dark' ? 'dark' : 'light']}
            />
          </View>
          <Text className="flex-1 text-base font-bold text-neutral-900 dark:text-neutral-50">
            {t(CATEGORY_LABEL_KEY[group.category])}
          </Text>
          <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">
            {formatCurrency(group.subtotal, currency)}
          </Text>
        </View>

        <View className="bg-neutral-100 dark:bg-neutral-700/50" style={{ height: StyleSheet.hairlineWidth }} />

        {group.expenses.map((expense, i) => (
          <View key={expense.id}>
            <ExpenseCard
              expense={expense}
              currency={currency}
              currentUserId={currentUserId}
              showCategoryIcon={false}
              standalone={false}
              onPress={() => onExpensePress(expense)}
              onEdit={expense.payer_id === currentUserId ? () => onExpenseEdit(expense) : undefined}
              onDelete={expense.payer_id === currentUserId ? () => onExpenseDelete(expense) : undefined}
            />
            {i < group.expenses.length - 1 && (
              <View className="bg-neutral-100 dark:bg-neutral-700/50 mx-4" style={{ height: StyleSheet.hairlineWidth }} />
            )}
          </View>
        ))}
      </View>
    </Animated.View>
  )
}

export default function ExpensesScreen() {
  const { tripId, collaborators, trip } = useTripContext()
  const tripCurrency = trip.currency ?? 'EUR'
  const router = useRouter()
  const { t } = useTranslation()
  const { data: currentUser } = useCurrentUser()
  const { data: expenses, isLoading, isFetching, refetch } = useExpenses(tripId)
  const { data: experiences } = useExperiences(tripId)
  const createExpense = useCreateExpense(tripId, collaborators, tripCurrency)
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

  const groupedExpenses = useMemo((): ExpenseGroup[] => {
    if (!expenses?.length) return []
    const map = new Map<ExpenseCategory, ExpenseWithSplits[]>()
    for (const expense of expenses) {
      const category = getExpenseCategory(expense.description, expense.experience?.type as ExpenseCategory | null)
      const arr = map.get(category) ?? []
      arr.push(expense)
      map.set(category, arr)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => b.created_at.localeCompare(a.created_at))
    }
    return CATEGORY_ORDER
      .filter((cat) => map.has(cat))
      .map((category) => {
        const catExpenses = map.get(category)!
        return {
          category,
          expenses: catExpenses,
          subtotal: catExpenses.reduce((s, e) => s + e.amount, 0),
        }
      })
  }, [expenses])

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
      t('common_delete'),
      t('wishlist_delete_body', { name: expense.description }),
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: t('common_delete'),
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
                  currency={tripCurrency}
                />
              </View>
            ) : (
              <View />
            )}

            {/* index 1: sticky tab bar */}
            <SegmentedTabBar
              tabs={[
                { key: 'gastos', label: t('expenses_tab_expenses') },
                { key: 'ajustes', label: t('expenses_tab_adjustments'), badge: debtTransactions.length },
                { key: 'saldos', label: t('expenses_tab_balances') },
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
                    title={t('expenses_empty_title')}
                    subtitle={t('expenses_empty_subtitle')}
                    actionLabel={t('expenses_empty_action')}
                    onAction={() => setSheetVisible(true)}
                  />
                ) : (
                  <View className="gap-4">
                    {groupedExpenses.map((group, i) => (
                      <CategoryExpenseCard
                        key={group.category}
                        group={group}
                        index={i}
                        currency={tripCurrency}
                        currentUserId={currentUser?.id}
                        onExpensePress={(expense) =>
                          router.push({
                            pathname: '/(app)/trips/expense/[expenseId]' as never,
                            params: { expenseId: expense.id, tripId },
                          })
                        }
                        onExpenseEdit={handleEdit}
                        onExpenseDelete={handleDelete}
                      />
                    ))}
                  </View>
                )
              )}

              {/* Tab: Ajustes */}
              {activeTab === 'ajustes' && (
                debtTransactions.length > 0 ? (
                  <>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                        {t('expenses_pending_label')}
                      </Text>
                      <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                        {t(debtTransactions.length === 1 ? 'expenses_pending_count_one' : 'expenses_pending_count_other', { count: debtTransactions.length })}
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
                          currency={tripCurrency}
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
                            {t('expenses_settled_label')}
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
                            currency={tripCurrency}
                          />
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <EmptyState
                      icon="checkmark-circle-outline"
                      title={t('expenses_all_settled_title')}
                      subtitle={t('expenses_all_settled_subtitle')}
                    />
                    {(settlements?.length ?? 0) > 0 && (
                      <>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                            {t('expenses_settled_label')}
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
                            currency={tripCurrency}
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
                      {t('expenses_balance_section')}
                    </Text>
                    {balances.map((b) => (
                      <BalanceCard
                        key={b.user_id}
                        balance={b}
                        isCurrentUser={b.user_id === currentUser?.id}
                        currency={tripCurrency}
                      />
                    ))}
                  </>
                ) : (
                  <EmptyState
                    icon="people-outline"
                    title={t('expenses_no_balances_title')}
                    subtitle={t('expenses_no_balances_subtitle')}
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
        tripCurrency={tripCurrency}
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
