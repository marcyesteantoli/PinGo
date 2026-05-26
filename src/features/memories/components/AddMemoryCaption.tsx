import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Image, View } from 'react-native'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { useErrorToast } from '@lib/errorToast'

interface AddMemoryCaptionProps {
  visible: boolean
  onClose: () => void
  onSubmit: (caption?: string) => void
  isLoading?: boolean
  error?: string | null
  imageUri?: string
}

export function AddMemoryCaption({
  visible,
  onClose,
  onSubmit,
  isLoading,
  error,
  imageUri,
}: AddMemoryCaptionProps) {
  const showError = useErrorToast()
  const { control, handleSubmit, reset } = useForm<{ caption: string }>({
    defaultValues: { caption: '' },
  })

  useEffect(() => {
    if (error) showError(error)
  }, [error])

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmitForm = ({ caption }: { caption: string }) => {
    onSubmit(caption.trim() || undefined)
    reset()
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose} title="Añadir recuerdo">
      <View className="gap-4 pb-4">
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: 200, borderRadius: 12 }}
            resizeMode="cover"
          />
        )}

        <Controller
          control={control}
          name="caption"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Descripción (opcional)"
              placeholder="¿Qué estás recordando?"
              value={value}
              onChangeText={onChange}
              maxLength={200}
              multiline
              numberOfLines={3}
              className="min-h-[72px]"
            />
          )}
        />


        <Button onPress={handleSubmit(handleSubmitForm)} isLoading={isLoading} size="lg">
          {imageUri ? 'Añadir recuerdo' : 'Seleccionar foto'}
        </Button>
      </View>
    </BottomSheet>
  )
}
