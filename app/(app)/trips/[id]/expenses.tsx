import { useMemo, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EmptyState } from '@components/ui/EmptyState'
import { SkeletonCard } from '@components/ui/Skeleton'
import { TripHeader } from '@features/trips/components/TripHeader'
import { useTripContext } from '@features/trips/TripProvider'
import { AddExpenseSheet } from '@features/expenses/components/AddExpenseSheet'
import { BalanceCard } from '@features/expenses/components/BalanceCard'
import { ExpenseCard } from '@features/expenses/components/ExpenseCard'
import { useCreateExpense } from '@features/expenses/hooks/useCreateExpense'
import { useExpenses } from '@features/expenses/hooks/useExpenses'
import { useSettleExpense } from '@features/expenses/hooks/useSettleExpense'
import { calculateBalances } from '@features/expenses/utils/calculateBalances'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import type { CreateExpenseFormData } from '@features/expenses/types'

export default function ExpensesScreen() {
  const { tripId, collaborators } = useTripContext()
  const { data: currentUser } = useCurrentUser()
  const { data: expenses, isLoading, refetch } = useExpenses(tripId)
  const createExpense = useCreateExpense(tripId)
  const settleExpense = useSettleExpense(tripId)
  const [sheetVisible, setSheetVisible] = useState(false)

  const balances = useMemo(
    () => calculateBalances(expenses ?? [], collaborators),
    [expenses, collaborators]
  )

  const handleCreate = async (data: CreateExpenseFormData) => {
    try {
      await createExpense.mutateAsync(data)
      setSheetVisible(false)
    } catch {
      // Error se muestra en el sheet
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
      <TripHeader />

      {isLoading ? (
        <View className="px-5 pt-4 gap-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-5 pb-24"
          onScrollEndDrag={() => refetch()}
          showsVerticalScrollIndicator={false}
        >
          {/* Balances */}
          {balances.length > 0 && (
            <View className="mt-4 gap-3">
              <Text className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                Balances
              </Text>
              {balances.map((b) => (
                <BalanceCard
                  key={b.user_id}
                  balance={b}
                  isCurrentUser={b.user_id === currentUser?.id}
                />
              ))}
            </View>
          )}

          {/* Expenses */}
          <View className="mt-6 gap-3">
            <Text className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
              Gastos ({expenses?.length ?? 0})
            </Text>
            {!expenses?.length ? (
              <EmptyState
                icon="wallet-outline"
                title="Sin gastos"
                subtitle="Registra los gastos del viaje y divide con el grupo"
                actionLabel="Añadir gasto"
                onAction={() => setSheetVisible(true)}
              />
            ) : (
              expenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  currentUserId={currentUser?.id}
                  onSettle={() => settleExpense.mutate(expense.id)}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* FAB */}
      {!isLoading && (
        <TouchableOpacity
          onPress={() => setSheetVisible(true)}
          className="absolute bottom-8 right-5 w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
          style={{ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
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
      />
    </SafeAreaView>
  )
}
