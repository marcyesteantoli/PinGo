import { zodResolver } from '@hookform/resolvers/zod'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@components/ui/Button'
import { DateRangePicker } from '@components/ui/DateRangePicker'
import { Input } from '@components/ui/Input'
import { useCreateTrip } from '@features/trips/hooks/useCreateTrip'
import { createTripSchema, type CreateTripFormData } from '@features/trips/types'
import { colors } from '@lib/colors'
import { cardShadow, ctaShadow } from '@lib/shadows'
import { useErrorToast } from '@lib/errorToast'

export default function NewTripScreen() {
  const router = useRouter()
  const createTrip = useCreateTrip()
  const showError = useErrorToast()

  useEffect(() => {
    if (createTrip.error) showError(createTrip.error.message)
  }, [createTrip.error])

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<CreateTripFormData>({
    resolver: zodResolver(createTripSchema),
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
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <LinearGradient
            colors={[colors.primary[500], colors.secondary[500]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: 20, paddingBottom: 48, alignItems: 'center', gap: 10 }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={12}
              style={{ position: 'absolute', top: 20, right: 20 }}
            >
              <Text style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <Ionicons name="map-outline" size={52} color={colors.white} />
            <View style={{ alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.white, letterSpacing: -0.5 }}>
                Nuevo viaje
              </Text>
              <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)' }}>
                ¿A dónde vamos?
              </Text>
            </View>
          </LinearGradient>

          {/* Form card */}
          <View
            className="mx-4 bg-white dark:bg-surface-800 rounded-2xl p-5 gap-5"
            style={[{ marginTop: -20 }, cardShadow]}
          >
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nombre del viaje"
                  placeholder="ej. Viaje a Roma 2025"
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

          </View>
        </ScrollView>

        {/* CTA */}
        <View className="px-5 pb-2 pt-3">
          <View style={ctaShadow}>
            <Button
              onPress={handleSubmit(onSubmit)}
              isLoading={createTrip.isPending}
              size="lg"
            >
              Crear viaje
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
