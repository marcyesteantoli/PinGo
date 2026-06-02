import { useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Alert, Linking, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import MapView, { Marker } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useWishlistItems } from '@features/wishlist/hooks/useWishlistItems'
import { useDeleteWishlistItem } from '@features/wishlist/hooks/useDeleteWishlistItem'
import { useToggleWishlistVisited } from '@features/wishlist/hooks/useToggleWishlistVisited'
import { useUpdateWishlistNote } from '@features/wishlist/hooks/useUpdateWishlistNote'
import { AddWishlistSheet } from '@features/wishlist/components/AddWishlistSheet'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import type { WishlistItemType } from '@/types/index'
import { TYPE_COLORS } from '@/features/wishlist/constants'

const TYPE_ICONS: Record<WishlistItemType, keyof typeof Ionicons.glyphMap> = {
  city: 'business-outline',
  restaurant: 'restaurant-outline',
  activity: 'bicycle-outline',
  accommodation: 'bed-outline',
  entertainment: 'film-outline',
  other: 'ellipsis-horizontal-outline',
}

export default function WishlistItemDetailScreen() {
  const router = useRouter()
  const { itemId } = useLocalSearchParams<{ itemId: string }>()
  const { isDark } = useTheme()
  const { t } = useTranslation()

  const { data: items = [] } = useWishlistItems()
  const item = items.find((i) => i.id === itemId)

  const deleteItem = useDeleteWishlistItem()
  const toggleVisited = useToggleWishlistVisited()
  const updateNote = useUpdateWishlistNote(itemId)

  const [editSheetVisible, setEditSheetVisible] = useState(false)
  const [noteText, setNoteText] = useState<string | undefined>(undefined)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  if (!item) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          className="flex-row items-center px-4 py-3.5"
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary[500]} />
        </TouchableOpacity>
        <View className="flex-1 items-center justify-center">
          <Text className="text-[15px] text-neutral-500 dark:text-neutral-400">{t('wishlist_detail_notFound')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  const isVisited = !!item.visited_at
  const typeColor = TYPE_COLORS[item.type]
  const location = item.location

  function handleToggleVisited() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    toggleVisited.mutate({ itemId: item.id, currentVisitedAt: item.visited_at })
  }

  function handleDelete() {
    Alert.alert(
      t('wishlist_delete_title'),
      t('wishlist_delete_body', { name: item.name }),
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: t('common_delete'),
          style: 'destructive',
          onPress: () => {
            deleteItem.mutate(item.id, {
              onSuccess: () => router.back(),
            })
          },
        },
      ]
    )
  }

  function openInMaps() {
    if (!location?.lat || !location?.lng) return
    const label = encodeURIComponent(location.address ?? item.name)
    const googleUrl = `comgooglemaps://?q=${label}&center=${location.lat},${location.lng}`
    const fallback = Platform.OS === 'ios'
      ? `maps://?ll=${location.lat},${location.lng}&q=${label}`
      : `geo:${location.lat},${location.lng}?q=${label}`
    Linking.canOpenURL(googleUrl).then((supported) =>
      Linking.openURL(supported ? googleUrl : fallback)
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
      {/* Nav bar */}
      <View className="flex-row items-center px-2 py-2.5 bg-neutral-100 dark:bg-surface-900">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          className="flex-row items-center pl-2 pr-3 min-w-[80px]"
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary[500]} />
          <Text className="text-[17px] ml-0.5" style={{ color: colors.primary[500] }}>{t('wishlist_detail_back')}</Text>
        </TouchableOpacity>
        <View className="flex-1" />
        <View className="flex-row items-center gap-1">
          <TouchableOpacity onPress={handleDelete} hitSlop={12} className="p-2">
            <Ionicons name="trash-outline" size={20} color={colors.neutral[400]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditSheetVisible(true)} hitSlop={12} className="p-2">
            <Ionicons name="create-outline" size={22} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Main card */}
        <View className="rounded-2xl mb-3" style={cardShadow}>
          <View className="bg-white dark:bg-surface-800 rounded-2xl p-4">
            {/* Type badge */}
            <View className="flex-row items-center gap-1.5 mb-3">
              <View style={{ backgroundColor: typeColor + '20', borderRadius: 8, padding: 5 }}>
                <Ionicons name={TYPE_ICONS[item.type]} size={15} color={typeColor} />
              </View>
              <Text style={{ color: typeColor }} className="text-[13px] font-semibold">
                {t(`wishlist_type_${item.type}`)}
              </Text>
            </View>

            {/* Name */}
            <Text
              className={`text-[24px] font-bold text-neutral-900 dark:text-neutral-50 leading-[30px] mb-4 ${isVisited ? 'line-through opacity-60' : ''}`}
            >
              {item.name}
            </Text>

            {/* Visited toggle */}
            <View
              className="flex-row items-center justify-between px-1 py-3 mt-1 rounded-xl"
              style={{
                borderTopWidth: 0.5,
                borderTopColor: isDark ? colors.surface[700] : colors.neutral[100],
                backgroundColor: isVisited
                  ? (isDark ? '#064e3b30' : '#d1fae540')
                  : 'transparent',
              }}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons
                  name={isVisited ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={20}
                  color={isVisited ? '#10b981' : (isDark ? colors.neutral[400] : colors.neutral[500])}
                />
                <Text
                  className="text-[15px] font-medium"
                  style={{ color: isVisited ? '#10b981' : (isDark ? colors.neutral[300] : colors.neutral[700]) }}
                >
                  {t('wishlist_detail_visited')}
                </Text>
              </View>
              <Switch
                value={isVisited}
                onValueChange={handleToggleVisited}
                disabled={toggleVisited.isPending}
                trackColor={{ false: colors.neutral[300], true: '#10b981' }}
                thumbColor="white"
                ios_backgroundColor={colors.neutral[300]}
              />
            </View>
          </View>
        </View>

        {/* Location card */}
        {location?.lat && location?.lng ? (
          <View className="rounded-2xl mb-3" style={cardShadow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openInMaps}
              className="rounded-2xl overflow-hidden"
            >
              <MapView
                style={{ height: 160, width: '100%' }}
                region={{
                  latitude: location.lat,
                  longitude: location.lng,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                pointerEvents="none"
              >
                <Marker coordinate={{ latitude: location.lat, longitude: location.lng }} />
              </MapView>
              <View className="bg-white dark:bg-surface-800 px-4 py-3 flex-row items-center gap-2.5">
                <Ionicons name="location" size={16} color={colors.primary[500]} />
                <Text numberOfLines={1} className="flex-1 text-sm text-neutral-700 dark:text-neutral-200">
                  {location.address ?? [location.city, location.country].filter(Boolean).join(', ')}
                </Text>
                <Ionicons name="open-outline" size={14} color={colors.neutral[400]} />
              </View>
            </TouchableOpacity>
          </View>
        ) : location?.city || location?.country ? (
          <View className="rounded-2xl mb-3" style={cardShadow}>
            <View className="bg-white dark:bg-surface-800 rounded-2xl px-4 py-3 flex-row items-center gap-2.5">
              <Ionicons name="location" size={16} color={colors.primary[500]} />
              <Text className="flex-1 text-sm text-neutral-700 dark:text-neutral-200">
                {[location.city, location.country].filter(Boolean).join(', ')}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Note card */}
        <View className="rounded-2xl mb-3" style={cardShadow}>
          <View className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden">
            <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide px-4 pt-3.5 pb-1.5">
              {t('wishlist_detail_noteLabel')}
            </Text>
            <View
              className="px-4 py-3 border-neutral-100 dark:border-surface-700"
              style={{ borderTopWidth: 0.5 }}
            >
              <TextInput
                value={noteText ?? item.note ?? ''}
                onChangeText={(text) => {
                  setNoteText(text)
                  clearTimeout(noteTimer.current)
                  noteTimer.current = setTimeout(() => updateNote.mutate(text), 800)
                }}
                onBlur={() => {
                  clearTimeout(noteTimer.current)
                  updateNote.mutate(noteText ?? item.note ?? '')
                }}
                placeholder={t('wishlist_detail_notePlaceholder')}
                placeholderTextColor={isDark ? colors.neutral[600] : colors.neutral[400]}
                multiline
                style={{
                  fontSize: 15,
                  color: isDark ? colors.neutral[50] : colors.neutral[900],
                  minHeight: 80,
                  textAlignVertical: 'top',
                  padding: 0,
                }}
              />
            </View>
          </View>
        </View>

      </ScrollView>

      <AddWishlistSheet
        visible={editSheetVisible}
        onClose={() => setEditSheetVisible(false)}
        editItem={item}
      />
    </SafeAreaView>
  )
}
