import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import Animated, {
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { DURATION, EASE_DRAWER } from '@lib/animations'
import type { OnboardingSlideData } from '../types'
import { OnboardingSlide } from './OnboardingSlide'
import { PaginationDots } from './PaginationDots'
import { FloatingParticles } from './FloatingParticles'

const VIEWABILITY_CONFIG = { viewAreaCoveragePercentThreshold: 50 }

interface OnboardingCarouselCta {
  labelKey: string
  onPress: () => void
}

interface OnboardingCarouselProps {
  slides: OnboardingSlideData[]
  onSkip: () => void
  primaryCta: OnboardingCarouselCta & { color: string }
  secondaryCta?: OnboardingCarouselCta
  onOpenPaywall?: () => void
}

export function OnboardingCarousel({ slides, onSkip, primaryCta, secondaryCta, onOpenPaywall }: OnboardingCarouselProps) {
  const { t } = useTranslation()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const [activeIndex, setActiveIndex] = useState(0)
  const flatListRef = useRef<any>(null)

  const bgColors = useMemo(() => slides.map((s) => s.bgColor), [slides])
  const indices = useMemo(() => slides.map((_, i) => i), [slides])

  const scrollX = useSharedValue(0)
  const screenOpacity = useSharedValue(0)

  useEffect(() => {
    screenOpacity.value = withTiming(1, { duration: DURATION.sheet, easing: EASE_DRAWER })
  }, [])

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x
    },
  })

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(scrollX.value / width, indices, bgColors),
  }))

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }))

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems[0] != null) {
        setActiveIndex(viewableItems[0].index ?? 0)
      }
    },
    [],
  )

  const isLastSlide = activeIndex === slides.length - 1
  const isProSlide = slides[activeIndex]?.type === 'pro_awareness'

  const handleContinueFree = useCallback(() => {
    flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true })
  }, [activeIndex])

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <StatusBar style="dark" />
      {/* Animated background */}
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} />

      {/* Floating ambient particles */}
      <FloatingParticles />

      {/* Skip button */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={onSkip}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>{t('onboarding_skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={1}
        onScroll={scrollHandler}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        renderItem={({ item, index }) => (
          <OnboardingSlide
            slide={item}
            width={width}
            isActive={index === activeIndex}
          />
        )}
      />

      {/* Bottom controls */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 28 }]}>
        <PaginationDots total={slides.length} activeIndex={activeIndex} />

        <View style={styles.gap20} />

        {isProSlide && (
          <>
            <TouchableOpacity
              style={[styles.ctaPrimary, { backgroundColor: '#0046DE', shadowColor: '#0046DE' }]}
              onPress={onOpenPaywall}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaPrimaryText}>{t('onboarding_pro_cta_trial')}</Text>
            </TouchableOpacity>

            <View style={styles.gap12} />
            <TouchableOpacity
              onPress={handleContinueFree}
              hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
            >
              <Text style={styles.ctaSecondaryText}>{t('onboarding_pro_cta_skip')}</Text>
            </TouchableOpacity>
          </>
        )}

        {isLastSlide && (
          <>
            <TouchableOpacity
              style={[
                styles.ctaPrimary,
                { backgroundColor: primaryCta.color, shadowColor: primaryCta.color },
              ]}
              onPress={primaryCta.onPress}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaPrimaryText}>{t(primaryCta.labelKey)}</Text>
            </TouchableOpacity>

            {secondaryCta && (
              <>
                <View style={styles.gap12} />
                <TouchableOpacity
                  onPress={secondaryCta.onPress}
                  hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                >
                  <Text style={styles.ctaSecondaryText}>{t(secondaryCta.labelKey)}</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    alignItems: 'flex-end',
    paddingBottom: 8,
  },
  skipButton: {
    paddingHorizontal: 4,
  },
  skipText: {
    color: 'rgba(0,0,0,0.35)',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  bottom: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  gap20: { height: 20 },
  gap12: { height: 12 },
  ctaPrimary: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'stretch',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaPrimaryText: {
    color: '#ffffff',
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  ctaSecondaryText: {
    color: 'rgba(0,0,0,0.4)',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
})
