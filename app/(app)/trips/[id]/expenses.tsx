import { useMemo, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
import { useCreateExpense } from '@features/expenses/hooks/useCreateExpense'
import { useExpenses } from '@features/expenses/hooks/useExpenses'
import { useSettleDebt } from '@features/expenses/hooks/useSettleDebt'
import { useSettlements } from '@features/expenses/hooks/useSettlements'
import { calculateBalances } from '@features/expenses/utils/calculateBalances'
import { calculateDebtResolution } from '@features/expenses/utils/calculateDebtResolution'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import type { CreateExpenseFormData } from '@features/expenses/types'

export default function ExpensesScreen() {
  const { tripId, collaborators } = useTripContext()
  const { data: currentUser } = useCurrentUser()
  const { data: expenses, isLoading, isFetching, refetch } = useExpenses(tripId)
  const createExpense = useCreateExpense(tripId, collaborators)
  const settleDebt = useSettleDebt(tripId)
  const { data: settlements } = useSettlements(tripId)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [balancesExpanded, setBalancesExpanded] = useState(true)
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

  const handleCreate = async (data: CreateExpenseFormData) => {
    try {
      await createExpense.mutateAsync(data)
      setSheetVisible(false)
    } catch {
      // Error visible en el sheet
    }
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
                <Text className="text-xs text-neutral-400 dark:text-neutral-500">{debtTransactions.length} pendiente{debtTransactions.length !== 1 ? 's' : ''}</Text>
              </View>
              {debtTransactions.map((tx, i) => (
                <DebtResolutionCard
                  key={`${tx.fromUserId}-${tx.toUserId}-${i}`}
                  transaction={tx}
                  isCurrentUserFrom={tx.fromUserId === currentUser?.id}
                  isCurrentUserTo={tx.toUserId === currentUser?.id}
                  onSettle={() => settleDebt.mutate({ fromUserId: tx.fromUserId, toUserId: tx.toUserId, amount: tx.amount })}
                  isSettling={
                    settleDebt.isPending &&
                    settleDebt.variables?.fromUserId === tx.fromUserId &&
                    settleDebt.variables?.toUserId === tx.toUserId
                  }
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
              expenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  currentUserId={currentUser?.id}
                />
              ))
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
        onClose={() => setSheetVisible(false)}
        onSubmit={handleCreate}
        isLoading={createExpense.isPending}
        error={createExpense.error?.message}
        currentUserId={currentUser?.id}
      />
      </View>
    </View>
  )
}
