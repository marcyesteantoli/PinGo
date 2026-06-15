import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated'
import { Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useColorScheme } from 'nativewind'
import { Avatar } from '@components/ui/Avatar'
import { formatCurrency } from '@utils/currency'
import { formatShortDate } from '@utils/date'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import type { Settlement, Collaborator } from '@/types'

interface SettledCardProps {
  settlement: Settlement
  collaborators: Collaborator[]
  currentUserId?: string
  currency?: string
}

export function SettledCard({ settlement, collaborators, currentUserId, currency = 'EUR' }: SettledCardProps) {
  const { t } = useTranslation()
  const { colorScheme } = useColorScheme()

  const fromUser = collaborators.find(c => c.user_id === settlement.from_user_id)
  const toUser = collaborators.find(c => c.user_id === settlement.to_user_id)

  const fromName = fromUser?.name ?? t('common_someone')
  const toName = toUser?.name ?? t('common_someone')
  const fromFirstName = fromName.split(' ')[0]
  const toFirstName = toName.split(' ')[0]

  const isFrom = settlement.from_user_id === currentUserId
  const isTo = settlement.to_user_id === currentUserId

  const label = isFrom
    ? t('expenses_settled_youPaid', { name: toFirstName })
    : isTo
      ? t('expenses_settled_paidYou', { name: fromFirstName })
      : `${fromFirstName} → ${toFirstName}`

  const accentColor = colorScheme === 'dark' ? colors.neutral[700] : colors.neutral[200]

  return (
    <Animated.View
      entering={FadeInDown.duration(220).easing(Easing.out(Easing.cubic))}
      exiting={FadeOut.duration(160)}
      layout={LinearTransition.duration(280)}
      className="rounded-2xl"
      style={cardShadow}
    >
      <View className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden">
        {/* Muted structural bar — neutral, not success green */}
        <View style={{ height: 3, backgroundColor: accentColor }} />

        <View className="px-4 py-3.5 flex-row items-center gap-3">
          {/* Avatar pair with directional arrow */}
          <View className="flex-row items-center gap-1.5">
            <Avatar uri={fromUser?.avatar_url} name={fromName} size="sm" />
            <View
              className="w-4 h-4 rounded-full items-center justify-center"
              style={{ backgroundColor: `${colors.success[600]}15` }}
            >
              <Ionicons name="arrow-forward" size={8} color={colors.success[600]} />
            </View>
            <Avatar uri={toUser?.avatar_url} name={toName} size="sm" />
          </View>

          {/* Label + date */}
          <View className="flex-1 min-w-0">
            <Text
              className="text-sm font-medium text-neutral-800 dark:text-neutral-100"
              numberOfLines={1}
            >
              {label}
            </Text>
            <Text className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
              {formatShortDate(settlement.created_at)}
            </Text>
          </View>

          {/* Amount + settled badge */}
          <View className="items-end gap-1 flex-shrink-0">
            <Text
              className="font-semibold"
              style={{ fontSize: 15, color: colors.neutral[800] }}
            >
              {formatCurrency(settlement.amount, currency)}
            </Text>
            <View className="flex-row items-center gap-0.5">
              <Ionicons name="checkmark-circle" size={12} color={colors.success[600]} />
              <Text
                className="text-[11px] font-medium"
                style={{ color: colors.success[600] }}
              >
                {t('expenses_settled_label')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  )
}
