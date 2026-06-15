import { Ionicons } from '@expo/vector-icons'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Modal, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'

interface TimePickerInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  minTime?: string
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

function TimePickerInput({ value, onChange, placeholder = '--:--', error, minTime }: TimePickerInputProps) {
  const [show, setShow] = useState(false)
  const pickerDate = parseTime(value)
  const { isDark } = useTheme()
  const { t } = useTranslation()
  const doneLabel = t('timeline_timePicker_done')

  const handleOpen = () => {
    onChange(dateToTime(pickerDate))
    setShow(true)
  }

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false)
    if (selected) onChange(dateToTime(selected))
  }

  const minimumDate = minTime
    ? (() => {
        const [h, m] = minTime.split(':').map(Number)
        return new Date(pickerDate.getFullYear(), pickerDate.getMonth(), pickerDate.getDate(), h, m, 0, 0)
      })()
    : new Date(pickerDate.getFullYear(), pickerDate.getMonth(), pickerDate.getDate(), 0, 0, 0, 0)

  const maximumDate = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), pickerDate.getDate(), 23, 59, 59, 999)

  return (
    <View className="gap-1 flex-1">
      <Pressable
        onPress={handleOpen}
        className={`border rounded-xl px-3 flex-row items-center justify-between bg-white dark:bg-surface-800 ${error ? 'border-error' : 'border-neutral-200 dark:border-surface-600'}`}
        style={{ paddingVertical: 12 }}
      >
        <Text className="text-base" style={{ color: value ? (isDark ? colors.neutral[50] : colors.neutral[900]) : colors.neutral[400] }}>
          {value ?? placeholder}
        </Text>
        <Ionicons name="time-outline" size={16} color={colors.neutral[400]} />
      </Pressable>
      {error && <Text className="text-xs text-error">{error}</Text>}

      {Platform.OS === 'ios' ? (
        <Modal visible={show} transparent animationType="none">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View style={{ backgroundColor: isDark ? colors.surface[800] : colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
              <View className="flex-row justify-end px-4 pt-3 pb-1">
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text className="text-base font-semibold" style={{ color: colors.primary[500] }}>{doneLabel}</Text>
                </TouchableOpacity>
              </View>
              {show && (
                <DateTimePicker
                  value={pickerDate}
                  mode="time"
                  display="spinner"
                  onChange={handleChange}
                  is24Hour
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  themeVariant={isDark ? 'dark' : 'light'}
                />
              )}
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
          minimumDate={minimumDate}
          maximumDate={maximumDate}
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
  const { t } = useTranslation()
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('timeline_timePicker_label')}</Text>
      <View className="flex-row gap-3 items-start">
        <TimePickerInput
          value={startTime}
          onChange={onStartTimeChange}
          placeholder={t('timeline_timePicker_start')}
          error={startTimeError}
        />
        <Text className="text-neutral-500 dark:text-neutral-400 text-base" style={{ paddingTop: 10 }}>—</Text>
        <TimePickerInput
          value={endTime}
          onChange={onEndTimeChange}
          placeholder={t('timeline_timePicker_end')}
          error={endTimeError}
          minTime={startTime}
        />
      </View>
    </View>
  )
}
