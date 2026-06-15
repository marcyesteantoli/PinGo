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
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <BlurView
        intensity={50}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="auto"
      />
      <View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.25)' }]}
        pointerEvents="auto"
      />

      <View className="flex-1 items-center justify-center px-8" pointerEvents="box-none">
        <View className="items-center gap-3">
          <View className="w-14 h-14 rounded-full bg-white/90 dark:bg-neutral-900/80 items-center justify-center">
            <Ionicons name="lock-closed" size={26} color={colors.primary[500]} />
          </View>
          <Text className="text-base font-semibold text-white text-center" style={styles.shadow}>
            {t('premium_locked_map_label')}
          </Text>

          <Pressable
            onPress={handlePress}
            className="flex-row items-center gap-1.5 bg-primary-500 rounded-full px-5 py-2.5 mt-1 active:opacity-80"
          >
            <Ionicons name="sparkles" size={16} color="white" />
            <Text className="text-[15px] font-semibold text-white">
              {t('premium_locked_map_unlock')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  shadow: {
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
})
