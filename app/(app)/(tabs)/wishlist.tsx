import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import Animated, {
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppHeader, useAppHeader } from '@components/ui/AppHeader'
import { Skeleton } from '@components/ui/Skeleton'
import { SegmentedTabBar } from '@components/ui/SegmentedTabBar'
import { useWishlistItems } from '@features/wishlist/hooks/useWishlistItems'
import { useDeleteWishlistItem } from '@features/wishlist/hooks/useDeleteWishlistItem'
import { useToggleWishlistVisited } from '@features/wishlist/hooks/useToggleWishlistVisited'
import { WishlistCard } from '@features/wishlist/components/WishlistCard'
import { AddWishlistSheet } from '@features/wishlist/components/AddWishlistSheet'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { cardShadow, fabShadow } from '@lib/shadows'
import { useStaggerEnter } from '@lib/useStaggerEnter'
import { useFabScroll } from '@lib/useFabScroll'
import { EASE_OUT, DURATION } from '@lib/animations'
import type { WishlistItem, WishlistItemType } from '@types/index'


type VisitedFilter = 'pending' | 'visited'

function WishlistCardSkeleton() {
  return (
    <View className="bg-white dark:bg-surface-800 rounded-2xl px-4 pt-3.5 pb-3.5" style={cardShadow}>
      <View className="flex-row items-center gap-3">
        <Skeleton width={44} height={44} className="rounded-xl" />
        <View className="flex-1 gap-2">
          <Skeleton height={18} className="w-3/4" />
          <Skeleton height={13} className="w-2/5" />
        </View>
      </View>
    </View>
  )
}

function StaggeredWishlistCard(props: React.ComponentProps<typeof WishlistCard> & { index: number }) {
  const { index, ...rest } = props
  const staggerStyle = useStaggerEnter(index, { delay: 55, duration: 280 })
  return (
    <Animated.View style={staggerStyle}>
      <WishlistCard {...rest} />
    </Animated.View>
  )
}

function FilterPill({ isActive, label, count, onPress }: { isActive: boolean; label: string; count?: number; onPress: () => void }) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const isEmpty = count !== undefined && count === 0
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.95, { duration: DURATION.press, easing: EASE_OUT }) }}
      onPressOut={() => { scale.value = withTiming(1, { duration: DURATION.press, easing: EASE_OUT }) }}
    >
      <Animated.View
        style={[animStyle, isEmpty ? { opacity: 0.45 } : undefined]}
        className={`flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full ${isActive ? 'bg-primary-500 dark:bg-primary-400' : 'bg-white dark:bg-surface-800'}`}
      >
        <Text className={`text-[13px] ${isActive ? 'font-semibold text-white' : 'font-normal text-neutral-600 dark:text-neutral-300'}`}>
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View className={`px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-primary-100 dark:bg-primary-600/40'}`}>
            <Text className={`text-[10px] font-semibold ${isActive ? 'text-white' : 'text-primary-600 dark:text-primary-300'}`}>
              {count}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  )
}

