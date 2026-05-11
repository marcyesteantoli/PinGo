import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import { Card } from '@components/ui/Card'
import { formatDateRange } from '@utils/date'
import type { Trip } from '@types/index'

interface TripCardProps {
  trip: Trip
  onPress: () => void
}

function getTripDays(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1)
}

export function TripCard({ trip, onPress }: TripCardProps) {
  const days = getTripDays(trip.start_date, trip.end_date)

  return (
    <Card onPress={onPress} className="flex-row items-center gap-3">
      <View className="w-11 h-11 rounded-[10px] bg-primary-50 dark:bg-primary-900/30 items-center justify-center">
        <Ionicons name="airplane" size={20} color="#06b6d4" />
      </View>

      <View className="flex-1 gap-0.5">
        <Text className="text-[17px] font-semibold text-neutral-900 dark:text-neutral-50" numberOfLines={1}>
          {trip.title}
        </Text>
        <Text className="text-[15px] text-neutral-500 dark:text-neutral-400">
          {formatDateRange(trip.start_date, trip.end_date)}
        </Text>
        <Text className="text-[13px] text-neutral-400 dark:text-neutral-500">
          {days} {days === 1 ? 'día' : 'días'}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#c5ced8" />
    </Card>
  )
}
