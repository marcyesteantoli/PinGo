import { useState, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
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
import { Skeleton } from '@components/ui/Skeleton'
import { SavedExperienceCard } from '@features/saved/components/SavedExperienceCard'
import { useSavedExperiences } from '@features/saved/hooks/useSavedExperiences'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import { EASE_OUT, DURATION } from '@lib/animations'
import type { Experience } from '@types/index'

function SavedExperienceCardSkeleton() {
  return (
    <View style={cardShadow} className="rounded-2xl bg-white dark:bg-surface-800 overflow-hidden">
      <View className="absolute top-0 left-0 bottom-0 w-[3px] bg-neutral-200 dark:bg-surface-600" />
      <View className="pl-5 pr-4 pt-3.5 pb-3.5">
        <View className="flex-row items-start gap-3">
          <Skeleton width={44} height={44} className="rounded-xl" />
          <View className="flex-1 gap-2 pt-0.5">
            <Skeleton height={16} className="w-3/4" />
            <Skeleton height={12} className="w-1/2" />
          </View>
          <Skeleton width={44} height={44} className="rounded-full" />
        </View>
      </View>
    </View>
  )
}

interface FilterChipProps {
  label: string
  count?: number
  isActive: boolean
  onPress: () => void
}

function FilterChip({ label, count, isActive, onPress }: FilterChipProps) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.95, { duration: DURATION.press, easing: EASE_OUT }) }}
      onPressOut={() => { scale.value = withTiming(1, { duration: DURATION.press, easing: EASE_OUT }) }}
    >
      <Animated.View
        style={animStyle}
        className={`flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full ${isActive ? 'bg-primary-500 dark:bg-primary-400' : 'bg-white dark:bg-surface-800'}`}
      >
        <Text className={`text-[13px] ${isActive ? 'font-semibold text-white' : 'font-normal text-neutral-600 dark:text-neutral-300'}`}>
          {label}
        </Text>
        {!isActive && count !== undefined && count > 0 && (
          <View className="bg-neutral-100 dark:bg-surface-700 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
            <Text className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-300">
              {count}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  )
}

export default function SavedExperiencesScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const { scrollY, scrollHandler } = useAppHeader()
  const { t } = useTranslation()

  const TYPE_FILTERS: { key: string | null; label: string }[] = [
    { key: null,             label: t('saved_filter_all') },
    { key: 'restaurant',    label: t('expType_restaurant') },
    { key: 'activity',      label: t('expType_activity') },
    { key: 'accommodation', label: t('expType_accommodation') },
    { key: 'transport',     label: t('expType_transport') },
    { key: 'entertainment', label: t('expType_entertainment') },
    { key: 'other',         label: t('expType_other') },
  ]

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

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of saved) {
      const t = item.experience.type as Experience['type']
      counts[t] = (counts[t] ?? 0) + 1
    }
    return counts
  }, [saved])

  const filtered = useMemo(() => {
    let items = saved

    if (activeType) {
      items = items.filter((i) => i.experience.type === activeType)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter((i) => {
        const loc = typeof i.experience.location === 'object' && i.experience.location !== null && 'name' in i.experience.location
          ? String((i.experience.location as { name: string }).name).toLowerCase()
          : ''
        return loc.includes(q) || i.experience.title.toLowerCase().includes(q)
      })
    }

    return items
  }, [saved, activeType, search])

  const isFiltered = !!activeType || !!search.trim()
  const activeTypeLabel = TYPE_FILTERS.find((f) => f.key === activeType)?.label ?? ''

  const clearFiltersScale = useSharedValue(1)
  const clearFiltersStyle = useAnimatedStyle(() => ({ transform: [{ scale: clearFiltersScale.value }] }))

  const listHeader = (
    <View>
      <Animated.View style={expandedSectionStyle}>
        <Text className="text-[34px] font-bold text-neutral-900 dark:text-neutral-50 pt-2 pb-3">
          {t('saved_title')}
        </Text>
      </Animated.View>

      {/* Search bar */}
      <View className="pb-2.5">
        <View className="flex-row items-center bg-white dark:bg-surface-700 rounded-xl px-3 py-2.5 gap-2">
          <Ionicons name="search" size={16} color={isDark ? colors.neutral[500] : colors.neutral[400]} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('saved_search_placeholder')}
            placeholderTextColor={colors.neutral[400]}
            className="flex-1 text-[15px] text-neutral-900 dark:text-neutral-50"
            style={{ padding: 0 }}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Filter chips with counts */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 12, gap: 8 }}
        keyboardShouldPersistTaps="handled"
      >
        {TYPE_FILTERS.map((filter) => (
          <FilterChip
            key={String(filter.key)}
            label={filter.label}
            count={filter.key ? typeCounts[filter.key] : undefined}
            isActive={activeType === filter.key}
            onPress={() => setActiveType(filter.key)}
          />
        ))}
      </ScrollView>
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
      <AppHeader title={t('saved_title')} scrollY={scrollY} expandProgress={sectionProgress} />

      {isLoading ? (
        <View className="px-5 pt-2 gap-3">
          {[0, 1, 2, 3].map((i) => <SavedExperienceCardSkeleton key={i} />)}
        </View>
      ) : (
        <Animated.FlatList
          data={filtered}
          keyExtractor={(item) => item.experience.id}
          renderItem={({ item, index }) => (
            <SavedExperienceCard
              item={item}
              index={index}
              onPress={() => router.push(`/saved-experiences/${item.experience.id}`)}
            />
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            isFiltered ? (
              <View className="items-center justify-center px-8 pt-16">
                <Ionicons name="filter-outline" size={44} color={isDark ? colors.neutral[500] : colors.neutral[400]} style={{ marginBottom: 16 }} />
                <Text className="text-[17px] font-semibold text-neutral-700 dark:text-neutral-200 text-center mb-2">
                  {activeType
                    ? t('saved_filtered_noType', { type: activeTypeLabel })
                    : t('saved_filtered_noQuery', { query: search })}
                </Text>
                <Pressable
                  onPress={() => { setActiveType(null); setSearch('') }}
                  onPressIn={() => { clearFiltersScale.value = withTiming(0.97, { duration: DURATION.press, easing: EASE_OUT }) }}
                  onPressOut={() => { clearFiltersScale.value = withTiming(1, { duration: DURATION.press, easing: EASE_OUT }) }}
                >
                  <Animated.View style={clearFiltersStyle} className="mt-3 px-5 py-2.5 rounded-full bg-neutral-200 dark:bg-surface-700">
                    <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                      {t('saved_filtered_seeAll')}
                    </Text>
                  </Animated.View>
                </Pressable>
              </View>
            ) : saved.length === 0 ? (
              <View className="flex-1 items-center justify-center px-8 pt-16">
                <Ionicons name="bookmark-outline" size={52} color={isDark ? colors.neutral[500] : colors.neutral[400]} style={{ marginBottom: 16 }} />
                <Text className="text-[18px] font-semibold text-neutral-700 dark:text-neutral-200 text-center mb-2">
                  {t('saved_empty_title')}
                </Text>
                <Text className="text-[15px] text-neutral-500 dark:text-neutral-400 text-center leading-[22px]">
                  {t('saved_empty_subtitle')}
                </Text>
              </View>
            ) : null
          }
          contentContainerClassName="px-5 pb-8 gap-3"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        />
      )}
    </SafeAreaView>
  )
}
