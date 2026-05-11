import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@components/ui/Button'
import { DatePickerInput } from '@components/ui/DatePickerInput'
import { Input } from '@components/ui/Input'
import { useCreateTrip } from '@features/trips/hooks/useCreateTrip'
import { createTripSchema, type CreateTripFormData } from '@features/trips/types'

export default function NewTripScreen() {
  const router = useRouter()
  const createTrip = useCreateTrip()

  const { control, handleSubmit, formState: { errors } } = useForm<CreateTripFormData>({
    resolver: zodResolver(createTripSchema),
  })

  const onSubmit = async (data: CreateTripFormData) => {
    try {
      const trip = await createTrip.mutateAsync(data)
      router.replace(`/(app)/trips/${trip.id}/timeline`)
    } catch {
      // Error se muestra via createTrip.error
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-900" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-surface-700">
          <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Nuevo viaje</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-base text-neutral-500 dark:text-neutral-400">Cancelar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerClassName="px-5 py-6 gap-5"
          keyboardShouldPersistTaps="handled"
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

          <Controller
            control={control}
            name="start_date"
            render={({ field: { onChange, value } }) => (
              <DatePickerInput
                label="Fecha de inicio"
                value={value}
                onChange={onChange}
                error={errors.start_date?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="end_date"
            render={({ field: { onChange, value } }) => (
              <DatePickerInput
                label="Fecha de fin"
                value={value}
                onChange={onChange}
                error={errors.end_date?.message}
              />
            )}
          />

          {createTrip.error && (
            <Text className="text-sm text-error text-center">{createTrip.error.message}</Text>
          )}

          <Button
            onPress={handleSubmit(onSubmit)}
            isLoading={createTrip.isPending}
            size="lg"
            className="mt-2"
          >
            Crear viaje
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
