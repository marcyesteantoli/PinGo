import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@utils/currency'
import type { ExpenseWithSplits, UserBalance } from '@types/index'

interface ExpenseSummaryCardProps {
  expenses: ExpenseWithSplits[]
  currentUserId?: string
  currentUserBalance?: UserBalance
  currency?: string
}

export function ExpenseSummaryCard({ expenses, currentUserId, currentUserBalance, currency = 'EUR' }: ExpenseSummaryCardProps) {
  const { t } = useTranslation()
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
        <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t('expenseSummary_title')}</Text>
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">{t('expenseSummary_count', { count: expenses.length })}</Text>
      </View>

      <View className="items-center py-2">
        <Text className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-1">{t('expenseSummary_total')}</Text>
        <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">{formatCurrency(totalViaje, currency)}</Text>
      </View>

      <View className="flex-row border-t border-neutral-100 dark:border-surface-700 pt-4 gap-4">
        <View className="flex-1 items-center">
          <Text className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-1">{t('expenseSummary_myShare')}</Text>
          <Text className="text-lg font-bold text-neutral-700 dark:text-neutral-200">{formatCurrency(miParte, currency)}</Text>
        </View>

        <View className="w-px bg-neutral-100 dark:bg-surface-700" />

        <View className="flex-1 items-center">
          <Text className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-1">{t('expenseSummary_myBalance')}</Text>
          <Text className={`text-lg font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : isNegative ? 'text-red-500 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
            {isPositive ? '+' : ''}{formatCurrency(balance, currency)}
          </Text>
          <Text className={`text-[13px] mt-0.5 ${isPositive ? 'text-green-500 dark:text-green-400' : isNegative ? 'text-red-400 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
            {isPositive ? t('expenses_balance_owed') : isNegative ? t('expenses_balance_owes_badge') : t('expenses_balance_even')}
          </Text>
        </View>
      </View>
    </View>
  )
}
