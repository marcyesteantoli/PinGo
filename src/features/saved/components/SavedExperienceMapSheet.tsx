import { useRef } from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Badge } from '@components/ui/Badge'
import { TYPE_ICON, TYPE_ICON_COLOR } from '@features/saved/constants'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import type { SavedExperienceItem, Experience } from '@app-types/index'

function getLocationName(location: unknown): string {
  if (typeof location === 'object' && location !== null && 'name' in location) {
    return String((location as { name?: unknown }).name ?? '')
  }
  return ''
}

function calcAvgScore(ratings: Array<{ attribute: string; value: number }>): number | null {
  if (!ratings.length) return null
  const sum = ratings.reduce((acc, r) => acc + r.value, 0)
  return Math.round((sum / ratings.length) * 10) / 10
}

interface SavedExperienceMapSheetProps {
  item: SavedExperienceItem | null
  visible: boolean
  onClose: () => void
  onViewDetail: () => void
}

export function SavedExperienceMapSheet({ item, visible, onClose, onViewDetail }: SavedExperienceMapSheetProps) {
  const { isDark } = useTheme()
  const { t } = useTranslation()

  // Keep showing the last selected item's content while the sheet animates closed
  const lastItemRef = useRef<SavedExperienceItem | null>(null)
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
  item: SavedExperienceItem
  isDark: boolean
  t: (key: string) => string
  onViewDetail: () => void
}) {
  const { experience, note, price_paid, coverPhotoUrl } = item
  const type = experience.type as Experience['type']
  const typeColor = TYPE_ICON_COLOR[type]
  const score = calcAvgScore(experience.attribute_ratings)
  const locationName = getLocationName(experience.location)

  const labelColor = isDark ? colors.neutral[400] : colors.neutral[500]
  const titleColor = isDark ? colors.neutral[50] : colors.neutral[900]
  const scoreColor =
    score === null ? colors.neutral[400]
    : score >= 8   ? '#22C55E'
    : score >= 5   ? '#F59E0B'
                   : '#94A3B8'

  return (
    <View style={{ paddingBottom: 4 }}>
      {coverPhotoUrl ? (
        <Image
          source={{ uri: coverPhotoUrl }}
          resizeMode="cover"
          style={{ width: '100%', height: 150, borderRadius: 16, marginBottom: 14 }}
        />
      ) : (
        <View
          style={{
            width: '100%', height: 110, borderRadius: 16, marginBottom: 14,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: typeColor + '1A',
          }}
        >
          <Ionicons name={TYPE_ICON[type]} size={40} color={typeColor} />
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Badge label={t(`expType_${type}`)} variant={type} />
        {score !== null && (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: scoreColor, letterSpacing: -0.5 }}>
              {score.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: labelColor }}>/10</Text>
          </View>
        )}
      </View>

      <Text
        numberOfLines={2}
        style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.3, color: titleColor, marginBottom: 6 }}
      >
        {experience.title}
      </Text>

      {locationName ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 }}>
          <Ionicons name="location-outline" size={14} color={labelColor} />
          <Text numberOfLines={1} style={{ fontSize: 14, color: labelColor, flex: 1 }}>
            {locationName}
          </Text>
        </View>
      ) : null}

      {(price_paid != null || note) && (
        <View style={{ gap: 8, marginBottom: 18 }}>
          {price_paid != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="pricetag-outline" size={15} color={labelColor} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: titleColor }}>
                {price_paid} €
              </Text>
            </View>
          )}
          {note ? (
            <View
              style={{
                flexDirection: 'row', gap: 8,
                borderRadius: 12, padding: 12,
                backgroundColor: isDark ? colors.surface[700] : colors.neutral[50],
              }}
            >
              <Ionicons name="chatbubble-outline" size={14} color={labelColor} style={{ marginTop: 1 }} />
              <Text numberOfLines={2} style={{ fontSize: 13, lineHeight: 18, color: labelColor, flex: 1 }}>
                {note}
              </Text>
            </View>
          ) : null}
        </View>
      )}

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
