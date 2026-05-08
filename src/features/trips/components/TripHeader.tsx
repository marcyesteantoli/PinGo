import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTripContext } from '../TripProvider'
import { formatShortDate } from '@utils/date'

export function TripHeader() {
  const { trip, collaborators } = useTripContext()
  const router = useRouter()

  const dateRange = `${formatShortDate(trip.start_date)} - ${formatShortDate(trip.end_date)}`
  const travelerCount = collaborators.length

  return (
    <SafeAreaView className="bg-white" edges={['top']}>
      <View className="px-5 pt-2 pb-5">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-bold text-neutral-900 tracking-tight">TripSync</Text>
          </View>
          <View className="w-8 h-8 rounded-full bg-neutral-100 items-center justify-center">
            <Ionicons name="person" size={16} color="#64748b" />
          </View>
        </View>

        <Text className="text-[26px] font-bold text-neutral-900 leading-tight mb-1" numberOfLines={3}>
          {trip.title}
        </Text>

        <View className="flex-row items-center flex-wrap">
          <Text className="text-sm font-medium text-primary-500">{dateRange}</Text>
          <Text className="text-sm text-neutral-400">
            {' '}• {travelerCount} {travelerCount === 1 ? 'Viajero' : 'Viajeros'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}
