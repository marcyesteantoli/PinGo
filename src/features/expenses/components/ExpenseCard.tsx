import { Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Avatar } from '@components/ui/Avatar'
import { formatCurrency } from '@utils/currency'
import type { ExpenseWithSplits } from '@types/index'
import { colors } from '@lib/colors'

interface ExpenseCardProps {
  expense: ExpenseWithSplits
  currentUserId?: string
}

function getExpenseIcon(description: string): string {
  const lower = description.toLowerCase()
  if (/cena|comida|restaurante|desayuno|almuerzo|café|cafe|bar|pizza|sushi/.test(lower)) return '🍽️'
  if (/taxi|uber|bus|metro|vuelo|tren|gasolina|peaje|coche|transport/.test(lower)) return '🚗'
  if (/hotel|airbnb|hostel|alojamiento|habitación|piso/.test(lower)) return '🏨'
  if (/entrada|museo|tour|actividad|excursión|concierto|parque|ticket/.test(lower)) return '🎫'
  if (/supermercado|compras|tienda|ropa|shopping/.test(lower)) return '🛍️'
  if (/seguro|médico|farmacia|salud/.test(lower)) return '💊'
  if (/playa|piscina|spa|wellness/.test(lower)) return '🏖️'
  return '💳'
}

export function ExpenseCard({ expense, currentUserId }: ExpenseCardProps) {
  const isCurrentUserPayer = expense.payer_id === currentUserId
  const unsettledCount = expense.splits.filter(
    (s) => !s.is_settled && s.user_id !== expense.payer_id
  ).length
  const participantCount = expense.splits.filter((s) => s.user_id !== expense.payer_id).length
  const allSettled = unsettledCount === 0

  return (
    <View
      className="bg-white dark:bg-surface-800 rounded-2xl"
      style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 }}
    >
      <View className="p-4 flex-row items-start gap-3">
        {/* Icon */}
        <View className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-surface-700 items-center justify-center mt-0.5">
          <Text className="text-lg">{getExpenseIcon(expense.description)}</Text>
        </View>

        {/* Content */}
        <View className="flex-1 gap-1">
          <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-50" numberOfLines={2}>
            {expense.description}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <Avatar uri={expense.payer.avatar_url} name={expense.payer.name} size="sm" />
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
              {isCurrentUserPayer ? 'Pagaste tú' : `Pagó ${expense.payer.name.split(' ')[0]}`}
            </Text>
          </View>
        </View>

        {/* Amount + status */}
        <View className="items-end gap-1.5">
          <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">
            {formatCurrency(expense.amount, expense.currency)}
          </Text>
          {allSettled ? (
            <View className="flex-row items-center gap-1 bg-green-100 dark:bg-green-900/40 rounded-full px-2 py-0.5">
              <Ionicons name="checkmark" size={10} color={colors.success[600]} />
              <Text className="text-xs text-green-700 dark:text-green-400">Saldado</Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-1 bg-amber-100 dark:bg-amber-900/40 rounded-full px-2 py-0.5">
              <View className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <Text className="text-xs text-amber-700 dark:text-amber-400">{unsettledCount}/{participantCount}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
