import { Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { colors } from '@lib/colors'

export type ProPaywallFeature = 'maps' | 'trips' | 'photos' | 'documents' | 'pdf'

interface ProPaywallSheetProps {
  visible: boolean
  onClose: () => void
  feature: ProPaywallFeature
}

const FEATURE_ICON: Record<ProPaywallFeature, keyof typeof Ionicons.glyphMap> = {
  maps: 'map-outline',
  trips: 'airplane-outline',
  photos: 'images-outline',
  documents: 'document-text-outline',
  pdf: 'download-outline',
}

const BENEFIT_KEYS = [
  'premium_paywall_benefit_maps',
  'premium_paywall_benefit_trips',
  'premium_paywall_benefit_photos',
  'premium_paywall_benefit_documents',
  'premium_paywall_benefit_pdf',
] as const

export function ProPaywallSheet({ visible, onClose, feature }: ProPaywallSheetProps) {
  const { t } = useTranslation()

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    // TODO: integrar RevenueCat/StoreKit
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} scrollable>
      <View className="items-center gap-4 mb-2">
        <View className="w-14 h-14 rounded-full bg-primary-500/10 items-center justify-center">
          <Ionicons name={FEATURE_ICON[feature]} size={28} color={colors.primary[500]} />
        </View>

        <View className="items-center gap-1 px-2">
          <Text className="text-xl font-bold text-neutral-900 dark:text-white text-center">
            {t(`premium_paywall_title_${feature}`)}
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
            {t(`premium_paywall_subtitle_${feature}`)}
          </Text>
        </View>

        <View className="w-full gap-2.5 mt-1">
          {BENEFIT_KEYS.map(key => (
            <View key={key} className="flex-row items-center gap-2.5">
              <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
              <Text className="text-[15px] text-neutral-700 dark:text-neutral-200 flex-1">
                {t(key)}
              </Text>
            </View>
          ))}
        </View>

        <View className="flex-row gap-3 w-full mt-2">
          <View className="flex-1 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 items-center gap-1">
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">{t('premium_paywall_monthly')}</Text>
            <Text className="text-lg font-bold text-neutral-900 dark:text-white">€4.99</Text>
            <Text className="text-xs text-neutral-400">{t('premium_paywall_perMonth')}</Text>
          </View>
          <View className="flex-1 rounded-2xl border-2 border-primary-500 p-4 items-center gap-1">
            <View className="absolute -top-2.5 self-center bg-primary-500 rounded-full px-2 py-0.5">
              <Text className="text-[11px] font-semibold text-white">{t('premium_paywall_annualSave')}</Text>
            </View>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">{t('premium_paywall_annual')}</Text>
            <Text className="text-lg font-bold text-neutral-900 dark:text-white">€34.99</Text>
            <Text className="text-xs text-neutral-400">{t('premium_paywall_perYear')}</Text>
          </View>
        </View>

        <Button onPress={handleUpgrade} size="lg" className="w-full mt-2">
          {t('premium_paywall_cta')}
        </Button>
        <Button onPress={onClose} variant="ghost" size="md" className="w-full -mt-1">
          {t('premium_paywall_later')}
        </Button>
      </View>
    </BottomSheet>
  )
}
