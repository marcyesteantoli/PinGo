import { Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import Animated from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { fabShadow } from '@lib/shadows'
import { useFabScroll } from '@lib/useFabScroll'

interface MapFabProps {
  onPress: () => void
  scrollY: SharedValue<number>
}

export function MapFab({ onPress, scrollY }: MapFabProps) {
  const { fabAnimStyle } = useFabScroll(scrollY)
  const { t } = useTranslation()

  return (
    <Animated.View className="absolute right-5" style={[fabAnimStyle, { bottom: 16 }]} pointerEvents="box-none">
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        className="flex-row items-center bg-primary-500 rounded-full pl-4 pr-5 h-14 gap-2"
        style={fabShadow}
      >
        <Ionicons name="map" size={20} color="#ffffff" />
        <Text className="text-white text-[15px] font-semibold">{t('common_viewMap')}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}
