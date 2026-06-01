import { memo, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'
import { Pressable, Text, TouchableOpacity, View } from 'react-native'
import { EASE_OUT, DURATION } from '@lib/animations'
import { EmojiRating } from '@components/ui/EmojiRating'
import { formatTimeRange } from '../types'
import type { Experience } from '@types/index'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'

const TYPE_ICON: Record<Experience['type'], React.ComponentProps<typeof Ionicons>['name']> = {
  transport:     'airplane-outline',
  accommodation: 'bed-outline',
  activity:      'compass-outline',
  restaurant:    'restaurant-outline',
  entertainment: 'film-outline',
  other:         'ellipse-outline',
}

const TYPE_BG: Record<Experience['type'], string> = {
  transport:     'bg-activity-blue-bg dark:bg-[#061E4E]',
  accommodation: 'bg-activity-purple-bg dark:bg-[#24064E]',
  activity:      'bg-activity-green-bg dark:bg-[#064E3B]',
  restaurant:    'bg-activity-orange-bg dark:bg-[#4E1E06]',
  entertainment: 'bg-activity-pink-bg dark:bg-[#4E062A]',
  other:         'bg-activity-gray-bg dark:bg-[#334155]',
}

const TYPE_ICON_COLOR: Record<Experience['type'], string> = {
  transport:     '#3B82F6',
  accommodation: '#8B5CF6',
  activity:      '#22C55E',
  restaurant:    '#F97316',
  entertainment: '#EC4899',
  other:         '#94A3B8',
}

const EDIT_WIDTH = 72
const DELETE_WIDTH = 76

interface ExperienceCardProps {
  experience: Experience
  ratingAvg?: number | null
  ratingCount?: number
  canDelete?: boolean
  onDelete?: () => void
  canEdit?: boolean
  onEdit?: () => void
  onPress?: () => void
}

export const ExperienceCard = memo(function ExperienceCard({
  experience,
  ratingAvg,
  canDelete,
  onDelete,
  canEdit,
  onEdit,
  onPress,
}: ExperienceCardProps) {
  const translateX = useSharedValue(0)
  const savedX = useSharedValue(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const rawLocation = experience.location
  const location = (
    typeof rawLocation === 'object' &&
    rawLocation !== null &&
    'name' in rawLocation &&
    typeof (rawLocation as { name: unknown }).name === 'string'
  ) ? (rawLocation as { name: string }) : null
  const timeRange = formatTimeRange(experience.start_time, experience.end_time)

  const hasActions = canDelete || canEdit
  const actionsWidth = (canEdit ? EDIT_WIDTH : 0) + (canDelete ? DELETE_WIDTH : 0)

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onBegin(() => {
      savedX.value = translateX.value
    })
    .onUpdate((e) => {
      if (!hasActions) return
      translateX.value = Math.min(0, Math.max(-actionsWidth, savedX.value + e.translationX))
    })
    .onEnd(() => {
      if (!hasActions) {
        translateX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
        return
      }
      translateX.value = translateX.value < -actionsWidth / 2
        ? withTiming(-actionsWidth, { duration: 240, easing: Easing.out(Easing.cubic) })
        : withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
    })

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const closeSwipe = () => {
    translateX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
  }

  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))

  const handleEditPress = () => {
    closeSwipe()
    onEdit?.()
  }

  const handleDeletePress = () => {
    closeSwipe()
    onDelete?.()
  }

  const hasBottomRow = !!(timeRange || experience.confirmation_code || ratingAvg)

  const rowWidth = containerWidth > 0 ? containerWidth + (hasActions ? actionsWidth : 0) : undefined
  const cardWidth = containerWidth > 0 ? containerWidth : undefined

  return (
    <View
      className="rounded-2xl"
      style={[cardShadow, { opacity: containerWidth > 0 ? 1 : 0 }]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width
        if (w > 0 && w !== containerWidth) setContainerWidth(w)
      }}
    >
      <View className="overflow-hidden rounded-2xl">
        <Animated.View style={[{ flexDirection: 'row', width: rowWidth }, cardStyle]}>
          <GestureDetector gesture={pan}>
            <View style={{ width: cardWidth, flex: cardWidth === undefined ? 1 : undefined }}>
              <Pressable
                onPress={onPress}
                android_ripple={{ color: 'transparent', borderless: true }}
                onPressIn={() => { pressScale.value = withTiming(0.97, { duration: DURATION.press, easing: EASE_OUT }) }}
                onPressOut={() => { pressScale.value = withTiming(1, { duration: DURATION.press, easing: EASE_OUT }) }}
              >
              <Animated.View style={pressStyle} className="bg-white dark:bg-surface-800 px-4 pt-3.5 pb-3.5">
                {/* Top section: icon + title/location */}
                <View className="flex-row items-start gap-3">
                  <View className={`w-11 h-11 rounded-xl items-center justify-center flex-shrink-0 ${TYPE_BG[experience.type]}`}>
                    <Ionicons
                      name={TYPE_ICON[experience.type]}
                      size={22}
                      color={TYPE_ICON_COLOR[experience.type]}
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-[17px] font-semibold text-neutral-900 dark:text-neutral-50 leading-snug" numberOfLines={2}>
                      {experience.title}
                    </Text>

                    {location?.name && (
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <Ionicons name="location-outline" size={13} color={colors.neutral[400]} />
                        <Text className="text-sm text-neutral-500 dark:text-neutral-400 flex-1" numberOfLines={1}>
                          {location.name}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Full-width bottom row */}
                {hasBottomRow && (
                  <View className="flex-row items-center justify-between mt-2.5 pt-2.5 border-t border-neutral-100 dark:border-surface-700">
                    <View className="flex-row items-center gap-2">
                      {timeRange && (
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="time-outline" size={13} color={colors.neutral[400]} />
                          <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                            {timeRange}
                          </Text>
                        </View>
                      )}
                      {experience.confirmation_code && (
                        <>
                          {timeRange && (
                            <Text className="text-neutral-300 dark:text-neutral-600 text-sm">•</Text>
                          )}
                          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                            + Reserva {experience.confirmation_code}
                          </Text>
                        </>
                      )}
                    </View>
                    {ratingAvg != null && (
                      <EmojiRating value={ratingAvg} size="sm" />
                    )}
                  </View>
                )}
              </Animated.View>
              </Pressable>
            </View>
          </GestureDetector>

          {canEdit && (
            <TouchableOpacity
              onPress={handleEditPress}
              className="bg-primary-500 items-center justify-center"
              style={{ width: EDIT_WIDTH }}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color={colors.white} />
            </TouchableOpacity>
          )}

          {canDelete && (
            <TouchableOpacity
              onPress={handleDeletePress}
              className="bg-error items-center justify-center"
              style={{ width: DELETE_WIDTH }}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color={colors.white} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </View>
  )
})
