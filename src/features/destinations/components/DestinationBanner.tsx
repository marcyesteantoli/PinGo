import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { formatDateRange } from '@utils/date'
import type { TripDestination } from '@types/index'

interface Props {
  destination: TripDestination
}

export function DestinationBanner({ destination }: Props) {
  const { i18n } = useTranslation()
  const dateRange = formatDateRange(destination.start_date, destination.end_date, i18n.language)

  return (
    <View className="flex-1 pt-2.5 pb-2 pr-4">
      <Text
        className="text-[20px] font-bold text-neutral-900 dark:text-neutral-50 leading-tight"
        numberOfLines={1}
      >
        {destination.name}
      </Text>
      <View className="flex-row items-center gap-1.5 mt-1">
        {destination.country ? (
          <>
            <Text className="text-[11px] font-semibold text-primary-500 dark:text-primary-400 tracking-[0.2px]">
              {destination.country}
            </Text>
            <Text className="text-[11px] text-neutral-400 dark:text-neutral-500">·</Text>
          </>
        ) : null}
        <Text className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 tracking-[0.2px]">
          {dateRange}
        </Text>
      </View>
    </View>
  )
}
