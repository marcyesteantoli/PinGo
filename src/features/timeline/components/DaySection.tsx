import { Text, View } from 'react-native'
import { formatDateWithWeekday } from '@utils/date'

interface DaySectionProps {
  date: string
  count: number
}

export function DaySection({ date, count }: DaySectionProps) {
  const isUndated = date === 'Sin fecha'
  const isToday = !isUndated && date === new Date().toISOString().slice(0, 10)

  return (
    <View className="flex-1 flex-row items-center gap-2 py-4 pr-4">
      <View className="w-3 h-px bg-primary-400 opacity-60" />

      {isToday ? (
        <View className="flex-row items-center gap-2 flex-1">
          <Text className="text-xs font-semibold text-primary-500 dark:text-primary-400 uppercase tracking-wider">
            {formatDateWithWeekday(date)}
          </Text>
          <View className="bg-primary-500 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-bold text-white uppercase tracking-wider">Hoy</Text>
          </View>
        </View>
      ) : (
        <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex-1">
          {isUndated ? 'Sin fecha' : formatDateWithWeekday(date)}
        </Text>
      )}

      {count > 0 && (
        <View className="bg-secondary-100 dark:bg-secondary-900/40 px-2 py-0.5 rounded-full">
          <Text className="text-xs font-semibold text-secondary-600 dark:text-secondary-300">
            {count}
          </Text>
        </View>
      )}
    </View>
  )
}
