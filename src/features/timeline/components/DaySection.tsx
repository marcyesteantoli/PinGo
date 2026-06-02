import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { formatDateWithWeekday } from '@utils/date'

export const UNDATED_SENTINEL = '__undated__'

interface DaySectionProps {
  date: string
  count: number
}

export function DaySection({ date, count }: DaySectionProps) {
  const { t, i18n } = useTranslation()
  const isUndated = date === UNDATED_SENTINEL
  const isToday = !isUndated && date === new Date().toISOString().slice(0, 10)

  return (
    <View className="flex-1 flex-row items-center gap-2 py-4 pr-4">
      {isToday ? (
        <View className="flex-row items-center gap-2 flex-1">
          <Text className="text-[13px] font-medium text-primary-500 dark:text-primary-400">
            {formatDateWithWeekday(date, i18n.language)}
          </Text>
          <View className="bg-primary-500 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-bold text-white uppercase tracking-wider">{t('daySection_today')}</Text>
          </View>
        </View>
      ) : (
        <Text className="text-[13px] font-medium text-neutral-600 dark:text-neutral-400 flex-1">
          {isUndated ? t('timeline_undated') : formatDateWithWeekday(date, i18n.language)}
        </Text>
      )}

      {count > 0 && (
        <View className="bg-primary-100 dark:bg-primary-600/40 px-2 py-0.5 rounded-full">
          <Text className="text-xs font-semibold text-primary-600 dark:text-primary-300">
            {count}
          </Text>
        </View>
      )}
    </View>
  )
}
