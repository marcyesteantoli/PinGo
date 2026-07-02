import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native'
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars'
import { useTranslation } from 'react-i18next'
import { colors } from '@lib/colors'
import { useTheme } from '@lib/theme'
import { formatDate } from '@utils/date'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function registerCalendarLocale(lang: string, todayLabel: string) {
  if (!LocaleConfig.locales[lang]) {
    const monthNames = Array.from({ length: 12 }, (_, i) =>
      capitalize(new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date(2000, i, 1)))
    )
    const monthNamesShort = Array.from({ length: 12 }, (_, i) =>
      capitalize(new Intl.DateTimeFormat(lang, { month: 'short' }).format(new Date(2000, i, 1)))
    )
    const dayNames = Array.from({ length: 7 }, (_, i) =>
      capitalize(new Intl.DateTimeFormat(lang, { weekday: 'long' }).format(new Date(2000, 0, 2 + i)))
    )
    const dayNamesShort = Array.from({ length: 7 }, (_, i) =>
      capitalize(new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(new Date(2000, 0, 2 + i)))
    )
    LocaleConfig.locales[lang] = { monthNames, monthNamesShort, dayNames, dayNamesShort, today: todayLabel }
  } else {
    LocaleConfig.locales[lang].today = todayLabel
  }
  LocaleConfig.defaultLocale = lang
}

interface DateRangePickerProps {
  startDate?: string
  endDate?: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  startError?: string
  endError?: string
  minDate?: string
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
  minDate,
}: DateRangePickerProps) {
  const { isDark } = useTheme()
  const { t, i18n } = useTranslation()
  const [show, setShow] = useState(false)
  const [tempStart, setTempStart] = useState<string | null>(null)
  const [tempEnd, setTempEnd] = useState<string | null>(null)

  registerCalendarLocale(i18n.language, t('dateRangePicker_calendar_today'))

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
      ? `${formatDate(startDate, i18n.language)}  →  ${formatDate(endDate, i18n.language)}`
      : startDate
        ? formatDate(startDate, i18n.language)
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
      <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('dateRangePicker_label')}</Text>
      <Pressable
        onPress={openPicker}
        className={`border rounded-xl px-4 flex-row items-center justify-between bg-white dark:bg-surface-800 ${error ? 'border-error' : 'border-neutral-200 dark:border-surface-600'}`}
        style={{ paddingVertical: 12 }}
      >
        <Text
          className="text-base"
          style={{ color: displayText ? (isDark ? colors.neutral[50] : colors.neutral[900]) : colors.neutral[400] }}
        >
          {displayText ?? t('dateRangePicker_placeholder')}
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
                <Text style={{ fontSize: 16, color: colors.neutral[400] }}>{t('common_cancel')}</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? colors.neutral[50] : colors.neutral[900] }}>
                {t('dateRangePicker_label')}
              </Text>
              <TouchableOpacity onPress={handleConfirm} disabled={confirmDisabled}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: confirmDisabled ? colors.neutral[300] : colors.primary[500] }}>
                  {t('dateRangePicker_confirm')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selection hint */}
            <View style={{ paddingVertical: 8, paddingHorizontal: 20 }}>
              {!tempStart ? (
                <Text style={{ fontSize: 13, color: colors.neutral[400], textAlign: 'center' }}>
                  {t('dateRangePicker_hint_start')}
                </Text>
              ) : !tempEnd ? (
                <Text style={{ fontSize: 13, color: colors.neutral[400], textAlign: 'center' }}>
                  {t('dateRangePicker_hint_end')}
                </Text>
              ) : (
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.primary[500], textAlign: 'center' }}>
                  {formatDate(tempStart, i18n.language)}  →  {formatDate(tempEnd, i18n.language)}
                </Text>
              )}
            </View>

            <Calendar
              markingType="period"
              markedDates={markedDates}
              onDayPress={handleDayPress}
              minDate={minDate ?? toLocalDateString(new Date())}
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
