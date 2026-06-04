import { useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { colors } from '@lib/colors'
import { useTheme } from '@lib/theme'
import { PLANS } from '../config'
import type { PlanId } from '../services/PremiumService'

type SelectablePlan = 'pro_monthly' | 'pro_annual' | 'trip_unlock'

interface PremiumPaywallProps {
  visible: boolean
  onClose: () => void
  onPurchase: (planId: PlanId) => Promise<void>
  onRestore: () => Promise<void>
  isPurchasing?: boolean
  tripId?: string
}

const FEATURES: Array<{ key: string; icon: string }> = [
  { key: 'premium_feature_pdf', icon: 'document-text-outline' },
  { key: 'premium_feature_collaborators', icon: 'people-outline' },
  { key: 'premium_feature_currency', icon: 'card-outline' },
  { key: 'premium_feature_storage', icon: 'images-outline' },
]

function PlanCard({
  selected,
  onPress,
  label,
  price,
  sublabel,
  badge,
}: {
  selected: boolean
  onPress: () => void
  label: string
  price: string
  sublabel?: string
  badge?: string
}) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePress = () => {
    scale.value = withTiming(0.96, { duration: 80 }, () => {
      scale.value = withTiming(1, { duration: 120 })
    })
    onPress()
  }

  return (
    <Animated.View style={animStyle} className="flex-1">
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        className={`rounded-2xl p-4 border-2 ${
          selected
            ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500'
            : 'bg-neutral-50 dark:bg-surface-800 border-neutral-200 dark:border-neutral-700'
        }`}
      >
        <View className="flex-row items-start justify-between mb-1">
          <Text
            className={`text-[13px] font-semibold ${
              selected
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {label}
          </Text>
          {badge ? (
            <View className="bg-primary-500 rounded-full px-1.5 py-0.5">
              <Text className="text-[10px] font-bold text-white">{badge}</Text>
            </View>
          ) : selected ? (
            <View className="w-4 h-4 rounded-full bg-primary-500 items-center justify-center">
              <Ionicons name="checkmark" size={10} color="white" />
            </View>
          ) : null}
        </View>
        <Text
          className={`text-[22px] font-bold ${
            selected
              ? 'text-primary-600 dark:text-primary-300'
              : 'text-neutral-900 dark:text-neutral-100'
          }`}
        >
          {price}
        </Text>
        {sublabel && (
          <Text
            className={`text-[11px] mt-0.5 ${
              selected
                ? 'text-primary-500 dark:text-primary-400'
                : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            {sublabel}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

export function PremiumPaywall({
  visible,
  onClose,
  onPurchase,
  onRestore,
  isPurchasing = false,
  tripId,
}: PremiumPaywallProps) {
  const { t } = useTranslation()
  const { isDark } = useTheme()
  const [selectedPlan, setSelectedPlan] = useState<SelectablePlan>(
    tripId ? 'trip_unlock' : 'pro_annual'
  )

  const handleUpgrade = () => {
    Alert.alert(t('premium_paywall_soon_title'), t('premium_paywall_soon_body'))
  }

  const ctaLabel =
    selectedPlan === 'trip_unlock'
      ? t('premium_paywall_cta_trip_unlock')
      : selectedPlan === 'pro_monthly'
        ? t('premium_paywall_cta_monthly')
        : t('premium_paywall_cta_annual')

  const unlockIconColor =
    selectedPlan === 'trip_unlock'
      ? colors.warning[500]
      : isDark
        ? colors.neutral[400]
        : colors.neutral[500]

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View className="items-center pt-2 pb-6">

          {/* Hero icon — layered aurora rings */}
          <View className="items-center justify-center mb-5">
            <View className="w-24 h-24 rounded-full bg-primary-500/5 dark:bg-primary-400/8 items-center justify-center">
              <View className="w-[72px] h-[72px] rounded-full bg-primary-500/10 dark:bg-primary-400/15 items-center justify-center">
                <View className="w-16 h-16 rounded-2xl bg-primary-500 items-center justify-center shadow-md">
                  <Ionicons name="sparkles" size={30} color="white" />
                </View>
              </View>
            </View>
          </View>

          {/* Badge */}
          <View className="flex-row items-center gap-1.5 bg-primary-500/10 dark:bg-primary-400/15 rounded-full px-3 py-1 mb-3">
            <Ionicons name="diamond-outline" size={11} color={colors.primary[500]} />
            <Text className="text-[11px] font-bold text-primary-600 dark:text-primary-400 tracking-widest uppercase">
              {t('premium_paywall_badge')}
            </Text>
          </View>

          {/* Headline + subtext */}
          <Text className="text-[24px] font-bold text-neutral-900 dark:text-neutral-50 text-center mb-1.5 tracking-tight px-2">
            {t('premium_paywall_headline')}
          </Text>
          <Text className="text-[14px] text-neutral-500 dark:text-neutral-400 text-center leading-5 mb-5 px-6">
            {t('premium_paywall_body')}
          </Text>

          {/* Feature list */}
          <View className="w-full bg-neutral-50 dark:bg-surface-800 rounded-2xl px-4 py-3 mb-5 gap-3">
            {FEATURES.map(({ key, icon }) => (
              <View key={key} className="flex-row items-center gap-3">
                <View className="w-7 h-7 rounded-full bg-primary-500/10 dark:bg-primary-400/15 items-center justify-center">
                  <Ionicons name={icon as any} size={14} color={colors.primary[500]} />
                </View>
                <Text className="text-[14px] text-neutral-700 dark:text-neutral-300 flex-1">
                  {t(key)}
                </Text>
              </View>
            ))}
          </View>

          {/* Trip unlock card — only shown when tripId is provided */}
          {tripId && (
            <>
              <TouchableOpacity
                onPress={() => setSelectedPlan('trip_unlock')}
                activeOpacity={0.8}
                className={`w-full rounded-2xl p-4 mb-4 border-2 ${
                  selectedPlan === 'trip_unlock'
                    ? 'bg-warning-50 dark:bg-warning-900/30 border-warning-400 dark:border-warning-500'
                    : 'bg-neutral-50 dark:bg-surface-800 border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                      selectedPlan === 'trip_unlock'
                        ? 'bg-warning-400/20'
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  >
                    <Ionicons name="flash" size={18} color={unlockIconColor} />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-[14px] font-semibold ${
                        selectedPlan === 'trip_unlock'
                          ? 'text-warning-700 dark:text-warning-400'
                          : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {t('premium_paywall_trip_unlock_label')}
                    </Text>
                    <Text
                      className={`text-[12px] mt-0.5 ${
                        selectedPlan === 'trip_unlock'
                          ? 'text-warning-600 dark:text-warning-500'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {t('premium_paywall_trip_unlock_sublabel')}
                    </Text>
                  </View>
                  <View className="items-end gap-1.5">
                    <Text
                      className={`text-[20px] font-bold ${
                        selectedPlan === 'trip_unlock'
                          ? 'text-warning-700 dark:text-warning-400'
                          : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {PLANS.trip_unlock.priceDisplay}
                    </Text>
                    {selectedPlan === 'trip_unlock' && (
                      <View className="w-5 h-5 rounded-full bg-warning-400 items-center justify-center">
                        <Ionicons name="checkmark" size={12} color="white" />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Divider */}
              <View className="w-full flex-row items-center gap-2 mb-4">
                <View className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
                <Text className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  {t('premium_paywall_or_subscribe')}
                </Text>
                <View className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
              </View>
            </>
          )}

          {/* Subscription plan cards */}
          <View className="flex-row gap-3 w-full mb-6">
            <PlanCard
              selected={selectedPlan === 'pro_monthly'}
              onPress={() => setSelectedPlan('pro_monthly')}
              label={t('premium_plan_monthly_label')}
              price={PLANS.pro_monthly.priceDisplay}
              sublabel={t('premium_plan_monthly_sublabel')}
            />
            <PlanCard
              selected={selectedPlan === 'pro_annual'}
              onPress={() => setSelectedPlan('pro_annual')}
              label={t('premium_plan_annual_label')}
              price={PLANS.pro_annual.priceDisplay}
              sublabel={t('premium_plan_annual_sublabel')}
              badge="-30%"
            />
          </View>

          {/* CTA */}
          <Button
            onPress={handleUpgrade}
            variant="primary"
            size="lg"
            isLoading={isPurchasing}
            className="w-full mb-4"
          >
            {ctaLabel}
          </Button>

          {/* Footer */}
          <TouchableOpacity onPress={onRestore} className="py-1.5 mb-0.5" activeOpacity={0.6}>
            <Text className="text-[13px] text-neutral-400 dark:text-neutral-500 text-center">
              {t('premium_paywall_restore')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="py-1.5" activeOpacity={0.6}>
            <Text className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400 text-center">
              {t('premium_paywall_dismiss')}
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </BottomSheet>
  )
}
