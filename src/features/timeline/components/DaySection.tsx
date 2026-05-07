import { Text, View } from 'react-native'
import { formatDate } from '@utils/date'

interface DaySectionProps {
  date: string
  count: number
}

export function DaySection({ date, count }: DaySectionProps) {
  const isUndated = date === 'Sin fecha'

  return (
    <View className="flex-row items-center justify-between px-1 pb-2 pt-4">
      <Text className="text-sm font-semibold text-neutral-700">
        {isUndated ? 'Sin fecha' : formatDate(date)}
      </Text>
      <Text className="text-xs text-neutral-400">
        {count} {count === 1 ? 'experiencia' : 'experiencias'}
      </Text>
    </View>
  )
}
