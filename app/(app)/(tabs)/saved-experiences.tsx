import { useState, useMemo } from 'react'
import { useRouter } from 'expo-router'
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppHeader, useAppHeader } from '@components/ui/AppHeader'
import { useSavedExperiences } from '@features/saved/hooks/useSavedExperiences'
import { Badge } from '@components/ui/Badge'
import { EXPERIENCE_TYPE_LABELS } from '@features/timeline/types'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import type { SavedExperienceItem } from '@types/index'
import type { BadgeVariant } from '@components/ui/Badge'
import type { Experience } from '@types/index'

const TYPE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  transport: 'transport',
  accommodation: 'accommodation',
  activity: 'activity',
  restaurant: 'restaurant',
  other: 'other',
}

const TYPE_FILTERS: { key: string | null; label: string }[] = [
  { key: null, label: 'Todas' },
  { key: 'restaurant', label: 'Gastronomía' },
  { key: 'activity', label: 'Actividad' },
  { key: 'accommodation', label: 'Alojamiento' },
  { key: 'transport', label: 'Transporte' },
  { key: 'other', label: 'Otro' },
]

function getLocationText(location: unknown): string | null {
  if (
    typeof location === 'object' &&
    location !== null &&
    'name' in location &&
    typeof (location as { name: unknown }).name === 'string'
  ) {
    return (location as { name: string }).name
  }
  return null
}

interface SavedExperienceCardProps {
  item: SavedExperienceItem
  onPress: () => void
}

