import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@components/ui/Avatar'
import { formatCurrency } from '@utils/currency'
import type { DebtTransaction } from '../utils/calculateDebtResolution'
import { colors } from '@lib/colors'
import { EASE_OUT } from '@lib/animations'
import { cardShadow } from '@lib/shadows'

interface DebtResolutionCardProps {
  transaction: DebtTransaction
  isCurrentUserFrom?: boolean
  isCurrentUserTo?: boolean
  onSettle?: () => void
  isSettling?: boolean
  currency?: string
}

export function DebtResolutionCard({
  transaction,
  isCurrentUserFrom,
  isCurrentUserTo,
  onSettle,
  isSettling,
  currency = 'EUR',
}: DebtResolutionCardProps) {
  const { t } = useTranslation()

  const fromLabel = isCurrentUserFrom ? t('common_youLabel') : transaction.fromName.split(' ')[0]
  const toLabel = isCurrentUserTo ? t('common_youLabel') : transaction.toName.split(' ')[0]

  const accentColor = isCurrentUserFrom
    ? colors.primary[500]
    : isCurrentUserTo
      ? colors.success[600]
      : colors.neutral[500]

  const contextLabel = isCurrentUserFrom
    ? t('expenses_debt_youOwe')
    : isCurrentUserTo
      ? t('expenses_debt_owedTo')
      : null

  const buttonScale = useSharedValue(1)
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }))

  return (
    <Animated.View
      entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))}
      exiting={FadeOut.duration(200)}
      layout={LinearTransition.duration(280)}
      className="rounded-2xl"
      style={cardShadow}
    >
      <View className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden">
      {/* Accent bar */}
      <View style={{ height: 3, backgroundColor: accentColor }} />

      {/* Role tag */}
      {contextLabel && (
        <View className="px-4 pt-3">
          <Text
            className="text-[11px] font-semibold uppercase"
            style={{ color: accentColor, letterSpacing: 0.8 }}
          >
            {contextLabel}
          </Text>
        </View>
      )}

      {/* Hero amount */}
      <View className="px-4 pt-2 pb-1 items-center">
        <Text
          className="font-bold"
          style={{ fontSize: 36, lineHeight: 44, color: accentColor }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCurrency(transaction.amount, currency)}
        </Text>
        {isCurrentUserFrom && (
          <Text className="text-sm text-neutral-400 dark:text-neutral-500 mt-0.5">
            {'a '}
            <Text className="font-semibold text-neutral-700 dark:text-neutral-200">{toLabel}</Text>
          </Text>
        )}
        {isCurrentUserTo && (
          <Text className="text-sm text-neutral-400 dark:text-neutral-500 mt-0.5">
            {'de '}
            <Text className="font-semibold text-neutral-700 dark:text-neutral-200">{fromLabel}</Text>
          </Text>
        )}
        {!isCurrentUserFrom && !isCurrentUserTo && (
          <Text className="text-sm text-neutral-400 dark:text-neutral-500 mt-0.5">
            <Text className="font-semibold text-neutral-700 dark:text-neutral-200">{fromLabel}</Text>
            {' → '}
            <Text className="font-semibold text-neutral-700 dark:text-neutral-200">{toLabel}</Text>
          </Text>
        )}
      </View>

      {/* Avatar row */}
      <View className="px-6 py-4 flex-row items-center gap-3">
        <View className="items-center gap-1.5">
          <Avatar uri={transaction.fromAvatarUrl} name={transaction.fromName} size="sm" />
          <Text className="text-xs font-medium text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
            {fromLabel}
          </Text>
        </View>

        <View className="flex-1 flex-row items-center gap-1.5">
          <View className="h-px flex-1" style={{ backgroundColor: accentColor + '30' }} />
          <View
            className="w-6 h-6 rounded-full items-center justify-center"
            style={{ backgroundColor: accentColor + '18' }}
          >
            <Ionicons name="arrow-forward" size={12} color={accentColor} />
          </View>
          <View className="h-px flex-1" style={{ backgroundColor: accentColor + '30' }} />
        </View>

        <View className="items-center gap-1.5">
          <Avatar uri={transaction.toAvatarUrl} name={transaction.toName} size="sm" />
          <Text className="text-xs font-medium text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
            {toLabel}
          </Text>
        </View>
      </View>

      {/* CTA button */}
      {onSettle && (
        <View className="px-4 pb-4">
          <Animated.View style={buttonStyle}>
            <Pressable
              onPress={onSettle}
              onPressIn={() => {
                buttonScale.value = withTiming(0.97, { duration: 100, easing: EASE_OUT })
              }}
              onPressOut={() => {
                buttonScale.value = withTiming(1, { duration: 160, easing: EASE_OUT })
              }}
              disabled={isSettling}
              className="flex-row items-center justify-center gap-2 rounded-2xl"
              style={[
                { minHeight: 50, opacity: isSettling ? 0.6 : 1 },
                isCurrentUserFrom
                  ? { backgroundColor: colors.primary[500] }
                  : {
                      backgroundColor: `${colors.success[600]}15`,
                      borderWidth: 1.5,
                      borderColor: colors.success[600],
                    },
              ]}
            >
              {isSettling ? (
                <ActivityIndicator
                  size="small"
                  color={isCurrentUserFrom ? colors.white : colors.success[600]}
                />
              ) : (
                <Ionicons
                  name={isCurrentUserFrom ? 'send' : 'checkmark-circle'}
                  size={18}
                  color={isCurrentUserFrom ? colors.white : colors.success[600]}
                />
              )}
              <Text
                className="text-[15px] font-semibold"
                style={{ color: isCurrentUserFrom ? colors.white : colors.success[600] }}
              >
                {isSettling
                  ? t('common_saving')
                  : isCurrentUserFrom
                    ? t('expenses_debt_ctaPay')
                    : t('expenses_debt_ctaReceived')}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
      </View>
    </Animated.View>
  )
}
