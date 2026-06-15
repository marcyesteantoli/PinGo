import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { colors } from '@lib/colors'
import { EASE_OUT, DURATION } from '@lib/animations'

interface LockedMapPreviewProps {
  visible: boolean
  onUnlockPress: () => void
}

export function LockedMapPreview({ visible, onUnlockPress }: LockedMapPreviewProps) {
  const { t } = useTranslation()
  const isDark = useColorScheme() === 'dark'

  const veilOpacity = useSharedValue(0)
  const badgeProgress = useSharedValue(0)
  const cardProgress = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      veilOpacity.value = withTiming(1, { duration: DURATION.normal, easing: EASE_OUT })
      badgeProgress.value = withDelay(80, withTiming(1, { duration: DURATION.sheet, easing: EASE_OUT }))
      cardProgress.value = withDelay(160, withTiming(1, { duration: DURATION.sheet, easing: EASE_OUT }))
    } else {
      veilOpacity.value = 0
      badgeProgress.value = 0
      cardProgress.value = 0
    }
  }, [visible, veilOpacity, badgeProgress, cardProgress])

  const veilStyle = useAnimatedStyle(() => ({ opacity: veilOpacity.value }))
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeProgress.value,
    transform: [
      { scale: 0.7 + badgeProgress.value * 0.3 },
      { translateY: (1 - badgeProgress.value) * 14 },
    ],
  }))
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardProgress.value,
    transform: [{ translateY: (1 - cardProgress.value) * 22 }],
  }))

  if (!visible) return null

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onUnlockPress()
  }

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, veilStyle]}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
    >
      {/* Full-bleed blur — map is fully obscured */}
      <BlurView
        intensity={isDark ? 70 : 90}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Vignette for depth + legibility */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(10,22,40,0.55)', 'rgba(10,22,40,0.25)', 'rgba(10,22,40,0.65)']
            : ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.45)']
        }
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Decorative scattered pins for atmosphere */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Ionicons
          name="location"
          size={120}
          color={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,55,176,0.06)'}
          style={styles.pinTopLeft}
        />
        <Ionicons
          name="location"
          size={88}
          color={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,55,176,0.06)'}
          style={styles.pinBottomRight}
        />
        <Ionicons
          name="navigate"
          size={64}
          color={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,55,176,0.05)'}
          style={styles.pinMidRight}
        />
      </View>

      {/* Centered lock content */}
      <View style={styles.content} pointerEvents="box-none">
        <Animated.View style={badgeStyle}>
          <View style={[styles.badge, { backgroundColor: colors.primary[500] }]}>
            <Ionicons name="lock-closed" size={30} color={colors.white} />
          </View>
          <View style={styles.badgeRibbon}>
            <Ionicons name="sparkles" size={11} color={colors.white} />
            <Text style={styles.badgeRibbonText}>PRO</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.card, cardStyle]}>
          <View className="items-center bg-white/90 dark:bg-surface-900/90 rounded-[28px] px-7 py-6">
            <Text className="text-[19px] font-bold text-neutral-900 dark:text-white text-center">
              {t('premium_locked_map_label')}
            </Text>
            <Text className="text-[14px] text-neutral-500 dark:text-neutral-300 text-center mt-1.5 leading-5">
              {t('premium_locked_map_description')}
            </Text>

            <Pressable
              onPress={handlePress}
              className="w-full mt-5 active:opacity-85"
              style={[styles.cta, { backgroundColor: colors.primary[500] }]}
            >
              <Ionicons name="sparkles" size={16} color={colors.white} />
              <Text className="text-[15px] font-semibold text-white ml-2">
                {t('premium_locked_map_unlock')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  badgeRibbon: {
    position: 'absolute',
    top: -8,
    right: -16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.tertiary[500],
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeRibbonText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  card: {
    marginTop: 22,
    width: '100%',
    maxWidth: 360,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingVertical: 13,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  pinTopLeft: {
    position: 'absolute',
    top: -20,
    left: -30,
    transform: [{ rotate: '-18deg' }],
  },
  pinBottomRight: {
    position: 'absolute',
    bottom: 40,
    right: -24,
    transform: [{ rotate: '14deg' }],
  },
  pinMidRight: {
    position: 'absolute',
    top: '38%',
    right: 20,
    transform: [{ rotate: '-8deg' }],
  },
})
