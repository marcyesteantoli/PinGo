import { useState } from 'react'
import { Pressable, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing } from 'react-native-reanimated'
import { EASE_OUT, DURATION } from '@lib/animations'
import { useColorScheme } from 'nativewind'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import type { WishlistItem, WishlistItemType } from '@types/index'

const TYPE_ICONS: Record<WishlistItemType, keyof typeof Ionicons.glyphMap> = {
  city: 'business-outline',
  restaurant: 'restaurant-outline',
  activity: 'bicycle-outline',
  accommodation: 'bed-outline',
  entertainment: 'film-outline',
  other: 'ellipsis-horizontal-outline',
}

const TYPE_COLORS: Record<WishlistItemType, string> = {
  city: '#EF4444',
  restaurant: '#F97316',
  activity: '#22C55E',
  accommodation: '#8B5CF6',
  entertainment: '#EC4899',
  other: '#94A3B8',
}

const TYPE_BG_COLORS: Record<WishlistItemType, { light: string; dark: string }> = {
  city:          { light: '#FEE2E2', dark: '#4E0606' },
  restaurant:    { light: '#FFEDD5', dark: '#4E1E06' },
  activity:      { light: '#DCFCE7', dark: '#064E3B' },
  accommodation: { light: '#EDE9FE', dark: '#24064E' },
  entertainment: { light: '#FCE7F3', dark: '#4E062A' },
  other:         { light: '#F1F5F9', dark: '#334155' },
}

const ACTION_WIDTH = 72

interface WishlistCardProps {
  item: WishlistItem
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleVisited: () => void
}

export function WishlistCard({ item, onPress, onEdit, onDelete, onToggleVisited }: WishlistCardProps) {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const typeColor = TYPE_COLORS[item.type]
  const typeIcon = TYPE_ICONS[item.type]
  const locationText = [item.location?.city, item.location?.country].filter(Boolean).join(', ')
  const isVisited = !!item.visited_at

  const [containerWidth, setContainerWidth] = useState(0)
  const translateX = useSharedValue(0)
  const savedX = useSharedValue(0)
  const effectiveWidth = ACTION_WIDTH * 3
  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))
  const iconScale = useSharedValue(1)
  const iconAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }))

  const pan = Gesture.Pan()
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

  function closeSwipe() {
    translateX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
  }

  const rowWidth = containerWidth > 0 ? containerWidth + effectiveWidth : undefined
  const cardWidth = containerWidth > 0 ? containerWidth : undefined

  const hasFooter = !!(item.note || isVisited)

  const cardBody = (
    <View className="px-4 pt-3.5 pb-3.5">
      {/* Top section: icon + title/location */}
      <View className="flex-row items-start gap-3">
        <View
          className="w-11 h-11 rounded-xl items-center justify-center flex-shrink-0"
          style={{ backgroundColor: isDark ? TYPE_BG_COLORS[item.type].dark : TYPE_BG_COLORS[item.type].light }}
        >
          <Ionicons name={typeIcon} size={22} color={typeColor} />
        </View>

        <View className="flex-1">
          <Text
            numberOfLines={2}
            className={`text-lg font-semibold text-neutral-900 dark:text-neutral-50 leading-snug ${isVisited ? 'line-through opacity-60' : ''}`}
          >
            {item.name}
          </Text>

          {locationText ? (
            <View className="flex-row items-center gap-1 mt-0.5">
              <Ionicons name="location-outline" size={13} color={colors.neutral[400]} />
              <Text numberOfLines={1} className="text-sm text-neutral-500 dark:text-neutral-400 flex-1">
                {locationText}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Full-width footer */}
      {hasFooter && (
        <View className="flex-row items-center justify-between mt-2.5 pt-2.5 border-t border-neutral-100 dark:border-surface-700">
          {item.note ? (
            <View className="flex-row items-center gap-1.5 flex-1 mr-2">
              <Ionicons name="chatbubble-outline" size={13} color={colors.neutral[400]} />
              <Text numberOfLines={1} className="text-sm text-neutral-500 dark:text-neutral-400 flex-1 italic">
                {item.note}
              </Text>
            </View>
          ) : <View className="flex-1" />}

          {isVisited && (
            <View className="flex-row items-center gap-1 bg-emerald-100 dark:bg-emerald-900/40 rounded-full px-2 py-0.5">
              <Ionicons name="checkmark-circle" size={13} color="#10b981" />
              <Text className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Visitado
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  )

  return (
    <View
      className="rounded-2xl mb-5"
      style={[
        { opacity: containerWidth > 0 ? 1 : 0 },
        cardShadow,
      ]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width
        if (w > 0 && w !== containerWidth) setContainerWidth(w)
      }}
    >
      <View className="overflow-hidden rounded-2xl">
        <Animated.View style={[{ flexDirection: 'row', width: rowWidth }, cardStyle]}>
          <GestureDetector gesture={pan}>
            <Pressable
              style={{ width: cardWidth, flex: cardWidth === undefined ? 1 : undefined }}
              android_ripple={{ color: 'transparent', borderless: true }}
              onPress={onPress}
              onPressIn={() => { pressScale.value = withTiming(0.97, { duration: DURATION.press, easing: EASE_OUT }) }}
              onPressOut={() => { pressScale.value = withTiming(1, { duration: DURATION.press, easing: EASE_OUT }) }}
            >
              <Animated.View style={[pressStyle, { flex: 1 }]} className="bg-white dark:bg-surface-800">
                {cardBody}
              </Animated.View>
            </Pressable>
          </GestureDetector>

          <TouchableOpacity
            onPress={() => {
              closeSwipe()
              iconScale.value = withSequence(
                withTiming(1.2, { duration: 100, easing: EASE_OUT }),
                withTiming(1, { duration: 100, easing: EASE_OUT })
              )
              onToggleVisited()
            }}
            style={{ width: ACTION_WIDTH, backgroundColor: '#10b981' }}
            className="items-center justify-center gap-1"
            activeOpacity={0.8}
          >
            <Animated.View style={iconAnimStyle}>
              <Ionicons
                name={isVisited ? 'close-circle-outline' : 'checkmark-circle-outline'}
                size={20}
                color={colors.white}
              />
            </Animated.View>
            <Text style={{ color: colors.white, fontSize: 11, fontWeight: '600' }}>
              {isVisited ? 'Pendiente' : 'Visitado'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { closeSwipe(); onEdit() }}
            style={{ width: ACTION_WIDTH, backgroundColor: colors.primary[500] }}
            className="items-center justify-center gap-1"
            activeOpacity={0.8}
          >
            <Ionicons name="pencil-outline" size={20} color={colors.white} />
            <Text style={{ color: colors.white, fontSize: 11, fontWeight: '600' }}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { closeSwipe(); onDelete() }}
            style={{ width: ACTION_WIDTH, backgroundColor: colors.error }}
            className="items-center justify-center gap-1"
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={20} color={colors.white} />
            <Text style={{ color: colors.white, fontSize: 11, fontWeight: '600' }}>Eliminar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  )
}
