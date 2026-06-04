import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { formatShortDate } from '@utils/date'
import type { TripDestination } from '@types/index'

const NODE_SHADOW = {
  shadowColor: colors.primary[500],
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.35,
  shadowRadius: 4,
}

interface Props {
  destinations: TripDestination[]
  onManage: () => void
  onDestinationPress?: (dest: TripDestination) => void
}

function RouteStop({
  name,
  date,
  isAdd,
  isDark,
  onPress,
}: {
  name: string
  date?: string
  isAdd?: boolean
  isDark: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ width: 66, alignItems: 'center' }}
    >
      <View
        className={
          isAdd
            ? 'w-8 h-8 rounded-full items-center justify-center border-2 border-neutral-300 dark:border-neutral-600 mb-1.5'
            : 'w-8 h-8 rounded-full items-center justify-center bg-primary-500 mb-1.5'
        }
        style={isAdd ? undefined : NODE_SHADOW}
      >
        <Ionicons
          name={isAdd ? 'add' : 'location'}
          size={isAdd ? 16 : 13}
          color={isAdd ? (isDark ? colors.neutral[500] : colors.neutral[400]) : '#fff'}
        />
      </View>
      <Text
        numberOfLines={1}
        className={
          isAdd
            ? 'text-[11px] text-neutral-400 dark:text-neutral-500 text-center'
            : 'text-[12px] font-semibold text-neutral-800 dark:text-neutral-100 text-center'
        }
      >
        {name}
      </Text>
      {date ? (
        <Text
          className="text-[11px] text-neutral-400 dark:text-neutral-500 text-center mt-0.5"
          numberOfLines={1}
        >
          {date}
        </Text>
      ) : null}
    </TouchableOpacity>
  )
}

function RouteConnector({ isDark }: { isDark: boolean }) {
  return (
    // paddingTop 16 = half of w-8 h-8 (32px) → centers line with circle
    <View style={{ paddingTop: 16, width: 24 }}>
      <View
        style={{
          height: 1,
          backgroundColor: isDark ? colors.surface[600] : colors.neutral[200],
        }}
      />
    </View>
  )
}

export function DestinationChipsStrip({ destinations, onManage, onDestinationPress }: Props) {
  const { isDark } = useTheme()
  const { t, i18n } = useTranslation()

  return (
    <View className="mb-2 mt-1">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 12,
          alignItems: 'flex-start',
        }}
      >
        {destinations.map((dest, index) => (
          <View key={dest.id} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {index > 0 && <RouteConnector isDark={isDark} />}
            <RouteStop
              name={dest.name}
              date={formatShortDate(dest.start_date, i18n.language)}
              onPress={() => onDestinationPress ? onDestinationPress(dest) : onManage()}
              isDark={isDark}
            />
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          {destinations.length > 0 && <RouteConnector isDark={isDark} />}
          <RouteStop
            name={t('destinations_add')}
            onPress={onManage}
            isAdd
            isDark={isDark}
          />
        </View>
      </ScrollView>
    </View>
  )
}
