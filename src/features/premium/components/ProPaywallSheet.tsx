import { useState } from 'react'
import { Pressable, Text, View, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { colors } from '@lib/colors'
import { LIMITS } from '@/config/limits'
import { usePurchase } from '@features/premium/hooks/usePurchase'
import { useRestorePurchases } from '@features/premium/hooks/useRestorePurchases'

export type ProPaywallFeature = 'maps' | 'trips' | 'photos' | 'documents' | 'pdf'

type PlanId = 'monthly' | 'annual' | 'lifetime'

interface Plan {
  id: PlanId
  labelKey: string
  price: string
  pricePerMonth?: string
  originalPrice?: string
  savingsPercent?: string
  descKey?: string
  trialDays?: number
  bestOffer?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'annual',
    labelKey: 'premium_paywall_annual',
    price: '29,99 €',
    pricePerMonth: '2,50 € / mes',
    originalPrice: '47,88 €',
    savingsPercent: '37%',
    bestOffer: true,
    trialDays: 7,
  },
  {
    id: 'monthly',
    labelKey: 'premium_paywall_monthly',
    price: '3,99 € / mes',
  },
  {
    id: 'lifetime',
    labelKey: 'premium_paywall_lifetime',
    price: '79,99 €',
    descKey: 'premium_paywall_lifetime_desc',
  },
]

interface ProPaywallSheetProps {
  visible: boolean
  onClose: () => void
  feature: ProPaywallFeature
  isLimitReached?: boolean
}

const BENEFITS: { key: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: { light: string; dark: string } }[] = [
  { key: 'premium_paywall_benefit_maps', icon: 'map-outline', color: '#0EA5E9', bg: { light: '#E0F2FE', dark: '#06304E' } },
  { key: 'premium_paywall_benefit_trips', icon: 'airplane-outline', color: '#F97316', bg: { light: '#FFEDD5', dark: '#4E1E06' } },
  { key: 'premium_paywall_benefit_photos', icon: 'images-outline', color: '#EC4899', bg: { light: '#FCE7F3', dark: '#4E062A' } },
  { key: 'premium_paywall_benefit_documents', icon: 'document-text-outline', color: '#22C55E', bg: { light: '#DCFCE7', dark: '#064E3B' } },
  { key: 'premium_paywall_benefit_pdf', icon: 'download-outline', color: '#8B5CF6', bg: { light: '#EDE9FE', dark: '#24064E' } },
  { key: 'premium_paywall_benefit_support', icon: 'heart', color: '#EF4444', bg: { light: '#FEE2E2', dark: '#4E0606' } },
]

