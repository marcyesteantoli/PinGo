import { Ionicons } from '@expo/vector-icons'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { EXPERIENCE_TYPE_LABELS } from '../types'
import type { Experience } from '@types/index'
import { colors } from '@lib/colors'

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

const TYPE_SELECTED_CLASSES: Record<ExperienceType, string> = {
  transport:     'bg-cyan-500 border-cyan-500',
  accommodation: 'bg-purple-500 border-purple-500',
  activity:      'bg-lime-600 border-lime-600',
  restaurant:    'bg-red-500 border-red-500',
  other:         'bg-stone-500 border-stone-500',
}

export function ExperienceTypePicker({ value, onChange, error }: ExperienceTypePickerProps) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Tipo</Text>
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
                    ? TYPE_SELECTED_CLASSES[type]
                    : 'bg-white dark:bg-surface-700 border-neutral-200 dark:border-surface-600'
                }`}
              >
                <Ionicons
                  name={TYPE_ICONS[type]}
                  size={16}
                  color={isSelected ? colors.white : colors.neutral[400]}
                />
                <Text
                  className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'}`}
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
