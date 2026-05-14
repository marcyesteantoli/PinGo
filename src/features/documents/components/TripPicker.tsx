import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import type { Trip } from '@types/index'

interface TripPickerProps {
  trips: Trip[]
  value?: string
  onChange: (id: string) => void
  error?: string
}

export function TripPicker({ trips, value, onChange, error }: TripPickerProps) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Viaje</Text>
      {trips.length === 0 ? (
        <Text className="text-xs text-neutral-400 italic">No tienes viajes disponibles</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
          <View className="flex-row gap-2 px-1 py-1">
            {trips.map((trip) => {
              const isSelected = value === trip.id
              return (
                <TouchableOpacity
                  key={trip.id}
                  onPress={() => onChange(trip.id)}
                  className={`px-3 py-2 rounded-xl border ${
                    isSelected
                      ? 'bg-primary-500 border-primary-500'
                      : 'bg-white dark:bg-surface-800 border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'}`}
                    numberOfLines={1}
                  >
                    {trip.title}
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