export function ProPaywallSheet({ visible, onClose, feature, isLimitReached }: ProPaywallSheetProps) {
  const { t } = useTranslation()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual')

  const purchase = usePurchase()
  const restorePurchases = useRestorePurchases()

  const limitMessages: Partial<Record<ProPaywallFeature, string>> = {
    trips: t('premium_trips_limit_message', { count: LIMITS.FREE_MAX_ACTIVE_TRIPS }),
    photos: t('premium_photos_limit_message', { count: LIMITS.FREE_MAX_PHOTOS_PER_TRIP }),
    documents: t('premium_documents_limit_message', { count: LIMITS.FREE_MAX_DOCUMENTS_PER_TRIP }),
  }
  const limitMessage = isLimitReached ? limitMessages[feature] : undefined
  const [showAllPlans, setShowAllPlans] = useState(false)
  const selectedPlanData = PLANS.find(plan => plan.id === selectedPlan)!
  const visiblePlans = showAllPlans ? PLANS : PLANS.filter(p => p.id !== 'lifetime')

  const handleSelectPlan = (id: PlanId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedPlan(id)
  }

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    purchase.mutate({ planId: selectedPlan, onClose })
  }

  const ctaLabel = selectedPlanData.trialDays
    ? t('premium_paywall_cta_trial', { days: selectedPlanData.trialDays })
    : t('premium_paywall_cta')

  return (
    <BottomSheet visible={visible} onClose={onClose} scrollable>
      <View className="items-center gap-4 mb-2">
        {/* Header */}
        <View className="items-center gap-1 px-2">
          <View className="flex-row items-center gap-2">
            <Ionicons name="sparkles" size={24} color={colors.primary[500]} />
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-bold text-neutral-900 dark:text-white">PinGo</Text>
              <View className="bg-primary-500 rounded-lg px-2 py-0.5 justify-center">
                <Text className="text-2xl font-bold text-white">PRO</Text>
              </View>
            </View>
          </View>
          <Text className="text-base text-neutral-500 dark:text-neutral-400 text-center">
            {t('premium_paywall_generic_subtitle')}
          </Text>
        </View>

        {/* Limit reached banner */}
        {limitMessage && (
          <View className="w-full rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-4 py-3">
            <Text className="text-amber-800 dark:text-amber-300 text-sm font-medium text-center">
              {limitMessage}
            </Text>
          </View>
        )}

        {/* Benefits */}
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

        {/* Plan selectors */}
        <View className="w-full gap-2.5 mt-2">
          {visiblePlans.map(plan => {
            const selected = selectedPlan === plan.id
            return (
              <Pressable
                key={plan.id}
                onPress={() => handleSelectPlan(plan.id)}
                className={`rounded-2xl border-2 overflow-hidden ${
                  selected
                    ? 'border-primary-500 bg-primary-500/5 dark:bg-primary-500/10'
                    : 'border-neutral-200 dark:border-neutral-700'
                }`}
              >
                {/* Best offer header row — annual only */}
                {plan.bestOffer && (
                  <View className="flex-row items-center justify-between px-4 pt-3 pb-1.5">
                    <Text
                      className={`text-xs font-bold uppercase tracking-wider ${
                        selected ? 'text-primary-500' : 'text-neutral-400 dark:text-neutral-500'
                      }`}
                    >
                      {t('premium_paywall_best_offer', { percent: plan.savingsPercent })}
                    </Text>
                    <View
                      className={`rounded-full px-2.5 py-1 ${
                        selected ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          selected ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                      >
                        {t('premium_paywall_trial_badge', { days: plan.trialDays })}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Main content row */}
                <View
                  className={`flex-row items-start justify-between px-4 ${
                    plan.bestOffer ? 'pb-3' : 'py-4'
                  }`}
                >
                  <View className="flex-1">
                    <Text
                      className={`text-xl font-bold ${
                        selected
                          ? 'text-neutral-900 dark:text-white'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {t(plan.labelKey)}
                    </Text>
                    {plan.originalPrice && (
                      <Text className="text-sm text-neutral-400 mt-0.5">
                        {t('premium_paywall_annual_months')}{' '}
                        <Text className="line-through">{plan.originalPrice}</Text>
                      </Text>
                    )}
                    {plan.descKey && !plan.originalPrice && (
                      <Text className="text-sm text-neutral-400 mt-0.5">{t(plan.descKey)}</Text>
                    )}
                  </View>

                  <View className="items-end ml-4">
                    <Text
                      className={`text-xl font-bold ${
                        selected && plan.bestOffer
                          ? 'text-primary-500'
                          : selected
                          ? 'text-neutral-900 dark:text-white'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {plan.price}
                    </Text>
                    {plan.pricePerMonth && (
                      <Text className="text-sm text-neutral-400 mt-0.5">{plan.pricePerMonth}</Text>
                    )}
                  </View>
                </View>
              </Pressable>
            )
          })}
        </View>

        {/* CTA */}
        <View className="w-full mt-2">
          <Button onPress={handleUpgrade} size="lg" disabled={purchase.isPending}>
            {purchase.isPending
              ? <ActivityIndicator color="white" />
              : <Text className="text-xl font-bold text-white text-center w-full">{ctaLabel}</Text>
            }
          </Button>
        </View>

        {/* Footer */}
        <View className="items-center gap-2 pb-2">
          <Text className="text-sm text-neutral-400 text-center">
            {selectedPlanData.trialDays
              ? t('premium_paywall_no_charge_now')
              : selectedPlanData.id === 'lifetime'
              ? t('premium_paywall_one_time_purchase')
              : t('premium_paywall_cancel_anytime')}
          </Text>
          <Pressable onPress={() => setShowAllPlans(prev => !prev)}>
            <Text className="text-sm text-primary-500">{t('premium_paywall_all_plans')}</Text>
          </Pressable>
          <Pressable
            onPress={() => restorePurchases.mutate()}
            disabled={restorePurchases.isPending}
          >
            <Text className="text-sm text-neutral-400">{t('premium_restore_purchases')}</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  )
}
