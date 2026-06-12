import { Ionicons } from '@expo/vector-icons'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { Experience } from '@app-types/index'
import { colors } from '@lib/colors'

type ExperienceType = Experience['type']

const TYPE_ICONS: Record<ExperienceType, React.ComponentProps<typeof Ionicons>['name']> = {
  transport:     'airplane-outline',
  accommodation: 'bed-outline',
  activity:      'compass-outline',
  restaurant:    'restaurant-outline',
  entertainment: 'film-outline',
  other:         'ellipse-outline',
}

interface ExperienceTypePickerProps {
  value?: ExperienceType
  onChange: (type: ExperienceType) => void
  error?: string
}

const TYPES: ExperienceType[] = ['transport', 'accommodation', 'activity', 'restaurant', 'entertainment', 'other']

const TYPE_SELECTED_CLASSES: Record<ExperienceType, string> = {
  transport:     'bg-activity-blue-main border-activity-blue-main',
  accommodation: 'bg-activity-purple-main border-activity-purple-main',
  activity:      'bg-activity-green-main border-activity-green-main',
  restaurant:    'bg-activity-orange-main border-activity-orange-main',
  entertainment: 'bg-activity-pink-main border-activity-pink-main',
  other:         'bg-activity-gray-main border-activity-gray-main',
}

export function ExperienceTypePicker({ value, onChange, error }: ExperienceTypePickerProps) {
  const { t } = useTranslation()
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('timeline_typePicker_label')}</Text>
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
                  {t(`expType_${type}`)}
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
