import { Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@components/ui/BottomSheet'
import { colors } from '@lib/colors'

interface ConfirmDeleteSheetProps {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export function ConfirmDeleteSheet({ visible, title, message, confirmLabel, onClose, onConfirm, isLoading }: ConfirmDeleteSheetProps) {
  const { t } = useTranslation()

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    onConfirm()
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View className="gap-4 mb-2">
        <View className="flex-row items-start gap-3 bg-error/10 rounded-2xl p-4">
          <Ionicons name="warning-outline" size={20} color={colors.error} />
          <Text className="text-sm text-neutral-700 dark:text-neutral-300 flex-1">
            {message}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={isLoading}
          className="bg-error rounded-2xl py-3.5 items-center"
          style={{ opacity: isLoading ? 0.6 : 1 }}
        >
          <Text className="text-white font-semibold">{confirmLabel ?? t('common_delete')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} className="py-2 items-center">
          <Text className="text-neutral-500 font-medium">{t('common_cancel')}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
