import { Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { colors } from '@lib/colors'
import type { TripDestination } from '@app-types/index'

interface Props {
  destinations: TripDestination[]
  onManage: () => void
  onDestinationPress?: (dest: TripDestination) => void
  onExportPdf?: () => void
}

export function DestinationChipsStrip({ destinations, onManage, onExportPdf }: Props) {
  const { t } = useTranslation()

  const label =
    destinations.length > 0
      ? `${t('destinations_see_route')} · ${destinations.length} ${t('destinations_cities', { count: destinations.length })}`
      : t('destinations_add')

  return (
    <View className="px-5 pt-1.5 pb-2 flex-row items-center justify-between">
      <TouchableOpacity
        onPress={onManage}
        activeOpacity={0.7}
        className="self-start flex-row items-center gap-1.5 bg-neutral-200/80 dark:bg-neutral-700 rounded-full px-3.5 py-1.5"
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

      {onExportPdf && (
        <TouchableOpacity
          onPress={onExportPdf}
          activeOpacity={0.7}
          className="flex-row items-center gap-1 bg-neutral-200/80 dark:bg-neutral-700 rounded-full px-3 py-1.5"
        >
          <Ionicons name="document-text-outline" size={13} color={colors.neutral[400]} />
          <Text className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300">
            PDF
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
