import { Ionicons } from '@expo/vector-icons'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { EXPERIENCE_TYPE_LABELS } from '../types'
import type { Experience } from '@types/index'

type ExperienceType = Experience['type']

const TYPE_ICONS: Record<ExperienceType, React.ComponentProps<typeof Ionicons>['name']> = {
  transport: 'airplane-outline',
  accommodation: 'bed-outline',
  activity: 'compass-outline',
  restaurant: 'restaurant-outline',
  other: 'ellipse-outline',
}

interface ExperienceTypePickerProps {
  value?: ExperienceType
  onChange: (type: ExperienceType) => void
  error?: string
}

const TYPES: ExperienceType[] = ['transport', 'accommodation', 'activity', 'restaurant', 'other']

export function ExperienceTypePicker({ value, onChange, error }: ExperienceTypePickerProps) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-neutral-700">Tipo</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
        <View className="flex-row gap-2 px-1 py-1">
          {TYPES.map((type) => {
            const isSelected = value === type
            return (
              <TouchableOpacity
                key={type}
                onPress={() => onChange(type)}
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                  isSelected
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-white border-neutral-200'
                }`}
              >
                <Ionicons
                  name={TYPE_ICONS[type]}
                  size={16}
                  color={isSelected ? '#ffffff' : '#8d99ae'}
                />
                <Text
                  className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-neutral-600'}`}
                >
                  {EXPERIENCE_TYPE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
      {error && <Text className="text-xs text-error">{error}</Text>}
    </View>
  )
}
