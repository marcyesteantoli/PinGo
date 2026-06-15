import { useEffect } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { DURATION, EASE_OUT } from '@lib/animations'
import type { OnboardingSlideData } from '../types'
import { ChaosChips } from './ChaosChips'
import { ChaosStackMockup } from './ChaosStackMockup'
import { ItineraryMockup } from './ItineraryMockup'
import { ExpenseSplitMockup } from './ExpenseSplitMockup'
import { PhotoMemoriesMockup } from './PhotoMemoriesMockup'
import { WishlistMapMockup } from './WishlistMapMockup'

interface OnboardingSlideProps {
  slide: OnboardingSlideData
  width: number
  isActive: boolean
}

export function OnboardingSlide({ slide, width, isActive }: OnboardingSlideProps) {
  const { t } = useTranslation()

  // Icon animations
  const iconScale = useSharedValue(0.5)
  const iconOpacity = useSharedValue(0)
  const iconRotate = useSharedValue(slide.type === 'intro' ? -20 : 0)

  // Text animations
  const titleOpacity = useSharedValue(0)
  const titleY = useSharedValue(20)
  const subtitleOpacity = useSharedValue(0)
  const subtitleY = useSharedValue(14)

  // Slide 1 globe slow rotation after entrance
  const globeRotate = useSharedValue(0)

  // Slide 6 rocket entrance from bottom-left
  const rocketX = useSharedValue(40)
  const rocketY = useSharedValue(40)

  useEffect(() => {
    if (!isActive) {
      iconScale.value = withTiming(0.5, { duration: DURATION.fast, easing: EASE_OUT })
      iconOpacity.value = withTiming(0, { duration: DURATION.fast, easing: EASE_OUT })
      titleOpacity.value = withTiming(0, { duration: DURATION.fast, easing: EASE_OUT })
      titleY.value = 20
      subtitleOpacity.value = withTiming(0, { duration: DURATION.fast, easing: EASE_OUT })
      subtitleY.value = 14
      globeRotate.value = 0
      rocketX.value = 40; rocketY.value = 40
      iconRotate.value = slide.type === 'intro' ? -20 : 0
      return
    }

    // Icon entrance
    iconScale.value = withTiming(1, { duration: DURATION.sheet, easing: EASE_OUT })
    iconOpacity.value = withTiming(1, { duration: DURATION.sheet, easing: EASE_OUT })

    // Title stagger
    titleOpacity.value = withDelay(120, withTiming(1, { duration: DURATION.normal, easing: EASE_OUT }))
    titleY.value = withDelay(120, withTiming(0, { duration: DURATION.normal, easing: EASE_OUT }))

    // Subtitle stagger
    subtitleOpacity.value = withDelay(200, withTiming(1, { duration: DURATION.normal, easing: EASE_OUT }))
    subtitleY.value = withDelay(200, withTiming(0, { duration: DURATION.normal, easing: EASE_OUT }))

    // Slide 1: globe tilt-settle then slow bob
    if (slide.type === 'intro') {
      iconRotate.value = withTiming(0, { duration: 800, easing: EASE_OUT })
    }

    // Slide 6: rocket from bottom-left
    if (slide.type === 'activation') {
      iconScale.value = 1
      rocketX.value = withTiming(0, { duration: DURATION.sheet, easing: EASE_OUT })
      rocketY.value = withTiming(0, { duration: DURATION.sheet, easing: EASE_OUT })
    }
  }, [isActive])

  const iconContainerStyle = useAnimatedStyle(() => {
    const baseTransform: object[] = [{ scale: iconScale.value }]
    if (slide.type === 'intro') baseTransform.push({ rotate: `${iconRotate.value}deg` })
    if (slide.type === 'activation') {
      baseTransform.push({ translateX: rocketX.value }, { translateY: rocketY.value })
    }
    return { opacity: iconOpacity.value, transform: baseTransform }
  })

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }))

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleY.value }],
  }))

  const isProblem = slide.type === 'problem'

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.spacerTop} />

      {/* Icon area */}
      <View style={styles.iconArea}>
        <Animated.View style={iconContainerStyle}>
          {slide.key === 'problem' ? (
            <ChaosStackMockup width={width - 64} isActive={isActive} />
          ) : slide.key === 'collaborative' ? (
            <ItineraryMockup width={width - 64} />
          ) : slide.key === 'organized' ? (
            <ExpenseSplitMockup isActive={isActive} />
          ) : slide.key === 'gallery' ? (
            <PhotoMemoriesMockup width={width - 64} />
          ) : slide.key === 'memories' ? (
            <WishlistMapMockup width={width - 32} />
          ) : slide.imageSource ? (
            <Image source={slide.imageSource} style={styles.logoImage} resizeMode="contain" />
          ) : (
            <View style={[styles.iconHalo, { backgroundColor: `${slide.accentColor}1F` }]}>
              <Ionicons name={slide.iconName} size={64} color={slide.accentColor} />
            </View>
          )}
        </Animated.View>
      </View>

      <View style={styles.gap32} />

      {/* Problem slide: chaos chips instead of subtitle */}
      {isProblem ? (
        <>
          <Animated.Text style={[styles.title, titleStyle]}>
            {t(slide.titleKey)}
          </Animated.Text>
          <View style={styles.gap16} />
          <ChaosChips isActive={isActive} />
        </>
      ) : (
        <>
          <Animated.Text style={[styles.title, titleStyle]}>
            {t(slide.titleKey)}
          </Animated.Text>
          <View style={styles.gap12} />
          <Animated.Text style={[styles.subtitle, subtitleStyle]}>
            {t(slide.subtitleKey)}
          </Animated.Text>
        </>
      )}

      <View style={styles.spacerBottom} />
    </View>
  )
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  spacerTop: {
    flex: 1,
  },
  spacerBottom: {
    flex: 1.5,
  },
  iconArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHalo: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 160,
    height: 160,
  },
  gap32: { height: 32 },
  gap16: { height: 16 },
  gap12: { height: 12 },
  title: {
    fontSize: 34,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
    lineHeight: 26,
  },
})
