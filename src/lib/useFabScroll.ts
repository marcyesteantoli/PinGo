import {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { EASE_OUT, EASE_OUT_FAST, DURATION } from '@lib/animations'

export function useFabScroll(scrollY: SharedValue<number>) {
  const fabVisible = useSharedValue(1)

  useAnimatedReaction(
    () => scrollY.value,
    (current, prev) => {
      if (prev === null) return
      // Near top: always show — prevents iOS rubber-band bounce from hiding FAB
      if (current <= 10) {
        if (fabVisible.value !== 1) {
          fabVisible.value = withTiming(1, { duration: DURATION.fast, easing: EASE_OUT })
        }
        return
      }
      const dy = current - prev
      if (dy > 8 && fabVisible.value === 1) {
        fabVisible.value = withTiming(0, { duration: DURATION.micro, easing: EASE_OUT_FAST })
      } else if (dy < -8 && fabVisible.value === 0) {
        fabVisible.value = withTiming(1, { duration: DURATION.fast, easing: EASE_OUT })
      }
    }
  )

  const fabAnimStyle = useAnimatedStyle(() => ({
    opacity: fabVisible.value,
    transform: [
      { translateY: interpolate(fabVisible.value, [0, 1], [80, 0]) },
      { scale: interpolate(fabVisible.value, [0, 1], [0.85, 1]) },
    ],
  }))

  return { fabVisible, fabAnimStyle }
}
