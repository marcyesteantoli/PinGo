import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { DatePickerInput } from '@components/ui/DatePickerInput'
import { Input } from '@components/ui/Input'
import { ExperienceTypePicker } from './ExperienceTypePicker'
import { LocationPicker } from './LocationPicker'
import { TimeRangePicker } from './TimeRangePicker'
import { createExperienceSchema, type CreateExperienceFormData } from '../types'

interface AddExperienceSheetProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: CreateExperienceFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
  minDate?: Date
  maxDate?: Date
}

export function AddExperienceSheet({
  visible,
  onClose,
  onSubmit,
  isLoading,
  error,
  minDate,
  maxDate,
}: AddExperienceSheetProps) {
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateExperienceFormData>({
    resolver: zodResolver(createExperienceSchema),
    defaultValues: { type: 'activity' },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmitForm = async (data: CreateExperienceFormData) => {
    await onSubmit(data)
    reset()
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose} title="Nueva experiencia">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="gap-4 pb-4">
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Título"
                  placeholder="ej. Vuelo Madrid → Roma"
                  value={value}
                  onChangeText={onChange}
                  error={errors.title?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="type"
              render={({ field: { onChange, value } }) => (
                <ExperienceTypePicker
                  value={value}
                  onChange={onChange}
                  error={errors.type?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="date"
              render={({ field: { onChange, value } }) => (
                <DatePickerInput
                  label="Fecha"
                  value={value}
                  onChange={onChange}
                  error={errors.date?.message}
                  minimumDate={minDate}
                  maximumDate={maxDate}
                />
              )}
            />

            <TimeRangePicker
              startTime={watch('start_time')}
              endTime={watch('end_time')}
              onStartTimeChange={(v) => setValue('start_time', v, { shouldValidate: true })}
              onEndTimeChange={(v) => setValue('end_time', v, { shouldValidate: true })}
              startTimeError={errors.start_time?.message}
              endTimeError={errors.end_time?.message}
            />

            <Controller
              control={control}
              name="confirmation_code"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Código de confirmación (opcional)"
                  placeholder="ej. ABC123"
                  value={value ?? ''}
                  onChangeText={onChange}
                  autoCapitalize="characters"
                />
              )}
            />

            <Controller
              control={control}
              name="location"
              render={({ field: { onChange, value } }) => (
                <LocationPicker
                  value={value}
                  onChange={onChange}
                  error={errors.location?.message}
                />
              )}
            />

            {error && (
              <Text className="text-sm text-error text-center">{error}</Text>
            )}

            <Button
              onPress={handleSubmit(handleSubmitForm)}
              isLoading={isLoading}
              size="lg"
            >
              Añadir experiencia
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  )
}
