import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { useTranslation } from 'react-i18next'
import { DURATION, EASE_OUT } from '@lib/animations'

// Each chip has a slightly different offset and rotation to look intentionally "chaotic"
const CHIP_CONFIGS = [
  { rotationDeg: -4, translateXOffset: -8 },
  { rotationDeg:  3, translateXOffset:  6 },
  { rotationDeg: -2, translateXOffset: -4 },
  { rotationDeg:  5, translateXOffset:  10 },
]

const CHIP_KEYS = [
  'onboarding_slide2_chip1',
  'onboarding_slide2_chip2',
  'onboarding_slide2_chip3',
  'onboarding_slide2_chip4',
] as const

interface ChipProps {
  label: string
  delay: number
  rotationDeg: number
  translateXOffset: number
}

function Chip({ label, delay, rotationDeg, translateXOffset }: ChipProps) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(24)

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: DURATION.normal, easing: EASE_OUT }))
    translateY.value = withDelay(delay, withTiming(0, { duration: DURATION.normal, easing: EASE_OUT }))
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateXOffset },
      { rotate: `${rotationDeg}deg` },
    ],
  }))

  return (
    <Animated.View style={[styles.chip, style]}>
      <Text style={styles.chipText}>{label}</Text>
    </Animated.View>
  )
}

interface ChaosChipsProps {
  isActive: boolean
}

export function ChaosChips({ isActive }: ChaosChipsProps) {
  const { t } = useTranslation()

  if (!isActive) return null

  return (
    <View style={styles.container}>
      {CHIP_KEYS.map((key, i) => (
        <Chip
          key={key}
          label={t(key)}
          delay={i * 90}
          rotationDeg={CHIP_CONFIGS[i].rotationDeg}
          translateXOffset={CHIP_CONFIGS[i].translateXOffset}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  chip: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipText: {
    color: '#dc2626',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
})
