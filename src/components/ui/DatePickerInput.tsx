import { Ionicons } from '@expo/vector-icons'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Modal, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'

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
  const { isDark } = useTheme()

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false)
    if (selected) onChange(dateToString(selected))
  }

  return (
    <View className="gap-1">
      {label && (
        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</Text>
      )}
      <Pressable
        onPress={() => setShow(true)}
        className={`border rounded-xl px-4 flex-row items-center justify-between bg-white dark:bg-surface-800 ${error ? 'border-error' : 'border-neutral-200 dark:border-surface-600'}`}
        style={{ paddingVertical: 12 }}
      >
        <Text className="text-base" style={{ color: value ? (isDark ? colors.neutral[50] : colors.neutral[900]) : colors.neutral[400] }}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.neutral[400]} />
      </Pressable>
      {error && <Text className="text-xs text-error">{error}</Text>}

      {Platform.OS === 'ios' ? (
        <Modal visible={show} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View style={{ backgroundColor: isDark ? colors.surface[800] : colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
              <View className="flex-row justify-end px-4 pt-3 pb-1">
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text className="text-base font-semibold" style={{ color: colors.primary[500] }}>Listo</Text>
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
                themeVariant={isDark ? 'dark' : 'light'}
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
