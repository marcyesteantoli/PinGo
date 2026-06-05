import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
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
import { TypeIconFilter } from '@features/saved/components/TypeIconFilter'
import { SavedExperiencesMap } from '@features/saved/components/SavedExperiencesMap'
import { useSavedExperiences } from '@features/saved/hooks/useSavedExperiences'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import type { Experience } from '@types/index'

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

type ViewMode = 'list' | 'map'

export default function SavedExperiencesScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const { scrollY, scrollHandler } = useAppHeader()
  const { t } = useTranslation()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [activeType, setActiveType] = useState<Experience['type'] | null>(null)

  const { data: saved = [], isLoading } = useSavedExperiences()

  // Collapsing large-title section
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
    height: interpolate(sectionProgress.value, [0, 1], [54, 0]),
    overflow: 'hidden',
  }))

  const handleFilterChange = useCallback((key: Experience['type'] | null) => {
    setActiveType(key)
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
    { key: 'restaurant',    label: t('expType_restaurant'),    count: typeCounts['restaurant'] },
    { key: 'activity',      label: t('expType_activity'),      count: typeCounts['activity'] },
    { key: 'accommodation', label: t('expType_accommodation'), count: typeCounts['accommodation'] },
    { key: 'transport',     label: t('expType_transport'),     count: typeCounts['transport'] },
    { key: 'entertainment', label: t('expType_entertainment'), count: typeCounts['entertainment'] },
    { key: 'other',         label: t('expType_other'),         count: typeCounts['other'] },
  ] as Array<{ key: Experience['type'] | null; label: string; count?: number }>
  ).filter((tab) => tab.key === null || (tab.count ?? 0) > 0), [saved.length, typeCounts, t])

  // Filtered items
  const filtered = useMemo(() => {
    if (!activeType) return saved
    return saved.filter((i) => i.experience.type === activeType)
  }, [saved, activeType])

  // Header map/list toggle action
  const rightActions = [
    {
      icon: (viewMode === 'list' ? 'map-outline' : 'list-outline') as React.ComponentProps<typeof Ionicons>['name'],
      onPress: () => setViewMode((v) => (v === 'list' ? 'map' : 'list')),
    },
  ]

  const listHeader = useMemo(() => (
    <View>
      <Animated.View style={expandedSectionStyle}>
        <Text className="text-[34px] font-bold text-neutral-900 dark:text-neutral-50 pt-1 pb-3">
          {t('saved_title')}
        </Text>
      </Animated.View>
      <View className="mb-2">
        <TypeIconFilter
          tabs={TYPE_TABS}
          active={activeType}
          onChange={handleFilterChange}
          isDark={isDark}
        />
      </View>
    </View>
  ), [expandedSectionStyle, TYPE_TABS, activeType, handleFilterChange, isDark, t])

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
      <AppHeader
        title={t('saved_title')}
        scrollY={scrollY}
        expandProgress={sectionProgress}
        rightActions={rightActions}
      />

      {isLoading ? (
        <View className="px-5 pt-2 gap-3">
          {[0, 1, 2].map((i) => <SavedExperienceCardSkeleton key={i} index={i} />)}
        </View>
      ) : viewMode === 'map' ? (
        /* ── Map view ── */
        <View style={{ flex: 1 }}>
          <View className="px-5 pb-2 pt-1">
            <TypeIconFilter
              tabs={TYPE_TABS}
              active={activeType}
              onChange={handleFilterChange}
              isDark={isDark}
            />
          </View>
          <SavedExperiencesMap
            items={filtered}
            onItemPress={(id) => router.push(`/saved-experiences/${id}`)}
          />
        </View>
      ) : (
        /* ── List view ── */
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
      )}
    </SafeAreaView>
  )
}
