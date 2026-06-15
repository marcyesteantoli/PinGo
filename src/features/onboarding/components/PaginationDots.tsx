import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { DURATION, EASE_OUT } from '@lib/animations'
import { ALL_SLIDES } from '../slides'

const ACCENT_COLORS = ALL_SLIDES.map((slide) => slide.accentColor)

interface PaginationDotsProps {
  total: number
  activeIndex: number
}

function Dot({ index, activeIndex }: { index: number; activeIndex: number }) {
  const width = useSharedValue(8)
  const opacity = useSharedValue(index === 0 ? 1 : 0.35)

  useEffect(() => {
    const isActive = index === activeIndex
    width.value = withTiming(isActive ? 28 : 8, { duration: DURATION.normal, easing: EASE_OUT })
    opacity.value = withTiming(isActive ? 1 : 0.35, { duration: DURATION.normal, easing: EASE_OUT })
  }, [activeIndex])

  const style = useAnimatedStyle(() => {
    const colors = ACCENT_COLORS.length > 1 ? ACCENT_COLORS : [ACCENT_COLORS[0], ACCENT_COLORS[0]]
    const color = interpolateColor(
      activeIndex,
      colors.map((_, i) => i),
      colors,
    )
    return {
      width: width.value,
      opacity: opacity.value,
      backgroundColor: color,
    }
  })

  return <Animated.View style={[styles.dot, style]} />
}

export function PaginationDots({ total, activeIndex }: PaginationDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <Dot key={i} index={i} activeIndex={activeIndex} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
})
