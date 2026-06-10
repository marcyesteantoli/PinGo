import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { DURATION, EASE_OUT } from '@lib/animations'

interface ExpenseSplitMockupProps {
  isActive: boolean
}

const BADGES: {
  key: string
  icon: React.ComponentProps<typeof Ionicons>['name']
  bg: string
  color: string
  top: number
  left?: number
  right?: number
}[] = [
  { key: 'restaurant',    icon: 'restaurant-outline',     bg: '#FFEDD5', color: '#F97316', top: 4,   left: 8 },
  { key: 'accommodation', icon: 'bed-outline',            bg: '#EDE9FE', color: '#8B5CF6', top: -4,  right: 12 },
  { key: 'transport',     icon: 'airplane-outline',       bg: '#DBEAFE', color: '#3B82F6', top: 100, left: -8 },
  { key: 'doc',           icon: 'document-text-outline',  bg: '#CFFAFE', color: '#06b6d4', top: 108, right: -12 },
]

export function ExpenseSplitMockup({ isActive }: ExpenseSplitMockupProps) {
  const docOpacity = useSharedValue(0)

  useEffect(() => {
    if (!isActive) {
      docOpacity.value = 0
      return
    }
    docOpacity.value = withDelay(400, withTiming(1, { duration: DURATION.normal, easing: EASE_OUT }))
  }, [isActive])

  const docStyle = useAnimatedStyle(() => ({ opacity: docOpacity.value }))

  return (
    <View style={styles.container}>
      {BADGES.map(badge => {
        const positionStyle = {
          position: 'absolute' as const,
          top: badge.top,
          left: badge.left,
          right: badge.right,
        }
        const badgeView = (
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Ionicons name={badge.icon} size={26} color={badge.color} />
          </View>
        )
        if (badge.key === 'doc') {
          return (
            <Animated.View key={badge.key} style={[positionStyle, docStyle]}>
              {badgeView}
            </Animated.View>
          )
        }
        return (
          <View key={badge.key} style={positionStyle}>
            {badgeView}
          </View>
        )
      })}

      <View style={styles.centerCircle}>
        <Ionicons name="cash-outline" size={56} color="#000000" />
      </View>

      <View style={styles.plusBadge}>
        <Ionicons name="add" size={28} color="#ffffff" />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  centerCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#ffffff',
    borderWidth: 10,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 14,
    right: 60,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
})
