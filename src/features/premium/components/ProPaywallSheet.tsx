import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { colors } from '@lib/colors'

export type ProPaywallFeature = 'maps' | 'trips' | 'photos' | 'documents' | 'pdf'

type PlanId = 'monthly' | 'annual' | 'lifetime'

interface Plan {
  id: PlanId
  labelKey: string
  price: string
  periodKey?: string
  originalPrice?: string
  savings?: string
  descKey?: string
  badgeKey?: string
}

const PLANS: Plan[] = [
  { id: 'monthly', labelKey: 'premium_paywall_monthly', price: '€3.99', periodKey: 'premium_paywall_perMonth' },
  { id: 'annual', labelKey: 'premium_paywall_annual', price: '€28.99', periodKey: 'premium_paywall_perYear', originalPrice: '€47.88', savings: '€18.89', descKey: 'premium_paywall_annual_desc', badgeKey: 'premium_paywall_annualSave' },
  { id: 'lifetime', labelKey: 'premium_paywall_lifetime', price: '€79.99', descKey: 'premium_paywall_lifetime_desc' },
]

interface ProPaywallSheetProps {
  visible: boolean
  onClose: () => void
  feature: ProPaywallFeature
}

const BENEFITS: { key: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: { light: string; dark: string } }[] = [
  { key: 'premium_paywall_benefit_maps', icon: 'map-outline', color: '#0EA5E9', bg: { light: '#E0F2FE', dark: '#06304E' } },
  { key: 'premium_paywall_benefit_trips', icon: 'airplane-outline', color: '#F97316', bg: { light: '#FFEDD5', dark: '#4E1E06' } },
  { key: 'premium_paywall_benefit_photos', icon: 'images-outline', color: '#EC4899', bg: { light: '#FCE7F3', dark: '#4E062A' } },
  { key: 'premium_paywall_benefit_documents', icon: 'document-text-outline', color: '#22C55E', bg: { light: '#DCFCE7', dark: '#064E3B' } },
  { key: 'premium_paywall_benefit_pdf', icon: 'download-outline', color: '#8B5CF6', bg: { light: '#EDE9FE', dark: '#24064E' } },
  { key: 'premium_paywall_benefit_support', icon: 'heart', color: '#EF4444', bg: { light: '#FEE2E2', dark: '#4E0606' } },
]

export function ProPaywallSheet({ visible, onClose }: ProPaywallSheetProps) {
  const { t } = useTranslation()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual')
  const selectedPlanData = PLANS.find(plan => plan.id === selectedPlan)!

  const handleSelectPlan = (id: PlanId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedPlan(id)
  }

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    // TODO: integrar RevenueCat/StoreKit
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} scrollable>
      <View className="items-center gap-4 mb-2">
        <View className="items-center gap-1 px-2">
          <View className="flex-row items-center gap-2">
            <Ionicons name="sparkles" size={24} color={colors.primary[500]} />
            <Text className="text-2xl font-bold text-neutral-900 dark:text-white text-center">
              {t('premium_paywall_generic_title')}
            </Text>
          </View>
          <Text className="text-base text-neutral-500 dark:text-neutral-400 text-center">
            {t('premium_paywall_generic_subtitle')}
          </Text>
        </View>

        <View className="w-full gap-3 mt-1">
          {BENEFITS.map(({ key, icon, color, bg }) => (
            <View key={key} className="flex-row items-center gap-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: isDark ? bg.dark : bg.light }}
              >
                <Ionicons name={icon} size={20} color={color} />
              </View>
              <Text className="text-base text-neutral-700 dark:text-neutral-200 flex-1">
                {t(key)}
              </Text>
            </View>
          ))}
        </View>

        <View className="w-full gap-2.5 mt-2">
          {PLANS.map(plan => {
            const selected = selectedPlan === plan.id
            return (
              <Pressable
                key={plan.id}
                onPress={() => handleSelectPlan(plan.id)}
                className={`rounded-2xl border-2 px-4 py-3 ${
                  selected ? 'border-primary-500 bg-primary-500/5' : 'border-neutral-200 dark:border-neutral-700'
                }`}
              >
                {plan.badgeKey && (
                  <View className="absolute -top-2.5 right-4 bg-warning-500 rounded-full px-2 py-0.5">
                    <Text className="text-xs font-semibold text-white">{t(plan.badgeKey)}</Text>
                  </View>
                )}
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                        selected ? 'border-primary-500' : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                    >
                      {selected && <View className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                        {t(plan.labelKey)}
                      </Text>
                      {plan.descKey && (
                        <Text className="text-sm text-neutral-400">{t(plan.descKey)}</Text>
                      )}
                    </View>
                  </View>
                  <View className="items-end">
                    {plan.originalPrice && (
                      <Text className="text-sm text-neutral-400 line-through">{plan.originalPrice}</Text>
                    )}
                    <View className="flex-row items-baseline gap-1">
                      <Text className="text-lg font-bold text-neutral-900 dark:text-white">{plan.price}</Text>
                      {plan.periodKey && <Text className="text-sm text-neutral-400">{t(plan.periodKey)}</Text>}
                    </View>
                  </View>
                </View>
              </Pressable>
            )
          })}
        </View>

        <Button onPress={handleUpgrade} size="lg" className="w-full mt-2">
          <View className="items-center w-full">
            <Text className="text-lg font-semibold text-white text-center">{t('premium_paywall_cta')}</Text>
            <Text className="text-sm text-white/80 text-center">
              {selectedPlanData.price}
              {selectedPlanData.periodKey ? ` ${t(selectedPlanData.periodKey)}` : ` · ${t('premium_paywall_lifetime_desc')}`}
            </Text>
          </View>
        </Button>
      </View>
    </BottomSheet>
  )
}
