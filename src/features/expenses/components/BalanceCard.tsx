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
    ? 'bg-green-100'
    : isNegative
      ? 'bg-red-100'
      : 'bg-neutral-100'

  const badgeText = isPositive
    ? 'text-green-700'
    : isNegative
      ? 'text-red-600'
      : 'text-neutral-500'

  const balanceText = isPositive
    ? 'text-green-600'
    : isNegative
      ? 'text-red-500'
      : 'text-neutral-400'

  return (
    <View
      className="bg-white rounded-2xl"
      style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 }}
    >
      <View className="p-4 flex-row items-center gap-3">
        <Avatar uri={balance.avatar_url} name={balance.name} size="md" />

        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-semibold text-neutral-900" numberOfLines={1}>
            {isCurrentUser ? `${balance.name} (tú)` : balance.name}
          </Text>
          <Text className="text-xs text-neutral-400">
            Te deben: {formatCurrency(balance.paid)} · Debes: {formatCurrency(balance.owes)}
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
