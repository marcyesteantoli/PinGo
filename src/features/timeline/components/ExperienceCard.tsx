import { Ionicons } from '@expo/vector-icons'
import { GestureDetector, Gesture, TouchableOpacity } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { Text, View } from 'react-native'
import { Badge } from '@components/ui/Badge'
import type { BadgeVariant } from '@components/ui/Badge'
import { EXPERIENCE_TYPE_LABELS, TIME_SLOT_LABELS } from '../types'
import type { Experience } from '@types/index'

const TYPE_ICONS: Record<Experience['type'], React.ComponentProps<typeof Ionicons>['name']> = {
  transport: 'airplane-outline',
  accommodation: 'bed-outline',
  activity: 'compass-outline',
  restaurant: 'restaurant-outline',
  other: 'ellipse-outline',
}

const TYPE_BADGE_VARIANT: Record<Experience['type'], BadgeVariant> = {
  transport: 'transport',
  accommodation: 'accommodation',
  activity: 'activity',
  restaurant: 'restaurant',
  other: 'other',
}

const TYPE_ICON_BG: Record<Experience['type'], string> = {
  transport: 'bg-sky-100',
  accommodation: 'bg-purple-100',
  activity: 'bg-primary-100',
  restaurant: 'bg-amber-100',
  other: 'bg-neutral-100',
}

const TYPE_ICON_COLOR: Record<Experience['type'], string> = {
  transport: '#0284c7',
  accommodation: '#7c3aed',
  activity: '#ea580c',
  restaurant: '#d97706',
  other: '#737373',
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

  return (
    <View className="overflow-hidden rounded-2xl">
      {canDelete && (
        <View className="absolute right-0 top-0 bottom-0 w-[76px] bg-error rounded-2xl items-center justify-center">
          <TouchableOpacity onPress={handleDeletePress} className="items-center justify-center p-4">
            <Ionicons name="trash-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}

      <GestureDetector gesture={pan}>
        <Animated.View
          style={cardStyle}
          className="bg-white rounded-2xl p-4 shadow-sm flex-row gap-3 items-start"
        >
          <TouchableOpacity onPress={onPress} className="flex-row gap-3 flex-1 items-start" activeOpacity={0.7}>
            <View className={`w-10 h-10 rounded-xl items-center justify-center ${TYPE_ICON_BG[experience.type]}`}>
              <Ionicons
                name={TYPE_ICONS[experience.type]}
                size={18}
                color={TYPE_ICON_COLOR[experience.type]}
              />
            </View>

            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-neutral-900" numberOfLines={2}>
                {experience.title}
              </Text>

              <View className="flex-row gap-2 flex-wrap">
                <Badge
                  label={EXPERIENCE_TYPE_LABELS[experience.type]}
                  variant={TYPE_BADGE_VARIANT[experience.type]}
                />
                {experience.time_slot && (
                  <Badge
                    label={TIME_SLOT_LABELS[experience.time_slot]}
                    variant="neutral"
                  />
                )}
              </View>

              {experience.confirmation_code && (
                <Text className="text-xs text-neutral-400 font-mono">
                  Ref: {experience.confirmation_code}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  )
}
