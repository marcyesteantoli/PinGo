import { Pressable, View, Text } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { EASE_OUT, DURATION } from '@lib/animations'
import { cardShadow } from '@lib/shadows'
import { TYPE_ICONS, TYPE_COLORS } from '../constants'
import type { WishlistItem } from '@types/index'

interface WishlistLaneCardProps {
  item: WishlistItem
  onPress: () => void
}

export function WishlistLaneCard({ item, onPress }: WishlistLaneCardProps) {
  const bg = TYPE_COLORS[item.type]
  const icon = TYPE_ICONS[item.type]
  const location = [item.location?.city, item.location?.country].filter(Boolean).join(', ')
  const isVisited = !!item.visited_at

  const scale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.96, { duration: DURATION.press, easing: EASE_OUT }) }}
      onPressOut={() => { scale.value = withTiming(1.0, { duration: DURATION.press, easing: EASE_OUT }) }}
    >
      <Animated.View style={[pressStyle, { width: 160, height: 130, borderRadius: 16 }, cardShadow]}>
        <View style={{ flex: 1, backgroundColor: bg, borderRadius: 16, overflow: 'hidden' }}>
          {/* Ghost icon */}
          <View style={{ position: 'absolute', right: -12, bottom: -12, opacity: 0.15 }}>
            <Ionicons name={icon} size={84} color="white" />
          </View>

          {/* Visited badge */}
          {isVisited && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: '#10b981',
                borderRadius: 11,
                width: 22,
                height: 22,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="checkmark" size={13} color="white" />
            </View>
          )}

          {/* Content */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 }}>
            <Text numberOfLines={2} style={{ color: 'white', fontSize: 15, fontWeight: '700', lineHeight: 20 }}>
              {item.name}
            </Text>
            {location ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 2 }}>
                <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.8)" />
                <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, flex: 1 }}>
                  {location}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  )
}
