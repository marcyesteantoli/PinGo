import { Ionicons } from '@expo/vector-icons'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Modal, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '@lib/theme'

interface TimePickerInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
}

function parseTime(s?: string): Date {
  const d = new Date()
  if (s) {
    const [h, m] = s.split(':').map(Number)
    d.setHours(h, m, 0, 0)
  }
  return d
}

function dateToTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function TimePickerInput({ value, onChange, placeholder = '--:--', error }: TimePickerInputProps) {
  const [show, setShow] = useState(false)
  const pickerDate = parseTime(value)
  const { isDark } = useTheme()

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false)
    if (selected) onChange(dateToTime(selected))
  }

  return (
    <View className="gap-1 flex-1">
      <Pressable
        onPress={() => setShow(true)}
        className={`border rounded-xl px-3 flex-row items-center justify-between bg-white dark:bg-surface-800 ${error ? 'border-error' : 'border-neutral-200 dark:border-surface-600'}`}
        style={{ paddingVertical: 12 }}
      >
        <Text className="text-base" style={{ color: value ? (isDark ? '#f1f5f9' : '#171717') : '#8d99ae' }}>
          {value ?? placeholder}
        </Text>
        <Ionicons name="time-outline" size={16} color="#8d99ae" />
      </Pressable>
      {error && <Text className="text-xs text-error">{error}</Text>}

      {Platform.OS === 'ios' ? (
        <Modal visible={show} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View style={{ backgroundColor: isDark ? '#142033' : 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
              <View className="flex-row justify-end px-4 pt-3 pb-1">
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text className="text-base font-semibold" style={{ color: '#0096c7' }}>Listo</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="time"
                display="spinner"
                onChange={handleChange}
                is24Hour
                themeVariant={isDark ? 'dark' : 'light'}
              />
            </View>
          </View>
        </Modal>
      ) : show && (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          display="default"
          onChange={handleChange}
          is24Hour
        />
      )}
    </View>
  )
}

interface TimeRangePickerProps {
  startTime?: string
  endTime?: string
  onStartTimeChange: (value: string) => void
  onEndTimeChange: (value: string) => void
  startTimeError?: string
  endTimeError?: string
}

export function TimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  startTimeError,
  endTimeError,
}: TimeRangePickerProps) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Franja horaria (opcional)</Text>
      <View className="flex-row gap-3 items-start">
        <TimePickerInput
          value={startTime}
          onChange={onStartTimeChange}
          placeholder="09:00"
          error={startTimeError}
        />
        <Text className="text-neutral-400 dark:text-neutral-500 text-base" style={{ paddingTop: 10 }}>—</Text>
        <TimePickerInput
          value={endTime}
          onChange={onEndTimeChange}
          placeholder="18:00"
          error={endTimeError}
        />
      </View>
    </View>
  )
}
