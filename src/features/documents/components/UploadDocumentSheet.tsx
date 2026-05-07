import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Text, View } from 'react-native'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { useExperiences } from '@features/timeline/hooks/useExperiences'
import { useTripContext } from '@features/trips/TripProvider'
import { uploadDocumentSchema, type UploadDocumentFormData } from '../types'
import { ExperiencePicker } from './ExperiencePicker'

interface UploadDocumentSheetProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: UploadDocumentFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export function UploadDocumentSheet({ visible, onClose, onSubmit, isLoading, error }: UploadDocumentSheetProps) {
  const { tripId } = useTripContext()
  const { data: experiences } = useExperiences(tripId)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<UploadDocumentFormData>({
    resolver: zodResolver(uploadDocumentSchema),
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmitForm = async (data: UploadDocumentFormData) => {
    await onSubmit(data)
    reset()
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose} title="Subir documento">
      <View className="gap-4 pb-4">
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nombre del documento"
              placeholder="ej. Confirmación vuelo"
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
              onChange={onChange}
              error={errors.experience_id?.message}
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
          Seleccionar archivo
        </Button>
      </View>
    </BottomSheet>
  )
}
