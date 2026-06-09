import { useEffect } from 'react'
import { Image, Text, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import Svg, { Polygon } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@lib/colors'

// ─── SVG triangle tip ─────────────────────────────────────────────────────────

function PinTip({ color, isSelected }: { color: string; isSelected: boolean }) {
  const w = isSelected ? 16 : 12
  const h = isSelected ? 10 : 8
  return (
    <Svg width={w} height={h} style={{ marginTop: -1 }}>
      <Polygon
        points={`0,0 ${w},0 ${w / 2},${h}`}
        fill={color}
        stroke="#ffffff"
        strokeWidth={isSelected ? 2 : 1.5}
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// ─── Generic circular pin ─────────────────────────────────────────────────────

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
  const size = isSelected ? 52 : 40

  const scale = useSharedValue(0.4)
  const opacity = useSharedValue(0)

  useEffect(() => {
    scale.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) })
    opacity.value = withTiming(1, { duration: 180 })
  }, [scale, opacity])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[{ alignItems: 'center' }, animStyle]}>
      <View style={{
        borderRadius: size / 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: isSelected ? 6 : 3 },
        shadowOpacity: isSelected ? 0.5 : 0.32,
        shadowRadius: isSelected ? 8 : 4,
        elevation: isSelected ? 10 : 5,
      }}>
        <View style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: isSelected ? 3 : 2.5,
          borderColor: '#ffffff',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: photoUrl ? colors.neutral[200] : color,
        }}>
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
              onLoadEnd={onImageLoadEnd}
            />
          ) : (
            <Ionicons
              name={icon}
              size={iconSize ?? (isSelected ? 24 : 18)}
              color="#ffffff"
            />
          )}
        </View>
      </View>
      <PinTip color={color} isSelected={isSelected} />
    </Animated.View>
  )
}

// ─── Cluster badge ────────────────────────────────────────────────────────────

export function ClusterMarker({ count }: { count: number }) {
  const size = count <= 9 ? 44 : count <= 99 ? 52 : 60
  const fontSize = count <= 9 ? 16 : count <= 99 ? 14 : 12

  const scale = useSharedValue(0.4)
  const opacity = useSharedValue(0)

  useEffect(() => {
    scale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) })
    opacity.value = withTiming(1, { duration: 160 })
  }, [scale, opacity])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: '#ffffff',
      borderWidth: 3,
      borderColor: 'rgba(0,70,222,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.22,
      shadowRadius: 6,
      elevation: 7,
    }, animStyle]}>
      <Text style={{
        fontSize,
        fontWeight: '700',
        color: colors.primary[500],
        letterSpacing: -0.5,
      }}>
        {count > 99 ? '99+' : String(count)}
      </Text>
    </Animated.View>
  )
}
