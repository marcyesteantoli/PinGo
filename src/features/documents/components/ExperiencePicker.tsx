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
  city:          'business-outline',
  other:         'ellipse-outline',
}

const TYPE_COLORS: Record<ExperienceType, string> = {
  transport:     '#3B82F6',
  accommodation: '#8B5CF6',
  activity:      '#22C55E',
  restaurant:    '#F97316',
  entertainment: '#EC4899',
  city:          '#14B8A6',
  other:         '#94A3B8',
}

interface ExperiencePickerProps {
  experiences: Experience[]
  value?: string
  onChange: (id: string) => void
  error?: string
}

export function ExperiencePicker({ experiences, value, onChange, error }: ExperiencePickerProps) {
  const { t } = useTranslation()
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('docs_experiencePicker_label')}</Text>
      {experiences.length === 0 ? (
        <Text className="text-xs text-neutral-400 italic">{t('docs_experiencePicker_empty')}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
          <View className="flex-row gap-2 px-1 py-1">
            {experiences.map((exp) => {
              const isSelected = value === exp.id
              return (
                <TouchableOpacity
                  key={exp.id}
                  onPress={() => onChange(exp.id)}
                  className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                    isSelected ? 'bg-primary-500 border-primary-500' : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <Ionicons
                    name={TYPE_ICONS[exp.type]}
                    size={15}
                    color={isSelected ? colors.white : TYPE_COLORS[exp.type]}
                  />
                  <Text
                    className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'}`}
                    numberOfLines={1}
                  >
                    {exp.title}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>
      )}
      {error && <Text className="text-xs text-error">{error}</Text>}
    </View>
  )
}
