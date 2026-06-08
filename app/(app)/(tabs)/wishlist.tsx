import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import Animated, {
  scrollTo,
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
import { WishlistSwimlane } from '@features/wishlist/components/WishlistSwimlane'
import { AddWishlistSheet } from '@features/wishlist/components/AddWishlistSheet'
import { WISHLIST_TYPES } from '@features/wishlist/constants'
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

function SwimlaneSkeletonRow() {
  return (
    <View className="gap-2.5">
      <View className="flex-row items-center px-5 gap-2.5">
        <Skeleton width={32} height={32} className="rounded-[10px]" />
        <Skeleton height={15} className="w-24" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }} scrollEnabled={false}>
        {[0, 1, 2].map((i) => <Skeleton key={i} width={160} height={130} style={{ borderRadius: 16 }} />)}
      </ScrollView>
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

export default function WishlistScreen() {
  const { isDark } = useTheme()
  const router = useRouter()
  const { scrollY, scrollHandler } = useAppHeader()
  const { t } = useTranslation()

  const { fabAnimStyle } = useFabScroll(scrollY)

  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const contentOpacity = useSharedValue(1)
  const contentAnimStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }))

  const [search, setSearch] = useState('')
  const [visitedFilter, setVisitedFilter] = useState<VisitedFilter>('pending')
  const [sheetVisible, setSheetVisible] = useState(false)
  const [editItem, setEditItem] = useState<WishlistItem | undefined>(undefined)

  const peekChecked = useRef(false)
  const [peekReady, setPeekReady] = useState(false)

  const { data: items = [], isLoading } = useWishlistItems()
  const deleteItem = useDeleteWishlistItem()
  const toggleVisited = useToggleWishlistVisited()

  // Items in current tab (pending or visited)
  const tabItems = useMemo(
    () => items.filter((i) => (visitedFilter === 'visited' ? !!i.visited_at : !i.visited_at)),
    [items, visitedFilter]
  )

  // Swimlane groups — one per non-empty type
  const typeGroups = useMemo(() => {
    const order: WishlistItemType[] = ['city', 'restaurant', 'activity', 'accommodation', 'entertainment', 'other']
    return order
      .map((type) => ({
        type,
        label: t(`wishlist_type_${type}` as never),
        items: tabItems.filter((i) => i.type === type),
      }))
      .filter((g) => g.items.length > 0)
  }, [tabItems, t])

  // Search results (flat list, filtered within current tab)
  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return tabItems.filter((i) => {
      const loc = [i.location?.city, i.location?.country].filter(Boolean).join(' ').toLowerCase()
      return i.name.toLowerCase().includes(q) || loc.includes(q)
    })
  }, [tabItems, search])

  const isSearching = !!search.trim()

  const baseCount = tabItems.length
  const headerSubtitle = items.length === 0
    ? t('wishlist_header_empty')
    : t(visitedFilter === 'visited' ? 'wishlist_header_visited' : 'wishlist_header_pending', { count: baseCount })

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
    if (key === visitedFilter) return
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
        subtitle={headerSubtitle}
        scrollY={scrollY}
        rightActions={[{ icon: 'map-outline', onPress: () => router.push('/wishlist/map' as never), variant: 'primary' }]}
      />

      {isLoading ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="pt-2 pb-24 gap-6">
            <View className="mx-5">
              <Skeleton height={40} className="rounded-xl" />
            </View>
            {[0, 1, 2].map((i) => <SwimlaneSkeletonRow key={i} />)}
          </View>
        </ScrollView>
      ) : (
        <Animated.ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {/* Tabs + search */}
          <View className="pt-2">
            <SegmentedTabBar
              tabs={[
                { key: 'pending', label: t('wishlist_segment_pending'), icon: 'heart-outline' },
                { key: 'visited', label: t('wishlist_segment_visited'), icon: 'checkmark-circle-outline' },
              ]}
              active={visitedFilter}
              onChange={handleFilterChange}
              className="mx-5 mb-3"
            />

            <View className="px-5 pb-4">
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
          </View>

          {/* Content */}
          <Animated.View style={contentAnimStyle}>
            {isSearching ? (
              /* Flat search results */
              <View className="px-5 pb-24 gap-3">
                {searchResults.length === 0 ? (
                  <View className="items-center justify-center px-8 pt-16">
                    <Ionicons
                      name="search-outline"
                      size={44}
                      color={isDark ? colors.neutral[500] : colors.neutral[400]}
                      style={{ marginBottom: 16 }}
                    />
                    <Text className="text-[17px] font-semibold text-neutral-700 dark:text-neutral-200 text-center mb-2">
                      {t('wishlist_noQuery', { query: search })}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setSearch('')}
                      className="mt-3 px-5 py-2.5 rounded-full bg-neutral-200 dark:bg-surface-700"
                    >
                      <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                        {t('wishlist_seeAll')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  searchResults.map((item, index) => (
                    <StaggeredWishlistCard
                      key={item.id}
                      item={item}
                      index={index}
                      peekOnMount={false}
                      onPress={() =>
                        router.push({ pathname: '/wishlist/[itemId]' as never, params: { itemId: item.id } })
                      }
                      onEdit={() => handleEdit(item)}
                      onDelete={() => handleDelete(item)}
                      onToggleVisited={() =>
                        toggleVisited.mutate({ itemId: item.id, currentVisitedAt: item.visited_at })
                      }
                    />
                  ))
                )}
              </View>
            ) : (
              /* Swimlane layout */
              <View className="pb-24 gap-6 pt-1">
                {items.length === 0 ? (
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
                ) : typeGroups.length === 0 ? (
                  /* Has items but none in this tab */
                  <View className="items-center justify-center px-8 pt-16">
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={44}
                      color={isDark ? colors.neutral[500] : colors.neutral[400]}
                      style={{ marginBottom: 16 }}
                    />
                    <Text className="text-[17px] font-semibold text-neutral-700 dark:text-neutral-200 text-center mb-2">
                      {t('wishlist_noVisited_title')}
                    </Text>
                  </View>
                ) : (
                  typeGroups.map((group, index) => (
                    <WishlistSwimlane
                      key={group.type}
                      type={group.type}
                      label={group.label}
                      items={group.items}
                      index={index}
                      onCardPress={(item) =>
                        router.push({ pathname: '/wishlist/[itemId]' as never, params: { itemId: item.id } })
                      }
                      onSeeAll={() =>
                        router.push({
                          pathname: '/wishlist/category/[type]' as never,
                          params: { type: group.type, filter: visitedFilter },
                        })
                      }
                    />
                  ))
                )}
              </View>
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
