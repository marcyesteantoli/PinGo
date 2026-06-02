import { useState } from 'react'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'
import { Avatar } from '@components/ui/Avatar'
import { formatCurrency } from '@utils/currency'
import type { ExpenseWithSplits } from '@types/index'
import { colors } from '@lib/colors'
import {
  getExpenseCategory,
  CATEGORY_ICON,
  CATEGORY_BG,
  CATEGORY_ICON_COLORS,
  type ExpenseCategory,
} from '@features/expenses/utils/getExpenseCategory'

interface ExpenseCardProps {
  expense: ExpenseWithSplits
  currency?: string
  currentUserId?: string
  showCategoryIcon?: boolean
  standalone?: boolean
  onPress?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

const ACTION_WIDTH = 72

export function ExpenseCard({ expense, currency, currentUserId, showCategoryIcon, standalone, onPress, onEdit, onDelete }: ExpenseCardProps) {
  const isCurrentUserPayer = expense.payer_id === currentUserId
  const category = getExpenseCategory(expense.description, expense.experience?.type as ExpenseCategory | null)

  const { colorScheme } = useColorScheme()
  const { t } = useTranslation()
  const [containerWidth, setContainerWidth] = useState(0)
  const translateX = useSharedValue(0)
  const savedX = useSharedValue(0)

  const hasActions = !!(onEdit || onDelete)
  const effectiveWidth = (onEdit ? ACTION_WIDTH : 0) + (onDelete ? ACTION_WIDTH : 0)

  const pan = Gesture.Pan()
    .enabled(hasActions)
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onBegin(() => {
      savedX.value = translateX.value
    })
    .onUpdate((e) => {
      translateX.value = Math.min(0, Math.max(-effectiveWidth, savedX.value + e.translationX))
    })
    .onEnd(() => {
      translateX.value = translateX.value < -effectiveWidth / 2
        ? withTiming(-effectiveWidth, { duration: 240, easing: Easing.out(Easing.cubic) })
        : withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
    })

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const closeSwipe = () => {
    translateX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
  }

  const rowWidth = containerWidth > 0 ? containerWidth + effectiveWidth : undefined
  const cardWidth = containerWidth > 0 ? containerWidth : undefined

  const cardBody = (
    <View className="p-4 flex-row items-center gap-3">
      {showCategoryIcon !== false && (
        <View className={`w-12 h-12 rounded-xl items-center justify-center ${CATEGORY_BG[category]}`}>
          <Ionicons name={CATEGORY_ICON[category]} size={28} color={CATEGORY_ICON_COLORS[category][colorScheme === 'dark' ? 'dark' : 'light']} />
        </View>
      )}

      <View className="flex-1">
        <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50" numberOfLines={1}>
          {expense.description}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-1">
          <Avatar uri={expense.payer.avatar_url} name={expense.payer.name} size="xs" />
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            {isCurrentUserPayer ? t('expenseCard_youPaid') : t('expenseCard_paidBy', { name: expense.payer.name.split(' ')[0] })}
          </Text>
        </View>
      </View>

      <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">
        {formatCurrency(expense.amount, currency ?? expense.currency)}
      </Text>
    </View>
  )

  return (
    <View
      className={standalone !== false ? 'rounded-2xl' : undefined}
      style={[
        { opacity: containerWidth > 0 ? 1 : 0 },
        standalone !== false ? Platform.select({
          android: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.10)' },
          default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
        }) : undefined,
      ]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width
        if (w > 0 && w !== containerWidth) setContainerWidth(w)
      }}
    >
      <View className={standalone !== false ? 'overflow-hidden rounded-2xl' : 'overflow-hidden'}>
        <Animated.View style={[{ flexDirection: 'row', width: rowWidth }, cardStyle]}>
          <GestureDetector gesture={pan}>
            <TouchableOpacity
              style={{ width: cardWidth, flex: cardWidth === undefined ? 1 : undefined }}
              className="bg-white dark:bg-surface-800"
              onPress={onPress}
              activeOpacity={onPress ? 0.7 : 1}
              disabled={!onPress}
            >
              {cardBody}
            </TouchableOpacity>
          </GestureDetector>

          {onEdit && (
            <TouchableOpacity
              onPress={() => { closeSwipe(); onEdit() }}
              style={{ width: ACTION_WIDTH, backgroundColor: colors.primary[500] }}
              className="items-center justify-center gap-1"
              activeOpacity={0.8}
            >
              <Ionicons name="pencil-outline" size={20} color={colors.white} />
              <Text style={{ color: colors.white, fontSize: 12, fontWeight: '600' }}>{t('common_edit')}</Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              onPress={() => { closeSwipe(); onDelete() }}
              style={{ width: ACTION_WIDTH, backgroundColor: colors.error }}
              className="items-center justify-center gap-1"
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color={colors.white} />
              <Text style={{ color: colors.white, fontSize: 12, fontWeight: '600' }}>{t('common_delete')}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </View>
  )
}
