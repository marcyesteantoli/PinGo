import { Ionicons } from '@expo/vector-icons'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Modal, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native'

interface DatePickerInputProps {
  label?: string
  value?: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  minimumDate?: Date
  maximumDate?: Date
}

function parseDate(s?: string): Date {
  if (!s) return new Date()
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDisplay(s: string): string {
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

function dateToString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function DatePickerInput({
  label,
  value,
  onChange,
  error,
  placeholder = 'Seleccionar fecha',
  minimumDate,
  maximumDate,
}: DatePickerInputProps) {
  const [show, setShow] = useState(false)
  const pickerDate = parseDate(value)

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false)
    if (selected) onChange(dateToString(selected))
  }

  return (
    <View className="gap-1">
      {label && <Text className="text-sm font-medium text-neutral-700">{label}</Text>}
      <Pressable
        onPress={() => setShow(true)}
        className={`border rounded-xl px-4 flex-row items-center justify-between bg-white ${error ? 'border-error' : 'border-neutral-200'}`}
        style={{ paddingVertical: 12 }}
      >
        <Text className="text-base" style={{ color: value ? '#171717' : '#8d99ae' }}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={18} color="#8d99ae" />
      </Pressable>
      {error && <Text className="text-xs text-error">{error}</Text>}

      {Platform.OS === 'ios' ? (
        <Modal visible={show} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
              <View className="flex-row justify-end px-4 pt-3 pb-1">
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text className="text-base font-semibold" style={{ color: '#0096c7' }}>Listo</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                locale="es-ES"
              />
            </View>
          </View>
        </Modal>
      ) : show && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  )
}
