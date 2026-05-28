import { useMemo, useState } from 'react'
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Animated, {
  interpolate,
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
import { AppHeader, useAppHeader } from '@components/ui/AppHeader'
import { SegmentedTabBar } from '@components/ui/SegmentedTabBar'
import { useWishlistItems } from '@features/wishlist/hooks/useWishlistItems'
import { useDeleteWishlistItem } from '@features/wishlist/hooks/useDeleteWishlistItem'
import { useToggleWishlistVisited } from '@features/wishlist/hooks/useToggleWishlistVisited'
import { WishlistCard } from '@features/wishlist/components/WishlistCard'
import { AddWishlistSheet } from '@features/wishlist/components/AddWishlistSheet'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { fabShadow } from '@lib/shadows'
import type { WishlistItem, WishlistItemType } from '@types/index'

const TYPE_FILTERS: { key: WishlistItemType | null; label: string }[] = [
  { key: null,            label: 'Todos' },
  { key: 'city',          label: 'Ciudad' },
  { key: 'restaurant',    label: 'Restaurante' },
  { key: 'activity',      label: 'Actividad' },
  { key: 'accommodation', label: 'Alojamiento' },
  { key: 'other',         label: 'Otro' },
]

type VisitedFilter = 'pending' | 'visited'

export default function WishlistScreen() {
  const { isDark } = useTheme()
  const router = useRouter()
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

  const fabVisible = useSharedValue(1)

  useAnimatedReaction(
    () => scrollY.value,
    (current, prev) => {
      if (prev === null) return
      const dy = current - prev
      if (dy > 8 && fabVisible.value === 1) {
        fabVisible.value = withTiming(0, { duration: 200 })
      } else if (dy < -8 && fabVisible.value === 0) {
        fabVisible.value = withTiming(1, { duration: 200 })
      }
    }
  )

  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(fabVisible.value, [0, 1], [80, 0]) }],
    opacity: fabVisible.value,
  }))

  const scrollRef = useAnimatedRef<Animated.ScrollView>()

  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<WishlistItemType | null>(null)
  const [visitedFilter, setVisitedFilter] = useState<VisitedFilter>('pending')
  const [sheetVisible, setSheetVisible] = useState(false)
  const [editItem, setEditItem] = useState<WishlistItem | undefined>(undefined)

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
      'Eliminar deseo',
      `¿Eliminar "${item.name}" de tu lista?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteItem.mutate(item.id),
        },
      ]
    )
  }

  const handleFilterChange = (key: string) => {
    setVisitedFilter(key as VisitedFilter)
    scrollTo(scrollRef, 0, 0, true)
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
      <AppHeader
        title="Mis deseos"
        scrollY={scrollY}
        expandProgress={sectionProgress}
        rightActions={[{ icon: 'add', onPress: handleOpenAdd }]}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-[15px] text-neutral-500 dark:text-neutral-400">Cargando...</Text>
        </View>
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
              Mis deseos
            </Text>
          </View>

          {/* index 1: controles sticky — tab bar + búsqueda + filtros */}
          <View className="bg-neutral-100 dark:bg-surface-900">
            <SegmentedTabBar
              tabs={[
                { key: 'pending', label: 'Pendientes', icon: 'heart-outline' },
                { key: 'visited', label: 'Visitados', icon: 'checkmark-circle-outline' },
              ]}
              active={visitedFilter}
              onChange={handleFilterChange}
              className="mb-3"
            />

            <View className="px-5 pb-2.5">
              <View className="flex-row items-center bg-white dark:bg-surface-800 rounded-xl px-3 py-2.5 gap-2">
                <Ionicons name="search" size={16} color={isDark ? colors.neutral[500] : colors.neutral[400]} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Buscar por nombre o ubicación..."
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

          {/* index 2: items */}
          <View className="px-5 pt-1 pb-24 gap-3">
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
                    Aún no tienes deseos
                  </Text>
                  <Text className="text-[15px] text-neutral-500 dark:text-neutral-400 text-center leading-[22px]">
                    Añade ciudades, restaurantes y lugares que quieres visitar algún día.
                  </Text>
                  <TouchableOpacity
                    onPress={handleOpenAdd}
                    activeOpacity={0.85}
                    className="mt-6 bg-primary-500 rounded-[14px] px-6 py-3"
                  >
                    <Text className="text-white text-[15px] font-semibold">Añadir primer deseo</Text>
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
                      ? 'Sin deseos visitados'
                      : activeType
                      ? `Sin deseos de tipo "${activeTypeLabel}"`
                      : `Sin resultados para "${search}"`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => { setActiveType(null); setSearch('') }}
                    className="mt-3 px-5 py-2.5 rounded-full bg-neutral-200 dark:bg-surface-700"
                  >
                    <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                      Ver todos
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null
            ) : (
              filtered.map((item) => (
                <WishlistCard
                  key={item.id}
                  item={item}
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
          </View>
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
