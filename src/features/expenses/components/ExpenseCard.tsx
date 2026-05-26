import { useState } from 'react'
import { useColorScheme } from 'nativewind'
import { Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'
import { Avatar } from '@components/ui/Avatar'
import { formatCurrency } from '@utils/currency'
import type { ExpenseWithSplits } from '@types/index'
import { colors } from '@lib/colors'

interface ExpenseCardProps {
  expense: ExpenseWithSplits
  currentUserId?: string
  onPress?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

type ExpenseCategory = 'restaurant' | 'transport' | 'accommodation' | 'activity' | 'other'

function getExpenseCategory(description: string, experienceType?: ExpenseCategory | null): ExpenseCategory {
  if (experienceType) return experienceType
  // TODO: i18n — regex only covers Spanish; replace with locale-aware keyword maps when multi-language support is added
  const lower = description.toLowerCase()
  if (/cena|comida|restaurante|desayuno|almuerzo|café|cafe|bar|pizza|sushi|gastro/.test(lower)) return 'restaurant'
  if (/taxi|uber|bus|metro|vuelo|tren|gasolina|peaje|coche|transport|billete|ferry/.test(lower)) return 'transport'
  if (/hotel|airbnb|hostel|alojamiento|habitación|piso|apartamento|check/.test(lower)) return 'accommodation'
  if (/entrada|museo|tour|actividad|excursión|concierto|parque|ticket|visita/.test(lower)) return 'activity'
  return 'other'
}

const CATEGORY_ICON: Record<ExpenseCategory, React.ComponentProps<typeof Ionicons>['name']> = {
  restaurant:    'restaurant-outline',
  transport:     'airplane-outline',
  accommodation: 'bed-outline',
  activity:      'compass-outline',
  other:         'wallet-outline',
}

const CATEGORY_BG: Record<ExpenseCategory, string> = {
  restaurant:    'bg-red-100 dark:bg-red-700/40',
  transport:     'bg-cyan-100 dark:bg-cyan-700/40',
  accommodation: 'bg-purple-100 dark:bg-purple-700/40',
  activity:      'bg-lime-100 dark:bg-lime-700/40',
  other:         'bg-neutral-100 dark:bg-surface-700',
}

const CATEGORY_ICON_COLORS: Record<ExpenseCategory, { light: string; dark: string }> = {
  restaurant:    { light: '#ef4444', dark: '#fca5a5' },
  transport:     { light: '#06b6d4', dark: '#67e8f9' },
  accommodation: { light: '#a855f7', dark: '#d8b4fe' },
  activity:      { light: '#3f6212', dark: '#bef264' },
  other:         { light: colors.neutral[500], dark: colors.neutral[400] },
}

const ACTION_WIDTH = 72

export function ExpenseCard({ expense, currentUserId, onPress, onEdit, onDelete }: ExpenseCardProps) {
  const isCurrentUserPayer = expense.payer_id === currentUserId
  const category = getExpenseCategory(expense.description, expense.experience?.type as ExpenseCategory | null)

  const { colorScheme } = useColorScheme()
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
      <View className={`w-12 h-12 rounded-xl items-center justify-center ${CATEGORY_BG[category]}`}>
        <Ionicons name={CATEGORY_ICON[category]} size={28} color={CATEGORY_ICON_COLORS[category][colorScheme === 'dark' ? 'dark' : 'light']} />
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50" numberOfLines={1}>
          {expense.description}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-1">
          <Avatar uri={expense.payer.avatar_url} name={expense.payer.name} size="xs" />
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            {isCurrentUserPayer ? 'Pagaste tú' : `Pagó ${expense.payer.name.split(' ')[0]}`}
          </Text>
        </View>
      </View>

      <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">
        {formatCurrency(expense.amount, expense.currency)}
      </Text>
    </View>
  )

  return (
    <View
      className="rounded-2xl"
      style={[
        { opacity: containerWidth > 0 ? 1 : 0 },
        { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
      ]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width
        if (w > 0 && w !== containerWidth) setContainerWidth(w)
      }}
    >
      <View className="overflow-hidden rounded-2xl">
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
              <Text style={{ color: colors.white, fontSize: 12, fontWeight: '600' }}>Editar</Text>
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
              <Text style={{ color: colors.white, fontSize: 12, fontWeight: '600' }}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </View>
  )
}
