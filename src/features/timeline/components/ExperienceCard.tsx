import { memo, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'
import { Text, TouchableOpacity, View } from 'react-native'
import { Badge } from '@components/ui/Badge'
import type { BadgeVariant } from '@components/ui/Badge'
import { EXPERIENCE_TYPE_LABELS, formatTimeRange } from '../types'
import type { Experience } from '@types/index'

const TYPE_BADGE_VARIANT: Record<Experience['type'], BadgeVariant> = {
  transport: 'transport',
  accommodation: 'accommodation',
  activity: 'activity',
  restaurant: 'restaurant',
  other: 'other',
}

const DELETE_WIDTH = 76

interface ExperienceCardProps {
  experience: Experience
  canDelete?: boolean
  onDelete?: () => void
  onPress?: () => void
}

export const ExperienceCard = memo(function ExperienceCard({ experience, canDelete, onDelete, onPress }: ExperienceCardProps) {
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

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onBegin(() => {
      savedX.value = translateX.value
    })
    .onUpdate((e) => {
      if (!canDelete) return
      translateX.value = Math.min(0, Math.max(-DELETE_WIDTH, savedX.value + e.translationX))
    })
    .onEnd(() => {
      if (!canDelete) {
        translateX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
        return
      }
      translateX.value = translateX.value < -DELETE_WIDTH / 2
        ? withTiming(-DELETE_WIDTH, { duration: 240, easing: Easing.out(Easing.cubic) })
        : withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
    })

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const handleDeletePress = () => {
    translateX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
    onDelete?.()
  }

  const hasBottomRow = !!(timeRange || experience.confirmation_code)

  // Width only known after first layout — card is hidden until then to avoid flash
  const rowWidth = containerWidth > 0 ? containerWidth + (canDelete ? DELETE_WIDTH : 0) : undefined
  const cardWidth = containerWidth > 0 ? containerWidth : undefined

  return (
    <View
      className="rounded-2xl"
      style={{
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        opacity: containerWidth > 0 ? 1 : 0,
      }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width
        if (w > 0 && w !== containerWidth) setContainerWidth(w)
      }}
    >
      <View className="overflow-hidden rounded-2xl">
        <Animated.View style={[{ flexDirection: 'row', width: rowWidth }, cardStyle]}>
          <GestureDetector gesture={pan}>
            <View style={{ width: cardWidth, flex: cardWidth === undefined ? 1 : undefined }}>
              <TouchableOpacity
                onPress={onPress}
                className="bg-white dark:bg-surface-800 px-4 pt-3 pb-3"
                activeOpacity={0.7}
              >
                {/* Badge row */}
                <View className="flex-row gap-1.5 mb-2">
                  <Badge
                    label={EXPERIENCE_TYPE_LABELS[experience.type]}
                    variant={TYPE_BADGE_VARIANT[experience.type]}
                  />
                  {experience.type === 'accommodation' && experience.confirmation_code && (
                    <Badge label="Check-in" variant="neutral" />
                  )}
                </View>

                {/* Title */}
                <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50 mb-0.5" numberOfLines={2}>
                  {experience.title}
                </Text>

                {/* Location subtitle */}
                {location?.name && (
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <Ionicons name="location-outline" size={12} color="#94a3b8" />
                    <Text className="text-xs text-neutral-400 dark:text-neutral-500 flex-1" numberOfLines={1}>
                      {location.name}
                    </Text>
                  </View>
                )}

                {/* Bottom row: time range + confirmation code */}
                {hasBottomRow && (
                  <View className="flex-row items-center gap-2 mt-2.5 pt-2.5 border-t border-neutral-100 dark:border-surface-700">
                    {timeRange && (
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="time-outline" size={12} color="#94a3b8" />
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
                        <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                          + Reserva {experience.confirmation_code}
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </GestureDetector>

          {canDelete && (
            <TouchableOpacity
              onPress={handleDeletePress}
              className="bg-error items-center justify-center"
              style={{ width: DELETE_WIDTH }}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </View>
  )
})
