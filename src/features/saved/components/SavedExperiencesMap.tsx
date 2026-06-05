import { useMemo, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import type { SavedExperienceItem, Experience } from '@types/index'

// ─── Type maps ────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<Experience['type'], React.ComponentProps<typeof Ionicons>['name']> = {
  transport:     'airplane-outline',
  accommodation: 'bed-outline',
  activity:      'compass-outline',
  restaurant:    'restaurant-outline',
  entertainment: 'film-outline',
  other:         'ellipse-outline',
}

const TYPE_BG_HEX: Record<Experience['type'], string> = {
  transport:     '#061E4E',
  accommodation: '#24064E',
  activity:      '#064E3B',
  restaurant:    '#4E1E06',
  entertainment: '#4E062A',
  other:         '#1E293B',
}

const TYPE_ICON_COLOR: Record<Experience['type'], string> = {
  transport:     '#3B82F6',
  accommodation: '#8B5CF6',
  activity:      '#22C55E',
  restaurant:    '#F97316',
  entertainment: '#EC4899',
  other:         '#94A3B8',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLocation(location: unknown): { lat: number; lng: number; name: string } | null {
  if (
    typeof location === 'object' &&
    location !== null &&
    'lat' in location &&
    'lng' in location
  ) {
    const loc = location as { lat?: number; lng?: number; name?: string }
    if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      return { lat: loc.lat, lng: loc.lng, name: loc.name ?? '' }
    }
  }
  return null
}

function calcAvgScore(ratings: Array<{ attribute: string; value: number }>): number | null {
  if (!ratings.length) return null
  const sum = ratings.reduce((acc, r) => acc + r.value, 0)
  return Math.round((sum / ratings.length) * 10) / 10
}

// ─── Mini card preview shown when a pin is tapped ────────────────────────────

function MiniCard({
  item,
  onNavigate,
  onClose,
}: {
  item: SavedExperienceItem
  onNavigate: () => void
  onClose: () => void
}) {
  const { isDark } = useTheme()
  const { t } = useTranslation()
  const type = item.experience.type as Experience['type']
  const score = calcAvgScore(item.experience.attribute_ratings)
  const loc = getLocation(item.experience.location)

  const scoreColor =
    score === null   ? colors.neutral[400]
    : score >= 8    ? '#22C55E'
    : score >= 5    ? '#F59E0B'
                    : '#94A3B8'

  return (
    <View style={[cardShadow, { borderRadius: 20, overflow: 'hidden' }]}>
      <View style={{
        backgroundColor: isDark ? colors.surface[800] : '#fff',
        borderRadius: 20,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
        {/* Type icon */}
        <View style={{
          width: 44, height: 44, borderRadius: 12,
          backgroundColor: TYPE_BG_HEX[type],
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Ionicons name={TYPE_ICON[type]} size={20} color={TYPE_ICON_COLOR[type]} />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 15, fontWeight: '700',
              color: isDark ? colors.neutral[50] : colors.neutral[900],
              marginBottom: 2,
            }}
          >
            {item.experience.title}
          </Text>
          {loc?.name ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="location-outline" size={11} color={colors.neutral[400]} />
              <Text numberOfLines={1} style={{ fontSize: 12, color: colors.neutral[400], flex: 1 }}>
                {loc.name}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Score */}
        {score !== null && (
          <View style={{ alignItems: 'center', flexShrink: 0 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: scoreColor, letterSpacing: -0.5 }}>
              {score.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 9, color: colors.neutral[400], fontWeight: '600' }}>/10</Text>
          </View>
        )}

        {/* Open detail */}
        <TouchableOpacity
          onPress={onNavigate}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: colors.primary[500],
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </TouchableOpacity>

        {/* Close */}
        <TouchableOpacity
          onPress={onClose}
          hitSlop={8}
          style={{ position: 'absolute', top: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={18} color={colors.neutral[400]} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Custom marker ────────────────────────────────────────────────────────────

function PinMarker({
  type,
  isSelected,
}: {
  type: Experience['type']
  isSelected: boolean
}) {
  return (
    <View style={{
      width: isSelected ? 44 : 36,
      height: isSelected ? 44 : 36,
      borderRadius: isSelected ? 22 : 18,
      backgroundColor: TYPE_BG_HEX[type],
      borderWidth: isSelected ? 3 : 2,
      borderColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Ionicons
        name={TYPE_ICON[type]}
        size={isSelected ? 20 : 16}
        color={TYPE_ICON_COLOR[type]}
      />
    </View>
  )
}

// ─── Main map component ───────────────────────────────────────────────────────

const DEFAULT_REGION = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 20,
  longitudeDelta: 20,
}

interface SavedExperiencesMapProps {
  items: SavedExperienceItem[]
  onItemPress: (experienceId: string) => void
}

export function SavedExperiencesMap({ items, onItemPress }: SavedExperiencesMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { t } = useTranslation()

  const locatedItems = useMemo(() =>
    items.filter((item) => getLocation(item.experience.location) !== null),
    [items]
  )

  const selectedItem = useMemo(() =>
    locatedItems.find((i) => i.experience.id === selectedId) ?? null,
    [locatedItems, selectedId]
  )

  const initialRegion = useMemo(() => {
    if (locatedItems.length === 0) return DEFAULT_REGION
    const lats = locatedItems.map((i) => getLocation(i.experience.location)!.lat)
    const lngs = locatedItems.map((i) => getLocation(i.experience.location)!.lng)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const pad = 0.5
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) + pad, 0.05),
      longitudeDelta: Math.max((maxLng - minLng) + pad, 0.05),
    }
  }, [locatedItems])

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        onPress={() => setSelectedId(null)}
      >
        {locatedItems.map((item) => {
          const loc = getLocation(item.experience.location)!
          const type = item.experience.type as Experience['type']
          return (
            <Marker
              key={item.experience.id}
              coordinate={{ latitude: loc.lat, longitude: loc.lng }}
              onPress={() => setSelectedId(item.experience.id)}
              tracksViewChanges={false}
            >
              <PinMarker type={type} isSelected={selectedId === item.experience.id} />
            </Marker>
          )
        })}
      </MapView>

      {/* No location empty state */}
      {locatedItems.length === 0 && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.15)',
        }}>
          <View style={{
            backgroundColor: '#fff', borderRadius: 20, padding: 24,
            alignItems: 'center', margin: 32,
          }}>
            <Ionicons name="map-outline" size={44} color={colors.neutral[400]} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.neutral[700], textAlign: 'center', marginBottom: 6 }}>
              {t('saved_map_noLocations_title', 'No locations yet')}
            </Text>
            <Text style={{ fontSize: 13, color: colors.neutral[400], textAlign: 'center' }}>
              {t('saved_map_noLocations_subtitle', 'Experiences with a location will appear here')}
            </Text>
          </View>
        </View>
      )}

      {/* Selected item preview card */}
      {selectedItem && (
        <View style={{ position: 'absolute', bottom: 24, left: 16, right: 16 }}>
          <MiniCard
            item={selectedItem}
            onNavigate={() => {
              setSelectedId(null)
              onItemPress(selectedItem.experience.id)
            }}
            onClose={() => setSelectedId(null)}
          />
        </View>
      )}
    </View>
  )
}
