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
      <View className="w-12 h-12 rounded-xl bg-primary-100 items-center justify-center">
        <Ionicons name="airplane-outline" size={22} color="#0096c7" />
      </View>

      <View className="flex-1 gap-0.5">
        <Text className="text-base font-semibold text-neutral-900" numberOfLines={1}>
          {trip.title}
        </Text>
        <Text className="text-sm text-neutral-500">
          {formatDateRange(trip.start_date, trip.end_date)}
        </Text>
        <Text className="text-xs text-neutral-400">
          {days} {days === 1 ? 'día' : 'días'}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#c5ced8" />
    </Card>
  )
}
