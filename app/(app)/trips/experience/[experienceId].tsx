import { useEffect, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
// TODO: import PROVIDER_GOOGLE and set provider={PROVIDER_GOOGLE} on MapView when Google Maps API key is configured
import MapView, { Marker } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { useExperiences } from '@features/timeline/hooks/useExperiences'
import { useDocuments } from '@features/documents/hooks/useDocuments'
import { useExpenses } from '@features/expenses/hooks/useExpenses'
import { ExpenseCard } from '@features/expenses/components/ExpenseCard'
import { useRatings } from '@features/timeline/hooks/useRatings'
import { useUpsertRating } from '@features/timeline/hooks/useUpsertRating'
import { useIsSaved } from '@features/saved/hooks/useIsSaved'
import { useToggleSaveExperience } from '@features/saved/hooks/useToggleSaveExperience'
import { useSavedNote } from '@features/saved/hooks/useSavedNote'
import { useUpsertSavedNote } from '@features/saved/hooks/useUpsertSavedNote'
import { AttributeRatingSection } from '@features/timeline/components/AttributeRatingSection'
import { DocumentViewer } from '@features/documents/components/DocumentViewer'
import { Avatar } from '@components/ui/Avatar'
import { Badge } from '@components/ui/Badge'
import { EmojiRating } from '@components/ui/EmojiRating'
import { UndoToast } from '@components/ui/UndoToast'
import { EXPERIENCE_TYPE_LABELS, formatTimeRange } from '@features/timeline/types'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import { formatDateWithWeekday } from '@utils/date'
import { formatCurrency } from '@utils/currency'
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
      className={`flex-row items-center px-4 gap-3 py-3.5 ${isFirst ? '' : 'border-neutral-100 dark:border-surface-700'}`}
      style={isFirst ? undefined : { borderTopWidth: 0.5 }}
    >
      <Ionicons name={icon as any} size={18} color={isDark ? colors.neutral[400] : colors.neutral[500]} />
      <View className="flex-1">
        {label && (
          <Text className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-[1px]">{label}</Text>
        )}
        <Text className="text-[15px] text-neutral-900 dark:text-neutral-50">{value}</Text>
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
  const { data: allExpenses } = useExpenses(tripId)
  const { data: currentUser } = useCurrentUser()
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
  const linkedExpenses = allExpenses?.filter(e => e.experience_id === experienceId) ?? []
  const linkedExpensesTotal = linkedExpenses.reduce((sum, e) => sum + e.amount, 0)

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

  if (!experience) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-[15px] text-neutral-500 dark:text-neutral-400">Experiencia no encontrada</Text>
        </View>
      </SafeAreaView>
    )
  }

  const hasDetails = !!(experience.date || timeRange || experience.confirmation_code)

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
      <View className="flex-row items-center px-2 py-2.5 bg-neutral-100 dark:bg-surface-900">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          className="flex-row items-center pl-2 pr-3 min-w-[80px]"
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary[500]} />
        </TouchableOpacity>
        <View className="flex-1" />
        <TouchableOpacity
          onPress={handleToggleSave}
          hitSlop={8}
          className="px-3 py-1.5"
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isSaved ? colors.primary[500] : (isDark ? colors.neutral[400] : colors.neutral[500])}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Title card */}
        <View className="rounded-2xl mb-3" style={cardShadow}>
          <View className="bg-white dark:bg-surface-800 rounded-2xl p-4">
            <Badge
              label={EXPERIENCE_TYPE_LABELS[experience.type]}
              variant={TYPE_BADGE_VARIANT[experience.type]}
            />
            <Text className="text-[24px] font-bold text-neutral-900 dark:text-neutral-50 mt-2.5 leading-[30px]">
              {experience.title}
            </Text>
            {ratingsData?.avg != null && (
              <View className="mt-2.5">
                <EmojiRating value={ratingsData.avg} size="sm" />
              </View>
            )}
          </View>
        </View>

        {/* Details card */}
        {hasDetails && (
          <View className="rounded-2xl mb-3" style={cardShadow}>
            <View className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden">
              <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide px-4 pt-3.5 pb-1.5">
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
          </View>
        )}

        {/* Map card */}
        {location && (
          <View className="rounded-2xl mb-3" style={cardShadow}>
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
              className="rounded-2xl overflow-hidden"
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
              <View className="bg-white dark:bg-surface-800 px-4 py-3 flex-row items-center gap-2.5">
                <Ionicons name="location" size={16} color={colors.primary[500]} />
                <Text
                  numberOfLines={1}
                  className="flex-1 text-sm text-neutral-700 dark:text-neutral-200"
                >
                  {location.name}
                </Text>
                <Ionicons name="open-outline" size={16} color={colors.neutral[400]} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Documents card */}
        {experienceDocs.length > 0 && (
          <View className="rounded-2xl mb-3" style={cardShadow}>
            <View className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden">
              <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide px-4 pt-3.5 pb-1.5">
                Documentos · {experienceDocs.length}
              </Text>
              {experienceDocs.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  onPress={() => setViewerDoc(doc)}
                  activeOpacity={0.7}
                  className="flex-row items-center px-4 py-3 border-neutral-100 dark:border-surface-700 gap-3"
                  style={{ borderTopWidth: 0.5 }}
                >
                  <View
                    className="rounded-lg bg-neutral-100 dark:bg-surface-700 items-center justify-center"
                    style={{ width: 38, height: 38 }}
                  >
                    <Ionicons
                      name={doc.file_type?.includes('image') ? 'image-outline' : 'document-text-outline'}
                      size={19}
                      color={colors.primary[500]}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="text-[15px] font-medium text-neutral-900 dark:text-neutral-50"
                    >
                      {doc.name}
                    </Text>
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-[1px]">
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
          </View>
        )}

        {/* Expenses card */}
        {linkedExpenses.length > 0 && (
          <View className="rounded-2xl mb-3" style={cardShadow}>
            <View className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden">
              <View className="flex-row items-center px-4 pt-3.5 pb-1.5">
                <Text className="flex-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Gastos · {linkedExpenses.length}
                </Text>
                <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                  {formatCurrency(linkedExpensesTotal)}
                </Text>
              </View>
              {linkedExpenses.map((expense) => (
                <View
                  key={expense.id}
                  className="border-neutral-100 dark:border-surface-700"
                  style={{ borderTopWidth: 0.5 }}
                >
                  <ExpenseCard expense={expense} currentUserId={currentUser?.id} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ratings card */}
        <View className="rounded-2xl mb-3" style={cardShadow}>
          <View className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden">
            <View className="flex-row items-center px-4 pt-3.5 pb-1.5">
              <Text className="flex-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                {ratingsData && ratingsData.count > 0
                  ? `Valoraciones · ${ratingsData.count}`
                  : 'Valoraciones'}
              </Text>
              {ratingsData?.avg != null && (
                <EmojiRating value={ratingsData.avg} size="sm" />
              )}
            </View>

            {/* All ratings list (excluding current user) */}
            {(() => {
              const otherRatings = ratingsData?.ratings.filter(r => r.user_id !== currentUser?.id) ?? []
              return (
                <ScrollView
                  style={{ maxHeight: 220, borderTopWidth: 0.5, borderTopColor: isDark ? colors.surface[700] : colors.neutral[100] }}
                  scrollEnabled
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {otherRatings.length > 0 ? (
                    otherRatings.map((r, i) => (
                      <View
                        key={r.user_id}
                        className={`flex-row items-center px-4 py-2.5 gap-3 ${i > 0 ? 'border-neutral-100 dark:border-surface-700' : ''}`}
                        style={i > 0 ? { borderTopWidth: 0.5 } : undefined}
                      >
                        <Avatar
                          name={r.profiles?.name ?? 'Usuario'}
                          uri={r.profiles?.avatar_url}
                          size="sm"
                        />
                        <Text
                          className="flex-1 text-[15px] text-neutral-800 dark:text-neutral-100"
                          numberOfLines={1}
                        >
                          {r.profiles?.name ?? 'Usuario'}
                        </Text>
                        <EmojiRating value={r.rating} size="sm" />
                      </View>
                    ))
                  ) : (
                    <View className="px-4 py-3.5">
                      <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                        Nadie más ha valorado aún
                      </Text>
                    </View>
                  )}
                </ScrollView>
              )
            })()}

            {/* User's own rating */}
            <View
              className="px-4 py-3 border-neutral-100 dark:border-surface-700"
              style={{ borderTopWidth: 0.5 }}
            >
              <Text className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                Tu valoración
              </Text>
              <EmojiRating
                value={ratingsData?.userRating ?? null}
                onChange={(rating) => upsertRating.mutate(rating)}
              />
            </View>
          </View>
        </View>

        {/* Attribute ratings collapsed — only when saved */}
        {isSaved && !ratingsExpanded && (
          <View className="rounded-2xl mb-3" style={cardShadow}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setRatingsExpanded(true)
              }}
              activeOpacity={0.7}
              className="bg-white dark:bg-surface-800 rounded-2xl flex-row items-center px-4 py-3.5 gap-3"
            >
              <Ionicons name="star-outline" size={18} color={colors.primary[500]} />
              <Text className="flex-1 text-[15px] text-neutral-800 dark:text-neutral-100">
                Valorar atributos
              </Text>
              <Ionicons name="chevron-forward" size={16} color={isDark ? colors.neutral[600] : colors.neutral[400]} />
            </TouchableOpacity>
          </View>
        )}

        {isSaved && ratingsExpanded && (
          <AttributeRatingSection
            experienceId={experienceId}
            experienceType={experience.type}
            cardBg={isDark ? colors.surface[800] : colors.white}
            labelColor={isDark ? colors.neutral[500] : colors.neutral[400]}
            borderColor={isDark ? colors.surface[700] : colors.neutral[100]}
          />
        )}

        {/* Note card */}
        {isSaved && (
          <View className="rounded-2xl mb-3" style={cardShadow}>
            <View className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden">
              <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide px-4 pt-3.5 pb-1.5">
                Mi nota
              </Text>
              <View
                className="px-4 py-3 border-neutral-100 dark:border-surface-700"
                style={{ borderTopWidth: 0.5 }}
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
                  placeholderTextColor={isDark ? colors.neutral[600] : colors.neutral[400]}
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
