import { Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { colors } from '@lib/colors'

interface DetailActionBarProps {
  onEdit: () => void
  onDelete: () => void
  editLabel?: string
  deleteLabel?: string
  isDeleting?: boolean
  editDisabled?: boolean
}

export function DetailActionBar({ onEdit, onDelete, editLabel, deleteLabel, isDeleting, editDisabled }: DetailActionBarProps) {
  const { t } = useTranslation()

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onEdit()
  }

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onDelete()
  }

  return (
    <View
      className="px-5 pt-3 pb-4 flex-row gap-3 bg-neutral-100 dark:bg-surface-900 border-neutral-100 dark:border-surface-700"
      style={{ borderTopWidth: 0.5 }}
    >
      <TouchableOpacity
        onPress={handleDelete}
        disabled={isDeleting}
        className="flex-1 h-12 rounded-xl border items-center justify-center flex-row gap-2"
        style={{ borderColor: colors.error, opacity: isDeleting ? 0.6 : 1 }}
      >
        <Ionicons name="trash-outline" size={18} color={colors.error} />
        <Text style={{ color: colors.error }} className="text-sm font-semibold">{deleteLabel ?? t('common_delete')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleEdit}
        disabled={editDisabled}
        className="flex-1 h-12 rounded-xl bg-primary-500 items-center justify-center flex-row gap-2"
        style={{ opacity: editDisabled ? 0.6 : 1 }}
      >
        <Ionicons name="pencil-outline" size={18} color={colors.white} />
        <Text className="text-sm font-semibold text-white">{editLabel ?? t('common_edit')}</Text>
      </TouchableOpacity>
    </View>
  )
}
