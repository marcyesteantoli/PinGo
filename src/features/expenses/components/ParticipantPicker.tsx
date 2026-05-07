import { Text, TouchableOpacity, View } from 'react-native'
import { Avatar } from '@components/ui/Avatar'
import type { Collaborator } from '@types/index'

interface ParticipantPickerProps {
  collaborators: Collaborator[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  error?: string
}

export function ParticipantPicker({ collaborators, selectedIds, onChange, error }: ParticipantPickerProps) {
  const toggle = (userId: string) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId))
    } else {
      onChange([...selectedIds, userId])
    }
  }

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-neutral-700">Participantes</Text>
      <View className="gap-2">
        {collaborators.map((c) => {
          const isSelected = selectedIds.includes(c.user_id)
          return (
            <TouchableOpacity
              key={c.user_id}
              onPress={() => toggle(c.user_id)}
              className={`flex-row items-center gap-3 p-3 rounded-xl border ${
                isSelected ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 bg-white'
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
                {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
      {error && <Text className="text-xs text-error">{error}</Text>}
    </View>
  )
}
