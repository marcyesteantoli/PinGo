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
import { buildAddLinkSchema, type AddLinkFormData } from '../types'
import { ExperiencePicker } from './ExperiencePicker'
import { useErrorToast } from '@lib/errorToast'

interface AddLinkSheetProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: AddLinkFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function AddLinkSheet({ visible, onClose, onSubmit, isLoading, error }: AddLinkSheetProps) {
  const showError = useErrorToast()
  const { tripId } = useTripContext()
  const { data: experiences } = useExperiences(tripId)
  const { t } = useTranslation()
  const schema = useMemo(() => buildAddLinkSchema(), [t])

  useEffect(() => {
    if (error) showError(error)
  }, [error])

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AddLinkFormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', url: '', experience_id: '' },
  })

  const urlValue = watch('url')
  const nameValue = watch('name')

  // Auto-suggest name from URL hostname when name is empty
  useEffect(() => {
    if (urlValue && !nameValue) {
      const hostname = extractHostname(urlValue)
      if (hostname) setValue('name', hostname, { shouldValidate: false })
    }
  }, [urlValue])

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmitForm = async (data: AddLinkFormData) => {
    await onSubmit(data)
    reset()
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose} title={t('docs_addLink_title')} scrollable>
      <View className="gap-4 pb-4">
        <Controller
          control={control}
          name="url"
          render={({ field: { onChange, value } }) => (
            <Input
              label={t('docs_link_url')}
              placeholder={t('docs_link_url_placeholder')}
              value={value}
              onChangeText={onChange}
              error={errors.url?.message}
              autoCapitalize="none"
              keyboardType="url"
              autoCorrect={false}
            />
          )}
        />

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
          {t('docs_addLink_submit')}
        </Button>
      </View>
    </BottomSheet>
  )
}
