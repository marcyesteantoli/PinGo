import { Controller, useForm } from 'react-hook-form'
import { Text, View } from 'react-native'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'

interface AddMemoryCaptionProps {
  visible: boolean
  onClose: () => void
  onSubmit: (caption?: string) => void
  isLoading?: boolean
  error?: string | null
}

export function AddMemoryCaption({ visible, onClose, onSubmit, isLoading, error }: AddMemoryCaptionProps) {
  const { control, handleSubmit, reset } = useForm<{ caption: string }>({
    defaultValues: { caption: '' },
  })

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

        {error && (
          <Text className="text-sm text-error text-center">{error}</Text>
        )}

        <Button
          onPress={handleSubmit(handleSubmitForm)}
          isLoading={isLoading}
          size="lg"
        >
          Seleccionar foto
        </Button>
      </View>
    </BottomSheet>
  )
}
