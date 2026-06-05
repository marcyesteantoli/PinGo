import { useEffect } from 'react'
import { ScrollView, Text, TouchableOpacity } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@lib/colors'
import type { Experience } from '@types/index'

// ─── Maps ─────────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  all:           'apps-outline',
  transport:     'airplane-outline',
  accommodation: 'bed-outline',
  activity:      'compass-outline',
  restaurant:    'restaurant-outline',
  entertainment: 'film-outline',
  other:         'ellipse-outline',
}

const TYPE_COLOR: Record<string, string> = {
  all:           colors.primary[400],
  transport:     '#3B82F6',
  accommodation: '#8B5CF6',
  activity:      '#22C55E',
  restaurant:    '#F97316',
  entertainment: '#EC4899',
  other:         '#94A3B8',
}

// ~18% opacity hex suffix
const TYPE_ACTIVE_BG: Record<string, string> = {
  all:           colors.primary[400] + '2E',
  transport:     '#3B82F62E',
  accommodation: '#8B5CF62E',
  activity:      '#22C55E2E',
  restaurant:    '#F973162E',
  entertainment: '#EC48992E',
  other:         '#94A3B82E',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FilterTab {
  key: Experience['type'] | null   // null = all
  label: string
  count?: number
}

interface TypeIconFilterProps {
  tabs: FilterTab[]
  active: Experience['type'] | null
  onChange: (key: Experience['type'] | null) => void
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
  const activeBg = TYPE_ACTIVE_BG[key]
  const inactiveBg = isDark ? colors.neutral[800] : colors.neutral[100]
  const icon = TYPE_ICON[key]
  const textColor = isActive ? accentColor : isDark ? colors.neutral[400] : colors.neutral[500]

  const scale = useSharedValue(1)
  const progress = useSharedValue(isActive ? 1 : 0)

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, { duration: 180 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [inactiveBg, activeBg]),
    transform: [{ scale: scale.value }],
  }))

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      onPressIn={() => {
        scale.value = withSpring(0.93, { damping: 14, stiffness: 350 })
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 350 })
      }}
      style={{ marginHorizontal: 3, marginVertical: 2 }}
    >
      <Animated.View
        style={[pillStyle, {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 11,
          paddingVertical: 7,
          borderRadius: 20,
          gap: 5,
        }]}
      >
        <Ionicons name={icon} size={14} color={textColor} />
        <Text
          style={{
            fontSize: 13,
            fontWeight: isActive ? '600' : '500',
            color: textColor,
            letterSpacing: -0.1,
          }}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

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
