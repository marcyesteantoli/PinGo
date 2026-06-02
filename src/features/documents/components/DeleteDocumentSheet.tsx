import { Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@components/ui/BottomSheet'
import { colors } from '@lib/colors'

interface DeleteDocumentSheetProps {
  visible: boolean
  documentName?: string
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export function DeleteDocumentSheet({ visible, documentName, onClose, onConfirm, isLoading }: DeleteDocumentSheetProps) {
  const { t } = useTranslation()
  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('docs_deleteSheet_title')}>
      <View className="gap-4 mb-2">
        <View className="flex-row items-start gap-3 bg-error/10 rounded-2xl p-4">
          <Ionicons name="warning-outline" size={20} color={colors.error} />
          <Text className="text-sm text-neutral-700 dark:text-neutral-300 flex-1">
            {documentName
              ? t('docs_deleteSheet_body', { name: documentName })
              : t('common_actionCannotBeUndone')}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onConfirm}
          disabled={isLoading}
          className="bg-error rounded-2xl py-3.5 items-center"
          style={{ opacity: isLoading ? 0.6 : 1 }}
        >
          <Text className="text-white font-semibold">{t('docs_deleteSheet_confirm')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} className="py-2 items-center">
          <Text className="text-neutral-500 font-medium">{t('common_cancel')}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
