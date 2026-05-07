import { Text, View } from 'react-native'
import { formatDateWithWeekday } from '@utils/date'

interface DaySectionProps {
  date: string
  count: number
}

export function DaySection({ date }: DaySectionProps) {
  const isUndated = date === 'Sin fecha'

  return (
    <View className="flex-row items-center gap-3 pb-3 pt-6 px-5">
      <View className="w-3 h-3 rounded-full bg-neutral-800" />
      <Text className="text-sm font-bold text-neutral-800">
        {isUndated ? 'Sin fecha' : formatDateWithWeekday(date)}
      </Text>
    </View>
  )
}
