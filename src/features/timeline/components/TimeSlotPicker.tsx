import { Text, TouchableOpacity, View } from 'react-native'
import { TIME_SLOT_LABELS } from '../types'
import type { Experience } from '@types/index'

type TimeSlot = NonNullable<Experience['time_slot']>

const SLOTS: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night']

interface TimeSlotPickerProps {
  value?: TimeSlot
  onChange: (slot: TimeSlot | undefined) => void
}

export function TimeSlotPicker({ value, onChange }: TimeSlotPickerProps) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-neutral-700">Franja horaria (opcional)</Text>
      <View className="flex-row gap-2 flex-wrap">
        {SLOTS.map((slot) => {
          const isSelected = value === slot
          return (
            <TouchableOpacity
              key={slot}
              onPress={() => onChange(isSelected ? undefined : slot)}
              className={`px-3 py-2 rounded-xl border ${
                isSelected
                  ? 'bg-primary-100 border-primary-500'
                  : 'bg-white border-neutral-200'
              }`}
            >
              <Text
                className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-neutral-600'}`}
              >
                {TIME_SLOT_LABELS[slot]}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
