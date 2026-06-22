import { useRef, useState } from 'react'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { useTrips } from '@features/trips/hooks/useTrips'
import { useExperiences } from '@features/timeline/hooks/useExperiences'
import { useDocuments, type DocumentWithExperience } from '@features/documents/hooks/useDocuments'
import { useExpenses } from '@features/expenses/hooks/useExpenses'
import { ExpenseCard } from '@features/expenses/components/ExpenseCard'
import { useRatings } from '@features/timeline/hooks/useRatings'
import { useUpsertRating } from '@features/timeline/hooks/useUpsertRating'
import { useDeleteRating } from '@features/timeline/hooks/useDeleteRating'
import { useUpdateExperience } from '@features/timeline/hooks/useUpdateExperience'
import { useDeleteExperience } from '@features/timeline/hooks/useDeleteExperience'
import { AddExperienceSheet } from '@features/timeline/components/AddExperienceSheet'
import { useSavedExperienceLink } from '@features/saved/hooks/useSavedExperienceLink'
import { useSaveExperienceFromTrip } from '@features/saved/hooks/useSaveExperienceFromTrip'
import { DocumentViewer } from '@features/documents/components/DocumentViewer'
import { Avatar } from '@components/ui/Avatar'
import { Badge } from '@components/ui/Badge'
import { ConfirmDeleteSheet } from '@components/ui/ConfirmDeleteSheet'
import { DetailActionBar } from '@components/ui/DetailActionBar'
import { EmojiRating } from '@components/ui/EmojiRating'
import { UndoToast } from '@components/ui/UndoToast'
import { formatTimeRange } from '@features/timeline/types'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import { formatDateWithWeekday } from '@utils/date'
import { formatCurrency } from '@utils/currency'
import type { Document } from '@app-types/index'
import type { BadgeVariant } from '@components/ui/Badge'


