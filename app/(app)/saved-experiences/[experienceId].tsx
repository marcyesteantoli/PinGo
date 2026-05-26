import { useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSavedExperienceDetail } from '@features/saved/hooks/useSavedExperienceDetail'
import { useUpsertSavedNote } from '@features/saved/hooks/useUpsertSavedNote'
import { useIsSaved } from '@features/saved/hooks/useIsSaved'
import { useToggleSaveExperience } from '@features/saved/hooks/useToggleSaveExperience'
import { Badge } from '@components/ui/Badge'
import { RadarChart } from '@components/ui/RadarChart'
import { EXPERIENCE_TYPE_LABELS } from '@features/timeline/types'
import { EXPERIENCE_ATTRIBUTES } from '@features/timeline/config/experienceAttributes'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import type { BadgeVariant } from '@components/ui/Badge'
import type { Experience } from '@types/index'

const TYPE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  transport: 'transport',
  accommodation: 'accommodation',
  activity: 'activity',
  restaurant: 'restaurant',
  other: 'other',
}

export default function SavedExperienceDetailScreen() {
  const router = useRouter()
  const { experienceId } = useLocalSearchParams<{ experienceId: string }>()
  const { isDark } = useTheme()

  const { data, isLoading } = useSavedExperienceDetail(experienceId)
  const { data: isSaved = true } = useIsSaved(experienceId)
  const toggleSave = useToggleSaveExperience(experienceId)
  const upsertNote = useUpsertSavedNote(experienceId)

  const [noteText, setNoteText] = useState<string | undefined>(undefined)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function handleUnsave() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    toggleSave.mutate(true, {
      onSuccess: () => router.back(),
    })
  }

  const bg = isDark ? colors.surface[900] : colors.neutral[100]
  const cardBg = isDark ? colors.surface[800] : colors.white
  const labelColor = isDark ? colors.neutral[500] : colors.neutral[400]
  const borderColor = isDark ? colors.surface[700] : colors.neutral[100]

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: labelColor, fontSize: 15 }}>Cargando...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary[500]} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: labelColor, fontSize: 15 }}>Joya no encontrada</Text>
        </View>
      </SafeAreaView>
    )
  }

  const { experience, attributeRatings, ratedCount, note } = data
  const attributes = EXPERIENCE_ATTRIBUTES[experience.type as Experience['type']] ?? []
  const hasAttributes = attributes.length > 0
  const location = experience.location

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {/* iOS-style nav bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 8,
          paddingVertical: 10,
          backgroundColor: bg,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, minWidth: 80 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary[500]} />
          <Text style={{ fontSize: 17, color: colors.primary[500], marginLeft: 2 }}>Mis Joyas</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={handleUnsave}
          hitSlop={8}
          style={{ paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isSaved ? colors.primary[500] : (isDark ? colors.neutral[400] : colors.neutral[500])}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title card */}
        <View style={{ backgroundColor: cardBg, borderRadius: 14, padding: 16, marginBottom: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <Badge
              label={EXPERIENCE_TYPE_LABELS[experience.type]}
              variant={TYPE_BADGE_VARIANT[experience.type]}
            />
            {experience.trip?.name && (
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 13,
                  color: labelColor,
                  flexShrink: 1,
                  marginLeft: 8,
                  marginTop: 2,
                }}
              >
                {experience.trip.name}
              </Text>
            )}
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: isDark ? colors.neutral[50] : colors.neutral[900],
              lineHeight: 30,
            }}
          >
            {experience.title}
          </Text>
        </View>

        {/* Location + map card */}
        {location && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              const googleNativeUrl = `comgooglemaps://?q=${encodeURIComponent(location.name)}&center=${location.lat},${location.lng}`
              const fallbackUrl = Platform.OS === 'ios'
                ? `maps://?ll=${location.lat},${location.lng}&q=${encodeURIComponent(location.name)}`
                : `geo:${location.lat},${location.lng}?q=${encodeURIComponent(location.name)}`
              Linking.canOpenURL(googleNativeUrl).then((supported) =>
                Linking.openURL(supported ? googleNativeUrl : fallbackUrl)
              )
            }}
            style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}
          >
            <MapView
              style={{ height: 180, width: '100%' }}
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
            <View
              style={{
                backgroundColor: cardBg,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Ionicons name="location" size={16} color={colors.primary[500]} />
              <Text
                numberOfLines={1}
                style={{ flex: 1, fontSize: 14, color: isDark ? colors.neutral[200] : colors.neutral[700] }}
              >
                {location.name}
              </Text>
              <Ionicons name="open-outline" size={14} color={colors.neutral[400]} />
            </View>
          </TouchableOpacity>
        )}

        {/* Attribute ratings card */}
        {hasAttributes && (
          <View style={{ backgroundColor: cardBg, borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: labelColor,
                paddingHorizontal: 16,
                paddingTop: 14,
                paddingBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
              }}
            >
              Mis valoraciones
            </Text>
            <View style={{ borderTopWidth: 0.5, borderTopColor: borderColor }}>
              {ratedCount >= 3 ? (
                <View style={{ paddingVertical: 8 }}>
                  <RadarChart
                    attributes={attributes}
                    userValues={attributeRatings}
                    groupAvg={{}}
                    size={200}
                    isDark={isDark}
                  />
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    gap: 10,
                  }}
                >
                  <Ionicons name="star-outline" size={18} color={labelColor} />
                  <Text style={{ fontSize: 14, color: labelColor }}>
                    Valora los atributos para ver tu gráfico
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Personal note card */}
        <View style={{ backgroundColor: cardBg, borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: labelColor,
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            Mi nota
          </Text>
          <View
            style={{
              borderTopWidth: 0.5,
              borderTopColor: borderColor,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <TextInput
              value={noteText ?? note ?? ''}
              onChangeText={(text) => {
                setNoteText(text)
                clearTimeout(noteTimer.current)
                noteTimer.current = setTimeout(() => upsertNote.mutate(text), 800)
              }}
              onBlur={() => {
                clearTimeout(noteTimer.current)
                upsertNote.mutate(noteText ?? note ?? '')
              }}
              placeholder="Escribe tu recomendación personal..."
              placeholderTextColor={labelColor}
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
      </ScrollView>
    </SafeAreaView>
  )
}