export default function WishlistScreen() {
  const { isDark } = useTheme()
  const router = useRouter()
  const { scrollY, scrollHandler } = useAppHeader()
  const { t } = useTranslation()

  const TYPE_FILTERS: { key: WishlistItemType | null; label: string }[] = [
    { key: null,            label: t('wishlist_type_all') },
    { key: 'city',          label: t('wishlist_type_city') },
    { key: 'restaurant',    label: t('wishlist_type_restaurant') },
    { key: 'activity',      label: t('wishlist_type_activity') },
    { key: 'accommodation', label: t('wishlist_type_accommodation') },
    { key: 'entertainment', label: t('wishlist_type_entertainment') },
    { key: 'other',         label: t('wishlist_type_other') },
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

  const { fabAnimStyle } = useFabScroll(scrollY)

  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const contentOpacity = useSharedValue(1)
  const contentAnimStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }))

  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<WishlistItemType | null>(null)
  const [visitedFilter, setVisitedFilter] = useState<VisitedFilter>('pending')
  const [sheetVisible, setSheetVisible] = useState(false)
  const [editItem, setEditItem] = useState<WishlistItem | undefined>(undefined)

  const peekChecked = useRef(false)
  const [peekReady, setPeekReady] = useState(false)

  const { data: items = [], isLoading } = useWishlistItems()
  const deleteItem = useDeleteWishlistItem()
  const toggleVisited = useToggleWishlistVisited()

  const filtered = useMemo(() => {
    let result: WishlistItem[] = items

    result = result.filter((i) =>
      visitedFilter === 'visited' ? !!i.visited_at : !i.visited_at
    )

    if (activeType) {
      result = result.filter((i) => i.type === activeType)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((i) => {
        const loc = [i.location?.city, i.location?.country].filter(Boolean).join(' ').toLowerCase()
        return i.name.toLowerCase().includes(q) || loc.includes(q)
      })
    }

    return result
  }, [items, activeType, search, visitedFilter])

  const typeCounts = useMemo(() => {
    const base = items.filter((i) =>
      visitedFilter === 'visited' ? !!i.visited_at : !i.visited_at
    )
    const map: Partial<Record<WishlistItemType, number>> = {}
    for (const item of base) {
      map[item.type] = (map[item.type] ?? 0) + 1
    }
    return map
  }, [items, visitedFilter])

  const isFiltered = !!activeType || !!search.trim()
  const activeTypeLabel = TYPE_FILTERS.find((f) => f.key === activeType)?.label ?? ''

  function handleOpenAdd() {
    setEditItem(undefined)
    setSheetVisible(true)
  }

  function handleEdit(item: WishlistItem) {
    setEditItem(item)
    setSheetVisible(true)
  }

  function handleDelete(item: WishlistItem) {
    Alert.alert(
      t('wishlist_delete_title'),
      t('wishlist_delete_body', { name: item.name }),
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: t('common_delete'),
          style: 'destructive',
          onPress: () => deleteItem.mutate(item.id),
        },
      ]
    )
  }

  const handleFilterChange = (key: string) => {
    scrollTo(scrollRef, 0, 0, true)
    contentOpacity.value = withTiming(0, { duration: 100, easing: EASE_OUT })
    setTimeout(() => setVisitedFilter(key as VisitedFilter), 110)
  }

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: DURATION.normal, easing: EASE_OUT })
  }, [visitedFilter])

  useEffect(() => {
    if (isLoading || items.length === 0 || peekChecked.current) return
    peekChecked.current = true
    AsyncStorage.getItem('@tripsync/wishlist_swipe_peek_shown').then((val) => {
      if (!val) {
        setPeekReady(true)
        void AsyncStorage.setItem('@tripsync/wishlist_swipe_peek_shown', '1')
      }
    })
  }, [isLoading, items.length])

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
      <AppHeader
        title={t('wishlist_title')}
        scrollY={scrollY}
        expandProgress={sectionProgress}
      />

      {isLoading ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="px-5">
            <Text className="text-[34px] font-bold text-neutral-900 dark:text-neutral-50 pt-2 pb-3">
              {t('wishlist_title')}
            </Text>
          </View>
          <View className="px-5 pt-1 pb-24 gap-3">
            {[0, 1, 2, 3, 4].map((i) => <WishlistCardSkeleton key={i} />)}
          </View>
        </ScrollView>
      ) : (
        <Animated.ScrollView
          ref={scrollRef}
          stickyHeaderIndices={[1]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {/* index 0: título scrollea hacia arriba */}
          <View className="px-5">
            <Text className="text-[34px] font-bold text-neutral-900 dark:text-neutral-50 pt-2 pb-3">
              {t('wishlist_title')}
            </Text>
          </View>

          {/* index 1: controles sticky — tab bar + búsqueda + filtros */}
          <View className="bg-neutral-100 dark:bg-surface-900">
            <SegmentedTabBar
              tabs={[
                { key: 'pending', label: t('wishlist_segment_pending'), icon: 'heart-outline' },
                { key: 'visited', label: t('wishlist_segment_visited'), icon: 'checkmark-circle-outline' },
              ]}
              active={visitedFilter}
              onChange={handleFilterChange}
              className="mx-5 mb-3"
            />

            <View className="px-5 pb-2.5">
              <View className="flex-row items-center bg-white dark:bg-surface-800 rounded-xl px-3 py-2.5 gap-2">
                <Ionicons name="search" size={16} color={isDark ? colors.neutral[500] : colors.neutral[400]} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t('wishlist_search_placeholder')}
                  placeholderTextColor={isDark ? colors.neutral[600] : colors.neutral[400]}
                  className="flex-1 text-[15px] text-neutral-900 dark:text-neutral-50"
                  style={{ padding: 0 }}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 12, paddingHorizontal: 20, gap: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              {TYPE_FILTERS.map((filter) => (
                <FilterPill
                  key={String(filter.key)}
                  isActive={activeType === filter.key}
                  label={filter.label}
                  count={filter.key !== null ? (typeCounts[filter.key] ?? 0) : undefined}
                  onPress={() => setActiveType(filter.key)}
                />
              ))}
            </ScrollView>
          </View>

          {/* index 2: items */}
          <Animated.View style={contentAnimStyle} className="px-5 pt-1 pb-24 gap-3">
            {filtered.length === 0 ? (
              items.length === 0 ? (
                <View className="items-center justify-center px-8 pt-16">
                  <Ionicons
                    name="heart-outline"
                    size={52}
                    color={isDark ? colors.neutral[500] : colors.neutral[400]}
                    style={{ marginBottom: 16 }}
                  />
                  <Text className="text-[18px] font-semibold text-neutral-700 dark:text-neutral-200 text-center mb-2">
                    {t('wishlist_empty_title')}
                  </Text>
                  <Text className="text-[15px] text-neutral-500 dark:text-neutral-400 text-center leading-[22px]">
                    {t('wishlist_empty_subtitle')}
                  </Text>
                  <TouchableOpacity
                    onPress={handleOpenAdd}
                    activeOpacity={0.85}
                    className="mt-6 bg-primary-500 rounded-2xl px-6 py-3"
                  >
                    <Text className="text-white text-[15px] font-semibold">{t('wishlist_empty_action')}</Text>
                  </TouchableOpacity>
                </View>
              ) : isFiltered || visitedFilter === 'visited' ? (
                <View className="items-center justify-center px-8 pt-16">
                  <Ionicons
                    name={visitedFilter === 'visited' ? 'checkmark-circle-outline' : 'filter-outline'}
                    size={44}
                    color={isDark ? colors.neutral[500] : colors.neutral[400]}
                    style={{ marginBottom: 16 }}
                  />
                  <Text className="text-[17px] font-semibold text-neutral-700 dark:text-neutral-200 text-center mb-2">
                    {visitedFilter === 'visited' && !isFiltered
                      ? t('wishlist_noVisited_title')
                      : activeType
                      ? t('wishlist_noType', { type: activeTypeLabel })
                      : t('wishlist_noQuery', { query: search })}
                  </Text>
                  <TouchableOpacity
                    onPress={() => { setActiveType(null); setSearch('') }}
                    className="mt-3 px-5 py-2.5 rounded-full bg-neutral-200 dark:bg-surface-700"
                  >
                    <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                      {t('wishlist_seeAll')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null
            ) : (
              filtered.map((item, index) => (
                <StaggeredWishlistCard
                  key={item.id}
                  item={item}
                  index={index}
                  peekOnMount={peekReady && index === 0}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onPress={() => router.push({ pathname: '/wishlist/[itemId]' as any, params: { itemId: item.id } })}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => handleDelete(item)}
                  onToggleVisited={() =>
                    toggleVisited.mutate({ itemId: item.id, currentVisitedAt: item.visited_at })
                  }
                />
              ))
            )}
          </Animated.View>
        </Animated.ScrollView>
      )}

      {/* FAB */}
      <Animated.View className="absolute right-5" style={[fabAnimStyle, { bottom: 16 }]} pointerEvents="box-none">
        <TouchableOpacity
          onPress={handleOpenAdd}
          activeOpacity={0.85}
          className="w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
          style={fabShadow}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>

      <AddWishlistSheet
        visible={sheetVisible}
        onClose={() => { setSheetVisible(false); setEditItem(undefined) }}
        editItem={editItem}
      />
    </SafeAreaView>
  )
}
