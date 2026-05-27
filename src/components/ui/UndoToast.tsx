import { useEffect } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@lib/colors'

interface UndoToastProps {
  visible: boolean
  message: string
  onUndo?: () => void
  actionLabel?: string
  onAction?: () => void
}

const SPRING = { damping: 15, stiffness: 350, mass: 1 }
const HIDE = { duration: 180, easing: Easing.in(Easing.ease) }

const toastShadow = {
  shadowColor: colors.primary[500],
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 6,
} as const

export function UndoToast({ visible, message, onUndo, actionLabel, onAction }: UndoToastProps) {
  const insets = useSafeAreaInsets()
  const translateY = useSharedValue(-80)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SPRING)
      opacity.value = withTiming(1, { duration: 200 })
    } else {
      translateY.value = withTiming(-80, HIDE)
      opacity.value = withTiming(0, HIDE)
    }
  }, [visible])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        animatedStyle,
        { position: 'absolute', top: insets.top + 12, left: 16, right: 16, zIndex: 50 },
      ]}
    >
      <View className="rounded-2xl" style={toastShadow}>
        <View className="bg-primary-50 dark:bg-primary-900 rounded-2xl overflow-hidden flex-row items-stretch border border-primary-100 dark:border-primary-800">
          <View className="w-[3px] bg-primary-500 dark:bg-primary-400" />
          <View className="flex-1 flex-row items-center px-4 py-3">
            <Text className="text-neutral-900 dark:text-neutral-50 text-[15px] flex-1" numberOfLines={1}>
              {message}
            </Text>
            {(onAction || onUndo) && (
              <>
                <View className="w-px h-5 bg-neutral-200 dark:bg-surface-600 mx-3" />
                <TouchableOpacity
                  onPress={onAction ?? onUndo}
                  className="min-h-[44px] justify-center"
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                >
                  <Text className="text-primary-500 dark:text-primary-400 text-[15px] font-semibold">
                    {actionLabel ?? 'Deshacer'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  )
}
