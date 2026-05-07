import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

interface SkeletonProps {
  width?: number | `${number}%`
  height?: number
  className?: string
}

export function Skeleton({ width, height = 16, className = '' }: SkeletonProps) {
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.35, { duration: 700 }), -1, true)
  }, [opacity])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      style={[animatedStyle, { height, width: width as any }]}
      className={`bg-neutral-200 rounded-xl ${className}`}
    />
  )
}

export function SkeletonText({ className = '' }: { className?: string }) {
  return <Skeleton height={14} className={`w-3/4 rounded-md ${className}`} />
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <View className={`bg-white rounded-2xl p-4 gap-3 shadow-sm ${className}`}>
      <Skeleton height={20} className="w-3/4" />
      <Skeleton height={14} className="w-1/2" />
      <Skeleton height={14} className="w-2/3" />
    </View>
  )
}
