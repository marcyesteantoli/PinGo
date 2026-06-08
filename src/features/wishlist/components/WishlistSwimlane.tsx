import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useStaggerEnter } from '@lib/useStaggerEnter'
import { useTheme } from '@lib/theme'
import { TYPE_ICONS, TYPE_COLORS, TYPE_BG_COLORS } from '../constants'
import { WishlistLaneCard } from './WishlistLaneCard'
import type { WishlistItem, WishlistItemType } from '@types/index'

interface WishlistSwimlaneProps {
  type: WishlistItemType
  label: string
  items: WishlistItem[]
  index: number
  onCardPress: (item: WishlistItem) => void
  onSeeAll: () => void
}

export function WishlistSwimlane({ type, label, items, index, onCardPress, onSeeAll }: WishlistSwimlaneProps) {
  const { isDark } = useTheme()
  const { t } = useTranslation()
  const staggerStyle = useStaggerEnter(index, { delay: 80, duration: 280, distance: 14 })

  const typeColor = TYPE_COLORS[type]
  const typeIcon = TYPE_ICONS[type]
  const bgColor = isDark ? TYPE_BG_COLORS[type].dark : TYPE_BG_COLORS[type].light

  return (
    <Animated.View style={staggerStyle} className="gap-2.5">
      {/* Section header */}
      <View className="flex-row items-center px-5 gap-2.5">
        <View
          style={{ backgroundColor: bgColor, width: 32, height: 32, borderRadius: 10 }}
          className="items-center justify-center"
        >
          <Ionicons name={typeIcon} size={17} color={typeColor} />
        </View>

        <Text className="flex-1 text-[15px] font-bold text-neutral-900 dark:text-neutral-50">
          {label}
        </Text>

        <View className="bg-neutral-200 dark:bg-surface-700 rounded-full px-2 py-0.5 mr-1">
          <Text className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            {items.length}
          </Text>
        </View>

        <TouchableOpacity onPress={onSeeAll} hitSlop={8} activeOpacity={0.7}>
          <Text className="text-[13px] font-semibold text-primary-500">
            {t('wishlist_seeAll')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal lane */}
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WishlistLaneCard item={item} onPress={() => onCardPress(item)} />
        )}
      />
    </Animated.View>
  )
}
