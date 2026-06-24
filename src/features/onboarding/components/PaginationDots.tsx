import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { DURATION, EASE_OUT } from '@lib/animations'

interface PaginationDotsProps {
  total: number
  activeIndex: number
  accentColors: string[]
}

function Dot({ index, activeIndex, accentColors }: { index: number; activeIndex: number; accentColors: string[] }) {
  const width = useSharedValue(8)
  const opacity = useSharedValue(index === 0 ? 1 : 0.35)

  useEffect(() => {
    const isActive = index === activeIndex
    width.value = withTiming(isActive ? 28 : 8, { duration: DURATION.normal, easing: EASE_OUT })
    opacity.value = withTiming(isActive ? 1 : 0.35, { duration: DURATION.normal, easing: EASE_OUT })
  }, [activeIndex])

  const style = useAnimatedStyle(() => {
    const colors = accentColors.length > 1 ? accentColors : [accentColors[0], accentColors[0]]
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

export function PaginationDots({ total, activeIndex, accentColors }: PaginationDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <Dot key={i} index={i} activeIndex={activeIndex} accentColors={accentColors} />
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
