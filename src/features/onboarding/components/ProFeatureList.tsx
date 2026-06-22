import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { DURATION, EASE_OUT } from '@lib/animations'

const PRIMARY = '#0046DE'

const BENEFITS: {
  key: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  bg: string
}[] = [
  { key: 'premium_paywall_benefit_trips', icon: 'airplane-outline', color: '#F97316', bg: '#FFEDD5' },
  { key: 'premium_paywall_benefit_photos', icon: 'images-outline', color: '#EC4899', bg: '#FCE7F3' },
  { key: 'premium_paywall_benefit_documents', icon: 'document-text-outline', color: '#22C55E', bg: '#DCFCE7' },
  { key: 'premium_paywall_benefit_pdf', icon: 'download-outline', color: '#8B5CF6', bg: '#EDE9FE' },
  { key: 'premium_paywall_benefit_maps', icon: 'map-outline', color: '#0EA5E9', bg: '#E0F2FE' },
  { key: 'premium_paywall_benefit_support', icon: 'heart', color: '#EF4444', bg: '#FEE2E2' },
]

function BenefitRow({
  item,
  delay,
  isActive,
}: {
  item: (typeof BENEFITS)[0]
  delay: number
  isActive: boolean
}) {
  const { t } = useTranslation()
  const opacity = useSharedValue(0)
  const translateX = useSharedValue(-14)

  useEffect(() => {
    if (!isActive) {
      opacity.value = withTiming(0, { duration: DURATION.fast, easing: EASE_OUT })
      translateX.value = -14
      return
    }
    opacity.value = withDelay(delay, withTiming(1, { duration: DURATION.normal, easing: EASE_OUT }))
    translateX.value = withDelay(delay, withTiming(0, { duration: DURATION.normal, easing: EASE_OUT }))
  }, [isActive])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }))

  return (
    <Animated.View style={[styles.row, style]}>
      <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
        <Ionicons name={item.icon} size={20} color={item.color} />
      </View>
      <Text style={styles.rowText}>{t(item.key)}</Text>
    </Animated.View>
  )
}

interface ProFeatureListProps {
  isActive: boolean
}

export function ProFeatureList({ isActive }: ProFeatureListProps) {
  const { t } = useTranslation()

  const headerOpacity = useSharedValue(0)
  const headerY = useSharedValue(14)
  const freeOpacity = useSharedValue(0)
  const freeY = useSharedValue(10)

  useEffect(() => {
    if (!isActive) {
      headerOpacity.value = withTiming(0, { duration: DURATION.fast, easing: EASE_OUT })
      headerY.value = 14
      freeOpacity.value = 0
      freeY.value = 10
      return
    }
    headerOpacity.value = withTiming(1, { duration: DURATION.sheet, easing: EASE_OUT })
    headerY.value = withTiming(0, { duration: DURATION.sheet, easing: EASE_OUT })
    freeOpacity.value = withDelay(520, withTiming(1, { duration: DURATION.normal, easing: EASE_OUT }))
    freeY.value = withDelay(520, withTiming(0, { duration: DURATION.normal, easing: EASE_OUT }))
  }, [isActive])

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }))

  const freeStyle = useAnimatedStyle(() => ({
    opacity: freeOpacity.value,
    transform: [{ translateY: freeY.value }],
  }))

  return (
    <View style={styles.container}>
      {/* PinGo PRO header — mirrors ProPaywallSheet */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.headerRow}>
          <Ionicons name="sparkles" size={22} color={PRIMARY} />
          <Text style={styles.headerPinGo}>PinGo</Text>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>{t('premium_paywall_generic_subtitle')}</Text>
      </Animated.View>

      {/* Benefits */}
      <View style={styles.benefits}>
        {BENEFITS.map((item, i) => (
          <BenefitRow key={item.key} item={item} delay={100 + i * 55} isActive={isActive} />
        ))}
      </View>

      {/* Free tier callout */}
      <Animated.Text style={[styles.footnote, freeStyle]}>
        {t('onboarding_pro_free_note')}
      </Animated.Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerPinGo: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
  },
  proBadge: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  proBadgeText: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#ffffff',
    lineHeight: 24,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(0,0,0,0.45)',
    textAlign: 'center',
  },
  benefits: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#374151',
    flex: 1,
  },
  footnote: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(0,0,0,0.35)',
    textAlign: 'center',
  },
})
