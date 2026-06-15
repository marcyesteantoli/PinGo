import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { DURATION, EASE_OUT } from '@lib/animations'

interface CardConfig {
  key: string
  icon: React.ComponentProps<typeof Ionicons>['name']
  iconBg: string
  iconColor: string
  lineWidths: number[]
  size: { width: number; height: number }
  position: { top?: number; left?: number; right?: number; bottom?: number }
  rotate: number
}

const CARDS: CardConfig[] = [
  {
    key: 'chat',
    icon: 'chatbubbles-outline',
    iconBg: '#DBEAFE',
    iconColor: '#3B82F6',
    lineWidths: [0.8, 0.5],
    size: { width: 132, height: 84 },
    position: { top: 0, left: 6 },
    rotate: -7,
  },
  {
    key: 'sheet',
    icon: 'grid-outline',
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
    lineWidths: [0.65, 0.85],
    size: { width: 116, height: 96 },
    position: { top: 28, right: 2 },
    rotate: 6,
  },
  {
    key: 'shot',
    icon: 'image-outline',
    iconBg: '#F3E8FF',
    iconColor: '#9333EA',
    lineWidths: [0.55, 0.4],
    size: { width: 110, height: 92 },
    position: { bottom: 16, left: 0 },
    rotate: 9,
  },
  {
    key: 'mail',
    icon: 'mail-outline',
    iconBg: '#FFEDD5',
    iconColor: '#F97316',
    lineWidths: [0.75, 0.6],
    size: { width: 130, height: 78 },
    position: { bottom: 0, right: 16 },
    rotate: -5,
  },
]

const STAGE_SIZE = 260

interface ChaosStackMockupProps {
  width: number
  isActive: boolean
}

function StackedCard({ config, scale, delay, isActive }: { config: CardConfig; scale: number; delay: number; isActive: boolean }) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(28)
  const rotate = useSharedValue(config.rotate * 2)

  useEffect(() => {
    if (!isActive) {
      opacity.value = 0
      translateY.value = 28
      rotate.value = config.rotate * 2
      return
    }
    opacity.value = withDelay(delay, withTiming(1, { duration: DURATION.normal, easing: EASE_OUT }))
    translateY.value = withDelay(delay, withTiming(0, { duration: DURATION.normal, easing: EASE_OUT }))
    rotate.value = withDelay(delay, withTiming(config.rotate, { duration: DURATION.normal, easing: EASE_OUT }))
  }, [isActive])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
  }))

  const positionStyle = {
    position: 'absolute' as const,
    top: config.position.top !== undefined ? config.position.top * scale : undefined,
    left: config.position.left !== undefined ? config.position.left * scale : undefined,
    right: config.position.right !== undefined ? config.position.right * scale : undefined,
    bottom: config.position.bottom !== undefined ? config.position.bottom * scale : undefined,
  }

  return (
    <Animated.View
      style={[
        styles.card,
        positionStyle,
        { width: config.size.width * scale, height: config.size.height * scale },
        style,
      ]}
    >
      <View style={[styles.iconBadge, { backgroundColor: config.iconBg }]}>
        <Ionicons name={config.icon} size={18 * scale} color={config.iconColor} />
      </View>
      <View style={styles.lines}>
        {config.lineWidths.map((w, i) => (
          <View key={i} style={[styles.line, { width: `${w * 100}%` }]} />
        ))}
      </View>
    </Animated.View>
  )
}

function CenterAlert({ scale, isActive }: { scale: number; isActive: boolean }) {
  const opacity = useSharedValue(0)
  const alertScale = useSharedValue(0.5)

  useEffect(() => {
    if (!isActive) {
      opacity.value = 0
      alertScale.value = 0.5
      return
    }
    const delay = CARDS.length * 90 + 60
    opacity.value = withDelay(delay, withTiming(1, { duration: DURATION.normal, easing: EASE_OUT }))
    alertScale.value = withDelay(delay, withTiming(1, { duration: DURATION.normal, easing: EASE_OUT }))
  }, [isActive])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: alertScale.value }],
  }))

  return (
    <Animated.View style={[styles.centerAlert, { width: 92 * scale, height: 92 * scale, borderRadius: 46 * scale }, style]}>
      <Ionicons name="warning" size={44 * scale} color="#ef4444" />
    </Animated.View>
  )
}

function NotificationBadge({ scale, isActive }: { scale: number; isActive: boolean }) {
  const opacity = useSharedValue(0)
  const badgeScale = useSharedValue(0.4)

  useEffect(() => {
    if (!isActive) {
      opacity.value = 0
      badgeScale.value = 0.4
      return
    }
    const delay = CARDS.length * 90 + 80
    opacity.value = withDelay(delay, withTiming(1, { duration: DURATION.normal, easing: EASE_OUT }))
    badgeScale.value = withDelay(delay, withTiming(1, { duration: DURATION.normal, easing: EASE_OUT }))
  }, [isActive])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: badgeScale.value }, { rotate: '8deg' }],
  }))

  return (
    <Animated.View style={[styles.notifBadge, { top: -8 * scale, left: 92 * scale }, style]}>
      <Text style={styles.notifText}>12+</Text>
    </Animated.View>
  )
}

export function ChaosStackMockup({ width, isActive }: ChaosStackMockupProps) {
  const stageSize = Math.min(width, STAGE_SIZE)
  const scale = stageSize / STAGE_SIZE

  return (
    <View style={[styles.stage, { width: stageSize, height: stageSize }]}>
      {CARDS.map((card, i) => (
        <StackedCard key={card.key} config={card} scale={scale} delay={i * 90} isActive={isActive} />
      ))}
      <NotificationBadge scale={scale} isActive={isActive} />
      <View style={styles.centerWrapper} pointerEvents="none">
        <CenterAlert scale={scale} isActive={isActive} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  stage: {
    position: 'relative',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lines: {
    gap: 6,
  },
  line: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  notifBadge: {
    position: 'absolute',
    minWidth: 36,
    height: 26,
    paddingHorizontal: 8,
    borderRadius: 13,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  notifText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  centerWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerAlert: {
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
})
