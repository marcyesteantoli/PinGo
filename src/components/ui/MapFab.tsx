import { Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { fabShadow } from '@lib/shadows'
import { useFabScroll } from '@lib/useFabScroll'
import { EASE_OUT, DURATION } from '@lib/animations'

interface MapFabProps {
  onPress: () => void
  scrollY: SharedValue<number>
}

export function MapFab({ onPress, scrollY }: MapFabProps) {
  const { fabAnimStyle } = useFabScroll(scrollY)
  const { t } = useTranslation()

  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))

  return (
    <Animated.View className="absolute right-5" style={[fabAnimStyle, { bottom: 16 }]} pointerEvents="box-none">
      <Animated.View style={pressStyle}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.85}
          onPressIn={() => { pressScale.value = withTiming(0.96, { duration: DURATION.press, easing: EASE_OUT }) }}
          onPressOut={() => { pressScale.value = withTiming(1, { duration: DURATION.press, easing: EASE_OUT }) }}
          className="flex-row items-center bg-primary-500 rounded-full pl-4 pr-5 h-14 gap-2"
          style={fabShadow}
        >
          <Ionicons name="map" size={20} color="#ffffff" />
          <Text className="text-white text-[15px] font-semibold">{t('common_viewMap')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  )
}
