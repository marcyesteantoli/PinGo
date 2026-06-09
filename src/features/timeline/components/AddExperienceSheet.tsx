import { useEffect, useMemo, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
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
import type { TripDestination } from '@types/index'

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
  destinations?: TripDestination[]
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
  destinations = [],
}: AddExperienceSheetProps) {
  const showError = useErrorToast()
  const { t } = useTranslation()
  const schema = useMemo(() => buildCreateExperienceSchema(), [t])
  const createDefaults = () => initialValues ?? { type: 'activity' as const, date: minDate ? dateToString(minDate) : undefined }
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateExperienceFormData>({
    resolver: zodResolver(schema),
    defaultValues: createDefaults(),
  })

  const titleManuallyTypedRef = useRef(false)
  const watchedDate = watch('date')
  const watchedDestId = watch('destination_id')
  const watchedLocation = watch('location')

  useEffect(() => {
    if (visible) {
      titleManuallyTypedRef.current = !!(initialValues?.title)
      reset(createDefaults())
    }
  }, [visible])

  useEffect(() => {
    if (!watchedLocation) return
    if (titleManuallyTypedRef.current) return
    setValue('title', watchedLocation.name, { shouldValidate: false })
  }, [watchedLocation])

  useEffect(() => {
    if (!watchedDate || !destinations.length) return
    const matching = destinations.filter(d => d.start_date <= watchedDate && watchedDate <= d.end_date)
    if (matching.length === 1) {
      setValue('destination_id', matching[0].id)
    } else if (matching.length === 0) {
      setValue('destination_id', null)
    }
  }, [watchedDate])

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
              name="location"
              render={({ field: { onChange, value } }) => (
                <LocationPicker
                  value={value}
                  onChange={onChange}
                  error={errors.location?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('timeline_field_title')}
                  placeholder={t('timeline_field_title_placeholder')}
                  value={value}
                  onChangeText={(text) => {
                    titleManuallyTypedRef.current = true
                    onChange(text)
                  }}
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

            {destinations.length > 0 && (
              <View className="gap-2">
                <Text className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
                  {t('timeline_field_destination')}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setValue('destination_id', null)}
                      activeOpacity={0.7}
                      className={`px-3.5 py-1.5 rounded-full border ${
                        !watchedDestId
                          ? 'bg-primary-500 border-primary-500'
                          : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600'
                      }`}
                    >
                      <Text className={`text-[13px] font-medium ${
                        !watchedDestId ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
                      }`}>
                        {t('timeline_destination_none')}
                      </Text>
                    </TouchableOpacity>
                    {destinations.map(d => (
                      <TouchableOpacity
                        key={d.id}
                        onPress={() => setValue('destination_id', d.id)}
                        activeOpacity={0.7}
                        className={`px-3.5 py-1.5 rounded-full border ${
                          watchedDestId === d.id
                            ? 'bg-primary-500 border-primary-500'
                            : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600'
                        }`}
                      >
                        <Text className={`text-[13px] font-medium ${
                          watchedDestId === d.id ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
                        }`}>
                          {d.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

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
