import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Avatar } from '@components/ui/Avatar'
import { formatCurrency } from '@utils/currency'
import type { DebtTransaction } from '../utils/calculateDebtResolution'

interface DebtResolutionCardProps {
  transaction: DebtTransaction
  isCurrentUserFrom?: boolean
  isCurrentUserTo?: boolean
  onSettle?: () => void
  isSettling?: boolean
}

export function DebtResolutionCard({
  transaction,
  isCurrentUserFrom,
  isCurrentUserTo,
  onSettle,
  isSettling,
}: DebtResolutionCardProps) {
  const fromLabel = isCurrentUserFrom ? 'Tú' : transaction.fromName.split(' ')[0]
  const toLabel = isCurrentUserTo ? 'Tú' : transaction.toName.split(' ')[0]

  return (
    <View
      className="bg-white rounded-2xl overflow-hidden"
      style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 }}
    >
      {/* Debt row */}
      <View className="px-4 pt-4 pb-3 flex-row items-center gap-3">
        <View className="items-center gap-1 w-14">
          <Avatar uri={transaction.fromAvatarUrl} name={transaction.fromName} size="md" />
          <Text className="text-xs text-neutral-500 text-center" numberOfLines={1}>{fromLabel}</Text>
        </View>

        <View className="flex-1 items-center gap-1">
          <Text className="text-lg font-bold text-neutral-900">{formatCurrency(transaction.amount)}</Text>
          <View className="flex-row items-center gap-1">
            <View className="h-px flex-1 bg-neutral-200" />
            <Ionicons name="arrow-forward" size={14} color="#8d99ae" />
            <View className="h-px flex-1 bg-neutral-200" />
          </View>
        </View>

        <View className="items-center gap-1 w-14">
          <Avatar uri={transaction.toAvatarUrl} name={transaction.toName} size="md" />
          <Text className="text-xs text-neutral-500 text-center" numberOfLines={1}>{toLabel}</Text>
        </View>
      </View>

      {/* Settle action */}
      {onSettle && (
        <TouchableOpacity
          onPress={onSettle}
          disabled={isSettling}
          activeOpacity={0.8}
          className="mx-4 mb-4 flex-row items-center justify-center gap-2 rounded-xl py-2.5 border border-neutral-200 active:bg-neutral-50"
          style={{ opacity: isSettling ? 0.6 : 1 }}
        >
          {isSettling ? (
            <ActivityIndicator size="small" color="#8d99ae" />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={16} color="#8d99ae" />
          )}
          <Text className="text-sm font-medium text-neutral-600">
            {isSettling ? 'Guardando...' : 'Marcar como saldado'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
