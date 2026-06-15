import { useEffect, useState } from 'react'
import { Modal, Text, View } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing, runOnJS } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@lib/colors'

interface ErrorToastProps {
  visible: boolean
  message: string
}

const SPRING = { damping: 15, stiffness: 350, mass: 1 }
const HIDE = { duration: 180, easing: Easing.in(Easing.ease) }

const toastShadow = {
  shadowColor: colors.error,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 6,
} as const

export function ErrorToast({ visible, message }: ErrorToastProps) {
  const insets = useSafeAreaInsets()
  const translateY = useSharedValue(-80)
  const opacity = useSharedValue(0)
  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    if (visible) {
      setModalVisible(true)
      translateY.value = withSpring(0, SPRING)
      opacity.value = withTiming(1, { duration: 200 })
    } else {
      translateY.value = withTiming(-80, HIDE)
      opacity.value = withTiming(0, HIDE, (finished) => {
        if (finished) runOnJS(setModalVisible)(false)
      })
    }
  }, [visible])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Modal transparent animationType="none" visible={modalVisible} statusBarTranslucent>
      <View pointerEvents="none" style={{ flex: 1 }}>
        <Animated.View
          pointerEvents="none"
          style={[
            animatedStyle,
            { position: 'absolute', top: insets.top + 12, left: 16, right: 16 },
          ]}
        >
          <View className="rounded-2xl" style={toastShadow}>
            <View className="bg-error-50 dark:bg-error-900 rounded-2xl overflow-hidden flex-row items-stretch border border-error-100 dark:border-error-800">
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
      </View>
    </Modal>
  )
}
