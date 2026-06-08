import { useEffect, useMemo, useRef, useState } from 'react'
import { Image, Platform, Text, View } from 'react-native'
import MapView, { Marker, type MarkerPressEvent } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { TYPE_ICON, TYPE_ICON_COLOR } from '@features/saved/constants'
import { SavedExperienceMapSheet } from './SavedExperienceMapSheet'
import type { SavedExperienceItem, Experience } from '@types/index'

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

// angular spread (degrees) of the located experiences — null when there's nothing to fit
function calcSpreadDeg(items: SavedExperienceItem[]): number | null {
  const locs = items.map(i => getLocation(i.experience.location)).filter(Boolean) as Array<{ lat: number; lng: number }>
  if (locs.length === 0) return null
  const lats = locs.map(l => l.lat)
  const lngs = locs.map(l => l.lng)
  return Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs))
}

// iOS (Apple Maps) camera takes `altitude` in metres — proportional to spread so distant clusters look globe-like
function calcAltitude(spread: number | null): number {
  if (spread === null) return 5_000_000
  const km = spread * 111
  // factor empiric: altitude in metres ≈ km × 8000 with generous margins
  return Math.max(30_000, Math.min(12_000_000, km * 8_000))
}

// Android (Google Maps) camera has no `altitude` — it uses a log2 `zoom` level instead
function calcZoom(spread: number | null): number {
  if (spread === null) return 2
  return Math.max(1, Math.min(14, Math.log2(360 / Math.max(spread, 0.01))))
}

// ─── Photo-thumbnail map pin ──────────────────────────────────────────────────

function PinMarker({
  type,
  photoUrl,
  isSelected,
  onImageLoadEnd,
}: {
  type: Experience['type']
  photoUrl: string | null
  isSelected: boolean
  onImageLoadEnd?: () => void
}) {
  const size = isSelected ? 52 : 40
  const tipSize = isSelected ? 13 : 10
  const color = TYPE_ICON_COLOR[type]

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Shadow wrapper — kept separate from the clipping circle so iOS doesn't cut it off */}
      <View style={{
        borderRadius: size / 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
        shadowOpacity: isSelected ? 0.45 : 0.3,
        shadowRadius: isSelected ? 6 : 3,
        elevation: isSelected ? 8 : 4,
      }}>
        <View style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: isSelected ? 3 : 2.5,
          borderColor: '#ffffff',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: photoUrl ? colors.neutral[200] : color,
        }}>
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
              onLoadEnd={onImageLoadEnd}
            />
          ) : (
            <Ionicons name={TYPE_ICON[type]} size={isSelected ? 24 : 18} color="#ffffff" />
          )}
        </View>
      </View>
      {/* Teardrop tip — keeps the type colour visible even on photo pins */}
      <View style={{
        width: tipSize,
        height: tipSize,
        backgroundColor: color,
        transform: [{ rotate: '45deg' }],
        marginTop: -(tipSize / 2) - 1,
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
        elevation: 3,
      }} />
    </View>
  )
}

// On Android, a custom-view Marker rendered with `tracksViewChanges={false}` from the
// start never gets rasterised by Google Maps and stays invisible — keep tracking on
// until the photo has loaded (or a fallback timeout passes for icon-only pins), and
// again whenever the pin's appearance changes (selection).
function ExperienceMarker({
  item,
  isSelected,
  onPress,
}: {
  item: SavedExperienceItem
  isSelected: boolean
  onPress: (e: MarkerPressEvent) => void
}) {
  const photoUrl = item.coverPhotoUrl
  const [ready, setReady] = useState(Platform.OS === 'ios')

  useEffect(() => {
    if (ready) return
    // photo pins get more headroom — `onImageLoadEnd` below usually wins the race anyway
    const id = setTimeout(() => setReady(true), photoUrl ? 1200 : 300)
    return () => clearTimeout(id)
  }, [ready, photoUrl])

  const loc = getLocation(item.experience.location)!
  const type = item.experience.type as Experience['type']

  return (
    <Marker
      coordinate={{ latitude: loc.lat, longitude: loc.lng }}
      anchor={{ x: 0.5, y: 1 }}
      calloutAnchor={{ x: 0.5, y: 0 }}
      onPress={onPress}
      tracksViewChanges={!ready || isSelected}
    >
      <PinMarker type={type} photoUrl={photoUrl} isSelected={isSelected} onImageLoadEnd={() => setReady(true)} />
    </Marker>
  )
}

