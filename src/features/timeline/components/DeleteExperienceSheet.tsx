import { Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@components/ui/BottomSheet'
import { colors } from '@lib/colors'

interface DeleteExperienceSheetProps {
  visible: boolean
  documentCount: number
  onClose: () => void
  onConfirm: () => void
}

export function DeleteExperienceSheet({ visible, documentCount, onClose, onConfirm }: DeleteExperienceSheetProps) {
  const { t } = useTranslation()
  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('timeline_deleteSheet_title')}>
      <View className="gap-4 mb-2">
        <View className="flex-row items-start gap-3 bg-error/10 rounded-2xl p-4">
          <Ionicons name="warning-outline" size={20} color={colors.error} />
          <Text className="text-sm text-neutral-700 flex-1">
            {t(documentCount === 1 ? 'timeline_deleteSheet_body_one' : 'timeline_deleteSheet_body_other', { count: documentCount })}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onConfirm}
          className="bg-error rounded-2xl py-3.5 items-center"
        >
          <Text className="text-white font-semibold">{t('timeline_deleteSheet_confirm')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} className="py-2 items-center">
          <Text className="text-neutral-500 font-medium">{t('common_cancel')}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
