import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native'
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars'
import { colors } from '@lib/colors'
import { useTheme } from '@lib/theme'

LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  today: 'Hoy',
}
LocaleConfig.defaultLocale = 'es'

interface DateRangePickerProps {
  startDate?: string
  endDate?: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  startError?: string
  endError?: string
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatShort(s: string): string {
  const [y, m, d] = s.split('-')
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]} ${y}`
}

function toLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildMarkedDates(start: string | null, end: string | null) {
  if (!start) return {}

  const PRIMARY = colors.primary[500]
  const RANGE_BG = '#e8e9fd'

  if (!end || start === end) {
    return {
      [start]: { startingDay: true, endingDay: true, color: PRIMARY, textColor: colors.white },
    }
  }

  const marked: Record<string, object> = {}
  const cur = new Date(start + 'T00:00:00')
  const endD = new Date(end + 'T00:00:00')

  while (cur <= endD) {
    const key = toLocalDateString(cur)
    const isStart = key === start
    const isEnd = key === end
    marked[key] = {
      startingDay: isStart,
      endingDay: isEnd,
      color: isStart || isEnd ? PRIMARY : RANGE_BG,
      textColor: isStart || isEnd ? colors.white : colors.neutral[900],
    }
    cur.setDate(cur.getDate() + 1)
  }

  return marked
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startError,
  endError,
}: DateRangePickerProps) {
  const { isDark } = useTheme()
  const [show, setShow] = useState(false)
  const [tempStart, setTempStart] = useState<string | null>(null)
  const [tempEnd, setTempEnd] = useState<string | null>(null)

  const error = startError || endError
  const bgColor = isDark ? colors.surface[800] : colors.white

  function openPicker() {
    setTempStart(startDate ?? null)
    setTempEnd(endDate ?? null)
    setShow(true)
  }

  function handleDayPress(day: DateData) {
    const d = day.dateString
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(d)
      setTempEnd(null)
    } else if (d < tempStart) {
      setTempStart(d)
    } else {
      setTempEnd(d)
    }
  }

  function handleConfirm() {
    if (tempStart) onStartDateChange(tempStart)
    if (tempEnd) onEndDateChange(tempEnd)
    setShow(false)
  }

  function handleCancel() {
    setShow(false)
  }

  const markedDates = buildMarkedDates(tempStart, tempEnd)
  const confirmDisabled = !tempStart || !tempEnd

  const displayText =
    startDate && endDate
      ? `${formatShort(startDate)}  →  ${formatShort(endDate)}`
      : startDate
        ? formatShort(startDate)
        : undefined

  const calendarTheme = {
    backgroundColor: bgColor,
    calendarBackground: bgColor,
    textSectionTitleColor: isDark ? colors.neutral[400] : colors.neutral[500],
    dayTextColor: isDark ? colors.neutral[50] : colors.neutral[900],
    todayTextColor: colors.primary[500],
    monthTextColor: isDark ? colors.neutral[50] : colors.neutral[900],
    arrowColor: colors.primary[500],
    textDisabledColor: isDark ? colors.surface[700] : colors.neutral[200],
    textDayFontSize: 15,
    textMonthFontSize: 16,
    textMonthFontWeight: '600' as const,
  }

  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Fechas del viaje</Text>
      <Pressable
        onPress={openPicker}
        className={`border rounded-xl px-4 flex-row items-center justify-between bg-white dark:bg-surface-800 ${error ? 'border-error' : 'border-neutral-200 dark:border-surface-600'}`}
        style={{ paddingVertical: 12 }}
      >
        <Text
          className="text-base"
          style={{ color: displayText ? (isDark ? colors.neutral[50] : colors.neutral[900]) : colors.neutral[400] }}
        >
          {displayText ?? 'Seleccionar fechas'}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.neutral[400]} />
      </Pressable>
      {error && <Text className="text-xs text-error">{error}</Text>}

      <Modal visible={show} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View style={{ backgroundColor: bgColor, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 36 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
              <TouchableOpacity onPress={handleCancel}>
                <Text style={{ fontSize: 16, color: colors.neutral[400] }}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? colors.neutral[50] : colors.neutral[900] }}>
                Fechas del viaje
              </Text>
              <TouchableOpacity onPress={handleConfirm} disabled={confirmDisabled}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: confirmDisabled ? colors.neutral[300] : colors.primary[500] }}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selection hint */}
            <View style={{ paddingVertical: 8, paddingHorizontal: 20 }}>
              {!tempStart ? (
                <Text style={{ fontSize: 13, color: colors.neutral[400], textAlign: 'center' }}>
                  Toca para seleccionar la fecha de inicio
                </Text>
              ) : !tempEnd ? (
                <Text style={{ fontSize: 13, color: colors.neutral[400], textAlign: 'center' }}>
                  Ahora selecciona la fecha de fin
                </Text>
              ) : (
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.primary[500], textAlign: 'center' }}>
                  {formatShort(tempStart)}  →  {formatShort(tempEnd)}
                </Text>
              )}
            </View>

            <Calendar
              markingType="period"
              markedDates={markedDates}
              onDayPress={handleDayPress}
              minDate={toLocalDateString(new Date())}
              current={tempStart ?? toLocalDateString(new Date())}
              firstDay={1}
              theme={calendarTheme}
              style={{ paddingBottom: 8 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}
