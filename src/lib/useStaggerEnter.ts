import { useEffect } from 'react'
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { EASE_OUT, DURATION } from '@lib/animations'

interface StaggerEnterOptions {
  delay?: number
  duration?: number
  axis?: 'y' | 'x'
  distance?: number
}

const MAX_STAGGER_INDEX = 8

export function useStaggerEnter(index: number, opts: StaggerEnterOptions = {}) {
  const { delay = 60, duration = DURATION.normal, axis = 'y', distance = 10 } = opts

  const opacity = useSharedValue(0)
  const translate = useSharedValue(distance)

  const effectiveIndex = Math.min(index, MAX_STAGGER_INDEX)

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration, easing: EASE_OUT })
      translate.value = withTiming(0, { duration, easing: EASE_OUT })
    }, effectiveIndex * delay)

    return () => clearTimeout(timeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: axis === 'y'
      ? [{ translateY: translate.value }]
      : [{ translateX: translate.value }],
  }))
}
