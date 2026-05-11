import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { SharedValue } from 'react-native-reanimated'
import { ThemeToggle } from '@components/ui/ThemeToggle'
import { useTripContext } from '../TripProvider'
import { formatShortDate } from '@utils/date'

const COLLAPSE_THRESHOLD = 60

interface TripHeaderProps {
  scrollY?: SharedValue<number>
}

export function TripHeader({ scrollY }: TripHeaderProps) {
  const { trip, collaborators } = useTripContext()

  const internalScrollY = useSharedValue(0)
  const activeScrollY = scrollY ?? internalScrollY

  const isMeasured = useSharedValue(false)
  const detailHeightSV = useSharedValue(0)

  const dateRange = `${formatShortDate(trip.start_date)} - ${formatShortDate(trip.end_date)}`
  const travelerCount = collaborators.length

  const detailAnimStyle = useAnimatedStyle(() => {
    if (!isMeasured.value) return {}
    const progress = interpolate(activeScrollY.value, [0, COLLAPSE_THRESHOLD], [0, 1], 'clamp')
    return {
      height: interpolate(progress, [0, 1], [detailHeightSV.value, 0]),
      opacity: interpolate(progress, [0, 0.6], [1, 0]),
    }
  })

  const compactTitleAnimStyle = useAnimatedStyle(() => {
    const progress = interpolate(activeScrollY.value, [20, COLLAPSE_THRESHOLD], [0, 1], 'clamp')
    return {
      opacity: progress,
      transform: [{ translateX: interpolate(progress, [0, 1], [6, 0]) }],
    }
  })

  return (
    <SafeAreaView className="bg-white dark:bg-surface-800" edges={['top']}>
      <View className="px-5 pt-2">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2 flex-1 overflow-hidden mr-2">
            <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
              TripSync
            </Text>
            <Animated.Text
              className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 flex-shrink"
              numberOfLines={1}
              style={compactTitleAnimStyle}
            >
              · {trip.title}
            </Animated.Text>
          </View>
          <View className="flex-row items-center gap-2">
            <ThemeToggle className="bg-neutral-100 dark:bg-surface-700" />
            <View className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-surface-700 items-center justify-center">
              <Ionicons name="person" size={16} color="#64748b" />
            </View>
          </View>
        </View>

        <Animated.View
          style={[{ overflow: 'hidden' }, detailAnimStyle]}
          onLayout={(e) => {
            if (!isMeasured.value) {
              detailHeightSV.value = e.nativeEvent.layout.height
              isMeasured.value = true
            }
          }}
        >
          <Text
            className="text-[34px] font-bold text-neutral-900 dark:text-neutral-50 leading-tight mb-1"
            numberOfLines={3}
          >
            {trip.title}
          </Text>

          <View className="flex-row items-center flex-wrap pb-5">
            <Text className="text-[15px] font-medium text-primary-500">{dateRange}</Text>
            <Text className="text-[15px] text-neutral-400 dark:text-neutral-500">
              {' '}· {travelerCount} {travelerCount === 1 ? 'viajero' : 'viajeros'}
            </Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}
