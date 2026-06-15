import { Image, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const ROWS: { key: string; icon: React.ComponentProps<typeof Ionicons>['name']; color: string; barWidth: number }[] = [
  { key: 'transport',     icon: 'airplane-outline',   color: '#3B82F6', barWidth: 0.55 },
  { key: 'accommodation', icon: 'bed-outline',        color: '#8B5CF6', barWidth: 0.4 },
  { key: 'restaurant',    icon: 'restaurant-outline', color: '#F97316', barWidth: 0.65 },
  { key: 'activity',      icon: 'compass-outline',    color: '#22C55E', barWidth: 0.45 },
]

const COLLABORATORS: { key: string; source: number; size: number; style: object }[] = [
  { key: 'a', source: require('../../../../assets/images/memoji-1.png'), size: 48, style: { top: -8, left: -22, transform: [{ rotate: '-8deg' }] } },
  { key: 'b', source: require('../../../../assets/images/memoji-2.png'), size: 60, style: { top: -22, right: -28, transform: [{ rotate: '7deg' }] } },
  { key: 'c', source: require('../../../../assets/images/memoji-3.png'), size: 50, style: { bottom: -16, right: -10, transform: [{ rotate: '-5deg' }] } },
]

interface ItineraryMockupProps {
  width: number
}

export function ItineraryMockup({ width }: ItineraryMockupProps) {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, { width: Math.min(width * 0.78, 230) }]}>
        {ROWS.map((row, i) => (
          <View key={row.key} style={styles.row}>
            <View style={styles.iconColumn}>
              <View style={[styles.circle, { backgroundColor: row.color }]}>
                <Ionicons name={row.icon} size={20} color="#fff" />
              </View>
              {i < ROWS.length - 1 && <View style={styles.connector} />}
            </View>
            <View style={styles.bars}>
              <View style={styles.barWide} />
              <View style={[styles.barNarrow, { width: `${row.barWidth * 100}%` }]} />
            </View>
          </View>
        ))}
      </View>

      {COLLABORATORS.map((avatar) => (
        <View
          key={avatar.key}
          style={[
            styles.avatar,
            avatar.style,
            { width: avatar.size, height: avatar.size, borderRadius: avatar.size / 2 },
          ]}
        >
          <Image source={avatar.source} style={styles.avatarImage} resizeMode="cover" />
        </View>
      ))}
    </View>
  )
}

const CIRCLE_SIZE = 44
const ROW_HEIGHT = 64

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
    gap: 16,
  },
  iconColumn: {
    width: CIRCLE_SIZE,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  connector: {
    position: 'absolute',
    top: CIRCLE_SIZE,
    bottom: -((ROW_HEIGHT - CIRCLE_SIZE) / 2),
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  bars: {
    flex: 1,
    gap: 8,
  },
  barWide: {
    height: 12,
    width: '85%',
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  barNarrow: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
})
