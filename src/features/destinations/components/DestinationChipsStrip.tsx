import { Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { colors } from '@lib/colors'
import type { TripDestination } from '@types/index'

interface Props {
  destinations: TripDestination[]
  onManage: () => void
  onDestinationPress?: (dest: TripDestination) => void
}

export function DestinationChipsStrip({ destinations, onManage }: Props) {
  const { t } = useTranslation()

  const label =
    destinations.length > 0
      ? `${t('destinations_see_route')} · ${destinations.length} ${t('destinations_cities', { count: destinations.length })}`
      : t('destinations_add')

  return (
    <View className="px-5 pt-1.5 pb-2">
      <TouchableOpacity
        onPress={onManage}
        activeOpacity={0.7}
        className="self-start flex-row items-center gap-1.5 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-full px-3.5 py-1.5"
      >
        <Ionicons
          name={destinations.length > 0 ? 'map-outline' : 'add'}
          size={13}
          color={colors.neutral[400]}
        />
        <Text className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300">
          {label}
        </Text>
        {destinations.length > 0 && (
          <Ionicons name="chevron-forward" size={12} color={colors.neutral[400]} />
        )}
      </TouchableOpacity>
    </View>
  )
}
