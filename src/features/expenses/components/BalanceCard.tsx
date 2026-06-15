import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated'
import { Text, View } from 'react-native'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@components/ui/Avatar'
import { formatCurrency } from '@utils/currency'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import type { UserBalance } from '@/types'

interface BalanceCardProps {
  balance: UserBalance
  isCurrentUser?: boolean
  currency?: string
  index?: number
}

export function BalanceCard({ balance, isCurrentUser, currency = 'EUR', index = 0 }: BalanceCardProps) {
  const { t } = useTranslation()
  const { colorScheme } = useColorScheme()
  const hasLeft = balance.status === 'left'

  const isPositive = balance.balance > 0.005
  const isNegative = balance.balance < -0.005
  const isEven = !isPositive && !isNegative

  const accentColor = isPositive
    ? colors.success[600]
    : isNegative
      ? colors.error
      : colorScheme === 'dark' ? colors.neutral[700] : colors.neutral[200]

  const balanceTextColor = isPositive
    ? colors.success[600]
    : isNegative
      ? colors.error
      : colors.neutral[500]

  const badgeStyle = isPositive
    ? 'bg-green-100 dark:bg-green-900/40'
    : isNegative
      ? 'bg-red-100 dark:bg-red-900/40'
      : 'bg-neutral-100 dark:bg-surface-700'

  const badgeTextStyle = isPositive
    ? 'text-green-700 dark:text-green-400'
    : isNegative
      ? 'text-red-600 dark:text-red-400'
      : 'text-neutral-500 dark:text-neutral-400'

  return (
    <Animated.View
      entering={FadeInDown.duration(220).delay(index * 60).easing(Easing.out(Easing.cubic))}
      exiting={FadeOut.duration(160)}
      layout={LinearTransition.duration(280)}
      className="rounded-2xl"
      style={[cardShadow, hasLeft && { opacity: 0.5 }]}
    >
      <View className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden">
        {/* State-coded accent bar */}
        <View style={{ height: 3, backgroundColor: accentColor }} />

        <View className="px-4 py-3.5 flex-row items-center gap-3">
          <Avatar uri={balance.avatar_url} name={balance.name} size="md" />

          <View className="flex-1 min-w-0 gap-0.5">
            {/* Name row with inline "you"/"left" badge */}
            <View className="flex-row items-center gap-1.5 flex-wrap">
              <Text
                className="text-sm font-semibold text-neutral-900 dark:text-neutral-50"
                numberOfLines={1}
              >
                {balance.name}
              </Text>
              {isCurrentUser && (
                <View className="rounded-full px-1.5 py-px bg-neutral-100 dark:bg-surface-700">
                  <Text className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                    {t('common_youLabel')}
                  </Text>
                </View>
              )}
              {hasLeft && (
                <View className="rounded-full px-1.5 py-px bg-neutral-100 dark:bg-surface-700">
                  <Text className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                    {t('balanceCard_leftTrip')}
                  </Text>
                </View>
              )}
            </View>

            {/* Paid · Owes breakdown */}
            <Text
              className="text-xs text-neutral-400 dark:text-neutral-500"
              numberOfLines={1}
            >
              {t('expenses_balance_paid')} {formatCurrency(balance.paid, currency)} · {t('expenses_balance_owes')} {formatCurrency(balance.owes, currency)}
            </Text>
          </View>

          {/* Balance amount + status badge */}
          <View className="items-end gap-1 flex-shrink-0">
            <Text
              className="font-bold"
              style={{ fontSize: 16, color: balanceTextColor }}
            >
              {isEven ? '—' : `${isPositive ? '+' : ''}${formatCurrency(balance.balance, currency)}`}
            </Text>
            <View className={`rounded-full px-2 py-px ${badgeStyle}`}>
              <Text className={`text-[11px] font-medium ${badgeTextStyle}`}>
                {isEven
                  ? t('expenses_balance_even')
                  : isPositive
                    ? t('expenses_balance_owed')
                    : t('expenses_balance_owes_badge')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  )
}
