import { useEffect, useMemo, useRef, useState } from 'react'
import { Platform, Text, View } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE, type MarkerPressEvent, type Region } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { useMapClusters } from '@lib/useMapClusters'
import { PinMarker, ClusterMarker, useMarkerReady } from '@components/map/MapPin'
import { TYPE_ICON, TYPE_ICON_COLOR } from '@features/saved/constants'
import { SavedExperienceMapSheet } from './SavedExperienceMapSheet'
import type { SavedExperienceItem, Experience } from '@app-types/index'

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

function calcSpreadDeg(items: SavedExperienceItem[]): number | null {
  const locs = items.map(i => getLocation(i.experience.location)).filter(Boolean) as Array<{ lat: number; lng: number }>
  if (locs.length === 0) return null
  const lats = locs.map(l => l.lat)
  const lngs = locs.map(l => l.lng)
  return Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs))
}

function calcAltitude(spread: number | null): number {
  if (spread === null) return 5_000_000
  const km = spread * 111
  return Math.max(30_000, Math.min(12_000_000, km * 8_000))
}

function calcZoom(spread: number | null): number {
  if (spread === null) return 2
  return Math.max(1, Math.min(14, Math.log2(360 / Math.max(spread, 0.01))))
}

function spreadToRegion(
  centerCoord: { latitude: number; longitude: number },
  spreadDeg: number | null,
): Region {
  const delta = spreadDeg ? Math.max(spreadDeg * 1.4, 0.01) : 180
  return {
    latitude: centerCoord.latitude,
    longitude: centerCoord.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  }
}

// ─── Individual experience marker ─────────────────────────────────────────────
// On Android, a custom-view Marker rendered with `tracksViewChanges={false}` from the
// start never gets rasterised — keep tracking on until the photo has loaded (or a
// fallback timeout passes), and again whenever selection changes.

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
      <PinMarker
        color={TYPE_ICON_COLOR[type]}
        icon={TYPE_ICON[type]}
        photoUrl={photoUrl}
        isSelected={isSelected}
        onImageLoadEnd={() => setReady(true)}
      />
    </Marker>
  )
}

// ─── Cluster marker ────────────────────────────────────────────────────────────

function ExperienceClusterMarker({
  count,
  coordinate,
  onPress,
}: {
  count: number
  coordinate: { latitude: number; longitude: number }
  onPress: (e: MarkerPressEvent) => void
}) {
  const ready = useMarkerReady()
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={!ready}
      onPress={onPress}
    >
      <ClusterMarker count={count} />
    </Marker>
  )
}

// ─── Map styles (Android — custom Google Maps style) ─────────────────────────

const MAP_STYLE_DARK = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a1628' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7a9ab8' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1e3050' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#2a4a70' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#162842' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0d1e30' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e3a5a' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#0f2040' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1d35' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a6a8a' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#0c1828' }] },
]

const MAP_STYLE_LIGHT = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c8d8e8' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f2f2ed' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e0dcd8' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#e8e8e2' }] },
  { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#f0f0ec' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a4a5a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f8f8f5' }] },
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

  const [currentRegion, setCurrentRegion] = useState<Region>(() =>
    spreadToRegion(centerCoord, spreadDeg)
  )

  const clusterItems = useMemo(
    () =>
      locatedItems.map((item) => ({
        id: item.experience.id,
        lat: getLocation(item.experience.location)!.lat,
        lng: getLocation(item.experience.location)!.lng,
        data: item,
      })),
    [locatedItems]
  )

  const { clusters, getExpansionRegion } = useMapClusters<SavedExperienceItem>(clusterItems, currentRegion)

  const mapRef = useRef<MapView>(null)
  const hasCenteredRef = useRef(false)
  const mapReadyRef = useRef(false)

  const centerOnItems = () => {
    if (hasCenteredRef.current || locatedItems.length === 0) return
    hasCenteredRef.current = true
    mapRef.current?.setCamera(initialCamera)
  }

  const handleMapReady = () => {
    mapReadyRef.current = true
    centerOnItems()
  }

  useEffect(() => {
    if (!mapReadyRef.current) return
    centerOnItems()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locatedItems, initialCamera])

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
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={{ flex: 1 }}
        mapType="standard"
        userInterfaceStyle={Platform.OS === 'ios' ? (isDark ? 'dark' : 'light') : undefined}
        customMapStyle={Platform.OS === 'android' ? (isDark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT) : undefined}
        camera={initialCamera}
        onMapReady={handleMapReady}
        onRegionChangeComplete={setCurrentRegion}
        onPress={() => setSelectedId(null)}
        showsCompass={false}
        showsScale={false}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}
      >
        {clusters.map((item) => {
          if (item.type === 'cluster') {
            return (
              <ExperienceClusterMarker
                key={`cluster-${item.clusterId}-${item.count}`}
                count={item.count}
                coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                onPress={(e) => {
                  e.stopPropagation()
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  const region = getExpansionRegion(item.clusterId)
                  if (!region) return
                  const zoom = Math.max(0, Math.min(20, Math.round(Math.log2(360 / region.latitudeDelta))))
                  mapRef.current?.animateCamera(
                    Platform.OS === 'android'
                      ? { center: { latitude: region.latitude, longitude: region.longitude }, zoom }
                      : { center: { latitude: region.latitude, longitude: region.longitude }, altitude: Math.max(30_000, region.latitudeDelta * 111 * 8_000) },
                    { duration: 400 }
                  )
                }}
              />
            )
          }
          return (
            <ExperienceMarker
              key={item.id}
              item={item.data}
              isSelected={selectedId === item.id}
              onPress={(e) => {
                e.stopPropagation()
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setSelectedId(item.id)
              }}
            />
          )
        })}
      </MapView>

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
