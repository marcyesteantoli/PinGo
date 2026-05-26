import { useEffect } from 'react'
import { Text, View } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@lib/colors'

interface ErrorToastProps {
  visible: boolean
  message: string
}

const SHOW = { duration: 280, easing: Easing.out(Easing.ease) }
const HIDE = { duration: 200, easing: Easing.in(Easing.ease) }

const toastShadow = {
  shadowColor: colors.error,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 6,
} as const

export function ErrorToast({ visible, message }: ErrorToastProps) {
  const translateY = useSharedValue(20)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, SHOW)
      opacity.value = withTiming(1, SHOW)
    } else {
      translateY.value = withTiming(20, HIDE)
      opacity.value = withTiming(0, HIDE)
    }
  }, [visible])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        animatedStyle,
        { position: 'absolute', bottom: 96, left: 16, right: 16, zIndex: 100 },
      ]}
    >
      <View className="rounded-2xl" style={toastShadow}>
        <View className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden flex-row items-stretch">
          <View className="w-[3px] bg-error" />
          <View className="flex-1 flex-row items-center px-4 py-3 gap-3">
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text className="text-neutral-900 dark:text-neutral-50 text-[15px] flex-1" numberOfLines={2}>
              {message}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  )
}
