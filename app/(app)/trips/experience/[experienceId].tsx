import { useEffect, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Linking, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
// TODO: import PROVIDER_GOOGLE and set provider={PROVIDER_GOOGLE} on MapView when Google Maps API key is configured
import MapView, { Marker } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useExperiences } from '@features/timeline/hooks/useExperiences'
import { useDocuments } from '@features/documents/hooks/useDocuments'
import { useRatings } from '@features/timeline/hooks/useRatings'
import { useUpsertRating } from '@features/timeline/hooks/useUpsertRating'
import { useIsSaved } from '@features/saved/hooks/useIsSaved'
import { useToggleSaveExperience } from '@features/saved/hooks/useToggleSaveExperience'
import { useSavedNote } from '@features/saved/hooks/useSavedNote'
import { useUpsertSavedNote } from '@features/saved/hooks/useUpsertSavedNote'
import { AttributeRatingSection } from '@features/timeline/components/AttributeRatingSection'
import { DocumentViewer } from '@features/documents/components/DocumentViewer'
import { Badge } from '@components/ui/Badge'
import { EmojiRating } from '@components/ui/EmojiRating'
import { UndoToast } from '@components/ui/UndoToast'
import { EXPERIENCE_TYPE_LABELS, formatTimeRange } from '@features/timeline/types'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { formatDateWithWeekday } from '@utils/date'
import type { Document } from '@types/index'
import type { BadgeVariant } from '@components/ui/Badge'

type DocumentWithExperience = Document & { experience_title: string | null }

const TYPE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  transport: 'transport',
  accommodation: 'accommodation',
  activity: 'activity',
  restaurant: 'restaurant',
  other: 'other',
}

interface DetailRowProps {
  icon: string
  label?: string
  value: string
  isDark: boolean
  isFirst?: boolean
}

function DetailRow({ icon, label, value, isDark, isFirst }: DetailRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderTopWidth: isFirst ? 0 : 0.5,
        borderTopColor: isDark ? colors.surface[700] : colors.neutral[100],
        gap: 12,
      }}
    >
      <Ionicons
        name={icon as any}
        size={18}
        color={isDark ? colors.neutral[400] : colors.neutral[500]}
      />
      <View style={{ flex: 1 }}>
        {label && (
          <Text style={{ fontSize: 13, color: isDark ? colors.neutral[500] : colors.neutral[400], marginBottom: 1 }}>
            {label}
          </Text>
        )}
        <Text style={{ fontSize: 15, color: isDark ? colors.neutral[50] : colors.neutral[900] }}>
          {value}
        </Text>
      </View>
    </View>
  )
}

