import { useEffect, useMemo, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Alert, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useColorScheme } from 'nativewind'
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  LinearTransition,
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
  const [collapsed, setCollapsed] = useState(false)
  const rotation = useSharedValue(0)
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))
  const toggle = () => {
    rotation.value = withTiming(collapsed ? 0 : 180, { duration: 220, easing: Easing.out(Easing.cubic) })
    setCollapsed(prev => !prev)
  }

  const iconColor = CATEGORY_ICON_COLORS[group.category][colorScheme === 'dark' ? 'dark' : 'light']

  return (
    <Animated.View style={staggerStyle} layout={LinearTransition.duration(280)}>
      <View
        className="rounded-2xl overflow-hidden"
        style={Platform.select({
          android: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.10)' },
          default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
        })}
      >
        <View className="bg-white dark:bg-surface-800">
          <TouchableOpacity onPress={toggle} activeOpacity={0.85}>
            <View className="flex-row items-center gap-3 pl-5 pr-4 py-3.5">
              <View className="absolute top-0 left-0 bottom-0 w-[3px]" style={{ backgroundColor: iconColor, opacity: 0.65 }} pointerEvents="none" />
            <View
              className="w-11 h-11 rounded-xl items-center justify-center"
              style={{ backgroundColor: iconColor + '26' }}
            >
              <Ionicons
                name={CATEGORY_ICON[group.category]}
                size={22}
                color={iconColor}
              />
            </View>
            <View className="flex-1 flex-row items-center gap-2">
              <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50" numberOfLines={1}>
                {t(CATEGORY_LABEL_KEY[group.category])}
              </Text>
              <View
                className="rounded-full px-1.5 py-0.5"
                style={{ backgroundColor: iconColor + '26' }}
              >
                <Text className="text-xs font-semibold" style={{ color: iconColor }}>
                  {group.expenses.length}
                </Text>
              </View>
            </View>
            <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
              {formatCurrency(group.subtotal, currency)}
            </Text>
            <View
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: iconColor + '1A' }}
            >
              <Animated.View style={chevronStyle}>
                <Ionicons name="chevron-down" size={16} color={iconColor} />
              </Animated.View>
            </View>
          </View>
        </TouchableOpacity>

        {!collapsed && (
          <Animated.View entering={FadeInDown.duration(220).easing(Easing.out(Easing.quad))} exiting={FadeOut.duration(150).easing(Easing.in(Easing.quad))}>
            <View className="h-px bg-neutral-200 dark:bg-surface-600" />

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
                  <View className="h-px bg-neutral-100 dark:bg-surface-700/60 mx-4" />
                )}
              </View>
            ))}
          </Animated.View>
        )}
        </View>
      </View>
    </Animated.View>
  )
}

export default function ExpensesScreen() {
  const { tripId, collaborators, activeCollaborators, trip } = useTripContext()
  const tripCurrency = trip.currency ?? 'EUR'
  const router = useRouter()
  const { t } = useTranslation()
  const { data: currentUser } = useCurrentUser()
  const { data: expenses, isLoading, isFetching, refetch } = useExpenses(tripId)
  const { data: experiences } = useExperiences(tripId)
  const createExpense = useCreateExpense(tripId, activeCollaborators, tripCurrency)
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

  const sortedDebtTransactions = useMemo(() => {
    if (!currentUser?.id) return debtTransactions
    return [...debtTransactions].sort((a, b) => {
      const aInvolved = a.fromUserId === currentUser.id || a.toUserId === currentUser.id ? 0 : 1
      const bInvolved = b.fromUserId === currentUser.id || b.toUserId === currentUser.id ? 0 : 1
      return aInvolved - bInvolved
    })
  }, [debtTransactions, currentUser?.id])

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
    if (key === activeTab) return
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
                sortedDebtTransactions.length > 0 ? (
                  <>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                        {t('expenses_pending_label')}
                      </Text>
                      <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                        {t(sortedDebtTransactions.length === 1 ? 'expenses_pending_count_one' : 'expenses_pending_count_other', { count: sortedDebtTransactions.length })}
                      </Text>
                    </View>
                    {sortedDebtTransactions.map((tx, i) => {
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
                    {balances.map((b, i) => (
                      <BalanceCard
                        key={b.user_id}
                        balance={b}
                        isCurrentUser={b.user_id === currentUser?.id}
                        currency={tripCurrency}
                        index={i}
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
        collaborators={activeCollaborators}
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
