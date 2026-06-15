import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { DURATION, EASE_OUT } from '@lib/animations'

const PARTICLES = [
  { icon: 'airplane-outline' as const, size: 32, opacity: 0.07, top: '12%', left: '8%',  amplitude: 20, period: 3200 },
  { icon: 'map-outline' as const,      size: 24, opacity: 0.06, top: '25%', right: '10%', amplitude: 14, period: 2800 },
  { icon: 'camera-outline' as const,   size: 28, opacity: 0.08, top: '55%', left: '6%',  amplitude: 18, period: 3600 },
  { icon: 'card-outline' as const,     size: 24, opacity: 0.06, top: '70%', right: '8%', amplitude: 12, period: 4000 },
  { icon: 'heart-outline' as const,    size: 20, opacity: 0.07, top: '40%', left: '88%', amplitude: 16, period: 2400 },
]

function Particle({ icon, size, opacity, top, left, right, amplitude, period }: typeof PARTICLES[number]) {
  const translateY = useSharedValue(0)

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(amplitude, { duration: period / 2, easing: EASE_OUT }),
      -1,
      true,
    )
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View style={[styles.particle, { top, left, right } as any, style]}>
      <Ionicons name={icon} size={size} color={`rgba(0,0,0,${opacity})`} />
    </Animated.View>
  )
}

export function FloatingParticles() {
  return (
    <>
      {PARTICLES.map((p) => (
        <Particle key={p.icon} {...p} />
      ))}
    </>
  )
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    pointerEvents: 'none',
  },
})
