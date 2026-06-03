import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { EASE_DRAWER, EASE_OUT, DURATION } from '@lib/animations'
import { colors } from '@lib/colors'

interface SelectionToolbarProps {
  selectedCount: number
  totalCount: number
  onCancel: () => void
  onSelectAll: () => void
  onDownload: () => void
  onDelete: () => void
}

interface ActionPillProps {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  onPress: () => void
  disabled?: boolean
  isDark: boolean
  destructive?: boolean
}

function ActionPill({
  icon,
  label,
  onPress,
  disabled = false,
  isDark,
  destructive = false,
}: ActionPillProps) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const iconColor = destructive
    ? colors.error
    : isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.78)'
  const pillBg = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        if (!disabled) scale.value = withTiming(0.93, { duration: 80, easing: EASE_OUT })
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 180, easing: EASE_OUT })
      }}
      hitSlop={6}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          styles.pill,
          { backgroundColor: pillBg, opacity: disabled ? 0.30 : 1 },
          animStyle,
        ]}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
        <Text style={[styles.pillLabel, { color: iconColor }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  )
}

export function SelectionToolbar({
  selectedCount,
  totalCount,
  onCancel,
  onSelectAll,
  onDownload,
  onDelete,
}: SelectionToolbarProps) {
  const insets = useSafeAreaInsets()
  const isDark = useColorScheme() === 'dark'
  const { t } = useTranslation()

  const actionsDisabled = selectedCount === 0
  const allSelected = selectedCount === totalCount && totalCount > 0

  const translateY = useSharedValue(100)
  useEffect(() => {
    translateY.value = withTiming(0, { duration: DURATION.normal, easing: EASE_DRAWER })
  }, [])

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const textColor = isDark ? 'rgba(255,255,255,0.86)' : 'rgba(0,0,0,0.82)'
  const subtleColor = isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.38)'
  const selectAllColor = allSelected ? subtleColor : colors.primary[500]

  const countLabel = selectedCount === 1
    ? t('memories_bulk_selected_one', { count: selectedCount })
    : t('memories_bulk_selected_other', { count: selectedCount })

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <BlurView
        tint={isDark ? 'dark' : 'extraLight'}
        intensity={92}
        style={StyleSheet.absoluteFillObject}
      />
      <View
        style={[
          styles.topBorder,
          { backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.10)' },
        ]}
      />

      <View style={[styles.inner, { paddingBottom: insets.bottom + 8 }]}>
        {/* Info row: Cancel | count | Select All */}
        <View style={styles.infoRow}>
          <Pressable onPress={onCancel} hitSlop={12} style={styles.infoSide}>
            <Text style={[styles.infoSideText, { color: subtleColor }]}>
              {t('memories_bulk_cancel')}
            </Text>
          </Pressable>

          <Text style={[styles.countText, { color: textColor }]}>
            {selectedCount === 0 ? t('memories_bulk_selected_other', { count: 0 }) : countLabel}
          </Text>

          <Pressable
            onPress={onSelectAll}
            disabled={allSelected}
            hitSlop={12}
            style={[styles.infoSide, styles.infoSideRight]}
          >
            <Text style={[styles.infoSideText, { color: selectAllColor }]}>
              {t('memories_bulk_selectAll')}
            </Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View
          style={[
            styles.divider,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' },
          ]}
        />

        {/* Action pills */}
        <View style={styles.actionsRow}>
          <ActionPill
            icon="arrow-down-outline"
            label={t('memories_bulk_save')}
            onPress={onDownload}
            disabled={actionsDisabled}
            isDark={isDark}
          />
          <ActionPill
            icon="trash-outline"
            label={t('common_delete')}
            onPress={onDelete}
            disabled={actionsDisabled}
            isDark={isDark}
            destructive
          />
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  inner: {
    paddingTop: 13,
  },

  // Info row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 13,
  },
  infoSide: {
    minWidth: 90,
  },
  infoSideRight: {
    alignItems: 'flex-end',
  },
  infoSideText: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  countText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.3,
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
  },

  // Action pills
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: 14,
  },
  pillLabel: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
})
