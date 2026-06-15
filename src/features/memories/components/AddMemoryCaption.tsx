import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Image, View } from 'react-native'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
    <BottomSheet visible={visible} onClose={handleClose} title={t('memories_addCaption_title')}>
      <View className="gap-4 pb-4">
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 12 }}
            resizeMode="cover"
          />
        )}

        <Controller
          control={control}
          name="caption"
          render={({ field: { onChange, value } }) => (
            <Input
              label={t('memories_addCaption_label')}
              placeholder={t('memories_addCaption_placeholder')}
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
          {imageUri ? t('memories_addCaption_submitWithImage') : t('memories_addCaption_submitNoImage')}
        </Button>
      </View>
    </BottomSheet>
  )
}
