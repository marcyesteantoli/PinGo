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

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center gap-3">
      <Avatar uri={balance.avatar_url} name={balance.name} size="md" />

      <View className="flex-1">
        <Text className="text-sm font-semibold text-neutral-900">
          {balance.name}{isCurrentUser ? ' (tú)' : ''}
        </Text>
        <Text className="text-xs text-neutral-400">
          Pagado: {formatCurrency(balance.paid)} · Debe: {formatCurrency(balance.owes)}
        </Text>
      </View>

      <View className="items-end">
        <Text
          className={`text-base font-bold ${isPositive ? 'text-green-600' : isNegative ? 'text-error' : 'text-neutral-400'}`}
        >
          {isEven ? '—' : `${isPositive ? '+' : ''}${formatCurrency(balance.balance)}`}
        </Text>
        <Text className={`text-xs ${isPositive ? 'text-green-500' : isNegative ? 'text-red-400' : 'text-neutral-400'}`}>
          {isEven ? 'En paz' : isPositive ? 'Te deben' : 'Debes'}
        </Text>
      </View>
    </View>
  )
}
