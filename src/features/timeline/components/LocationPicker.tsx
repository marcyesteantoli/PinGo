import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
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
  const { t } = useTranslation()
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
  const borderFaint = isDark ? colors.surface[700] : colors.neutral[100]
  const searchBarBg = isDark ? colors.surface[700] : '#e5e5ea'

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
    if (selected) onChange(selected)
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
            style={{ flex: 1, fontSize: 16, color: value ? textColor : placeholderColor }}
          >
            {value ? value.name : t('timeline_locationPicker_placeholder')}
          </Text>
          {value ? (
            <TouchableOpacity onPress={() => onChange(undefined)} hitSlop={8}>
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

          {/* Nav bar — fixed, never moves */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: cardBg,
              borderBottomWidth: 0.5,
              borderBottomColor: borderFaint,
            }}
          >
            <TouchableOpacity onPress={handleClose} style={{ minWidth: 72 }}>
              <Text style={{ fontSize: 17, color: colors.primary[500] }}>{t('common_cancel')}</Text>
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
              {t('timeline_locationPicker_title')}
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
                {t('timeline_locationPicker_done')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content — KeyboardAwareScrollView keeps navbar pinned */}
          <KeyboardAwareScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            bottomOffset={16}
          >
            {/* iOS-style search bar */}
            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: searchBarBg,
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  gap: 6,
                  height: 44,
                }}
              >
                <Ionicons name="search" size={16} color={colors.neutral[400]} />
                <TextInput
                  value={query}
                  onChangeText={handleQueryChange}
                  placeholder={t('timeline_locationPicker_search')}
                  placeholderTextColor={colors.neutral[400]}
                  autoFocus
                  returnKeyType="search"
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: textColor,
                  }}
                />
                {isSearching && (
                  <ActivityIndicator size="small" color={colors.neutral[400]} />
                )}
                {query.length > 0 && !isSearching && (
                  <TouchableOpacity
                    onPress={() => { setQuery(''); setResults([]) }}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={17} color={colors.neutral[400]} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Results list */}
            {results.length > 0 && (
              <View
                style={{
                  marginHorizontal: 16,
                  marginTop: 4,
                  backgroundColor: cardBg,
                  borderRadius: 14,
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.07,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <FlatList
                  data={results}
                  keyExtractor={(item) => String(item.place_id)}
                  keyboardShouldPersistTaps="handled"
                  scrollEnabled={false}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      onPress={() => handleSelectResult(item)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 13,
                        gap: 12,
                        borderTopWidth: index === 0 ? 0 : 0.5,
                        borderTopColor: borderFaint,
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: isDark ? colors.surface[700] : '#f2f2f7',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="location-outline" size={16} color={colors.primary[500]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={{ fontSize: 15, color: textColor, fontWeight: '500' }}
                        >
                          {getPlaceName(item)}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={{ fontSize: 13, color: colors.neutral[400], marginTop: 2 }}
                        >
                          {getPlaceSubtitle(item)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={15} color={colors.neutral[300]} />
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {/* Empty state */}
            {!isSearching && results.length === 0 && !showMap && (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    backgroundColor: isDark ? colors.surface[800] : '#e5e5ea',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={query.trim() ? 'search-outline' : 'map-outline'}
                    size={28}
                    color={colors.neutral[400]}
                  />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: textColor }}>
                  {query.trim() ? t('timeline_locationPicker_empty_noResults_title') : t('timeline_locationPicker_empty_initial_title')}
                </Text>
                <Text style={{ fontSize: 14, color: colors.neutral[400], textAlign: 'center', paddingHorizontal: 32 }}>
                  {query.trim()
                    ? t('timeline_locationPicker_empty_noResults_subtitle')
                    : t('timeline_locationPicker_empty_initial_subtitle')}
                </Text>
              </View>
            )}

            {/* Map + selected card */}
            {showMap && selected && (
              <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, gap: 12 }}>
                <View
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
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

                {/* Selected place row */}
                <View
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 13,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isDark ? 0.2 : 0.06,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: colors.primary[500] + '18',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="location" size={16} color={colors.primary[500]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 15, color: textColor, fontWeight: '600' }}
                    >
                      {selected.name}
                    </Text>
                    {selected.city && (
                      <Text numberOfLines={1} style={{ fontSize: 13, color: colors.neutral[400], marginTop: 1 }}>
                        {selected.city}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => { setSelected(null); setQuery('') }}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.neutral[300]} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleConfirm}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: colors.primary[500],
                    borderRadius: 14,
                    paddingVertical: 15,
                    alignItems: 'center',
                    shadowColor: colors.primary[500],
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text style={{ fontSize: 17, fontWeight: '600', color: colors.white }}>
                    {t('timeline_locationPicker_confirm')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAwareScrollView>
        </SafeAreaView>
      </Modal>
    </>
  )
}
