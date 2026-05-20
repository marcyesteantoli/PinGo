import { useEffect, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { colors } from '@lib/colors'
import { RatingFace } from './RatingFace'

const LABELS: Record<number, string> = {
  1: 'Decepcionante', 2: 'Muy malo',
  3: 'Malo', 4: 'Regular',
  5: 'Aceptable', 6: 'Bien',
  7: 'Muy bien', 8: 'Genial',
  9: 'Increíble', 10: 'Perfecto',
}

const THUMB_SIZE = 30

function getLevel(rating: number): 1 | 2 | 3 | 4 | 5 {
  if (rating <= 2) return 1
  if (rating <= 4) return 2
  if (rating <= 6) return 3
  if (rating <= 8) return 4
  return 5
}

// Maps a thumbLeft position [0, trackWidth - THUMB_SIZE] to an integer value [1, 10]
function thumbLeftToValue(thumbLeft: number, trackWidth: number): number {
  'worklet'
  const range = trackWidth - THUMB_SIZE
  if (range <= 0) return 1
  return Math.round((thumbLeft / range) * 9 + 1)
}

// Maps an integer value [1, 10] to a thumbLeft position [0, trackWidth - THUMB_SIZE]
function valueToThumbLeft(value: number, trackWidth: number): number {
  const range = trackWidth - THUMB_SIZE
  if (range <= 0) return 0
  return ((value - 1) / 9) * range
}

interface RatingSliderProps {
  value: number | null
  onChange?: (v: number) => void
}

function RatingSlider({ value, onChange }: RatingSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0)
  const trackWidthSV = useSharedValue(0)
  const thumbX = useSharedValue(0)
  const lastHapticValue = useRef<number | null>(null)
  const [displayValue, setDisplayValue] = useState<number>(value ?? 5)

  useEffect(() => {
    if (trackWidth <= 0) return
    const initial = value !== null ? Math.max(1, Math.min(10, Math.round(value))) : 5
    thumbX.value = valueToThumbLeft(initial, trackWidth)
    setDisplayValue(initial)
    lastHapticValue.current = initial
  }, [value, trackWidth])

  function onDisplayValueChange(v: number) {
    setDisplayValue(v)
  }

  function triggerHaptic() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const pan = Gesture.Pan()
    .activeOffsetX([-5, 5])
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      'worklet'
      const tw = trackWidthSV.value
      if (tw <= 0) return
      const range = tw - THUMB_SIZE
      const newLeft = Math.max(0, Math.min(range, e.x - THUMB_SIZE / 2))
      thumbX.value = newLeft
      const v = thumbLeftToValue(newLeft, tw)
      runOnJS(onDisplayValueChange)(v)
      if (lastHapticValue.current !== v) {
        lastHapticValue.current = v
        runOnJS(triggerHaptic)()
      }
    })
    .onEnd(() => {
      'worklet'
      const tw = trackWidthSV.value
      if (tw <= 0) return
      const range = tw - THUMB_SIZE
      const snappedLeft = Math.max(0, Math.min(range, thumbX.value))
      const finalValue = thumbLeftToValue(snappedLeft, tw)
      const snappedPosition = ((finalValue - 1) / 9) * range
      thumbX.value = withSpring(snappedPosition, { damping: 20, stiffness: 300 })
      runOnJS(onDisplayValueChange)(finalValue)
      if (onChange) runOnJS(onChange)(finalValue)
    })

  const colorProgress = useDerivedValue(() => {
    const tw = trackWidthSV.value
    if (tw <= 0) return 0
    const v = thumbLeftToValue(thumbX.value, tw)
    return (v - 1) / 9
  })

  const fillAnimStyle = useAnimatedStyle(() => {
    const fillColor = interpolateColor(
      colorProgress.value,
      [0, 0.25, 0.5, 0.75, 1],
      ['#4a5568', '#2f3aa3', '#e11d48', '#F77737', '#FFC837'],
    )
    return {
      backgroundColor: fillColor,
      width: thumbX.value + THUMB_SIZE / 2,
    }
  })

  const thumbAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }))

  const thumbColorStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      colorProgress.value,
      [0, 0.25, 0.5, 0.75, 1],
      ['#4a5568', '#2f3aa3', '#e11d48', '#F77737', '#FFC837'],
    )
    return { borderColor }
  })

  return (
    <View style={{ gap: 16 }}>
      <GestureDetector gesture={pan}>
        <View
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width
            setTrackWidth(w)
            trackWidthSV.value = w
          }}
          style={{ height: THUMB_SIZE, justifyContent: 'center' }}
        >
          <View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.neutral[200],
              overflow: 'hidden',
              marginHorizontal: THUMB_SIZE / 2,
            }}
          >
            <Animated.View style={[{ height: '100%', borderRadius: 3 }, fillAnimStyle]} />
          </View>

          <Animated.View
            style={[
              {
                position: 'absolute',
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: THUMB_SIZE / 2,
                backgroundColor: '#ffffff',
                borderWidth: 2.5,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18,
                shadowRadius: 4,
                elevation: 4,
              },
              thumbAnimStyle,
              thumbColorStyle,
            ]}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[700] }}>
              {displayValue}
            </Text>
          </Animated.View>
        </View>
      </GestureDetector>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <RatingFace level={getLevel(displayValue)} size={36} />
        <Text style={{ fontSize: 15, fontWeight: '500', color: colors.neutral[700] }}>
          {LABELS[displayValue]}
        </Text>
      </View>
    </View>
  )
}

interface EmojiRatingProps {
  value: number | null
  onChange?: (v: number) => void
  size?: 'sm' | 'lg' | 'md'
}

export function EmojiRating({ value, onChange, size = 'md' }: EmojiRatingProps) {
  if (size === 'sm' || size === 'lg') {
    if (!value) return null
    const clamped = Math.max(1, Math.min(10, Math.round(value)))
    const faceSize = size === 'lg' ? 28 : 22
    const fontSize = size === 'lg' ? 16 : 14
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: size === 'lg' ? 5 : 3 }}>
        <RatingFace level={getLevel(clamped)} size={faceSize} />
        <Text style={{ fontSize, fontWeight: '600', color: colors.neutral[600] }}>
          {`${Number.isInteger(value) ? value : value.toFixed(1)}/10`}
        </Text>
      </View>
    )
  }
  return <RatingSlider value={value} onChange={onChange} />
}
