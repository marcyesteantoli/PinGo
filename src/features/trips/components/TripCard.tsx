import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import { Card } from '@components/ui/Card'
import { Avatar } from '@components/ui/Avatar'
import { Badge } from '@components/ui/Badge'
import { formatDateRange } from '@utils/date'
import { useTheme } from '@lib/theme'
import type { TripWithCollaborators } from '@features/trips/hooks/useTrips'

interface TripCardProps {
  trip: TripWithCollaborators
  onPress: () => void
}

type TripStatus = 'upcoming' | 'active' | 'past'

function getTripStatus(startDate: string, endDate: string): TripStatus {
  const today = new Date().toISOString().split('T')[0]
  if (endDate < today) return 'past'
  if (startDate > today) return 'upcoming'
  return 'active'
}

function getDaysUntil(startDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(startDate + 'T00:00:00')
  return Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getTripDays(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1)
}

export function TripCard({ trip, onPress }: TripCardProps) {
  const { isDark } = useTheme()
  const { collaborators } = trip
  const days = getTripDays(trip.start_date, trip.end_date)
  const status = getTripStatus(trip.start_date, trip.end_date)
  const daysUntil = status === 'upcoming' ? getDaysUntil(trip.start_date) : 0

  const statusConfig: Record<TripStatus, { label: string; variant: 'success' | 'primary' | 'neutral' }> = {
    active:   { label: 'En curso',          variant: 'success' },
    upcoming: { label: `En ${daysUntil} días`, variant: 'primary'  },
    past:     { label: 'Completado',         variant: 'neutral' },
  }

  const { label, variant } = statusConfig[status]
  const borderColor = isDark ? '#1e2d3f' : '#ffffff'
  const subtleColor = isDark ? '#8896a8' : '#a0adb8'

  return (
    <Card onPress={onPress}>
      {/* Title + Status badge */}
      <View className="flex-row items-start justify-between gap-2 mb-2">
        <Text
          className="flex-1 text-[17px] font-semibold text-neutral-900 dark:text-neutral-50"
          numberOfLines={1}
        >
          {trip.title}
        </Text>
        <Badge label={label} variant={variant} />
      </View>

      {/* Date range + days */}
      <View className="flex-row items-center gap-1.5 mb-3">
        <Ionicons name="calendar-outline" size={13} color={subtleColor} />
        <Text className="text-[13px] text-neutral-500 dark:text-neutral-400">
          {formatDateRange(trip.start_date, trip.end_date)}
        </Text>
        <Text className="text-[13px] text-neutral-400 dark:text-neutral-500">
          · {days} {days === 1 ? 'día' : 'días'}
        </Text>
      </View>

      {/* Collaborators + chevron */}
      <View className="flex-row items-center justify-between">
        {collaborators.length > 0 ? (
          <View className="flex-row items-center gap-2">
            <View className="flex-row">
              {collaborators.slice(0, 4).map((c, i) => (
                <View
                  key={c.user_id}
                  style={{
                    marginLeft: i > 0 ? -8 : 0,
                    zIndex: 10 - i,
                    borderRadius: 17,
                    borderWidth: 2,
                    borderColor,
                  }}
                >
                  <Avatar name={c.name} uri={c.avatar_url} size="sm" />
                </View>
              ))}
              {collaborators.length > 4 && (
                <View
                  style={{
                    marginLeft: -8,
                    zIndex: 6,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor,
                    backgroundColor: isDark ? '#2a3a4e' : '#e5e7eb',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                    +{collaborators.length - 4}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-[13px] text-neutral-400 dark:text-neutral-500">
              {collaborators.length} {collaborators.length === 1 ? 'persona' : 'personas'}
            </Text>
          </View>
        ) : (
          <View />
        )}
        <Ionicons name="chevron-forward" size={16} color={subtleColor} />
      </View>
    </Card>
  )
}