const TYPE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  transport:     'transport',
  accommodation: 'accommodation',
  activity:      'activity',
  restaurant:    'restaurant',
  entertainment: 'entertainment',
  other:         'other',
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
  const { data: trips } = useTrips()
  const tripCurrency = trips?.find(t => t.id === tripId)?.currency ?? 'EUR'
  const { isDark } = useTheme()
  const { t } = useTranslation()
  const [viewerDoc, setViewerDoc] = useState<DocumentWithExperience | null>(null)
  const [saveToast, setSaveToast] = useState(false)
  const [editSheetVisible, setEditSheetVisible] = useState(false)
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false)
  const [newSavedId, setNewSavedId] = useState<string | null>(null)
  const [docsExpanded, setDocsExpanded] = useState(true)
  const [expensesExpanded, setExpensesExpanded] = useState(true)
  const [isRatingExpanded, setIsRatingExpanded] = useState(false)
  const saveToastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const docsProgress = useSharedValue(1)
  const docsNaturalH = useSharedValue(0)
  const expensesProgress = useSharedValue(1)
  const expensesNaturalH = useSharedValue(0)

  const docsChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(docsProgress.value, [0, 1], [0, 180])}deg` }],
  }))
  const expensesChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(expensesProgress.value, [0, 1], [0, 180])}deg` }],
  }))
  const docsContentStyle = useAnimatedStyle(() => {
    if (docsNaturalH.value === 0) return { overflow: 'hidden' as const }
    return {
      height: docsProgress.value * docsNaturalH.value,
      overflow: 'hidden' as const,
    }
  })
  const expensesContentStyle = useAnimatedStyle(() => {
    if (expensesNaturalH.value === 0) return { overflow: 'hidden' as const }
    return {
      height: expensesProgress.value * expensesNaturalH.value,
      overflow: 'hidden' as const,
    }
  })

  function toggleDocs() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = !docsExpanded
    setDocsExpanded(next)
    docsProgress.value = withTiming(next ? 1 : 0, { duration: 240 })
  }
  function toggleExpenses() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = !expensesExpanded
    setExpensesExpanded(next)
    expensesProgress.value = withTiming(next ? 1 : 0, { duration: 240 })
  }

  const { data: experiences } = useExperiences(tripId)
  const { data: allDocuments } = useDocuments(tripId)
  const { data: allExpenses } = useExpenses(tripId)
  const { data: currentUser } = useCurrentUser()
  const { data: ratingsData } = useRatings(experienceId)
  const upsertRating = useUpsertRating(experienceId, tripId)
  const deleteRating = useDeleteRating(experienceId, tripId)
  const updateExperience = useUpdateExperience(tripId)
  const deleteExperience = useDeleteExperience(tripId)
  const { data: savedLink } = useSavedExperienceLink(experienceId)
  const isSaved = !!savedLink
  const saveExperience = useSaveExperienceFromTrip(experienceId)
  function handleToggleSave() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    saveExperience.mutate(savedLink?.experienceId ?? null, {
      onSuccess: (newId) => {
        if (newId) {
          setNewSavedId(newId)
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
          <Text className="text-[15px] text-neutral-500 dark:text-neutral-400">{t('experience_notFound')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  const hasDetails = !!(experience.date || timeRange || experience.confirmation_code)

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top', 'bottom']}>
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
              label={t(`expType_${experience.type}`)}
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
                {t('experience_section_details')}
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
                  label={t('experience_field_booking')}
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
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
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
              <TouchableOpacity
                onPress={toggleDocs}
                activeOpacity={0.7}
                className={`flex-row items-center px-4 pt-3.5 ${docsExpanded ? 'pb-1.5' : 'pb-3'}`}
              >
                <Text className="flex-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  {t('experience_section_documents', { count: experienceDocs.length })}
                </Text>
                <Animated.View style={docsChevronStyle}>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={isDark ? colors.neutral[400] : colors.neutral[500]}
                  />
                </Animated.View>
              </TouchableOpacity>
              <Animated.View style={docsContentStyle}>
                <View
                  onLayout={(e) => {
                    const h = e.nativeEvent.layout.height
                    if (docsNaturalH.value === 0 && h > 0) docsNaturalH.value = h
                  }}
                >
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
                          {doc.file_type?.includes('image') ? t('experience_fileType_image') : t('experience_fileType_pdf')}
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
              </Animated.View>
            </View>
          </View>
        )}

        {/* Expenses card */}
        {linkedExpenses.length > 0 && (
          <View className="rounded-2xl mb-3" style={cardShadow}>
            <View className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden">
              <TouchableOpacity
                onPress={toggleExpenses}
                activeOpacity={0.7}
                className={`flex-row items-center px-4 pt-3.5 ${expensesExpanded ? 'pb-1.5' : 'pb-3'}`}
              >
                <Text className="flex-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  {t('experience_section_expenses', { count: linkedExpenses.length })}
                </Text>
                <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mr-1.5">
                  {formatCurrency(linkedExpensesTotal, tripCurrency)}
                </Text>
                <Animated.View style={expensesChevronStyle}>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={isDark ? colors.neutral[400] : colors.neutral[500]}
                  />
                </Animated.View>
              </TouchableOpacity>
              <Animated.View style={expensesContentStyle}>
                <View
                  onLayout={(e) => {
                    const h = e.nativeEvent.layout.height
                    if (expensesNaturalH.value === 0 && h > 0) expensesNaturalH.value = h
                  }}
                >
                  {linkedExpenses.map((expense) => (
                    <View
                      key={expense.id}
                      className="border-neutral-100 dark:border-surface-700"
                      style={{ borderTopWidth: 0.5 }}
                    >
                      <ExpenseCard expense={expense} showCategoryIcon={false} currentUserId={currentUser?.id} />
                    </View>
                  ))}
                </View>
              </Animated.View>
            </View>
          </View>
        )}

        {/* Ratings card */}
        <View className="rounded-2xl mb-3" style={cardShadow}>
          <View className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden">
            <View className="flex-row items-center px-4 pt-3.5 pb-1.5">
              <Text className="flex-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                {ratingsData && ratingsData.count > 0
                  ? t('experience_section_ratings_count', { count: ratingsData.count })
                  : t('experience_section_ratings')}
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
                          name={r.profiles?.name ?? t('common_someone')}
                          uri={r.profiles?.avatar_url}
                          size="sm"
                        />
                        <Text
                          className="flex-1 text-[15px] text-neutral-800 dark:text-neutral-100"
                          numberOfLines={1}
                        >
                          {r.profiles?.name ?? t('common_someone')}
                        </Text>
                        <EmojiRating value={r.rating} size="sm" />
                      </View>
                    ))
                  ) : (
                    <View className="px-4 py-3.5">
                      <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                        {t('experience_noOtherRatings')}
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
              {ratingsData?.userRating == null && !isRatingExpanded ? (
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2.5 flex-1">
                    <Ionicons
                      name="star-outline"
                      size={20}
                      color={isDark ? colors.neutral[400] : colors.neutral[500]}
                    />
                    <Text className="text-[15px] text-neutral-700 dark:text-neutral-200 flex-1">
                      {t('experience_rateThisExperience')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsRatingExpanded(true)}
                    className="px-3.5 py-1.5 rounded-full bg-neutral-100 dark:bg-surface-700"
                  >
                    <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-100">
                      {t('experience_rateButton')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t('experience_myRating')}
                    </Text>
                    {ratingsData?.userRating != null && (
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                          deleteRating.mutate()
                          setIsRatingExpanded(false)
                        }}
                        className="flex-row items-center gap-1"
                      >
                        <Ionicons name="trash-outline" size={14} color={colors.error} />
                        <Text className="text-xs font-medium text-error-500">
                          {t('experience_deleteRating')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <EmojiRating
                    value={ratingsData?.userRating ?? null}
                    onChange={(rating) => upsertRating.mutate(rating)}
                  />
                </>
              )}
            </View>
          </View>
        </View>

      </ScrollView>

      <DetailActionBar
        onEdit={() => setEditSheetVisible(true)}
        onDelete={() => setDeleteSheetVisible(true)}
        isDeleting={deleteExperience.isPending}
      />

      <DocumentViewer
        document={viewerDoc}
        visible={viewerDoc !== null}
        onClose={() => setViewerDoc(null)}
      />

      <AddExperienceSheet
        visible={editSheetVisible}
        onClose={() => setEditSheetVisible(false)}
        onSubmit={async (data) => {
          await updateExperience.mutateAsync({ experienceId, formData: data })
          setEditSheetVisible(false)
        }}
        isLoading={updateExperience.isPending}
        error={updateExperience.error?.message}
        initialValues={{
          title: experience.title,
          type: experience.type,
          date: experience.date ?? new Date().toISOString().slice(0, 10),
          start_time: experience.start_time ?? undefined,
          end_time: experience.end_time ?? undefined,
          confirmation_code: experience.confirmation_code ?? undefined,
          location: (
            typeof experience.location === 'object' &&
            experience.location !== null &&
            'name' in experience.location &&
            'lat' in experience.location &&
            'lng' in experience.location
          ) ? (experience.location as { name: string; lat: number; lng: number; city?: string }) : undefined,
        }}
        mode="edit"
      />

      <ConfirmDeleteSheet
        visible={deleteSheetVisible}
        title={t('timeline_deleteSheet_title')}
        message={
          experienceDocs.length > 0
            ? t(experienceDocs.length === 1 ? 'timeline_deleteSheet_body_one' : 'timeline_deleteSheet_body_other', { count: experienceDocs.length })
            : t('experience_deleteSheet_body')
        }
        confirmLabel={experienceDocs.length > 0 ? t('timeline_deleteSheet_confirm') : undefined}
        isLoading={deleteExperience.isPending}
        onClose={() => setDeleteSheetVisible(false)}
        onConfirm={() => deleteExperience.mutate(experienceId, { onSuccess: () => router.back() })}
      />

      <UndoToast
        visible={saveToast}
        message={t('experience_saved_toast')}
        actionLabel={t('experience_rate_action')}
        onAction={() => {
          setSaveToast(false)
          if (newSavedId) router.push(`/saved-experiences/${newSavedId}`)
        }}
      />
    </SafeAreaView>
  )
}
