import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import type { Experience } from '@types/index'

interface ExperiencePickerProps {
  experiences: Experience[]
  value?: string
  onChange: (id: string) => void
  error?: string
}

export function ExperiencePicker({ experiences, value, onChange, error }: ExperiencePickerProps) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-neutral-700">Experiencia relacionada</Text>
      {experiences.length === 0 ? (
        <Text className="text-xs text-neutral-400 italic">No hay experiencias en este viaje</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
          <View className="flex-row gap-2 px-1 py-1">
            {experiences.map((exp) => {
              const isSelected = value === exp.id
              return (
                <TouchableOpacity
                  key={exp.id}
                  onPress={() => onChange(exp.id)}
                  className={`px-3 py-2 rounded-xl border ${
                    isSelected ? 'bg-primary-500 border-primary-500' : 'bg-white border-neutral-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-neutral-600'}`}
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
