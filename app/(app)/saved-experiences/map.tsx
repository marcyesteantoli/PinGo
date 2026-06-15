import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { SavedExperiencesMap } from '@features/saved/components/SavedExperiencesMap'
import { useSavedExperiences } from '@features/saved/hooks/useSavedExperiences'
import { useTheme } from '@lib/theme'
import { EASE_OUT } from '@lib/animations'

function BackButton({ onPress, top }: { onPress: () => void; top: number }) {
  const { isDark } = useTheme()
  const { t } = useTranslation()
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const iconColor = isDark ? 'rgba(255,255,255,0.90)' : 'rgba(0,0,0,0.78)'

  return (
    <Animated.View style={[styles.backBtnWrap, { top }, animStyle]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onPress()
        }}
        onPressIn={() => { scale.value = withTiming(0.88, { duration: 100, easing: EASE_OUT }) }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 200, easing: EASE_OUT }) }}
        accessibilityRole="button"
        accessibilityLabel={t('common_back')}
        hitSlop={10}
      >
        <BlurView intensity={85} tint={isDark ? 'dark' : 'extraLight'} style={styles.backBtnBlur}>
          <Ionicons name="chevron-back" size={22} color={iconColor} />
        </BlurView>
      </Pressable>
    </Animated.View>
  )
}

export default function SavedExperiencesMapScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { data: items = [] } = useSavedExperiences()

  return (
    <View style={{ flex: 1 }}>
      <SavedExperiencesMap
        items={items}
        onItemPress={(id) => router.push(`/saved-experiences/${id}`)}
      />
      <BackButton onPress={() => router.back()} top={insets.top + 8} />
    </View>
  )
}

const styles = StyleSheet.create({
  backBtnWrap: {
    position: 'absolute',
    left: 16,
    borderRadius: 19,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  backBtnBlur: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
})
