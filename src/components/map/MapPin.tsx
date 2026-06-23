import { useEffect, useId, useState } from 'react'
import { Platform, Text, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
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

// ─── Teardrop path builder ────────────────────────────────────────────────────
// Classic map-pin shape: circle on top, smooth bezier tip below.
// Connection angle of 25° from the circle bottom creates a natural teardrop.
// The arc uses large-arc=1, sweep=0 (counter-clockwise in SVG Y-down coords)
// to trace the major arc from right connection, up through the top, to left connection.

function buildPinPath(W: number, bw: number, tipLen: number): string {
  const r = W / 2 - bw / 2
  const cx = W / 2
  const cy = W / 2
  const H = W + tipLen
  const lx = +(cx - r * 0.4226).toFixed(2) // sin(25°) = 0.4226
  const ly = +(cy + r * 0.9063).toFixed(2) // cos(25°) = 0.9063
  const rx = +(cx + r * 0.4226).toFixed(2)
  const tipY = +(H - 2.5).toFixed(2)
  const cpY = +(ly + (tipY - ly) * 0.55).toFixed(2)
  // Bezier control points sit slightly outside the start/end x to create a gentle
  // outward curve on each side before converging to the tip — natural teardrop profile.
  return `M ${lx} ${ly} Q ${+(lx - 3).toFixed(2)} ${cpY} ${cx} ${tipY} Q ${+(rx + 3).toFixed(2)} ${cpY} ${rx} ${ly} A ${r} ${r} 0 1 0 ${lx} ${ly} Z`
}

// ─── Generic map pin ──────────────────────────────────────────────────────────
// Drawn as a single SVG Path (teardrop) instead of Circle + Polygon.
// react-native-maps' Android snapshot rasterises the marker's rectangular bounding
// box and does not reliably clip borderRadius, so an SVG canvas with a transparent
// background is required to get correct transparent corners and shape.

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
  const W = isSelected ? 48 : 36
  const bw = isSelected ? 3 : 2.5
  const tipLen = isSelected ? 20 : 16
  const H = W + tipLen
  const r = W / 2 - bw / 2
  const cx = W / 2
  const cy = W / 2
  const clipId = useId()

  const pinPath = buildPinPath(W, bw, tipLen)

  // Android rasterises the marker snapshot; skip entrance animation there to
  // avoid the pin being frozen at a partial scale/opacity in the bitmap.
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
    shadowOffset: { width: 0, height: isSelected ? 8 : 4 },
    shadowOpacity: isSelected ? 0.55 : 0.35,
    shadowRadius: isSelected ? 10 : 5,
  } : {}

  // A `transform` style on Android makes react-native-maps snapshot the pre-transform
  // layout box while the transformed content renders larger, cropping the marker.
  const Wrapper = Platform.OS === 'android' ? View : Animated.View
  const wrapperStyle = Platform.OS === 'android'
    ? { width: W, height: H }
    : [{ width: W, height: H }, shadowStyle, animStyle]

  return (
    // collapsable={false} prevents RN's view-flattening from breaking the Android bitmap.
    <View collapsable={false} style={{ width: W, height: H }}>
      <Wrapper style={wrapperStyle}>
        <Svg width={W} height={H}>
          {photoUrl ? (
            <>
              <Defs>
                <ClipPath id={clipId}>
                  <Circle cx={cx} cy={cy} r={W / 2 - bw} />
                </ClipPath>
              </Defs>
              {/* Full teardrop with category color — tip portion stays visible below photo */}
              <Path d={pinPath} fill={color} stroke="#ffffff" strokeWidth={bw} strokeLinejoin="round" />
              {/* Photo clipped to circle, overlaid on top of the circle portion */}
              <SvgImage
                href={{ uri: photoUrl }}
                x={bw}
                y={bw}
                width={W - bw * 2}
                height={W - bw * 2}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#${clipId})`}
                onLoad={onImageLoadEnd}
              />
              {/* White border ring rendered on top of the photo */}
              <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff" strokeWidth={bw} />
            </>
          ) : (
            <Path
              d={pinPath}
              fill={color}
              stroke="#ffffff"
              strokeWidth={bw}
              strokeLinejoin="round"
            />
          )}
        </Svg>
        {!photoUrl && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: W,
              height: W,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={icon}
              size={iconSize ?? (isSelected ? 28 : 20)}
              color="#ffffff"
            />
          </View>
        )}
      </Wrapper>
    </View>
  )
}

// ─── Cluster badge ────────────────────────────────────────────────────────────
// Two-ring design: outer halo (primary @ 18% opacity) + inner solid fill (primary).
// White text for count instead of blue-on-white — more legible on the colored fill.

export function ClusterMarker({ count }: { count: number }) {
  const outer = count <= 9 ? 48 : count <= 99 ? 56 : 62
  const innerR = (outer - 10) / 2  // 5px halo gap on each side
  const fontSize = count <= 9 ? 17 : count <= 99 ? 15 : 13

  // Same Android/iOS animation split as PinMarker.
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
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  } : {}

  const Wrapper = Platform.OS === 'android' ? View : Animated.View
  const wrapperStyle = Platform.OS === 'android'
    ? { width: outer, height: outer }
    : [{ width: outer, height: outer }, shadowStyle, animStyle]

  return (
    <View collapsable={false} style={{ width: outer, height: outer }}>
      <Wrapper style={wrapperStyle}>
        <Svg width={outer} height={outer}>
          {/* Outer halo ring */}
          <Circle
            cx={outer / 2}
            cy={outer / 2}
            r={outer / 2 - 1}
            fill="rgba(0,70,222,0.18)"
          />
          {/* Inner solid fill */}
          <Circle
            cx={outer / 2}
            cy={outer / 2}
            r={innerR}
            fill={colors.primary[500]}
          />
        </Svg>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: outer,
            height: outer,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{
            fontSize,
            fontWeight: '700',
            color: '#ffffff',
            letterSpacing: -0.5,
          }}>
            {count > 99 ? '99+' : String(count)}
          </Text>
        </View>
      </Wrapper>
    </View>
  )
}
