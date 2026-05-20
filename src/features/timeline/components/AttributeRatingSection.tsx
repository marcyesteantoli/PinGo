import React, { useEffect, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { RadarChart } from '@components/ui/RadarChart'
import { useAttributeRatings } from '@features/timeline/hooks/useAttributeRatings'
import { useUpsertAttributeRating } from '@features/timeline/hooks/useUpsertAttributeRating'
import { EXPERIENCE_ATTRIBUTES } from '@features/timeline/config/experienceAttributes'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import type { Experience } from '@types/index'

const THUMB = 22

function posToValue(thumbLeft: number, trackWidth: number): number {
  'worklet'
  const range = trackWidth - THUMB
  if (range <= 0) return 1
  return Math.round((thumbLeft / range) * 9 + 1)
}

function valueToPos(value: number, trackWidth: number): number {
  'worklet'
  const range = trackWidth - THUMB
  if (range <= 0) return 0
  return ((value - 1) / 9) * range
}

interface AttributeSliderProps {
  label: string
  value: number | undefined
  onChange: (v: number) => void
  isDark: boolean
}

function AttributeSlider({ label, value, onChange, isDark }: AttributeSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0)
  const trackWidthSV = useSharedValue(0)
  const thumbX = useSharedValue(0)
  const lastHapticValue = useRef<number | null>(null)
  const [displayValue, setDisplayValue] = useState<number | undefined>(value)

  useEffect(() => {
    if (trackWidth <= 0 || value === undefined) return
    const clamped = Math.max(1, Math.min(10, Math.round(value)))
    thumbX.value = valueToPos(clamped, trackWidth)
    setDisplayValue(clamped)
    lastHapticValue.current = clamped
  }, [value, trackWidth])

  function onDisplayChange(v: number) { setDisplayValue(v) }
  function triggerHaptic() { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }

  const applyPosition = (x: number) => {
    'worklet'
    const tw = trackWidthSV.value
    if (tw <= 0) return
    const range = tw - THUMB
    const newLeft = Math.max(0, Math.min(range, x - THUMB / 2))
    thumbX.value = newLeft
    const v = posToValue(newLeft, tw)
    runOnJS(onDisplayChange)(v)
    if (lastHapticValue.current !== v) {
      lastHapticValue.current = v
      runOnJS(triggerHaptic)()
    }
  }

  const pan = Gesture.Pan()
    .activeOffsetX([-5, 5])
    .failOffsetY([-15, 15])
    .onStart((e) => { 'worklet'; applyPosition(e.x) })
    .onUpdate((e) => { 'worklet'; applyPosition(e.x) })
    .onEnd(() => {
      'worklet'
      const tw = trackWidthSV.value
      if (tw <= 0) return
      const finalValue = posToValue(thumbX.value, tw)
      thumbX.value = withSpring(valueToPos(finalValue, tw), { damping: 20, stiffness: 300 })
      runOnJS(onDisplayChange)(finalValue)
      runOnJS(onChange)(finalValue)
    })

  const tap = Gesture.Tap()
    .onEnd((e) => {
      'worklet'
      const tw = trackWidthSV.value
      if (tw <= 0) return
      const range = tw - THUMB
      const newLeft = Math.max(0, Math.min(range, e.x - THUMB / 2))
      const v = posToValue(newLeft, tw)
      thumbX.value = withSpring(valueToPos(v, tw), { damping: 20, stiffness: 300 })
      runOnJS(onDisplayChange)(v)
      runOnJS(triggerHaptic)()
      runOnJS(onChange)(v)
    })

  const gesture = Gesture.Race(pan, tap)

  const fillStyle = useAnimatedStyle(() => ({
    width: Math.max(0, thumbX.value + THUMB / 2),
  }))

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }))

  const trackBg = isDark ? colors.surface[700] : colors.neutral[200]
  const textColor = isDark ? colors.neutral[200] : colors.neutral[800]
  const mutedColor = isDark ? colors.neutral[600] : colors.neutral[400]
  const hasValue = displayValue !== undefined

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
      <Text
        style={{ width: 92, fontSize: 14, fontWeight: '500', color: textColor }}
        numberOfLines={1}
      >
        {label}
      </Text>

      <GestureDetector gesture={gesture}>
        <View
          style={{ flex: 1, height: 44, justifyContent: 'center' }}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width
            setTrackWidth(w)
            trackWidthSV.value = w
          }}
        >
          <View
            style={{
              height: 4,
              borderRadius: 2,
              backgroundColor: trackBg,
              overflow: 'hidden',
              marginHorizontal: THUMB / 2,
            }}
          >
            <Animated.View
              style={[{ height: '100%', borderRadius: 2, backgroundColor: colors.primary[500] }, fillStyle]}
            />
          </View>

          {hasValue && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: THUMB,
                  height: THUMB,
                  borderRadius: THUMB / 2,
                  backgroundColor: colors.primary[500],
                  shadowColor: colors.primary[500],
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.35,
                  shadowRadius: 4,
                  elevation: 3,
                },
                thumbStyle,
              ]}
            />
          )}
        </View>
      </GestureDetector>

      <Text
        style={{
          width: 22,
          fontSize: 14,
          fontWeight: '700',
          color: hasValue ? colors.secondary[400] : mutedColor,
          textAlign: 'right',
        }}
      >
        {displayValue ?? '—'}
      </Text>
    </View>
  )
}

interface AttributeRatingSectionProps {
  experienceId: string
  experienceType: Experience['type']
  cardBg: string
  labelColor: string
  borderColor: string
}

export function AttributeRatingSection({
  experienceId,
  experienceType,
  cardBg,
  labelColor,
  borderColor,
}: AttributeRatingSectionProps) {
  const { isDark } = useTheme()
  const attributes = EXPERIENCE_ATTRIBUTES[experienceType]

  const { data } = useAttributeRatings(experienceId)
  const upsert = useUpsertAttributeRating(experienceId)

  if (attributes.length === 0) return null

  const userValues = data?.userValues ?? {}
  const hasAnyUserValue = attributes.some((a) => userValues[a] !== undefined)

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: labelColor,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
      >
        Atributos
      </Text>

      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 8,
          paddingTop: 4,
          borderTopWidth: 0.5,
          borderTopColor: borderColor,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            color: labelColor,
            marginBottom: 2,
            marginTop: 6,
          }}
        >
          Tu valoración
        </Text>
        {attributes.map((attr) => (
          <AttributeSlider
            key={attr}
            label={attr}
            value={userValues[attr]}
            isDark={isDark}
            onChange={(v) => upsert.mutate({ attribute: attr, value: v })}
          />
        ))}
      </View>

      {hasAnyUserValue && (
        <View
          style={{
            paddingVertical: 4,
            borderTopWidth: 0.5,
            borderTopColor: borderColor,
          }}
        >
          <RadarChart
            attributes={attributes}
            userValues={userValues}
            groupAvg={{}}
            isDark={isDark}
          />
        </View>
      )}
    </View>
  )
}
