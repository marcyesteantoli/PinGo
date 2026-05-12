import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const OFFSCREEN_Y = 1000
const CLOSE_THRESHOLD = 80
const SNAP_SPRING = { damping: 40, stiffness: 400, mass: 1 }

interface BottomSheetProps {
  visible: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets()
  const paddingBottom = Math.max(insets.bottom + 16, 32)
  const [modalVisible, setModalVisible] = useState(false)

  // Easing.bezier must be inside the component, not at module level.
  // At module level it runs before Reanimated's worklet runtime initializes on iOS,
  // causing a silent native crash with no JS error.
  const OPEN_TIMING = useMemo(() => ({ duration: 380, easing: Easing.bezier(0.25, 1, 0.5, 1) }), [])
  const CLOSE_TIMING = useMemo(() => ({ duration: 260, easing: Easing.bezier(0.4, 0, 1, 1) }), [])

  const translateY = useSharedValue(OFFSCREEN_Y)
  const backdropOpacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      translateY.value = OFFSCREEN_Y
      backdropOpacity.value = 0
      setModalVisible(true)
    } else {
      backdropOpacity.value = withTiming(0, { duration: 220 })
      translateY.value = withTiming(OFFSCREEN_Y, CLOSE_TIMING, () => {
        runOnJS(setModalVisible)(false)
      })
    }
  }, [visible])

  useEffect(() => {
    if (modalVisible) {
      translateY.value = withTiming(0, OPEN_TIMING)
      backdropOpacity.value = withTiming(1, { duration: 280 })
    }
  }, [modalVisible])

  const handleGestureClose = useCallback(() => {
    Keyboard.dismiss()
    onClose()
  }, [onClose])

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY
        backdropOpacity.value = Math.max(0, 1 - e.translationY / 300)
      }
    })
    .onEnd((e) => {
      if (e.translationY > CLOSE_THRESHOLD || e.velocityY > 700) {
        runOnJS(handleGestureClose)()
      } else {
        translateY.value = withSpring(0, SNAP_SPRING)
        backdropOpacity.value = withTiming(1, { duration: 200 })
      }
    })

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
            },
            backdropStyle,
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={() => { Keyboard.dismiss(); onClose() }} />
        </Animated.View>

        <Animated.View style={sheetStyle}>
          <View className="bg-white dark:bg-surface-800 rounded-t-[28px] px-5" style={{ paddingBottom }}>
            <GestureDetector gesture={gesture}>
              <View style={{ width: '100%', alignItems: 'center', paddingTop: 12, paddingBottom: 16 }}>
                <View className="w-9 h-[5px] rounded-full bg-neutral-300 dark:bg-surface-500" />
              </View>
            </GestureDetector>

            {title && (
              <View className="flex-row items-center justify-between mb-5">
                <Text className="text-[20px] font-semibold text-neutral-900 dark:text-neutral-50">{title}</Text>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); onClose() }} className="p-2 -mr-1">
                  <Text className="text-[17px] text-primary-500 dark:text-primary-400">Cerrar</Text>
                </TouchableOpacity>
              </View>
            )}

            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