// ─── Dark vector style (Android — iOS uses native mutedStandard) ─────────────

const MAP_STYLE_DARK = [
  { elementType: 'geometry', stylers: [{ color: colors.surface[900] }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: colors.surface[900] }] },
  { elementType: 'labels.text.fill', stylers: [{ color: colors.neutral[400] }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: colors.surface[700] }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: colors.surface[800] }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: colors.neutral[500] }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: colors.surface[700] }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: colors.surface[800] }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: colors.surface[600] }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: colors.surface[800] }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: colors.surface[900] }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: colors.neutral[600] }] },
]

// ─── Main map component ───────────────────────────────────────────────────────

interface SavedExperiencesMapProps {
  items: SavedExperienceItem[]
  onItemPress: (experienceId: string) => void
}

export function SavedExperiencesMap({ items, onItemPress }: SavedExperiencesMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { isDark } = useTheme()
  const { t } = useTranslation()

  const locatedItems = useMemo(() =>
    items.filter((item) => getLocation(item.experience.location) !== null),
    [items]
  )

  const selectedItem = useMemo(() =>
    locatedItems.find((i) => i.experience.id === selectedId) ?? null,
    [locatedItems, selectedId]
  )

  const centerCoord = useMemo(() => {
    if (locatedItems.length === 0) return { latitude: 20, longitude: 0 }
    const lats = locatedItems.map((i) => getLocation(i.experience.location)!.lat)
    const lngs = locatedItems.map((i) => getLocation(i.experience.location)!.lng)
    return {
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    }
  }, [locatedItems])

  const spreadDeg = useMemo(() => calcSpreadDeg(locatedItems), [locatedItems])

  const initialCamera = useMemo(() =>
    Platform.OS === 'android'
      ? { center: centerCoord, pitch: 0, heading: 0, zoom: calcZoom(spreadDeg) }
      : { center: centerCoord, pitch: 0, heading: 0, altitude: Math.max(calcAltitude(spreadDeg), 8_000_000) },
    [centerCoord, spreadDeg]
  )

  const mapRef = useRef<MapView>(null)

  useEffect(() => {
    if (!selectedItem) return
    const loc = getLocation(selectedItem.experience.location)
    if (!loc) return
    mapRef.current?.animateCamera(
      Platform.OS === 'android'
        ? { center: { latitude: loc.lat, longitude: loc.lng }, zoom: 14 }
        : { center: { latitude: loc.lat, longitude: loc.lng }, altitude: 20_000 },
      { duration: 350 }
    )
  }, [selectedItem])

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        userInterfaceStyle={Platform.OS === 'ios' ? (isDark ? 'dark' : 'light') : undefined}
        customMapStyle={Platform.OS === 'android' && isDark ? MAP_STYLE_DARK : undefined}
        camera={initialCamera}
        onPress={() => setSelectedId(null)}
        showsCompass={false}
        showsScale={false}
      >
        {locatedItems.map((item) => (
          <ExperienceMarker
            key={item.experience.id}
            item={item}
            isSelected={selectedId === item.experience.id}
            onPress={(e) => {
              e.stopPropagation()
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setSelectedId(item.experience.id)
            }}
          />
        ))}
      </MapView>

      {/* No location empty state */}
      {locatedItems.length === 0 && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            backgroundColor: isDark ? colors.surface[800] : 'rgba(20,20,30,0.85)',
            borderRadius: 20,
            padding: 24,
            alignItems: 'center',
            margin: 32,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}>
            <Ionicons name="globe-outline" size={44} color={colors.neutral[400]} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.neutral[100], textAlign: 'center', marginBottom: 6 }}>
              {t('saved_map_noLocations_title', 'No locations yet')}
            </Text>
            <Text style={{ fontSize: 13, color: colors.neutral[400], textAlign: 'center' }}>
              {t('saved_map_noLocations_subtitle', 'Experiences with a location will appear here')}
            </Text>
          </View>
        </View>
      )}

      <SavedExperienceMapSheet
        item={selectedItem}
        visible={!!selectedItem}
        onClose={() => setSelectedId(null)}
        onViewDetail={() => selectedItem && onItemPress(selectedItem.experience.id)}
      />
    </View>
  )
}
