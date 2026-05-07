import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTripContext } from '../TripProvider'
import { formatDateRange } from '@utils/date'

export function TripHeader() {
  const router = useRouter()
  const { trip } = useTripContext()

  return (
    <SafeAreaView className="bg-white border-b border-neutral-100" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-8 h-8 rounded-lg items-center justify-center"
        >
          <Ionicons name="arrow-back" size={22} color="#404040" />
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-base font-semibold text-neutral-900" numberOfLines={1}>
            {trip.title}
          </Text>
          <Text className="text-xs text-neutral-500">
            {formatDateRange(trip.start_date, trip.end_date)}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}
