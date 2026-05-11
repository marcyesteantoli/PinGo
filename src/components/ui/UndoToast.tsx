import { useEffect } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'

interface UndoToastProps {
  visible: boolean
  message: string
  onUndo: () => void
}

const SHOW = { duration: 280, easing: Easing.out(Easing.ease) }
const HIDE = { duration: 200, easing: Easing.in(Easing.ease) }

export function UndoToast({ visible, message, onUndo }: UndoToastProps) {
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
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        animatedStyle,
        { position: 'absolute', bottom: 96, left: 16, right: 16, zIndex: 50 },
      ]}
    >
      <View
        className="bg-primary-50 rounded-2xl px-4 py-3.5 flex-row items-center border border-primary-200"
        style={{ elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }}
      >
        <Text className="text-primary-900 text-sm flex-1" numberOfLines={1}>{message}</Text>
        <TouchableOpacity onPress={onUndo} className="ml-4 py-0.5">
          <Text className="text-primary-600 text-sm font-semibold">Deshacer</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}
