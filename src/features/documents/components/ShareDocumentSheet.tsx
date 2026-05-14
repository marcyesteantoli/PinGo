import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Text, View } from 'react-native'
import { z } from 'zod'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { useTrips } from '@features/trips/hooks/useTrips'
import { useExperiences } from '@features/timeline/hooks/useExperiences'
import { ExperiencePicker } from './ExperiencePicker'
import { TripPicker } from './TripPicker'
import { useUploadSharedDocument } from '../hooks/useUploadSharedDocument'

const schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  trip_id: z.string().min(1, 'Selecciona un viaje'),
  experience_id: z.string().uuid('Selecciona una experiencia'),
})

type FormData = z.infer<typeof schema>

interface ShareDocumentSheetProps {
  visible: boolean
  onClose: () => void
  fileUri: string
  mimeType: string
  fileName: string
  initialTripId?: string
}

export function ShareDocumentSheet({
  visible,
  onClose,
  fileUri,
  mimeType,
  fileName,
  initialTripId,
}: ShareDocumentSheetProps) {
  const { data: trips = [] } = useTrips()
  const upload = useUploadSharedDocument()

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: fileName.replace(/\.[^/.]+$/, ''),
      trip_id: initialTripId ?? '',
      experience_id: '',
    },
  })

  const selectedTripId = watch('trip_id')
  const { data: experiences = [] } = useExperiences(selectedTripId)

  useEffect(() => {
    if (visible) {
      reset({
        name: fileName.replace(/\.[^/.]+$/, ''),
        trip_id: initialTripId ?? '',
        experience_id: '',
      })
    }
  }, [visible, fileName, initialTripId])

  useEffect(() => {
    setValue('experience_id', '')
  }, [selectedTripId])

  const handleSubmitForm = async (data: FormData) => {
    await upload.mutateAsync({
      tripId: data.trip_id,
      experienceId: data.experience_id,
      name: data.name,
      fileUri,
      mimeType,
      fileName,
    })
    onClose()
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Guardar documento">
      <View className="gap-4 pb-4">
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nombre del documento"
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="trip_id"
          render={({ field: { onChange, value } }) => (
            <TripPicker
              trips={trips}
              value={value}
              onChange={onChange}
              error={errors.trip_id?.message}
            />
          )}
        />

        {selectedTripId ? (
          <Controller
            control={control}
            name="experience_id"
            render={({ field: { onChange, value } }) => (
              <ExperiencePicker
                experiences={experiences}
                value={value}
                onChange={onChange}
                error={errors.experience_id?.message}
              />
            )}
          />
        ) : null}

        {upload.error && (
          <Text className="text-sm text-error text-center">{upload.error.message}</Text>
        )}

        <Button onPress={handleSubmit(handleSubmitForm)} isLoading={upload.isPending} size="lg">
          Guardar
        </Button>
      </View>
    </BottomSheet>
  )
}
