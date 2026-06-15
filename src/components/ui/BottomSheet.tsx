import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Dimensions, Keyboard, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EASE_DRAWER, EASE_DRAWER_OUT, DURATION } from '@lib/animations'

const SCREEN_HEIGHT = Dimensions.get('window').height

const OFFSCREEN_Y = SCREEN_HEIGHT
const CLOSE_THRESHOLD = 80

interface BottomSheetProps {
  visible: boolean
  onClose: () => void
  title?: string
  scrollable?: boolean
  children: ReactNode
}

export function BottomSheet({ visible, onClose, title, scrollable, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const paddingBottom = Math.max(insets.bottom + 16, 32)
  const [modalVisible, setModalVisible] = useState(false)

  const OPEN_TIMING = useMemo(() => ({ duration: DURATION.sheet, easing: EASE_DRAWER }), [])
  const CLOSE_TIMING = useMemo(() => ({ duration: DURATION.sheetClose, easing: EASE_DRAWER_OUT }), [])

  const translateY = useSharedValue(OFFSCREEN_Y)
  const backdropOpacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      translateY.value = OFFSCREEN_Y
      backdropOpacity.value = 0
      setModalVisible(true)
      // Animation starts in Modal.onShow — guarantees modal is mounted before animating
    } else {
      // Gesture may have already animated out — skip animation, just unmount
      if (translateY.value >= SCREEN_HEIGHT - 1) {
        setModalVisible(false)
        return
      }
      backdropOpacity.value = withTiming(0, { duration: DURATION.sheetClose })
      translateY.value = withTiming(OFFSCREEN_Y, CLOSE_TIMING, () => {
        runOnJS(setModalVisible)(false)
      })
    }
  }, [visible])

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
        // Animate on UI thread immediately — no JS round-trip freeze
        backdropOpacity.value = withTiming(0, { duration: 250 })
        if (e.velocityY > 500) {
          // Follow finger momentum naturally
          translateY.value = withDecay(
            { velocity: e.velocityY, clamp: [0, SCREEN_HEIGHT] },
            () => { runOnJS(handleGestureClose)() }
          )
        } else {
          translateY.value = withTiming(SCREEN_HEIGHT, CLOSE_TIMING, () => {
            runOnJS(handleGestureClose)()
          })
        }
      } else {
        translateY.value = withTiming(0, { duration: DURATION.sheet, easing: EASE_DRAWER })
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
      onShow={() => {
        translateY.value = withTiming(0, OPEN_TIMING)
        backdropOpacity.value = withTiming(1, { duration: 280 })
      }}
    >
      <GestureHandlerRootView style={{ flex: 1, justifyContent: 'flex-end' }}>
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
          <View
            className="bg-white dark:bg-surface-800 rounded-t-[28px] px-5"
            style={{ paddingBottom: scrollable ? 0 : paddingBottom, maxHeight: SCREEN_HEIGHT * 0.9 }}
          >
            <GestureDetector gesture={gesture}>
              <View style={{ width: '100%', alignItems: 'center', paddingTop: 12, paddingBottom: 16 }}>
                <View className="w-9 h-[5px] rounded-full bg-neutral-300 dark:bg-surface-500" />
              </View>
            </GestureDetector>

            {title && (
              <View className="flex-row items-center justify-between mb-5">
                <Text className="text-[20px] font-semibold text-neutral-900 dark:text-neutral-50">{title}</Text>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); onClose() }} className="p-2 -mr-1">
                  <Text className="text-[17px] text-primary-500 dark:text-primary-300">{t('bottomSheet_close')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {scrollable ? (
              <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bottomOffset={16}
                contentContainerStyle={{ paddingBottom }}
              >
                {children}
              </KeyboardAwareScrollView>
            ) : children}
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  )
}
