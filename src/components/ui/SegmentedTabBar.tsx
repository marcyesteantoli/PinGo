import { useEffect, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'

export interface SegmentedTab {
  key: string
  label: string
  badge?: number
  icon?: keyof typeof Ionicons.glyphMap
}

interface Props {
  tabs: SegmentedTab[]
  active: string
  onChange: (key: string) => void
  className?: string
}

export function SegmentedTabBar({ tabs, active, onChange, className }: Props) {
  const { isDark } = useTheme()
  const [segmentWidth, setSegmentWidth] = useState(0)
  const translateX = useSharedValue(0)

  const activeIndex = tabs.findIndex((t) => t.key === active)

  useEffect(() => {
    if (segmentWidth > 0) {
      translateX.value = withTiming(activeIndex * segmentWidth, { duration: 200 })
    }
  }, [activeIndex, segmentWidth, translateX])

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: segmentWidth > 4 ? segmentWidth - 4 : 0,
  }))

  return (
    <View
      className={`bg-neutral-200 dark:bg-surface-700 rounded-[10px] ${className !== undefined ? className : 'mx-5 my-3'}`}
      style={{ padding: 2 }}
    >
      <View
        className="flex-row"
        onLayout={(e) => setSegmentWidth(e.nativeEvent.layout.width / tabs.length)}
      >
        {/* Sliding indicator */}
        <Animated.View
          className="absolute top-0 bottom-0 bg-white dark:bg-surface-800 rounded-[8px]"
          style={[
            indicatorStyle,
            {
              marginLeft: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            },
          ]}
        />

        {tabs.map((tab) => {
          const isActive = tab.key === active
          const iconColor = isActive
            ? isDark ? colors.neutral[50] : colors.neutral[900]
            : isDark ? colors.neutral[400] : colors.neutral[500]

          return (
            <TouchableOpacity
              key={tab.key}
              className="flex-1 py-1.5 items-center justify-center z-10"
              onPress={() => onChange(tab.key)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-1">
                {tab.icon && (
                  <Ionicons name={tab.icon} size={15} color={iconColor} />
                )}
                <Text
                  className={`text-[13px] font-semibold ${
                    isActive
                      ? 'text-neutral-900 dark:text-neutral-50'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {tab.label}
                </Text>
                {(tab.badge ?? 0) > 0 && (
                  <View className="bg-primary-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1">
                    <Text className="text-[10px] font-bold text-white">{tab.badge}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
