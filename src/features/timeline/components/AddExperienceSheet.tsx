import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { DatePickerInput } from '@components/ui/DatePickerInput'
import { Input } from '@components/ui/Input'
import { ExperienceTypePicker } from './ExperienceTypePicker'
import { LocationPicker } from './LocationPicker'
import { TimeRangePicker } from './TimeRangePicker'
import { buildCreateExperienceSchema, type CreateExperienceFormData } from '../types'
import { useErrorToast } from '@lib/errorToast'

interface AddExperienceSheetProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: CreateExperienceFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
  minDate?: Date
  maxDate?: Date
  initialValues?: CreateExperienceFormData
  mode?: 'create' | 'edit'
}

function dateToString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function AddExperienceSheet({
  visible,
  onClose,
  onSubmit,
  isLoading,
  error,
  minDate,
  maxDate,
  initialValues,
  mode = 'create',
}: AddExperienceSheetProps) {
  const showError = useErrorToast()
  const { t } = useTranslation()
  const schema = useMemo(() => buildCreateExperienceSchema(), [t])
  const createDefaults = () => initialValues ?? { type: 'activity' as const, date: minDate ? dateToString(minDate) : undefined }
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateExperienceFormData>({
    resolver: zodResolver(schema),
    defaultValues: createDefaults(),
  })

  useEffect(() => {
    if (visible) {
      reset(createDefaults())
    }
  }, [visible])

  useEffect(() => {
    if (error) showError(error)
  }, [error])

  const handleClose = () => {
    reset(createDefaults())
    onClose()
  }

  const handleSubmitForm = async (data: CreateExperienceFormData) => {
    await onSubmit(data)
    if (mode === 'create') reset()
  }

  const title = mode === 'edit' ? t('timeline_addSheet_edit') : t('timeline_addSheet_create')
  const submitLabel = mode === 'edit' ? t('timeline_addSheet_submitEdit') : t('timeline_addSheet_submitCreate')

  return (
    <BottomSheet visible={visible} onClose={handleClose} title={title}>
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bottomOffset={16}>
          <View className="gap-4 pb-4">
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('timeline_field_title')}
                  placeholder={t('timeline_field_title_placeholder')}
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
                  label={t('timeline_field_date')}
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
                  label={t('timeline_field_confirmCode')}
                  placeholder={t('timeline_field_confirmCode_placeholder')}
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


            <Button
              onPress={handleSubmit(handleSubmitForm)}
              isLoading={isLoading}
              size="lg"
            >
              {submitLabel}
            </Button>
          </View>
      </KeyboardAwareScrollView>
    </BottomSheet>
  )
}
