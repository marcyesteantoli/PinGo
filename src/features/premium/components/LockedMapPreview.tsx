import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { colors } from '@lib/colors'

interface LockedMapPreviewProps {
  visible: boolean
  onUnlockPress: () => void
}

export function LockedMapPreview({ visible, onUnlockPress }: LockedMapPreviewProps) {
  const { t } = useTranslation()
  const isDark = useColorScheme() === 'dark'

  if (!visible) return null

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onUnlockPress()
  }

  return (
    <View
      style={StyleSheet.absoluteFillObject}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
    >
      {/* Bottom blur strip only */}
      <View style={styles.blurStrip} pointerEvents="none">
        <BlurView
          intensity={12}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Bottom floating card */}
      <View style={styles.card}>
        <View
          className="flex-row items-center bg-white/90 dark:bg-neutral-900/85 rounded-2xl px-5 py-4"
          style={styles.cardShadow}
        >
          <Ionicons name="lock-closed" size={20} color={colors.primary[500]} />
          <Text className="flex-1 mx-3 font-semibold text-sm text-neutral-800 dark:text-white">
            {t('premium_locked_map_label')}
          </Text>
          <Pressable
            onPress={handlePress}
            className="flex-row items-center gap-1.5 bg-primary-500 rounded-full px-4 py-2 active:opacity-80"
          >
            <Ionicons name="sparkles" size={14} color="white" />
            <Text className="text-sm font-semibold text-white">
              {t('premium_locked_map_unlock')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  blurStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    overflow: 'hidden',
  },
  card: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
})
