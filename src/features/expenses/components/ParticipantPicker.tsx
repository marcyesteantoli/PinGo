import { Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@components/ui/Avatar'
import type { Collaborator } from '@types/index'
import { colors } from '@lib/colors'

interface ParticipantPickerProps {
  collaborators: Collaborator[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  error?: string
}

export function ParticipantPicker({ collaborators, selectedIds, onChange, error }: ParticipantPickerProps) {
  const { t } = useTranslation()
  const allSelected = collaborators.length > 0 && selectedIds.length === collaborators.length

  const toggle = (userId: string) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId))
    } else {
      onChange([...selectedIds, userId])
    }
  }

  const toggleAll = () => {
    if (allSelected) {
      onChange([])
    } else {
      onChange(collaborators.map((c) => c.user_id))
    }
  }

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-neutral-700">
          {t('expenses_participants_label')}{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
        </Text>
        <TouchableOpacity onPress={toggleAll} hitSlop={8} className="flex-row items-center gap-1 px-3 py-2 rounded-lg active:bg-neutral-100">
          <Ionicons
            name={allSelected ? 'checkbox' : 'checkbox-outline'}
            size={16}
            color={allSelected ? colors.primary[500] : colors.neutral[400]}
          />
          <Text className={`text-sm font-medium ${allSelected ? 'text-primary-600' : 'text-neutral-500'}`}>
            {allSelected ? t('expenses_participants_deselectAll') : t('expenses_participants_selectAll')}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="gap-2">
        {collaborators.map((c) => {
          const isSelected = selectedIds.includes(c.user_id)
          return (
            <TouchableOpacity
              key={c.user_id}
              onPress={() => toggle(c.user_id)}
              activeOpacity={0.7}
              className={`flex-row items-center gap-3 p-3 rounded-xl border ${
                isSelected ? 'border-primary-300 bg-primary-50' : 'border-neutral-200 bg-white'
              }`}
            >
              <Avatar uri={c.avatar_url} name={c.name} size="sm" />
              <Text className={`flex-1 text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-neutral-700'}`}>
                {c.name}
              </Text>
              <View
                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                  isSelected ? 'border-primary-500 bg-primary-500' : 'border-neutral-300 bg-white'
                }`}
              >
                {isSelected && <Ionicons name="checkmark" size={12} color={colors.white} />}
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      {error && <Text className="text-xs text-error">{error}</Text>}
    </View>
  )
}
