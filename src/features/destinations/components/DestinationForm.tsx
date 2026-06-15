import { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@components/ui/Input'
import { DatePickerInput } from '@components/ui/DatePickerInput'
import { Button } from '@components/ui/Button'
import type { TripDestination } from '@app-types/index'
import type { DestinationFormData } from '../hooks/useUpsertDestination'

interface DestinationFormProps {
  initial?: TripDestination
  tripStartDate: string
  tripEndDate: string
  onSave: (data: DestinationFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  error?: string | null
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function DestinationForm({
  initial,
  tripStartDate,
  tripEndDate,
  onSave,
  onCancel,
  isLoading,
  error,
}: DestinationFormProps) {
  const { t } = useTranslation()
  const defaultStart = initial?.start_date ?? tripStartDate

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<DestinationFormData>({
    defaultValues: {
      id: initial?.id,
      name: initial?.name ?? '',
      country: initial?.country ?? '',
      start_date: defaultStart,
      end_date: initial?.end_date ?? defaultStart,
    },
  })

  const startDate = watch('start_date')

  const handleFormSubmit = async (data: DestinationFormData) => {
    await onSave({
      ...data,
      country: data.country || null,
    })
  }

  return (
    <View className="gap-4 pb-4">
      <Controller
        control={control}
        name="name"
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('destinations_city')}
            value={value}
            onChangeText={onChange}
            placeholder="ej. Tokyo"
            error={errors.name ? t('validation_required_name') : undefined}
            autoCapitalize="words"
          />
        )}
      />

      <Controller
        control={control}
        name="country"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('destinations_country')}
            value={value ?? ''}
            onChangeText={onChange}
            placeholder="ej. Japón"
            autoCapitalize="words"
          />
        )}
      />

      <Controller
        control={control}
        name="start_date"
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <DatePickerInput
            label={t('destinations_startDate')}
            value={value}
            onChange={(v) => {
              onChange(v)
              const endDate = watch('end_date')
              if (endDate < v) setValue('end_date', v)
            }}
            minimumDate={parseDate(tripStartDate)}
            maximumDate={parseDate(tripEndDate)}
          />
        )}
      />

      <Controller
        control={control}
        name="end_date"
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <DatePickerInput
            label={t('destinations_endDate')}
            value={value}
            onChange={onChange}
            minimumDate={parseDate(startDate || tripStartDate)}
            maximumDate={parseDate(tripEndDate)}
          />
        )}
      />

      {error ? (
        <Text className="text-[13px] text-error text-center">{error}</Text>
      ) : null}

      <View className="flex-row gap-3 mt-2">
        <TouchableOpacity
          onPress={onCancel}
          className="flex-1 py-3 rounded-2xl border border-neutral-200 dark:border-surface-600 items-center"
          activeOpacity={0.7}
        >
          <Text className="text-[15px] font-medium text-neutral-600 dark:text-neutral-400">
            {t('common_cancel')}
          </Text>
        </TouchableOpacity>
        <Button
          onPress={handleSubmit(handleFormSubmit)}
          isLoading={isLoading}
          size="md"
          className="flex-1"
        >
          {t('common_saveNew')}
        </Button>
      </View>
    </View>
  )
}
