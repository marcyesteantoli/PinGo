import { Text, TouchableOpacity, View } from 'react-native'
import { Avatar } from '@components/ui/Avatar'
import { formatCurrency } from '@utils/currency'
import type { ExpenseWithSplits } from '@types/index'

interface ExpenseCardProps {
  expense: ExpenseWithSplits
  currentUserId?: string
  onSettle?: () => void
}

export function ExpenseCard({ expense, currentUserId, onSettle }: ExpenseCardProps) {
  const userSplit = currentUserId
    ? expense.splits.find((s) => s.user_id === currentUserId)
    : undefined
  const isSettled = userSplit?.is_settled ?? false
  const unsettledCount = expense.splits.filter((s) => !s.is_settled).length

  return (
    <View
      className="rounded-2xl"
      style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 }}
    >
      <View className="bg-white rounded-2xl p-4 gap-3">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 gap-1">
            <Text className="text-base font-semibold text-neutral-900" numberOfLines={2}>
              {expense.description}
            </Text>
            <View className="flex-row items-center gap-2">
              <Avatar uri={expense.payer.avatar_url} name={expense.payer.name} size="sm" />
              <Text className="text-xs text-neutral-500">Pagó {expense.payer.name}</Text>
            </View>
          </View>

          <View className="items-end gap-1">
            <Text className="text-lg font-bold text-neutral-900">
              {formatCurrency(expense.amount, expense.currency)}
            </Text>
            {unsettledCount > 0 && (
              <View className="bg-amber-100 rounded-full px-2 py-0.5">
                <Text className="text-xs text-amber-700">{unsettledCount} pendiente{unsettledCount > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        </View>

        {userSplit && !isSettled && onSettle && (
          <View className="border-t border-neutral-100 pt-3 flex-row items-center justify-between">
            <Text className="text-sm text-neutral-500">
              Tu parte: {formatCurrency(userSplit.amount, expense.currency)}
            </Text>
            <TouchableOpacity
              onPress={onSettle}
              className="bg-green-100 rounded-xl px-3 py-1.5"
            >
              <Text className="text-xs font-semibold text-green-700">Marcar como pagado</Text>
            </TouchableOpacity>
          </View>
        )}

        {isSettled && (
          <View className="border-t border-neutral-100 pt-3">
            <Text className="text-xs text-green-600 font-medium">✓ Tu parte está liquidada</Text>
          </View>
        )}
      </View>
    </View>
  )
}
