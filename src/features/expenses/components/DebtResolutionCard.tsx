import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Avatar } from '@components/ui/Avatar'
import { formatCurrency } from '@utils/currency'
import type { DebtTransaction } from '../utils/calculateDebtResolution'
import { colors } from '@lib/colors'

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

  const accentColor = isCurrentUserFrom
    ? colors.primary[500]
    : isCurrentUserTo
      ? colors.success[600]
      : colors.neutral[500]

  const contextLabel = isCurrentUserFrom
    ? 'Debes pagar'
    : isCurrentUserTo
      ? 'Te deben'
      : null

  const contextSubLabel = isCurrentUserFrom
    ? <Text>a <Text className="font-semibold text-neutral-800 dark:text-neutral-100">{toLabel}</Text></Text>
    : isCurrentUserTo
      ? <Text className="font-semibold text-neutral-800 dark:text-neutral-100">{fromLabel}</Text>
      : <Text><Text className="font-semibold text-neutral-800 dark:text-neutral-100">{fromLabel}</Text> debe a <Text className="font-semibold text-neutral-800 dark:text-neutral-100">{toLabel}</Text></Text>

  return (
    <View
      className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden"
      style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 }}
    >
      {/* Header */}
      <View className="px-4 pt-4 pb-3 flex-row items-start justify-between">
        <View className="gap-0.5">
          {contextLabel && (
            <Text className="text-xs font-semibold uppercase tracking-wide" style={{ color: accentColor }}>
              {contextLabel}
            </Text>
          )}
          <Text className="text-base text-neutral-500 dark:text-neutral-400">
            {contextSubLabel}
          </Text>
        </View>
        <Text className="text-xl font-bold" style={{ color: accentColor }}>
          {formatCurrency(transaction.amount)}
        </Text>
      </View>

      {/* Separator */}
      <View className="h-px bg-neutral-100 dark:bg-surface-700 mx-4" />

      {/* Avatars */}
      <View className="px-4 py-3 flex-row items-center gap-2">
        <View className="items-center gap-1">
          <Avatar uri={transaction.fromAvatarUrl} name={transaction.fromName} size="sm" />
          <Text className="text-xs text-neutral-400 dark:text-neutral-500" numberOfLines={1}>
            {fromLabel}
          </Text>
        </View>

        <View className="flex-1 flex-row items-center gap-1">
          <View className="h-px flex-1" style={{ backgroundColor: accentColor + '40' }} />
          <View
            className="w-5 h-5 rounded-full items-center justify-center"
            style={{ backgroundColor: accentColor + '15' }}
          >
            <Ionicons name="arrow-forward" size={11} color={accentColor} />
          </View>
          <View className="h-px flex-1" style={{ backgroundColor: accentColor + '40' }} />
        </View>

        <View className="items-center gap-1">
          <Avatar uri={transaction.toAvatarUrl} name={transaction.toName} size="sm" />
          <Text className="text-xs text-neutral-400 dark:text-neutral-500" numberOfLines={1}>
            {toLabel}
          </Text>
        </View>
      </View>

      {/* CTA Button */}
      {onSettle && (
        <View className="px-4 pb-4">
          <TouchableOpacity
            onPress={onSettle}
            disabled={isSettling}
            activeOpacity={0.8}
            className="flex-row items-center justify-center gap-2 rounded-xl py-3"
            style={[
              { minHeight: 44, opacity: isSettling ? 0.6 : 1 },
              isCurrentUserFrom
                ? { backgroundColor: colors.primary[500] }
                : { backgroundColor: `${colors.success[600]}15`, borderWidth: 1.5, borderColor: colors.success[600] },
            ]}
          >
            {isSettling ? (
              <ActivityIndicator size="small" color={isCurrentUserFrom ? colors.white : colors.success[600]} />
            ) : (
              <Ionicons
                name="checkmark-circle"
                size={17}
                color={isCurrentUserFrom ? colors.white : colors.success[600]}
              />
            )}
            <Text
              className="text-sm font-semibold"
              style={{ color: isCurrentUserFrom ? colors.white : colors.success[600] }}
            >
              {isSettling ? 'Guardando...' : isCurrentUserFrom ? 'He pagado' : 'He cobrado'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
