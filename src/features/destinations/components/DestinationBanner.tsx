import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@lib/colors'
import type { TripDestination } from '@types/index'

interface DestinationBannerProps {
  destination: TripDestination
}

export function DestinationBanner({ destination }: DestinationBannerProps) {
  return (
    <View className="px-4 pt-4 pb-1">
      <View className="bg-primary-50 dark:bg-primary-950/40 rounded-2xl px-4 py-3 flex-row items-center gap-3">
        <View className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 items-center justify-center">
          <Ionicons name="location" size={16} color={colors.primary[500]} />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-primary-700 dark:text-primary-300">
            {destination.name}
          </Text>
          {destination.country ? (
            <Text className="text-[12px] text-primary-500 dark:text-primary-400 mt-0.5">
              {destination.country}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  )
}
