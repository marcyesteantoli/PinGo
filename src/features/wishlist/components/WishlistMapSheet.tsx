import { useRef } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@components/ui/BottomSheet'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { openInMaps } from '@lib/openInMaps'
import { TYPE_ICONS, TYPE_COLORS } from '@features/wishlist/constants'
import type { WishlistItem } from '@app-types/index'

interface WishlistMapSheetProps {
  item: WishlistItem | null
  visible: boolean
  onClose: () => void
  onViewDetail: () => void
}

export function WishlistMapSheet({ item, visible, onClose, onViewDetail }: WishlistMapSheetProps) {
  const { isDark } = useTheme()
  const { t } = useTranslation()

  const lastItemRef = useRef<WishlistItem | null>(null)
  if (item) lastItemRef.current = item
  const current = lastItemRef.current

  function handleViewDetail() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onClose()
    onViewDetail()
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {current && <SheetContent item={current} isDark={isDark} t={t} onViewDetail={handleViewDetail} />}
    </BottomSheet>
  )
}

function SheetContent({
  item,
  isDark,
  t,
  onViewDetail,
}: {
  item: WishlistItem
  isDark: boolean
  t: (key: string) => string
  onViewDetail: () => void
}) {
  const typeColor = TYPE_COLORS[item.type]
  const typeIcon = TYPE_ICONS[item.type]
  const labelColor = isDark ? colors.neutral[400] : colors.neutral[500]
  const titleColor = isDark ? colors.neutral[50] : colors.neutral[900]

  const locationLine = [item.location?.city, item.location?.country].filter(Boolean).join(', ')
  const { lat, lng, address } = item.location ?? {}
  const hasCoords = typeof lat === 'number' && typeof lng === 'number'

  function handleOpenMaps() {
    if (!hasCoords) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    openInMaps(lat, lng, address ?? item.name)
  }

  return (
    <View style={{ paddingBottom: 4 }}>
      <View style={{
        width: '100%', height: 110, borderRadius: 16, marginBottom: 14,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: typeColor + '1A',
      }}>
        <Ionicons name={typeIcon} size={40} color={typeColor} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 5,
          paddingHorizontal: 10, paddingVertical: 4,
          borderRadius: 20,
          backgroundColor: typeColor + '22',
        }}>
          <Ionicons name={typeIcon} size={12} color={typeColor} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: typeColor }}>
            {t(`wishlist_type_${item.type}` as never)}
          </Text>
        </View>
        {item.visited_at && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            marginLeft: 8, paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: 20,
            backgroundColor: '#22C55E22',
          }}>
            <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#22C55E' }}>
              {t('wishlist_segment_visited')}
            </Text>
          </View>
        )}
      </View>

      <Text
        numberOfLines={2}
        style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.3, color: titleColor, marginBottom: 6 }}
      >
        {item.name}
      </Text>

      {(locationLine || hasCoords) ? (
        <TouchableOpacity
          onPress={hasCoords ? handleOpenMaps : undefined}
          activeOpacity={hasCoords ? 0.6 : 1}
          disabled={!hasCoords}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14,
            paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
            backgroundColor: isDark ? colors.surface[700] : colors.neutral[100],
          }}
        >
          <Ionicons name="location-outline" size={14} color={labelColor} />
          <Text numberOfLines={1} style={{ fontSize: 14, color: labelColor, flex: 1 }}>
            {locationLine}
          </Text>
          {hasCoords && (
            <Ionicons name="chevron-forward" size={14} color={labelColor} />
          )}
        </TouchableOpacity>
      ) : null}

      {item.note ? (
        <View style={{
          flexDirection: 'row', gap: 8, borderRadius: 12, padding: 12, marginBottom: 18,
          backgroundColor: isDark ? colors.surface[700] : colors.neutral[50],
        }}>
          <Ionicons name="chatbubble-outline" size={14} color={labelColor} style={{ marginTop: 1 }} />
          <Text numberOfLines={2} style={{ fontSize: 13, lineHeight: 18, color: labelColor, flex: 1 }}>
            {item.note}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={onViewDetail}
        activeOpacity={0.85}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
          backgroundColor: colors.primary[500],
          borderRadius: 14,
          paddingVertical: 14,
        }}
      >
        <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>
          {t('saved_map_sheet_viewDetail')}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.white} />
      </TouchableOpacity>
    </View>
  )
}
