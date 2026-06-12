import { useEffect, useId, useState } from 'react'
import { Platform, Text, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import Svg, { Circle, ClipPath, Defs, Image as SvgImage, Polygon } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@lib/colors'

// ─── Marker ready helper ──────────────────────────────────────────────────────
// On Android, a custom-view Marker rendered with `tracksViewChanges={false}` from the
// start never gets rasterised — keep tracking on for one beat after mount so the
// entrance animation (scale/opacity) finishes before the snapshot is taken.

export function useMarkerReady(delay = 300) {
  const [ready, setReady] = useState(Platform.OS === 'ios')

  useEffect(() => {
    if (ready) return
    const id = setTimeout(() => setReady(true), delay)
    return () => clearTimeout(id)
  }, [ready, delay])

  return ready
}

// ─── Generic circular pin ─────────────────────────────────────────────────────
// Drawn entirely as a single SVG (circle + border + tip) instead of nested
// Views with borderRadius/overflow. react-native-maps' Android marker
// snapshot rasterises the View's rectangular bounding box and does not
// reliably clip to borderRadius, which left a square corner on the bubble
// and dropped the triangular tip. An SVG has a transparent canvas and draws
// only the shapes themselves, so there's nothing rectangular to crop.

export function PinMarker({
  color,
  icon,
  iconSize,
  photoUrl,
  isSelected,
  onImageLoadEnd,
}: {
  color: string
  icon: keyof typeof Ionicons.glyphMap
  iconSize?: number
  photoUrl?: string | null
  isSelected: boolean
  onImageLoadEnd?: () => void
}) {
  const size = isSelected ? 40 : 30
  const borderWidth = isSelected ? 3 : 2.5
  const tipW = isSelected ? 16 : 12
  const tipH = isSelected ? 10 : 8
  const tipTop = size - 2
  const canvasH = tipTop + tipH
  const clipId = useId()

  // Android rasterises the marker for its tracksViewChanges snapshot; if that
  // happens mid-animation the pin is frozen at a partial scale/opacity. Skip
  // the entrance animation there and render at full size immediately.
  const initial = Platform.OS === 'android' ? 1 : 0.4
  const scale = useSharedValue(initial)
  const opacity = useSharedValue(initial === 1 ? 1 : 0)

  useEffect(() => {
    if (Platform.OS === 'android') return
    scale.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) })
    opacity.value = withTiming(1, { duration: 180 })
  }, [scale, opacity])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const shadowStyle = Platform.OS === 'ios' ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: isSelected ? 6 : 3 },
    shadowOpacity: isSelected ? 0.5 : 0.32,
    shadowRadius: isSelected ? 8 : 4,
  } : {}

  const tipPoints = `${size / 2 - tipW / 2},${tipTop} ${size / 2 + tipW / 2},${tipTop} ${size / 2},${tipTop + tipH}`

  // A `transform` style on the marker's content view — even an inert
  // scale(1) — makes react-native-maps' Android snapshot capture the
  // pre-transform layout box while the transformed content renders larger,
  // cropping the bubble. Skip Animated.View/transform on Android entirely.
  const Wrapper = Platform.OS === 'android' ? View : Animated.View
  const wrapperStyle = Platform.OS === 'android'
    ? { width: size, height: canvasH }
    : [{ width: size, height: canvasH }, shadowStyle, animStyle]

  return (
    // collapsable={false} — without it RN's view-flattening optimization breaks
    // react-native-maps' Android bitmap measurement and crops the marker.
    <View collapsable={false} style={{ width: size, height: canvasH }}>
      <Wrapper style={wrapperStyle}>
        <Svg width={size} height={canvasH}>
          {photoUrl ? (
            <>
              <Defs>
                <ClipPath id={clipId}>
                  <Circle cx={size / 2} cy={size / 2} r={size / 2 - borderWidth} />
                </ClipPath>
              </Defs>
              <SvgImage
                href={{ uri: photoUrl }}
                x={borderWidth}
                y={borderWidth}
                width={size - borderWidth * 2}
                height={size - borderWidth * 2}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#${clipId})`}
                onLoad={onImageLoadEnd}
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - borderWidth / 2}
                fill="none"
                stroke="#ffffff"
                strokeWidth={borderWidth}
              />
            </>
          ) : (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - borderWidth / 2}
              fill={color}
              stroke="#ffffff"
              strokeWidth={borderWidth}
            />
          )}
          <Polygon
            points={tipPoints}
            fill={color}
            stroke="#ffffff"
            strokeWidth={isSelected ? 2 : 1.5}
            strokeLinejoin="round"
          />
        </Svg>
        {!photoUrl && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: size,
              height: size,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={icon}
              size={iconSize ?? (isSelected ? 24 : 18)}
              color="#ffffff"
            />
          </View>
        )}
      </Wrapper>
    </View>
  )
}

// ─── Cluster badge ────────────────────────────────────────────────────────────
// Same SVG-only approach as PinMarker — see comment above.

export function ClusterMarker({ count }: { count: number }) {
  const size = count <= 9 ? 40 : count <= 99 ? 48 : 52
  const fontSize = count <= 9 ? 16 : count <= 99 ? 14 : 12
  const borderWidth = 3

  // Android rasterises the marker for its tracksViewChanges snapshot; if that
  // happens mid-animation the bubble is frozen at a partial scale/opacity. Skip
  // the entrance animation there and render at full size immediately.
  const initial = Platform.OS === 'android' ? 1 : 0.4
  const scale = useSharedValue(initial)
  const opacity = useSharedValue(initial === 1 ? 1 : 0)

  useEffect(() => {
    if (Platform.OS === 'android') return
    scale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) })
    opacity.value = withTiming(1, { duration: 160 })
  }, [scale, opacity])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const shadowStyle = Platform.OS === 'ios' ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
  } : {}

  // A `transform` style on the marker's content view — even an inert
  // scale(1) — makes react-native-maps' Android snapshot capture the
  // pre-transform layout box while the transformed content renders larger,
  // cropping the bubble. Skip Animated.View/transform on Android entirely.
  const Wrapper = Platform.OS === 'android' ? View : Animated.View
  const wrapperStyle = Platform.OS === 'android'
    ? { width: size, height: size }
    : [{ width: size, height: size }, shadowStyle, animStyle]

  return (
    // collapsable={false} — without it RN's view-flattening optimization breaks
    // react-native-maps' Android bitmap measurement and crops the bubble.
    <View collapsable={false} style={{ width: size, height: size }}>
      <Wrapper style={wrapperStyle}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - borderWidth / 2}
            fill="#ffffff"
            stroke="rgba(0,70,222,0.25)"
            strokeWidth={borderWidth}
          />
        </Svg>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{
            fontSize,
            fontWeight: '700',
            color: colors.primary[500],
            letterSpacing: -0.5,
          }}>
            {count > 99 ? '99+' : String(count)}
          </Text>
        </View>
      </Wrapper>
    </View>
  )
}
