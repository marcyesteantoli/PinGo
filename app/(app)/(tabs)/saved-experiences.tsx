import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppHeader, useAppHeader } from '@components/ui/AppHeader'
import { MapFab } from '@components/ui/MapFab'
import { SearchToolbar } from '@components/ui/SearchToolbar'
import { Skeleton } from '@components/ui/Skeleton'
import { AddSavedExperienceSheet } from '@features/saved/components/AddSavedExperienceSheet'
import { SavedExperienceCard } from '@features/saved/components/SavedExperienceCard'
import { TypeIconFilter, type FilterTypeKey } from '@features/saved/components/TypeIconFilter'
import { useSavedExperiences } from '@features/saved/hooks/useSavedExperiences'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import type { Experience } from '@app-types/index'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLocName(location: unknown): string {
  if (typeof location === 'object' && location !== null && 'name' in location) {
    return String((location as { name?: unknown }).name ?? '')
  }
  return ''
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SavedExperienceCardSkeleton({ index }: { index: number }) {
  return (
    <View
      style={[cardShadow, { borderRadius: 20, height: 200 }]}
    >
      <Skeleton width="100%" height={200} className="rounded-[20px]" />
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SavedExperiencesScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const { scrollY, scrollHandler } = useAppHeader()
  const { t } = useTranslation()

  const [activeType, setActiveType] = useState<Experience['type'] | null>(null)
  const [query, setQuery] = useState('')
  const [addSheetVisible, setAddSheetVisible] = useState(false)

  const { data: saved = [], isLoading } = useSavedExperiences()

  const headerSubtitle = saved.length === 0
    ? t('saved_header_empty')
    : t('saved_header_count', { count: saved.length })

  const handleFilterChange = useCallback((key: FilterTypeKey | null) => {
    setActiveType(key as Experience['type'] | null)
  }, [])

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text)
  }, [])

  // Type counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of saved) {
      const tp = item.experience.type
      counts[tp] = (counts[tp] ?? 0) + 1
    }
    return counts
  }, [saved])

  // Filter tabs definition
  const TYPE_TABS = useMemo<Array<{ key: Experience['type'] | null; label: string; count?: number }>>(() => ([
    { key: null,             label: t('saved_filter_all'),      count: saved.length },
    { key: 'city',          label: t('expType_city'),          count: typeCounts['city'] },
    { key: 'restaurant',    label: t('expType_restaurant'),    count: typeCounts['restaurant'] },
    { key: 'activity',      label: t('expType_activity'),      count: typeCounts['activity'] },
    { key: 'accommodation', label: t('expType_accommodation'), count: typeCounts['accommodation'] },
    { key: 'entertainment', label: t('expType_entertainment'), count: typeCounts['entertainment'] },
    { key: 'transport',     label: t('expType_transport'),     count: typeCounts['transport'] },
    { key: 'other',         label: t('expType_other'),         count: typeCounts['other'] },
  ] as Array<{ key: Experience['type'] | null; label: string; count?: number }>
  ).filter((tab) => tab.key === null || (tab.count ?? 0) > 0), [saved.length, typeCounts, t])

  // Filtered items — type filter + text query applied in series
  const filtered = useMemo(() => {
    let result = activeType ? saved.filter(i => i.experience.type === activeType) : saved
    const q = query.trim().toLowerCase()
    if (q) {
      result = result.filter(i =>
        i.experience.title.toLowerCase().includes(q) ||
        getLocName(i.experience.location).toLowerCase().includes(q)
      )
    }
    return result
  }, [saved, activeType, query])

  const handleAddPress = useCallback(() => setAddSheetVisible(true), [])

  // Stable header — no query dep so FlatList never remounts it (TextInput keeps focus)
  const listHeader = useMemo(() => (
    <View className="gap-2 pt-2">
      <SearchToolbar
        search={query}
        onSearchChange={handleQueryChange}
        onAddPress={handleAddPress}
        isDark={isDark}
        placeholder={t('saved_search_placeholder')}
        className="pb-4"
        horizontalPadding={0}
      />
      <TypeIconFilter
        tabs={TYPE_TABS}
        active={activeType}
        onChange={handleFilterChange}
        isDark={isDark}
      />
    </View>
  ), [TYPE_TABS, activeType, handleFilterChange, handleAddPress, isDark, t, query, handleQueryChange])

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
      <AppHeader
        title={t('saved_title')}
        subtitle={headerSubtitle}
        scrollY={scrollY}
      />

      {isLoading ? (
        <View className="px-5 pt-2 gap-3">
          {[0, 1, 2].map((i) => <SavedExperienceCardSkeleton key={i} index={i} />)}
        </View>
      ) : (
        <>
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
              saved.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8 pt-16">
                  <Ionicons
                    name="bookmark-outline"
                    size={52}
                    color={isDark ? colors.neutral[500] : colors.neutral[400]}
                    style={{ marginBottom: 16 }}
                  />
                  <Text className="text-[18px] font-semibold text-neutral-700 dark:text-neutral-200 text-center mb-2">
                    {t('saved_empty_title')}
                  </Text>
                  <Text className="text-[15px] text-neutral-500 dark:text-neutral-400 text-center leading-[22px]">
                    {t('saved_empty_subtitle')}
                  </Text>
                </View>
              ) : query.trim() ? (
                <View className="items-center justify-center px-8 pt-10">
                  <Ionicons
                    name="search-outline"
                    size={36}
                    color={isDark ? colors.neutral[500] : colors.neutral[400]}
                    style={{ marginBottom: 12 }}
                  />
                  <Text className="text-[16px] font-semibold text-neutral-600 dark:text-neutral-300 text-center">
                    {t('saved_filtered_noQuery', { query: query.trim() })}
                  </Text>
                </View>
              ) : (
                <View className="items-center justify-center px-8 pt-10">
                  <Ionicons
                    name="filter-outline"
                    size={36}
                    color={isDark ? colors.neutral[500] : colors.neutral[400]}
                    style={{ marginBottom: 12 }}
                  />
                  <Text className="text-[16px] font-semibold text-neutral-600 dark:text-neutral-300 text-center">
                    {t('saved_filtered_noType', { type: activeType })}
                  </Text>
                </View>
              )
            }
            contentContainerClassName="px-5 pb-10 gap-3"
            showsVerticalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          />
        </>
      )}

      <MapFab onPress={() => router.push('/saved-experiences/map')} scrollY={scrollY} />

      <AddSavedExperienceSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
      />
    </SafeAreaView>
  )
}
