import { StyleSheet, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import { TYPE_COLORS, TYPE_ICONS } from '@features/wishlist/constants'
import { WORLD_DOTS } from './worldDots'

const MAP_WIDTH = 320
const MAP_HEIGHT = 160
const DOT_COLOR = '#D2C9BC'
const DOT_RADIUS = 1.3

const PINS: {
  key: string
  icon: React.ComponentProps<typeof Ionicons>['name']
  color: string
  size: number
  cx: number
  cy: number
  rotate: string
}[] = [
  { key: 'city', icon: TYPE_ICONS.city, color: TYPE_COLORS.city, size: 36, cx: 168, cy: 22, rotate: '-6deg' },
  { key: 'restaurant', icon: TYPE_ICONS.restaurant, color: TYPE_COLORS.restaurant, size: 32, cx: 96, cy: 102, rotate: '8deg' },
  { key: 'accommodation', icon: TYPE_ICONS.accommodation, color: TYPE_COLORS.accommodation, size: 32, cx: 240, cy: 32, rotate: '5deg' },
]

interface WishlistMapMockupProps {
  width?: number
}

export function WishlistMapMockup({ width = MAP_WIDTH }: WishlistMapMockupProps) {
  const scale = width / MAP_WIDTH
  const height = MAP_HEIGHT * scale

  return (
    <View style={[styles.wrapper, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
        {WORLD_DOTS.map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={DOT_RADIUS} fill={DOT_COLOR} />
        ))}
      </Svg>

      {PINS.map((pin) => {
        const size = pin.size * scale
        return (
          <View
            key={pin.key}
            style={[
              styles.pin,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: pin.color,
                left: pin.cx * scale - size / 2,
                top: pin.cy * scale - size / 2,
                transform: [{ rotate: pin.rotate }],
              },
            ]}
          >
            <Ionicons name={pin.icon} size={size * 0.45} color="#ffffff" />
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
})
