import { Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatCurrency } from '@utils/currency'
import { formatShortDate } from '@utils/date'
import { colors } from '@lib/colors'
import type { Settlement } from '@types/index'
import type { Collaborator } from '@types/index'

interface SettledCardProps {
  settlement: Settlement
  collaborators: Collaborator[]
  currentUserId?: string
}

export function SettledCard({ settlement, collaborators, currentUserId }: SettledCardProps) {
  const fromUser = collaborators.find(c => c.user_id === settlement.from_user_id)
  const toUser = collaborators.find(c => c.user_id === settlement.to_user_id)

  const fromFirstName = fromUser?.name.split(' ')[0] ?? 'Alguien'
  const toFirstName = toUser?.name.split(' ')[0] ?? 'Alguien'

  const isFrom = settlement.from_user_id === currentUserId
  const isTo = settlement.to_user_id === currentUserId

  const label = isFrom
    ? <Text>Pagaste a <Text className="font-semibold">{toFirstName}</Text></Text>
    : isTo
      ? <Text><Text className="font-semibold">{fromFirstName}</Text> te pagó</Text>
      : <Text><Text className="font-semibold">{fromFirstName}</Text> pagó a <Text className="font-semibold">{toFirstName}</Text></Text>

  return (
    <View className="bg-white dark:bg-surface-800 rounded-xl px-4 py-3 flex-row items-center gap-3">
      <View
        className="w-8 h-8 rounded-full items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${colors.success[600]}18` }}
      >
        <Ionicons name="checkmark" size={15} color={colors.success[600]} />
      </View>

      <View className="flex-1">
        <Text className="text-sm text-neutral-600 dark:text-neutral-300">
          {label}
        </Text>
        <Text className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
          {formatShortDate(settlement.created_at)}
        </Text>
      </View>

      <Text className="text-sm font-semibold flex-shrink-0" style={{ color: colors.success[600] }}>
        {formatCurrency(settlement.amount)}
      </Text>
    </View>
  )
}
