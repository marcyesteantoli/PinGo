import { Text, View } from 'react-native'
import { Avatar } from '@components/ui/Avatar'
import { formatCurrency } from '@utils/currency'
import type { UserBalance } from '@types/index'

interface BalanceCardProps {
  balance: UserBalance
  isCurrentUser?: boolean
}

export function BalanceCard({ balance, isCurrentUser }: BalanceCardProps) {
  const isPositive = balance.balance > 0.005
  const isNegative = balance.balance < -0.005
  const isEven = !isPositive && !isNegative

  const badgeStyle = isPositive
    ? 'bg-green-100 dark:bg-green-900/40'
    : isNegative
      ? 'bg-red-100 dark:bg-red-900/40'
      : 'bg-neutral-100 dark:bg-surface-700'

  const badgeText = isPositive
    ? 'text-green-700 dark:text-green-400'
    : isNegative
      ? 'text-red-600 dark:text-red-400'
      : 'text-neutral-500 dark:text-neutral-400'

  const balanceText = isPositive
    ? 'text-green-600 dark:text-green-400'
    : isNegative
      ? 'text-red-500 dark:text-red-400'
      : 'text-neutral-400 dark:text-neutral-500'

  return (
    <View
      className="bg-white dark:bg-surface-800 rounded-2xl"
      style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 }}
    >
      <View className="p-4 flex-row items-center gap-3">
        <Avatar uri={balance.avatar_url} name={balance.name} size="md" />

        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-50" numberOfLines={1}>
            {isCurrentUser ? `${balance.name} (tú)` : balance.name}
          </Text>
          <Text className="text-xs text-neutral-400 dark:text-neutral-500">
            Ha pagado: {formatCurrency(balance.paid)} · Su parte: {formatCurrency(balance.owes)}
          </Text>
        </View>

        <View className="items-end gap-1">
          <Text className={`text-base font-bold ${balanceText}`}>
            {isEven ? '—' : `${isPositive ? '+' : ''}${formatCurrency(balance.balance)}`}
          </Text>
          <View className={`rounded-full px-2 py-0.5 ${badgeStyle}`}>
            <Text className={`text-xs font-medium ${badgeText}`}>
              {isEven ? 'En paz' : isPositive ? 'Te deben' : 'Debes'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
