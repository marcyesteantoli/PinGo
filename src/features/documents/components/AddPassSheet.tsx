import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { i18n } from '@/i18n'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { useExperiences } from '@features/timeline/hooks/useExperiences'
import { useTripContext } from '@features/trips/TripProvider'
import { ExperiencePicker } from './ExperiencePicker'

type AddPassFormData = {
  name: string
  experience_id: string
}

function buildAddPassSchema() {
  return z.object({
    name: z.string().min(1, i18n.t('validation_required_docName')),
    experience_id: z.string().uuid(i18n.t('validation_required_experience')),
  })
}

interface AddPassSheetProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: AddPassFormData) => Promise<void>
  isLoading?: boolean
}

export function AddPassSheet({ visible, onClose, onSubmit, isLoading }: AddPassSheetProps) {
  const { tripId } = useTripContext()
  const { data: experiences } = useExperiences(tripId)
  const { t } = useTranslation()
  const schema = useMemo(() => buildAddPassSchema(), [t])

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AddPassFormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', experience_id: '' },
  })

  const nameValue = watch('name')

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmitForm = async (data: AddPassFormData) => {
    await onSubmit(data)
    reset()
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose} title={t('docs_addPass_title')} scrollable>
      <View className="gap-4 pb-4">
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              label={t('docs_uploadSheet_nameLabel')}
              placeholder={t('docs_addPass_namePlaceholder')}
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
          {t('docs_addPass_submit')}
        </Button>
      </View>
    </BottomSheet>
  )
}
