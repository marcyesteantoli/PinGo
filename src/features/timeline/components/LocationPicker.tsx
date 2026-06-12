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
import { Platform } from 'react-native'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'

interface Location {
  name: string
  lat: number
  lng: number
  city?: string
  placeId?: string
}

interface LocationPickerProps {
  value?: Location
  onChange: (loc: Location | undefined) => void
  error?: string
}

interface GooglePrediction {
  placePrediction: {
    placeId: string
    structuredFormat: {
      mainText?: { text: string }
      secondaryText?: { text: string }
    }
  }
}

interface GooglePlaceDetails {
  location: { latitude: number; longitude: number }
  displayName: { text: string }
  addressComponents?: Array<{ longText: string; types?: string[] }>
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const PLACES_API_KEY = Platform.OS === 'ios'
  ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS!
  : process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID!

async function fetchPredictions(query: string, sessionToken: string, lang: string): Promise<GooglePrediction[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'X-Goog-Api-Key': PLACES_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: query, sessionToken, languageCode: lang }),
  })
  const data = await res.json()
  if (!res.ok) {
    const status = data?.error?.status ?? `HTTP_${res.status}`
    console.error('[LocationPicker] Places API error:', status, data?.error?.message)
    throw new Error(status)
  }
  if (data.error?.status === 'RESOURCE_EXHAUSTED') throw new Error('QUOTA_EXCEEDED')
  return data.suggestions ?? []
}

async function getPlaceDetails(placeId: string, sessionToken: string): Promise<GooglePlaceDetails | null> {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?sessionToken=${encodeURIComponent(sessionToken)}`,
    {
      headers: {
        'X-Goog-Api-Key': PLACES_API_KEY,
        'X-Goog-FieldMask': 'id,displayName,location,addressComponents',
      },
    }
  )
  if (!res.ok) return null
  return res.json()
}

export function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const { isDark } = useTheme()
  const { t, i18n } = useTranslation()
  const [modalVisible, setModalVisible] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GooglePrediction[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selected, setSelected] = useState<Location | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionTokenRef = useRef<string | null>(null)

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
    setSearchError(null)
    setSelected(value ?? null)
    setModalVisible(true)
    sessionTokenRef.current = generateUUID()
  }

  const handleClose = () => {
    setModalVisible(false)
    setSelected(null)
    sessionTokenRef.current = null
  }

  const handleConfirm = () => {
    if (selected) onChange(selected)
    setModalVisible(false)
    setSelected(null)
  }

  const handleQueryChange = (text: string) => {
    setQuery(text)
    setSearchError(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!text.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const data = await fetchPredictions(text, sessionTokenRef.current!, i18n.language)
        setResults(data)
      } catch (e: unknown) {
        if (e instanceof Error) {
          if (e.message === 'QUOTA_EXCEEDED') {
            setSearchError(t('timeline_locationPicker_quota_exceeded'))
          } else {
            setSearchError(t('timeline_locationPicker_error_api'))
          }
        }
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 600)
  }

  const handleSelectResult = async (prediction: GooglePrediction) => {
    const { placeId, structuredFormat } = prediction.placePrediction
    setIsSearching(true)
    try {
      const details = await getPlaceDetails(placeId, sessionTokenRef.current!)
      sessionTokenRef.current = null
      if (!details) return
      const addressComponents = details.addressComponents ?? []
      const city =
        addressComponents.find((c) => c.types?.includes('locality'))?.longText ??
        addressComponents.find((c) => c.types?.includes('administrative_area_level_2'))?.longText ??
        addressComponents.find((c) => c.types?.includes('administrative_area_level_1'))?.longText
      setSelected({
        name: structuredFormat.mainText.text,
        lat: details.location.latitude,
        lng: details.location.longitude,
        placeId,
        ...(city ? { city } : {}),
      })
      setResults([])
      setQuery('')
    } finally {
      setIsSearching(false)
    }
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
                    onPress={() => { setQuery(''); setResults([]); setSearchError(null) }}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={17} color={colors.neutral[400]} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Quota error */}
            {searchError && (
              <View style={{ marginHorizontal: 16, marginTop: 4 }}>
                <Text style={{ fontSize: 13, color: colors.error, textAlign: 'center' }}>
                  {searchError}
                </Text>
              </View>
            )}

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
                  keyExtractor={(item) => item.placePrediction.placeId}
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
                          {item.placePrediction.structuredFormat.mainText?.text}
                        </Text>
                        {item.placePrediction.structuredFormat.secondaryText?.text && (
                          <Text
                            numberOfLines={1}
                            style={{ fontSize: 13, color: colors.neutral[400], marginTop: 2 }}
                          >
                            {item.placePrediction.structuredFormat.secondaryText.text}
                          </Text>
                        )}
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