export default function ExperienceDetailScreen() {
  const router = useRouter()
  const { experienceId, tripId } = useLocalSearchParams<{ experienceId: string; tripId: string }>()
  const { isDark } = useTheme()
  const [viewerDoc, setViewerDoc] = useState<DocumentWithExperience | null>(null)
  const [saveToast, setSaveToast] = useState(false)
  const saveToastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const { data: experiences } = useExperiences(tripId)
  const { data: allDocuments } = useDocuments(tripId)
  const { data: ratingsData } = useRatings(experienceId)
  const upsertRating = useUpsertRating(experienceId, tripId)
  const { data: isSaved = false, isSuccess: isSavedLoaded } = useIsSaved(experienceId)
  const toggleSave = useToggleSaveExperience(experienceId)
  const { data: savedNote } = useSavedNote(experienceId)
  const upsertNote = useUpsertSavedNote(experienceId)
  const [noteText, setNoteText] = useState<string | undefined>(undefined)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [ratingsExpanded, setRatingsExpanded] = useState(false)
  const initialSavedRef = useRef(false)

  useEffect(() => {
    if (isSavedLoaded && !initialSavedRef.current) {
      initialSavedRef.current = true
      if (isSaved) setRatingsExpanded(true)
    }
  }, [isSavedLoaded, isSaved])

  function handleToggleSave() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    toggleSave.mutate(isSaved, {
      onSuccess: () => {
        if (!isSaved) {
          clearTimeout(saveToastTimer.current)
          setSaveToast(true)
          saveToastTimer.current = setTimeout(() => setSaveToast(false), 4000)
        }
      },
    })
  }

  const experience = experiences?.find(e => e.id === experienceId)
  const experienceDocs = (allDocuments?.filter(d => d.experience_id === experienceId) ?? []) as DocumentWithExperience[]

  const rawLocation = experience?.location
  const location =
    typeof rawLocation === 'object' &&
    rawLocation !== null &&
    'name' in rawLocation &&
    'lat' in rawLocation &&
    'lng' in rawLocation &&
    typeof (rawLocation as { name: unknown }).name === 'string'
      ? (rawLocation as { name: string; lat: number; lng: number })
      : null

  const timeRange = experience ? formatTimeRange(experience.start_time, experience.end_time) : null

  const bg = isDark ? colors.surface[900] : '#f2f2f7'
  const cardBg = isDark ? colors.surface[800] : colors.white
  const labelColor = isDark ? colors.neutral[500] : colors.neutral[400]

  if (!experience) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: labelColor, fontSize: 15 }}>Experiencia no encontrada</Text>
        </View>
      </SafeAreaView>
    )
  }

  const hasDetails = !!(experience.date || timeRange || experience.confirmation_code)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
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
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={handleToggleSave}
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
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title card */}
        <View style={{ backgroundColor: cardBg, borderRadius: 14, padding: 16, marginBottom: 12 }}>
          <Badge
            label={EXPERIENCE_TYPE_LABELS[experience.type]}
            variant={TYPE_BADGE_VARIANT[experience.type]}
          />
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: isDark ? colors.neutral[50] : colors.neutral[900],
              marginTop: 10,
              lineHeight: 30,
            }}
          >
            {experience.title}
          </Text>
        </View>

        {/* Details card */}
        {hasDetails && (
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
              Detalles
            </Text>

            {experience.date && (
              <DetailRow
                icon="calendar-outline"
                value={formatDateWithWeekday(experience.date)}
                isDark={isDark}
                isFirst
              />
            )}
            {timeRange && (
              <DetailRow
                icon="time-outline"
                value={timeRange}
                isDark={isDark}
                isFirst={!experience.date}
              />
            )}
            {experience.confirmation_code && (
              <DetailRow
                icon="ticket-outline"
                label="Reserva"
                value={experience.confirmation_code}
                isDark={isDark}
                isFirst={!experience.date && !timeRange}
              />
            )}
          </View>
        )}

        {/* Map card */}
        {location && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              const googleUrl = `comgooglemaps://?q=${encodeURIComponent(location.name)}&center=${location.lat},${location.lng}`
              const appleUrl = `maps://?ll=${location.lat},${location.lng}&q=${encodeURIComponent(location.name)}`
              Linking.canOpenURL(googleUrl).then((supported) =>
                Linking.openURL(supported ? googleUrl : appleUrl)
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
              <Ionicons name="open-outline" size={16} color={colors.neutral[400]} />
            </View>
          </TouchableOpacity>
        )}

        {/* Documents card */}
        {experienceDocs.length > 0 && (
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
              Documentos · {experienceDocs.length}
            </Text>

            {experienceDocs.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                onPress={() => setViewerDoc(doc)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderTopWidth: 0.5,
                  borderTopColor: isDark ? colors.surface[700] : colors.neutral[100],
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    backgroundColor: isDark ? colors.surface[700] : colors.neutral[100],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={doc.file_type?.includes('image') ? 'image-outline' : 'document-text-outline'}
                    size={19}
                    color={colors.primary[500]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 15, fontWeight: '500', color: isDark ? colors.neutral[50] : colors.neutral[900] }}
                  >
                    {doc.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: isDark ? colors.neutral[500] : colors.neutral[400], marginTop: 1 }}>
                    {doc.file_type?.includes('image') ? 'Imagen' : 'PDF'}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isDark ? colors.neutral[600] : colors.neutral[400]}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Ratings card */}
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
            {ratingsData && ratingsData.count > 0
              ? `Valoraciones · ${ratingsData.count}`
              : 'Valoraciones'}
          </Text>

          {ratingsData && ratingsData.count > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 10,
                gap: 10,
                borderTopWidth: 0.5,
                borderTopColor: isDark ? colors.surface[700] : colors.neutral[100],
              }}
            >
              <EmojiRating value={ratingsData.avg} size="sm" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: isDark ? colors.neutral[50] : colors.neutral[900] }}>
                {ratingsData.avg?.toFixed(1)}
              </Text>
            </View>
          )}

          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderTopWidth: 0.5,
              borderTopColor: isDark ? colors.surface[700] : colors.neutral[100],
            }}
          >
            <Text style={{ fontSize: 12, color: labelColor, marginBottom: 8 }}>
              Tu valoración
            </Text>
            <EmojiRating
              value={ratingsData?.userRating ?? null}
              onChange={(rating) => upsertRating.mutate(rating)}
            />
          </View>
        </View>

        {/* Attribute ratings + note — only when saved */}
        {isSaved && !ratingsExpanded && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setRatingsExpanded(true)
            }}
            activeOpacity={0.7}
            style={{
              backgroundColor: cardBg,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 12,
              gap: 12,
            }}
          >
            <Ionicons name="star-outline" size={18} color={colors.primary[500]} />
            <Text style={{ flex: 1, fontSize: 15, color: isDark ? colors.neutral[100] : colors.neutral[800] }}>
              Valorar atributos
            </Text>
            <Ionicons name="chevron-forward" size={16} color={isDark ? colors.neutral[600] : colors.neutral[400]} />
          </TouchableOpacity>
        )}

        {isSaved && ratingsExpanded && (
          <AttributeRatingSection
            experienceId={experienceId}
            experienceType={experience.type}
            cardBg={cardBg}
            labelColor={labelColor}
            borderColor={isDark ? colors.surface[700] : colors.neutral[100]}
          />
        )}

        {isSaved && (
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
                borderTopColor: isDark ? colors.surface[700] : colors.neutral[100],
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <TextInput
                value={noteText ?? savedNote ?? ''}
                onChangeText={(text) => {
                  setNoteText(text)
                  clearTimeout(noteTimer.current)
                  noteTimer.current = setTimeout(() => upsertNote.mutate(text), 800)
                }}
                onBlur={() => {
                  clearTimeout(noteTimer.current)
                  upsertNote.mutate(noteText ?? savedNote ?? '')
                }}
                placeholder="Escribe algo sobre esta experiencia..."
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
        )}
      </ScrollView>

      <DocumentViewer
        document={viewerDoc}
        visible={viewerDoc !== null}
        onClose={() => setViewerDoc(null)}
      />

      <UndoToast
        visible={saveToast}
        message="¡Añadida a Mis Joyas!"
        onUndo={() => {
          setSaveToast(false)
          toggleSave.mutate(true)
        }}
      />
    </SafeAreaView>
  )
}
