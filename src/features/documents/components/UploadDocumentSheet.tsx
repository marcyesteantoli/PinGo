import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { useExperiences } from '@features/timeline/hooks/useExperiences'
import { useTripContext } from '@features/trips/TripProvider'
import { buildUploadDocumentSchema, type UploadDocumentFormData } from '../types'
import { ExperiencePicker } from './ExperiencePicker'
import { useErrorToast } from '@lib/errorToast'

interface UploadDocumentSheetProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: UploadDocumentFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export function UploadDocumentSheet({ visible, onClose, onSubmit, isLoading, error }: UploadDocumentSheetProps) {
  const showError = useErrorToast()
  const { tripId } = useTripContext()
  const { data: experiences } = useExperiences(tripId)
  const { t } = useTranslation()
  const schema = useMemo(() => buildUploadDocumentSchema(), [t])

  useEffect(() => {
    if (error) showError(error)
  }, [error])

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UploadDocumentFormData>({
    resolver: zodResolver(schema),
  })

  const nameValue = watch('name')

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmitForm = async (data: UploadDocumentFormData) => {
    await onSubmit(data)
    reset()
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose} title={t('docs_uploadSheet_title')}>
      <View className="gap-4 pb-4">
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              label={t('docs_uploadSheet_nameLabel')}
              placeholder={t('docs_uploadSheet_namePlaceholder')}
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="experience_id"
          render={({ field: { onChange, value } }) => (
            <ExperiencePicker
              experiences={experiences ?? []}
              value={value}
              onChange={(id) => {
                onChange(id)
                if (!nameValue) {
                  const exp = experiences?.find((e) => e.id === id)
                  if (exp) setValue('name', exp.title, { shouldValidate: false })
                }
              }}
              error={errors.experience_id?.message}
            />
          )}
        />

        <Button
          onPress={handleSubmit(handleSubmitForm)}
          isLoading={isLoading}
          size="lg"
        >
          {t('docs_uploadSheet_submit')}
        </Button>
      </View>
    </BottomSheet>
  )
}