function SavedExperienceCard({ item, onPress }: SavedExperienceCardProps) {
  const { isDark } = useTheme()
  const { experience, note } = item
  const locationText = getLocationText(experience.location)

  return (
    <View className="rounded-2xl mb-3" style={cardShadow}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden"
      >
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Badge
              label={EXPERIENCE_TYPE_LABELS[experience.type as Experience['type']]}
              variant={TYPE_BADGE_VARIANT[experience.type]}
            />
            {experience.trip?.name && (
              <Text
                numberOfLines={1}
                className="text-[13px] text-neutral-500 dark:text-neutral-400 shrink ml-2"
              >
                {experience.trip.name}
              </Text>
            )}
          </View>

          <Text
            numberOfLines={2}
            className={`text-[17px] font-semibold text-neutral-900 dark:text-neutral-50 ${locationText ? 'mb-1' : ''}`}
          >
            {experience.title}
          </Text>

          {locationText && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="location-outline" size={15} color={isDark ? colors.neutral[500] : colors.neutral[400]} />
              <Text numberOfLines={1} className="text-[13px] text-neutral-500 dark:text-neutral-400 flex-1">
                {locationText}
              </Text>
            </View>
          )}

          {note ? (
            <View className="flex-row items-center gap-1.5 mt-2">
              <Ionicons name="chatbubble-outline" size={13} color={isDark ? colors.neutral[500] : colors.neutral[400]} />
              <Text
                numberOfLines={1}
                className="text-[13px] text-neutral-500 dark:text-neutral-400 flex-1 italic"
              >
                {note}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  )
}

export default function SavedExperiencesScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const { scrollY, scrollHandler } = useAppHeader()
  const sectionProgress = useSharedValue(0)
  useAnimatedReaction(
    () => scrollY.value,
    (y) => {
      if (y > 44 && sectionProgress.value < 0.5) {
        sectionProgress.value = withTiming(1, { duration: 180 })
      } else if (y < 18 && sectionProgress.value > 0.5) {
        sectionProgress.value = withTiming(0, { duration: 180 })
      }
    }
  )
  const expandedSectionStyle = useAnimatedStyle(() => ({
    height: interpolate(sectionProgress.value, [0, 1], [57, 0]),
    overflow: 'hidden',
  }))

  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<string | null>(null)

  const { data: saved = [], isLoading } = useSavedExperiences()

  const filtered = useMemo(() => {
    let items = saved

    if (activeType) {
      items = items.filter((i) => i.experience.type === activeType)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter((i) => {
        const loc = getLocationText(i.experience.location)?.toLowerCase() ?? ''
        const title = i.experience.title.toLowerCase()
        return loc.includes(q) || title.includes(q)
      })
    }

    return items
  }, [saved, activeType, search])

  const isFiltered = !!activeType || !!search.trim()
  const activeTypeLabel = TYPE_FILTERS.find((f) => f.key === activeType)?.label ?? ''

  const listHeader = (
    <View>
      <Animated.View style={expandedSectionStyle}>
        <Text className="text-[34px] font-bold text-neutral-900 dark:text-neutral-50 pt-2 pb-3">
          Mis joyas
        </Text>
      </Animated.View>

      {/* Search bar */}
      <View className="pb-2.5">
        <View className="flex-row items-center bg-white dark:bg-surface-800 rounded-xl px-3 py-2.5 gap-2">
          <Ionicons name="search" size={16} color={isDark ? colors.neutral[500] : colors.neutral[400]} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por lugar o nombre..."
            placeholderTextColor={isDark ? colors.neutral[600] : colors.neutral[400]}
            className="flex-1 text-[15px] text-neutral-900 dark:text-neutral-50"
            style={{ padding: 0 }}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 12, gap: 8 }}
        keyboardShouldPersistTaps="handled"
      >
        {TYPE_FILTERS.map((filter) => {
          const isActive = activeType === filter.key
          return (
            <TouchableOpacity
              key={String(filter.key)}
              onPress={() => setActiveType(filter.key)}
              activeOpacity={0.7}
              className={`px-3.5 py-1.5 rounded-full ${isActive ? 'bg-primary-500 dark:bg-primary-400' : 'bg-white dark:bg-surface-800'}`}
            >
              <Text
                className={`text-[13px] ${isActive ? 'font-semibold text-white' : 'font-normal text-neutral-600 dark:text-neutral-300'}`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
      <AppHeader title="Mis joyas" scrollY={scrollY} expandProgress={sectionProgress} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-[15px] text-neutral-500 dark:text-neutral-400">Cargando...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filtered}
          keyExtractor={(item) => item.experience.id}
          renderItem={({ item }) => (
            <SavedExperienceCard
              item={item}
              onPress={() => router.push(`/saved-experiences/${item.experience.id}`)}
            />
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            saved.length === 0 ? (
              <View className="flex-1 items-center justify-center px-8 pt-16">
                <Ionicons name="bookmark-outline" size={52} color={isDark ? colors.neutral[500] : colors.neutral[400]} style={{ marginBottom: 16 }} />
                <Text className="text-[18px] font-semibold text-neutral-700 dark:text-neutral-200 text-center mb-2">
                  Aún no tienes joyas
                </Text>
                <Text className="text-[15px] text-neutral-500 dark:text-neutral-400 text-center leading-[22px]">
                  Guarda las experiencias que te han enamorado con el marcador en la ficha de cada experiencia.
                </Text>
              </View>
            ) : isFiltered ? (
              <View className="items-center justify-center px-8 pt-16">
                <Ionicons name="filter-outline" size={44} color={isDark ? colors.neutral[500] : colors.neutral[400]} style={{ marginBottom: 16 }} />
                <Text className="text-[17px] font-semibold text-neutral-700 dark:text-neutral-200 text-center mb-2">
                  {activeType
                    ? `Sin joyas de tipo "${activeTypeLabel}"`
                    : `Sin resultados para "${search}"`}
                </Text>
                <TouchableOpacity
                  onPress={() => { setActiveType(null); setSearch('') }}
                  className="mt-3 px-5 py-2.5 rounded-full bg-neutral-200 dark:bg-surface-700"
                >
                  <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                    Ver todas
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          contentContainerClassName="px-5 pb-8"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        />
      )}
    </SafeAreaView>
  )
}
