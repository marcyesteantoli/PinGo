import { useEffect, useRef, useState } from 'react'
import { Pressable, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, useReducedMotion, Easing } from 'react-native-reanimated'
import { EASE_OUT, DURATION } from '@lib/animations'
import { useColorScheme } from 'nativewind'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import type { WishlistItem } from '@types/index'
import { TYPE_ICONS, TYPE_COLORS, TYPE_BG_COLORS } from '../constants'

const ACTION_WIDTH = 72

interface WishlistCardProps {
  item: WishlistItem
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleVisited: () => void
  peekOnMount?: boolean
}

export function WishlistCard({ item, onPress, onEdit, onDelete, onToggleVisited, peekOnMount }: WishlistCardProps) {
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
  const rippleScale = useSharedValue(0)
  const rippleOpacity = useSharedValue(0)
  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }))
  const cardExitOpacity = useSharedValue(1)
  const exitStyle = useAnimatedStyle(() => ({
    opacity: containerWidth > 0 ? cardExitOpacity.value : 0,
  }))
  const isAnimatingVisited = useRef(false)
  const [localVisited, setLocalVisited] = useState(isVisited)
  useEffect(() => { setLocalVisited(isVisited) }, [isVisited])

  const reduceMotion = useReducedMotion()
  useEffect(() => {
    if (!peekOnMount || reduceMotion) return
    const timer = setTimeout(() => {
      translateX.value = withSequence(
        withTiming(-44, { duration: 380, easing: EASE_OUT }),
        withDelay(480, withTiming(0, { duration: 300, easing: EASE_OUT }))
      )
    }, 600)
    return () => clearTimeout(timer)
  }, [peekOnMount, reduceMotion])

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

  function handleToggleVisited() {
    if (isAnimatingVisited.current) return
    const toVisited = !localVisited
    isAnimatingVisited.current = true
    setLocalVisited(toVisited)
    iconScale.value = toVisited
      ? withSequence(
          withTiming(0.75, { duration: 80, easing: EASE_OUT }),
          withTiming(1.35, { duration: 180, easing: EASE_OUT }),
          withTiming(1.0, { duration: 140, easing: EASE_OUT })
        )
      : withSequence(
          withTiming(0.8, { duration: 100, easing: EASE_OUT }),
          withTiming(1.0, { duration: 150, easing: EASE_OUT })
        )
    if (toVisited) {
      rippleScale.value = 0
      rippleOpacity.value = 0.45
      rippleScale.value = withTiming(1, { duration: 380, easing: EASE_OUT })
      rippleOpacity.value = withTiming(0, { duration: 380, easing: EASE_OUT })
      setTimeout(() => {
        cardExitOpacity.value = withTiming(0, { duration: 200, easing: EASE_OUT })
        setTimeout(() => {
          isAnimatingVisited.current = false
          onToggleVisited()
        }, 200)
      }, 380)
    } else {
      setTimeout(() => {
        cardExitOpacity.value = withTiming(0, { duration: 200, easing: EASE_OUT })
        setTimeout(() => {
          isAnimatingVisited.current = false
          onToggleVisited()
        }, 200)
      }, 250)
    }
  }

  function closeSwipe() {
    translateX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
  }

  const rowWidth = containerWidth > 0 ? containerWidth + effectiveWidth : undefined
  const cardWidth = containerWidth > 0 ? containerWidth : undefined

  const hasFooter = !!(item.note || isVisited)

  const cardBody = (
    <View className="px-4 pt-3.5 pb-3.5">
      {/* Top section: icon + title/location + visited toggle */}
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

        <TouchableOpacity
          onPress={handleToggleVisited}
          hitSlop={4}
          style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 18 }}
          activeOpacity={0.7}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              rippleStyle,
              { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: '#10b981' },
            ]}
          />
          <Animated.View style={iconAnimStyle}>
            <Ionicons
              name={localVisited ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={24}
              color={localVisited ? '#10b981' : isDark ? colors.neutral[600] : colors.neutral[300]}
            />
          </Animated.View>
        </TouchableOpacity>
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
    <Animated.View
      className="rounded-2xl"
      style={[exitStyle, cardShadow]}
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
            onPress={() => { closeSwipe(); handleToggleVisited() }}
            style={{ width: ACTION_WIDTH, backgroundColor: '#10b981' }}
            className="items-center justify-center gap-1"
            activeOpacity={0.8}
          >
            <Animated.View style={iconAnimStyle}>
              <Ionicons
                name={localVisited ? 'close-circle-outline' : 'checkmark-circle-outline'}
                size={20}
                color={colors.white}
              />
            </Animated.View>
            <Text style={{ color: colors.white, fontSize: 11, fontWeight: '600' }}>
              {localVisited ? 'Pendiente' : 'Visitado'}
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
    </Animated.View>
  )
}
