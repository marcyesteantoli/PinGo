import { useEffect, useId, useState } from 'react'
import { Platform, Text, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import Svg, { Circle, ClipPath, Defs, Image as SvgImage, Path } from 'react-native-svg'
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

// ─── Triangle pointer path ────────────────────────────────────────────────────
// Small downward pointer below the circle body. Top edge starts 1px inside
// the circle's bottom so the circle fill covers the seam seamlessly.

function makeTrianglePath(cx: number, tipW: number, tipH: number, circleBottom: number): string {
  const topY = circleBottom - 1
  return (
    `M ${(cx - tipW / 2).toFixed(1)},${topY} ` +
    `L ${cx},${(circleBottom + tipH).toFixed(1)} ` +
    `L ${(cx + tipW / 2).toFixed(1)},${topY} Z`
  )
}

// ─── Spring configs ───────────────────────────────────────────────────────────
// Pin: gentle spring so each pin feels like it landed independently.
// Cluster: bouncier so it reads as "group snapping into position".

const PIN_SPRING = { damping: 14, stiffness: 180, mass: 0.7, overshootClamping: false } as const
const CLUSTER_SPRING = { damping: 9, stiffness: 220, mass: 0.5, overshootClamping: false } as const

// ─── Pin marker ───────────────────────────────────────────────────────────────
// Circle body + small triangle pointer. SVG-only to avoid Android rasterization
// artifacts. Canvas: size+pad*2 wide, size+tipH+pad*2 tall (pad keeps border
// strokes from clipping at canvas edges).

export function PinMarker({
  color,
  icon,
  iconSize,
  photoUrl,
  showBorder = true,
  onImageLoadEnd,
}: {
  color: string
  icon: keyof typeof Ionicons.glyphMap
  iconSize?: number
  photoUrl?: string | null
  showBorder?: boolean
  onImageLoadEnd?: () => void
}) {
  const size = 32
  const strokeWidth = 2
  const pad = 2
  const tipH = 8
  const tipW = 9
  const canvasW = size + pad * 2           // 2px pad left + right
  const canvasH = size + tipH + pad * 2   // 2px pad top + bottom (tip stroke no longer clips)
  const cx = size / 2 + pad              // circle center on canvas

  const clipId = useId()
  const r = size / 2
  const circleBottom = size + pad
  const trianglePath = makeTrianglePath(cx, tipW, tipH, circleBottom)

  // Android rasterises the marker snapshot mid-animation → skip entrance there.
  const initial = Platform.OS === 'android' ? 1 : 0.4
  const scale = useSharedValue(initial)
  const opacity = useSharedValue(initial === 1 ? 1 : 0)

  useEffect(() => {
    if (Platform.OS === 'android') return
    scale.value = withSpring(1, PIN_SPRING)
    opacity.value = withTiming(1, { duration: 200 })
  }, [scale, opacity])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const shadowStyle = Platform.OS === 'ios' ? {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
  } : {}

  // A `transform` style on the marker's content view — even an inert scale(1) — makes
  // react-native-maps' Android snapshot capture the pre-transform layout box while the
  // transformed content renders larger, cropping the marker. Skip Animated.View on Android.
  const Wrapper = Platform.OS === 'android' ? View : Animated.View
  const wrapperStyle = Platform.OS === 'android'
    ? { width: canvasW, height: canvasH }
    : [{ width: canvasW, height: canvasH }, shadowStyle, animStyle]

  return (
    // collapsable={false} — prevents RN view-flattening from breaking Android bitmap measurement.
    <View collapsable={false} style={{ width: canvasW, height: canvasH }}>
      <Wrapper style={wrapperStyle}>
        <Svg width={canvasW} height={canvasH}>
          {/* Triangle pointer — drawn first so circle covers the seam */}
          <Path d={trianglePath} fill={color} />

          {/* Circle body — fill, then photo on top, then white border last */}
          <Circle cx={cx} cy={cx} r={r} fill={color} />

          {photoUrl ? (
            <>
              <Defs>
                <ClipPath id={clipId}>
                  <Circle cx={cx} cy={cx} r={r} />
                </ClipPath>
              </Defs>
              <SvgImage
                href={{ uri: photoUrl }}
                x={pad}
                y={pad}
                width={size}
                height={size}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#${clipId})`}
                onLoad={onImageLoadEnd}
              />
            </>
          ) : null}

          {/* Border drawn last so it sits on top of photo */}
          {(showBorder || !!photoUrl) && (
            <Circle
              cx={cx}
              cy={cx}
              r={r}
              fill="none"
              stroke={photoUrl ? color : '#ffffff'}
              strokeWidth={strokeWidth}
            />
          )}
        </Svg>

        {!photoUrl && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: pad,
              left: pad,
              width: size,
              height: size,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={icon}
              size={iconSize ?? 15}
              color="#ffffff"
            />
          </View>
        )}
      </Wrapper>
    </View>
  )
}

// ─── Cluster marker ───────────────────────────────────────────────────────────
// Canvas = size (same as old code) so Android rasterization is reliable.
// Two-ring design: white frame → primary blue core.
// The "outer glow" effect is provided by shadowRadius on iOS instead of an
// extra SVG ring (which required canvas expansion and caused Android clipping).

export function ClusterMarker({ count }: { count: number }) {
  const size = count <= 9 ? 32 : count <= 99 ? 38 : 44
  const fontSize = count <= 9 ? 13 : count <= 99 ? 11 : 10
  const cx = size / 2

  // Inset frame ring so the 3px stroke stays inside the canvas bounds.
  const frameR = size / 2 - 2
  const coreR = frameR - 5

  // Android rasterises the marker snapshot mid-animation → skip entrance there.
  const initial = Platform.OS === 'android' ? 1 : 0.4
  const scale = useSharedValue(initial)
  const opacity = useSharedValue(initial === 1 ? 1 : 0)

  useEffect(() => {
    if (Platform.OS === 'android') return
    // Clusters use a bouncier spring — they feel like a group snapping into view.
    scale.value = withDelay(60, withSpring(1, CLUSTER_SPRING))
    opacity.value = withTiming(1, { duration: 160 })
  }, [scale, opacity])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const shadowStyle = Platform.OS === 'ios' ? {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  } : {}

  const Wrapper = Platform.OS === 'android' ? View : Animated.View
  const wrapperStyle = Platform.OS === 'android'
    ? { width: size, height: size }
    : [{ width: size, height: size }, shadowStyle, animStyle]

  return (
    <View collapsable={false} style={{ width: size, height: size }}>
      <Wrapper style={wrapperStyle}>
        <Svg width={size} height={size}>
          <Circle
            cx={cx}
            cy={cx}
            r={frameR}
            fill="#FFFFFF"
            stroke="rgba(0,70,222,0.20)"
            strokeWidth={3}
          />
          <Circle cx={cx} cy={cx} r={coreR} fill={colors.primary[500]} />
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
            color: '#FFFFFF',
            letterSpacing: -0.5,
          }}>
            {count > 99 ? '99+' : String(count)}
          </Text>
        </View>
      </Wrapper>
    </View>
  )
}