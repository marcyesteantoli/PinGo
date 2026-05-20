import { Text, View } from 'react-native'
import { formatCurrency } from '@utils/currency'
import type { ExpenseWithSplits, UserBalance } from '@types/index'

interface ExpenseSummaryCardProps {
  expenses: ExpenseWithSplits[]
  currentUserId?: string
  currentUserBalance?: UserBalance
}

export function ExpenseSummaryCard({ expenses, currentUserId, currentUserBalance }: ExpenseSummaryCardProps) {
  const totalViaje = expenses.reduce((sum, e) => sum + e.amount, 0)

  const miParte = expenses.reduce((sum, e) => {
    const split = e.splits.find((s) => s.user_id === currentUserId)
    return sum + (split?.amount ?? 0)
  }, 0)

  const balance = currentUserBalance?.balance ?? 0
  const isPositive = balance > 0.005
  const isNegative = balance < -0.005

  return (
    <View className="bg-white dark:bg-surface-800 rounded-2xl p-5 gap-4" style={{ elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 }}>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Resumen del viaje</Text>
        <Text className="text-xs text-neutral-400 dark:text-neutral-500">{expenses.length} gasto{expenses.length !== 1 ? 's' : ''}</Text>
      </View>

      <View className="items-center py-2">
        <Text className="text-[13px] text-neutral-400 dark:text-neutral-500 mb-1">Total gastado</Text>
        <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">{formatCurrency(totalViaje)}</Text>
      </View>

      <View className="flex-row border-t border-neutral-100 dark:border-surface-700 pt-4 gap-4">
        <View className="flex-1 items-center">
          <Text className="text-[13px] text-neutral-400 dark:text-neutral-500 mb-1">Mi parte</Text>
          <Text className="text-lg font-bold text-neutral-700 dark:text-neutral-200">{formatCurrency(miParte)}</Text>
        </View>

        <View className="w-px bg-neutral-100 dark:bg-surface-700" />

        <View className="flex-1 items-center">
          <Text className="text-[13px] text-neutral-400 dark:text-neutral-500 mb-1">Mi balance</Text>
          <Text className={`text-lg font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : isNegative ? 'text-red-500 dark:text-red-400' : 'text-neutral-400 dark:text-neutral-500'}`}>
            {isPositive ? '+' : ''}{formatCurrency(balance)}
          </Text>
          <Text className={`text-[13px] mt-0.5 ${isPositive ? 'text-green-500 dark:text-green-400' : isNegative ? 'text-red-400 dark:text-red-400' : 'text-neutral-400 dark:text-neutral-500'}`}>
            {isPositive ? 'Te deben' : isNegative ? 'Debes' : 'En paz'}
          </Text>
        </View>
      </View>
    </View>
  )
}
