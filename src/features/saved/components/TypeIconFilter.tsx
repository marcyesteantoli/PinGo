import { useEffect } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@lib/colors'
import type { Experience, WishlistItemType } from '@types/index'

// ─── Maps ─────────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  all:           'apps-outline',
  transport:     'airplane-outline',
  accommodation: 'bed-outline',
  activity:      'compass-outline',
  restaurant:    'restaurant-outline',
  entertainment: 'film-outline',
  city:          'business-outline',
  other:         'ellipse-outline',
}

const TYPE_COLOR: Record<string, string> = {
  all:           colors.primary[400],
  transport:     '#3B82F6',
  accommodation: '#8B5CF6',
  activity:      '#22C55E',
  restaurant:    '#F97316',
  entertainment: '#EC4899',
  city:          '#14B8A6',
  other:         '#94A3B8',
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type FilterTypeKey = Experience['type'] | WishlistItemType

interface FilterTab {
  key: FilterTypeKey | null
  label: string
  count?: number
}

interface TypeIconFilterProps {
  tabs: FilterTab[]
  active: FilterTypeKey | null
  onChange: (key: FilterTypeKey | null) => void
  isDark: boolean
}

// ─── Single pill cell ─────────────────────────────────────────────────────────

function TabCell({
  tab,
  isActive,
  onPress,
  isDark,
}: {
  tab: FilterTab
  isActive: boolean
  onPress: () => void
  isDark: boolean
}) {
  const key = tab.key ?? 'all'
  const accentColor = TYPE_COLOR[key]
  const icon = TYPE_ICON[key]
  const isEmpty = tab.key !== null && tab.count === 0

  const inactiveBg     = isDark ? colors.neutral[800] : '#FFFFFF'
  const inactiveBorder = isDark ? colors.neutral[600] : colors.neutral[200]
  const inactiveText   = isDark ? colors.neutral[400] : colors.neutral[500]

  const scale    = useSharedValue(1)
  const progress = useSharedValue(isActive ? 1 : 0)

  const EASE_OUT = Easing.out(Easing.cubic)

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, { duration: 180, easing: EASE_OUT })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [inactiveBg, accentColor]),
    borderColor: interpolateColor(progress.value, [0, 1], [inactiveBorder, accentColor]),
    transform: [{ scale: scale.value }],
  }))

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [inactiveText, '#FFFFFF']),
    opacity: interpolate(progress.value, [0, 1], [0.75, 1]),
  }))

  // Cross-fade icon colors: neutral → white
  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0]),
  }))
  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }))

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      onPressIn={() => {
        scale.value = withTiming(0.93, { duration: 100, easing: EASE_OUT })
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 180, easing: EASE_OUT })
      }}
      style={[{ marginHorizontal: 3, marginVertical: 2 }, isEmpty ? { opacity: 0.45 } : undefined]}
    >
      <Animated.View
        style={[pillStyle, styles.pill]}
      >
        {/* Icon cross-fade */}
        <View style={styles.iconWrap}>
          <Animated.View style={[StyleSheet.absoluteFillObject, styles.iconCenter, inactiveIconStyle]}>
            <Ionicons name={icon} size={14} color={inactiveText} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFillObject, styles.iconCenter, activeIconStyle]}>
            <Ionicons name={icon} size={14} color="#FFFFFF" />
          </Animated.View>
        </View>

        <Animated.Text
          style={[
            textStyle,
            {
              fontSize: 13,
              fontWeight: isActive ? '600' : '500',
              letterSpacing: -0.1,
            },
          ]}
        >
          {tab.label}
        </Animated.Text>

        {tab.key !== null && tab.count !== undefined && tab.count > 0 && (
          <View
            className="px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.22)' : `${accentColor}1A` }}
          >
            <Text className="text-[10px] font-semibold" style={{ color: isActive ? '#FFFFFF' : accentColor }}>
              {tab.count}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  iconWrap: {
    width: 14,
    height: 14,
  },
  iconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})

// ─── Filter row ───────────────────────────────────────────────────────────────

export function TypeIconFilter({ tabs, active, onChange, isDark }: TypeIconFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 4 }}
    >
      {tabs.map((tab) => (
        <TabCell
          key={String(tab.key)}
          tab={tab}
          isActive={active === tab.key}
          onPress={() => onChange(tab.key)}
          isDark={isDark}
        />
      ))}
    </ScrollView>
  )
}
