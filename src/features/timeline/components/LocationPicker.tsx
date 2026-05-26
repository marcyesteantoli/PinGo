import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
// TODO: import PROVIDER_GOOGLE and set provider={PROVIDER_GOOGLE} on MapView when Google Maps API key is configured
import MapView, { Marker } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'

interface Location {
  name: string
  lat: number
  lng: number
  city?: string
}

interface LocationPickerProps {
  value?: Location
  onChange: (loc: Location | undefined) => void
  error?: string
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address?: {
    tourism?: string
    amenity?: string
    road?: string
    building?: string
    neighbourhood?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    country?: string
  }
}

async function searchPlaces(q: string): Promise<NominatimResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&accept-language=es`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'PinGo-TFM/1.0 (marcyesteantoli@gmail.com)' },
  })
  if (!res.ok) return []
  return res.json()
}

function getPlaceName(r: NominatimResult): string {
  return (
    r.address?.tourism ??
    r.address?.amenity ??
    r.address?.building ??
    r.address?.road ??
    r.address?.neighbourhood ??
    r.display_name.split(',')[0]
  )
}

function getPlaceSubtitle(r: NominatimResult): string {
  const parts = r.display_name.split(',').slice(1, 3).map((s) => s.trim())
  return parts.join(', ')
}

export function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const { isDark } = useTheme()
  const [modalVisible, setModalVisible] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selected, setSelected] = useState<Location | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const borderColor = error
    ? colors.error
    : isDark
    ? colors.surface[700]
    : colors.neutral[200]
  const bgColor = isDark ? colors.surface[800] : colors.white
  const textColor = isDark ? colors.neutral[50] : colors.neutral[900]
  const placeholderColor = colors.neutral[400]
  const modalBg = isDark ? colors.surface[900] : '#f2f2f7'
  const cardBg = isDark ? colors.surface[800] : colors.white
  const borderTop = isDark ? colors.surface[700] : colors.neutral[100]

  const handleOpen = () => {
    setQuery('')
    setResults([])
    setSelected(value ?? null)
    setModalVisible(true)
  }

  const handleClose = () => {
    setModalVisible(false)
    setSelected(null)
  }

  const handleConfirm = () => {
    if (selected) {
      onChange(selected)
    }
    setModalVisible(false)
    setSelected(null)
  }

  const handleQueryChange = (text: string) => {
    setQuery(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!text.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const data = await searchPlaces(text)
        setResults(data)
      } finally {
        setIsSearching(false)
      }
    }, 600)
  }

  const handleSelectResult = (result: NominatimResult) => {
    const city =
      result.address?.city ??
      result.address?.town ??
      result.address?.village ??
      result.address?.county ??
      result.address?.state
    setSelected({
      name: getPlaceName(result),
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      ...(city ? { city } : {}),
    })
    setResults([])
    setQuery('')
  }

  const showMap = selected !== null && results.length === 0

  return (
    <>
      {/* Trigger button */}
      <View style={{ gap: 4 }}>
        <Pressable
          onPress={handleOpen}
          style={{
            borderWidth: 1,
            borderColor,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: bgColor,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: 16,
              color: value ? textColor : placeholderColor,
            }}
          >
            {value ? value.name : 'Añadir ubicación'}
          </Text>
          {value ? (
            <TouchableOpacity
              onPress={() => onChange(undefined)}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={colors.neutral[400]} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="location-outline" size={18} color={colors.neutral[400]} />
          )}
        </Pressable>
        {error && (
          <Text style={{ fontSize: 14, color: colors.error }}>{error}</Text>
        )}
      </View>

      {/* Full-screen modal */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={handleClose}>
        <SafeAreaView style={{ flex: 1, backgroundColor: modalBg }}>
          {/* Nav bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: cardBg,
              borderBottomWidth: 0.5,
              borderBottomColor: borderTop,
            }}
          >
            <TouchableOpacity onPress={handleClose} style={{ minWidth: 72 }}>
              <Text style={{ fontSize: 17, color: colors.primary[500] }}>Cancelar</Text>
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 17,
                fontWeight: '600',
                color: textColor,
              }}
            >
              Ubicación
            </Text>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!selected}
              style={{ minWidth: 72, alignItems: 'flex-end' }}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '600',
                  color: selected ? colors.primary[500] : colors.neutral[400],
                }}
              >
                Listo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search input */}
          <View
            style={{
              margin: 16,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: cardBg,
              borderRadius: 12,
              paddingHorizontal: 12,
              gap: 8,
              borderWidth: 1,
              borderColor: isDark ? colors.surface[700] : colors.neutral[200],
            }}
          >
            <Ionicons name="search-outline" size={18} color={colors.neutral[400]} />
            <TextInput
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Buscar lugar..."
              placeholderTextColor={colors.neutral[400]}
              autoFocus
              style={{
                flex: 1,
                fontSize: 16,
                paddingVertical: 11,
                color: textColor,
              }}
            />
            {isSearching && <ActivityIndicator size="small" color={colors.neutral[400]} />}
            {query.length > 0 && !isSearching && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]) }}>
                <Ionicons name="close-circle" size={18} color={colors.neutral[400]} />
              </TouchableOpacity>
            )}
          </View>

          {/* Results list */}
          {results.length > 0 && (
            <View
              style={{
                marginHorizontal: 16,
                backgroundColor: cardBg,
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <FlatList
                data={results}
                keyExtractor={(item) => String(item.place_id)}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectResult(item)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      gap: 12,
                      borderTopWidth: index === 0 ? 0 : 0.5,
                      borderTopColor: borderTop,
                    }}
                  >
                    <Ionicons name="location-outline" size={18} color={colors.neutral[400]} />
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: 15, color: textColor, fontWeight: '500' }}
                      >
                        {getPlaceName(item)}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: 13, color: colors.neutral[400], marginTop: 1 }}
                      >
                        {getPlaceSubtitle(item)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.neutral[400]} />
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Empty state */}
          {!isSearching && results.length === 0 && !showMap && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="search-outline" size={40} color={colors.neutral[300]} />
              <Text style={{ fontSize: 15, color: colors.neutral[400] }}>
                {query.trim() ? 'Sin resultados' : 'Busca un lugar'}
              </Text>
            </View>
          )}

          {/* Map preview of selected place */}
          {showMap && selected && (
            <View style={{ marginHorizontal: 16, gap: 12 }}>
              <View style={{ borderRadius: 14, overflow: 'hidden' }}>
                <MapView
                  style={{ height: 220, width: '100%' }}
                  region={{
                    latitude: selected.lat,
                    longitude: selected.lng,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker coordinate={{ latitude: selected.lat, longitude: selected.lng }} />
                </MapView>
              </View>

              <View
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Ionicons name="location" size={16} color={colors.primary[500]} />
                <Text
                  style={{ flex: 1, fontSize: 15, color: textColor, fontWeight: '500' }}
                  numberOfLines={2}
                >
                  {selected.name}
                </Text>
                <TouchableOpacity
                  onPress={() => { setSelected(null); setQuery('') }}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={18} color={colors.neutral[400]} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleConfirm}
                activeOpacity={0.8}
                style={{
                  backgroundColor: colors.primary[500],
                  borderRadius: 14,
                  paddingVertical: 13,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: '600', color: colors.white }}>
                  Confirmar ubicación
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </>
  )
}
