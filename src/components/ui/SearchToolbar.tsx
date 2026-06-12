import { useRef, useState } from 'react'
import { TextInput, TouchableOpacity, View } from 'react-native'
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@lib/colors'
import { EASE_OUT, DURATION } from '@lib/animations'

const TOOLBAR_BTN = 44

interface SearchToolbarProps {
  search: string
  onSearchChange: (text: string) => void
  onAddPress: () => void
  isDark: boolean
  placeholder: string
  className?: string
  horizontalPadding?: number
}

export function SearchToolbar({ search, onSearchChange, onAddPress, isDark, placeholder, className = 'px-5 pb-4', horizontalPadding = 40 }: SearchToolbarProps) {
  const inputRef = useRef<TextInput>(null)
  const [expanded, setExpanded] = useState(false)
  const containerWidth = useSharedValue(0)
  const progress = useSharedValue(0)

  const grayBg = isDark ? colors.surface[700] : colors.neutral[200]
  const iconColor = isDark ? colors.neutral[100] : colors.neutral[700]
  const expandedBg = isDark ? colors.surface[800] : colors.white

  function handleExpand() {
    if (expanded) return
    setExpanded(true)
    progress.value = withTiming(1, { duration: DURATION.normal, easing: EASE_OUT })
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleCollapse() {
    if (!expanded) return
    inputRef.current?.blur()
    onSearchChange('')
    progress.value = withTiming(0, { duration: DURATION.normal, easing: EASE_OUT })
    setExpanded(false)
  }

  const pillStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [TOOLBAR_BTN, Math.max(TOOLBAR_BTN, containerWidth.value - horizontalPadding)]),
    backgroundColor: interpolateColor(progress.value, [0, 1], [grayBg, expandedBg]),
  }))

  const addStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [TOOLBAR_BTN, 0]),
    opacity: interpolate(progress.value, [0, 0.5], [1, 0], 'clamp'),
  }))

  const clearStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.5, 1], [0, 1], 'clamp'),
  }))

  return (
    <View
      className={`flex-row items-center justify-between ${className}`}
      onLayout={(e) => { containerWidth.value = e.nativeEvent.layout.width }}
    >
      <Animated.View style={[pillStyle, { height: TOOLBAR_BTN, borderRadius: TOOLBAR_BTN / 2, overflow: 'hidden', flexDirection: 'row', alignItems: 'center' }]}>
        <TouchableOpacity
          onPress={handleExpand}
          style={{ width: TOOLBAR_BTN, height: TOOLBAR_BTN, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="search" size={18} color={iconColor} />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          value={search}
          onChangeText={onSearchChange}
          placeholder={placeholder}
          placeholderTextColor={isDark ? colors.neutral[600] : colors.neutral[400]}
          className="flex-1 text-[15px] text-neutral-900 dark:text-neutral-50"
          style={{ padding: 0 }}
          returnKeyType="search"
          onBlur={handleCollapse}
        />
        <Animated.View style={clearStyle}>
          <TouchableOpacity
            onPress={handleCollapse}
            hitSlop={8}
            style={{ width: TOOLBAR_BTN, height: TOOLBAR_BTN, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="close-circle" size={18} color={isDark ? colors.neutral[500] : colors.neutral[400]} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[addStyle, { height: TOOLBAR_BTN, borderRadius: TOOLBAR_BTN / 2, overflow: 'hidden' }]}>
        <TouchableOpacity
          onPress={onAddPress}
          style={{ width: TOOLBAR_BTN, height: TOOLBAR_BTN, borderRadius: TOOLBAR_BTN / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: grayBg }}
        >
          <Ionicons name="add" size={22} color={iconColor} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}
