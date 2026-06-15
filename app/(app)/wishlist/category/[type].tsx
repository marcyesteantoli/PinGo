import { useMemo, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useWishlistItems } from '@features/wishlist/hooks/useWishlistItems'
import { useDeleteWishlistItem } from '@features/wishlist/hooks/useDeleteWishlistItem'
import { useToggleWishlistVisited } from '@features/wishlist/hooks/useToggleWishlistVisited'
import { WishlistCard } from '@features/wishlist/components/WishlistCard'
import { AddWishlistSheet } from '@features/wishlist/components/AddWishlistSheet'
import { SegmentedTabBar } from '@components/ui/SegmentedTabBar'
import { Skeleton } from '@components/ui/Skeleton'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import { useStaggerEnter } from '@lib/useStaggerEnter'
import { WISHLIST_TYPES, TYPE_COLORS, TYPE_BG_COLORS } from '@features/wishlist/constants'
import type { WishlistItem, WishlistItemType } from '@app-types/index'

type VisitedFilter = 'pending' | 'visited'

function CardSkeleton() {
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

function StaggeredCard(props: React.ComponentProps<typeof WishlistCard> & { index: number }) {
  const { index, ...rest } = props
  const style = useStaggerEnter(index, { delay: 55, duration: 280 })
  return <Animated.View style={style}><WishlistCard {...rest} /></Animated.View>
}

export default function WishlistCategoryScreen() {
  const router = useRouter()
  const { type, filter } = useLocalSearchParams<{ type: string; filter?: string }>()
  const { isDark } = useTheme()
  const { t } = useTranslation()

  const typeKey = type as WishlistItemType
  const typeConfig = WISHLIST_TYPES.find(w => w.key === typeKey)
  const typeColor = typeConfig ? TYPE_COLORS[typeKey] : colors.primary[500]
  const typeBgColor = typeConfig
    ? (isDark ? TYPE_BG_COLORS[typeKey].dark : TYPE_BG_COLORS[typeKey].light)
    : undefined

  const [visitedFilter, setVisitedFilter] = useState<VisitedFilter>(
    filter === 'visited' ? 'visited' : 'pending'
  )
  const [sheetVisible, setSheetVisible] = useState(false)
  const [editItem, setEditItem] = useState<WishlistItem | undefined>(undefined)

  const { data: allItems = [], isLoading } = useWishlistItems()
  const deleteItem = useDeleteWishlistItem()
  const toggleVisited = useToggleWishlistVisited()

  const filtered = useMemo(
    () =>
      allItems.filter(
        (i) =>
          i.type === typeKey &&
          (visitedFilter === 'visited' ? !!i.visited_at : !i.visited_at)
      ),
    [allItems, typeKey, visitedFilter]
  )

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

  const typeLabel = t(`wishlist_type_${typeKey}` as never)

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-3 gap-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
        </TouchableOpacity>

        <View className="flex-row items-center gap-2 flex-1">
          {typeBgColor && typeConfig && (
            <View
              style={{ backgroundColor: typeBgColor, width: 30, height: 30, borderRadius: 9 }}
              className="items-center justify-center"
            >
              <Ionicons name={typeConfig.icon} size={16} color={typeColor} />
            </View>
          )}
          <Text className="text-[20px] font-bold text-neutral-900 dark:text-neutral-50">
            {typeLabel}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-2 pb-24 gap-3">
            {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </View>
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <SegmentedTabBar
            tabs={[
              { key: 'pending', label: t('wishlist_segment_pending'), icon: 'heart-outline' },
              { key: 'visited', label: t('wishlist_segment_visited'), icon: 'checkmark-circle-outline' },
            ]}
            active={visitedFilter}
            onChange={(key) => setVisitedFilter(key as VisitedFilter)}
            className="mx-5 mb-3 mt-1"
          />

          <View className="px-5 pt-1 pb-24 gap-3">
            {filtered.length === 0 ? (
              <View className="items-center justify-center px-8 pt-16">
                <Ionicons
                  name={visitedFilter === 'visited' ? 'checkmark-circle-outline' : 'heart-outline'}
                  size={44}
                  color={isDark ? colors.neutral[500] : colors.neutral[400]}
                  style={{ marginBottom: 16 }}
                />
                <Text className="text-[17px] font-semibold text-neutral-700 dark:text-neutral-200 text-center mb-2">
                  {visitedFilter === 'visited'
                    ? t('wishlist_noVisited_title')
                    : t('wishlist_noType', { type: typeLabel })}
                </Text>
              </View>
            ) : (
              filtered.map((item, index) => (
                <StaggeredCard
                  key={item.id}
                  item={item}
                  index={index}
                  onPress={() =>
                    router.push({
                      pathname: '/wishlist/[itemId]' as never,
                      params: { itemId: item.id },
                    })
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
        </ScrollView>
      )}

      <AddWishlistSheet
        visible={sheetVisible}
        onClose={() => {
          setSheetVisible(false)
          setEditItem(undefined)
        }}
        editItem={editItem}
      />
    </SafeAreaView>
  )
}
