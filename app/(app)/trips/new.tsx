import { zodResolver } from '@hookform/resolvers/zod'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Button } from '@components/ui/Button'
import { DateRangePicker } from '@components/ui/DateRangePicker'
import { Input } from '@components/ui/Input'
import { ActiveTripLimitReachedError, useCreateTrip } from '@features/trips/hooks/useCreateTrip'
import { buildCreateTripSchema, type CreateTripFormData } from '@features/trips/types'
import { SUPPORTED_CURRENCIES } from '@utils/currencies'
import { colors } from '@lib/colors'
import { cardShadow, ctaShadow } from '@lib/shadows'
import { useErrorToast } from '@lib/errorToast'
import { ProPaywallSheet } from '@features/premium/components/ProPaywallSheet'

export default function NewTripScreen() {
  const router = useRouter()
  const createTrip = useCreateTrip()
  const showError = useErrorToast()
  const { t } = useTranslation()
  const [paywallVisible, setPaywallVisible] = useState(false)

  const schema = useMemo(() => buildCreateTripSchema(), [t])

  useEffect(() => {
    if (!createTrip.error) return
    if (createTrip.error instanceof ActiveTripLimitReachedError) {
      setPaywallVisible(true)
      return
    }
    showError(createTrip.error.message)
  }, [createTrip.error])

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<CreateTripFormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'EUR' },
  })

  const startDate = watch('start_date')
  const endDate = watch('end_date')

  const onSubmit = async (data: CreateTripFormData) => {
    try {
      const trip = await createTrip.mutateAsync(data)
      router.replace(`/(app)/trips/${trip.id}/timeline`)
    } catch {
      // Error se muestra via createTrip.error
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-surface-900" edges={['top', 'bottom']}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={16}
      >
        {/* Hero */}
        <LinearGradient
          colors={[colors.primary[400], colors.primary[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: 16, paddingBottom: 36, alignItems: 'center', gap: 8 }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={12}
            style={{ position: 'absolute', top: 16, right: 20 }}
          >
            <Text style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>
              {t('newTrip_cancel')}
            </Text>
          </TouchableOpacity>

          <Ionicons name="map-outline" size={40} color={colors.white} />
          <View style={{ alignItems: 'center', gap: 3, marginTop: 2 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.white, letterSpacing: -0.5 }}>
              {t('newTrip_title')}
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)' }}>
              {t('newTrip_subtitle')}
            </Text>
          </View>
        </LinearGradient>

        {/* Form card */}
        <View
          className="mx-4 bg-white dark:bg-surface-800 rounded-2xl p-5 gap-5"
          style={[{ marginTop: -16 }, cardShadow]}
        >
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('newTrip_name_label')}
                placeholder={t('newTrip_name_placeholder')}
                value={value}
                onChangeText={onChange}
                autoCapitalize="sentences"
                error={errors.title?.message}
              />
            )}
          />

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(d) => setValue('start_date', d, { shouldValidate: true })}
            onEndDateChange={(d) => setValue('end_date', d, { shouldValidate: true })}
            startError={errors.start_date?.message}
            endError={errors.end_date?.message}
          />

          {/* Currency picker */}
          <Controller
            control={control}
            name="currency"
            render={({ field: { onChange, value } }) => (
              <View className="gap-2">
                <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('newTrip_currency_label')}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {SUPPORTED_CURRENCIES.map((c) => {
                    const isSelected = value === c.code
                    return (
                      <TouchableOpacity
                        key={c.code}
                        onPress={() => onChange(c.code)}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                          borderRadius: 20,
                          borderWidth: 1.5,
                          borderColor: isSelected ? colors.primary[500] : colors.neutral[200],
                          backgroundColor: isSelected ? '#e8f0fe' : 'transparent',
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: isSelected ? colors.primary[500] : colors.neutral[500] }}>
                          {c.symbol}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: isSelected ? '600' : '400', color: isSelected ? colors.primary[600] : colors.neutral[700] }}>
                          {c.code}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>
              </View>
            )}
          />
        </View>

        {/* CTA */}
        <View className="mx-4 mt-4">
          <View style={ctaShadow}>
            <Button
              onPress={handleSubmit(onSubmit)}
              isLoading={createTrip.isPending}
              size="lg"
            >
              {t('newTrip_submit')}
            </Button>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <ProPaywallSheet
        visible={paywallVisible}
        onClose={() => { setPaywallVisible(false); createTrip.reset() }}
        feature="trips"
        isLimitReached
      />
    </SafeAreaView>
  )
}
