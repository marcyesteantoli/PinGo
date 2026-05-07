import { Ionicons } from '@expo/vector-icons'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
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

export function ExperienceCard({ experience, canDelete, onDelete, onPress }: ExperienceCardProps) {
  const translateX = useSharedValue(0)
  const location = experience.location as { name?: string } | null
  const timeRange = formatTimeRange(experience.start_time, experience.end_time)

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      if (!canDelete) return
      translateX.value = Math.min(0, Math.max(-DELETE_WIDTH, e.translationX))
    })
    .onEnd((e) => {
      if (!canDelete) {
        translateX.value = withSpring(0)
        return
      }
      translateX.value = e.translationX < -DELETE_WIDTH / 2
        ? withSpring(-DELETE_WIDTH)
        : withSpring(0)
    })

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const handleDeletePress = () => {
    translateX.value = withSpring(0)
    onDelete?.()
  }

  const hasBottomRow = !!(timeRange || experience.confirmation_code)

  return (
    <View
      className="rounded-2xl"
      style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 }}
    >
      <View className="overflow-hidden rounded-2xl">
        {canDelete && (
          <View className="absolute right-0 top-0 bottom-0 w-[76px] bg-error items-center justify-center">
            <TouchableOpacity onPress={handleDeletePress} className="items-center justify-center p-4">
              <Ionicons name="trash-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        <GestureDetector gesture={pan}>
          <Animated.View style={cardStyle}>
            <TouchableOpacity
              onPress={onPress}
              className="bg-white px-4 pt-3 pb-3 rounded-2xl"
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
              <Text className="text-base font-semibold text-neutral-900 mb-0.5" numberOfLines={2}>
                {experience.title}
              </Text>

              {/* Location subtitle */}
              {location?.name && (
                <View className="flex-row items-center gap-1 mt-0.5">
                  <Ionicons name="location-outline" size={12} color="#94a3b8" />
                  <Text className="text-xs text-neutral-400 flex-1" numberOfLines={1}>
                    {location.name}
                  </Text>
                </View>
              )}

              {/* Bottom row: time range + confirmation code */}
              {hasBottomRow && (
                <View className="flex-row items-center gap-2 mt-2.5 pt-2.5 border-t border-neutral-100">
                  {timeRange && (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="time-outline" size={12} color="#525252" />
                      <Text className="text-sm font-semibold text-neutral-700">
                        {timeRange}
                      </Text>
                    </View>
                  )}
                  {experience.confirmation_code && (
                    <>
                      {timeRange && (
                        <Text className="text-neutral-300 text-sm">•</Text>
                      )}
                      <Text className="text-xs text-neutral-400">
                        + Reserva {experience.confirmation_code}
                      </Text>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  )
}
