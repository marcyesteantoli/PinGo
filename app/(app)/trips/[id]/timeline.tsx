import { useState, useMemo, useRef, useCallback } from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { fabShadow } from '@lib/shadows'
import { colors } from '@lib/colors'
import { EmptyState } from '@components/ui/EmptyState'
import { SkeletonCard } from '@components/ui/Skeleton'
import { UndoToast } from '@components/ui/UndoToast'
import { TripHeader } from '@features/trips/components/TripHeader'
import { useTripContext } from '@features/trips/TripProvider'
import { AddExperienceSheet } from '@features/timeline/components/AddExperienceSheet'
import { DeleteExperienceSheet } from '@features/timeline/components/DeleteExperienceSheet'
import { DaySection, UNDATED_SENTINEL as UNDATED_DISPLAY } from '@features/timeline/components/DaySection'
import { ExperienceCard } from '@features/timeline/components/ExperienceCard'
import { useCreateExperience } from '@features/timeline/hooks/useCreateExperience'
import { useDeleteExperience } from '@features/timeline/hooks/useDeleteExperience'
import { useUpdateExperience } from '@features/timeline/hooks/useUpdateExperience'
import { useExperiences } from '@features/timeline/hooks/useExperiences'
import { useRatingsForTrip } from '@features/timeline/hooks/useRatingsForTrip'
import { useDocuments } from '@features/documents/hooks/useDocuments'
import { useDestinations } from '@features/destinations/hooks/useDestinations'
import { DestinationBanner } from '@features/destinations/components/DestinationBanner'
import { DestinationChipsStrip } from '@features/destinations/components/DestinationChipsStrip'
import { ManageDestinationsSheet } from '@features/destinations/components/ManageDestinationsSheet'
import { queryKeys } from '@lib/queryKeys'
import { useStaggerEnter } from '@lib/useStaggerEnter'
import { useFabScroll } from '@lib/useFabScroll'
import type { Experience, TripDestination } from '@types/index'
import type { CreateExperienceFormData } from '@features/timeline/types'

const UNDATED_SENTINEL = '__undated__'

type Section = { title: string; data: Experience[] }

type TimelineEntry =
  | { type: 'header'; title: string; count: number; isFirst: boolean; followsBanner: boolean; isToday: boolean }
  | { type: 'item'; experience: Experience; isUndated: boolean; sectionIndex: number }
  | { type: 'city_banner'; destination: TripDestination; lineAbove?: boolean }

function groupByDate(experiences: Experience[]): Section[] {
  const groups: Record<string, Experience[]> = {}
  for (const exp of experiences) {
    const key = exp.date ?? UNDATED_SENTINEL
    if (!groups[key]) groups[key] = []
    groups[key].push(exp)
  }
  const sortByTime = (exps: Experience[]) =>
    exps.sort((a, b) => {
      if (!a.start_time && !b.start_time) return 0
      if (!a.start_time) return 1
      if (!b.start_time) return -1
      return a.start_time.localeCompare(b.start_time)
    })

  const dated = Object.entries(groups)
    .filter(([k]) => k !== UNDATED_SENTINEL)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, data]) => ({ title, data: sortByTime(data) }))
  const undated = groups[UNDATED_SENTINEL] ?? []
  return undated.length > 0 ? [...dated, { title: UNDATED_SENTINEL, data: undated }] : dated
}

function getDestinationForDate(date: string, destinations: TripDestination[]): TripDestination | null {
  return destinations.find(d => d.start_date <= date && date <= d.end_date) ?? null
}

function groupByDestId(experiences: Experience[]): { destId: string | null; items: Experience[] }[] {
  const seen = new Map<string | null, Experience[]>()
  const order: (string | null)[] = []
  for (const exp of experiences) {
    const key = exp.destination_id ?? null
    if (!seen.has(key)) {
      seen.set(key, [])
      order.push(key)
    }
    seen.get(key)!.push(exp)
  }
  return order.map(k => ({ destId: k, items: seen.get(k)! }))
}

function toRows(sections: Section[], destinations: TripDestination[]): TimelineEntry[] {
  const today = new Date().toISOString().slice(0, 10)
  const rows: TimelineEntry[] = []
  let lastBannerId: string | null = null
  let isFirstGroup = true
  let lastWasBanner = false

  sections.forEach((s) => {
    const isUndated = s.title === UNDATED_SENTINEL

    if (!isUndated && destinations.length > 0) {
      const dayDest = getDestinationForDate(s.title, destinations)
      const dayDestId = dayDest?.id ?? null
      if (dayDestId !== lastBannerId) {
        if (dayDest) {
          rows.push({ type: 'city_banner', destination: dayDest })
          lastBannerId = dayDestId
          lastWasBanner = true
        } else {
          lastBannerId = null
          isFirstGroup = true
        }
      }
    }

    rows.push({
      type: 'header',
      title: s.title,
      count: s.data.length,
      isFirst: lastWasBanner ? false : isFirstGroup,
      followsBanner: lastWasBanner,
      isToday: !isUndated && s.title === today,
    })
    isFirstGroup = false
    lastWasBanner = false

    const destGroups = groupByDestId(s.data)
    let sectionIdx = 0

    for (const { destId, items } of destGroups) {
      if (!isUndated && destId !== null && destId !== lastBannerId) {
        const dest = destinations.find(d => d.id === destId) ?? null
        if (dest) {
          rows.push({ type: 'city_banner', destination: dest, lineAbove: true })
          lastBannerId = destId
        }
      }
      for (const exp of items) {
        rows.push({ type: 'item', experience: exp, isUndated, sectionIndex: sectionIdx++ })
      }
    }
  })
  return rows
}

function StaggeredExperienceCardWrapper({
  entry,
  ratingData,
  onDelete,
  onEdit,
  onPress,
}: {
  entry: { experience: Experience; sectionIndex: number }
  ratingData: { avg: number | null; count: number } | undefined
  onDelete: () => void
  onEdit: () => void
  onPress: () => void
}) {
  const staggerStyle = useStaggerEnter(entry.sectionIndex, { delay: 50, duration: 240, axis: 'y', distance: 6 })
  return (
    <Animated.View style={staggerStyle}>
      <ExperienceCard
        experience={entry.experience}
        ratingAvg={ratingData?.avg ?? null}
        ratingCount={ratingData?.count ?? 0}
        canDelete
        onDelete={onDelete}
        canEdit
        onEdit={onEdit}
        onPress={onPress}
      />
    </Animated.View>
  )
}

interface DeleteSheetState {
  visible: boolean
  experience: Experience | null
  documentCount: number
}

export default function TimelineScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { tripId, trip, isOwner } = useTripContext()
  const { t } = useTranslation()
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y })

  const { fabAnimStyle } = useFabScroll(scrollY)

  const queryClient = useQueryClient()
  const { data: experiences, isLoading, error, refetch } = useExperiences(tripId)
  const { data: documents } = useDocuments(tripId)
  const experienceIds = useMemo(() => experiences?.map(e => e.id) ?? [], [experiences])
  const { data: ratingsMap } = useRatingsForTrip(tripId, experienceIds)
  const createExperience = useCreateExperience(tripId)
  const deleteExperience = useDeleteExperience(tripId)
  const updateExperience = useUpdateExperience(tripId)
  const { data: destinations = [] } = useDestinations(tripId)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [destSheetVisible, setDestSheetVisible] = useState(false)
  const [editExperience, setEditExperience] = useState<Experience | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [deleteSheet, setDeleteSheet] = useState<DeleteSheetState>({
    visible: false,
    experience: null,
    documentCount: 0,
  })

  const flatListRef = useRef<FlatList<TimelineEntry>>(null)

  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const pendingDeleteRef = useRef<{
    experienceId: string
    snapshot: Experience[] | undefined
  } | null>(null)

  const rows = useMemo(
    () => toRows(groupByDate(experiences ?? []), destinations),
    [experiences, destinations]
  )

  const scrollToDestination = useCallback((dest: TripDestination) => {
    let idx = rows.findIndex(r => r.type === 'city_banner' && r.destination.id === dest.id)
    if (idx < 0) {
      idx = rows.findIndex(
        r => r.type === 'header' && r.title !== UNDATED_SENTINEL && r.title >= dest.start_date
      )
    }
    if (idx < 0) return
    flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0 })
  }, [rows])

  const commitDelete = async (experienceId: string, snapshot: Experience[] | undefined) => {
    try {
      await deleteExperience.mutateAsync(experienceId)
    } catch {
      if (snapshot) {
        queryClient.setQueryData(queryKeys.experiences.all(tripId), snapshot)
      }
    }
  }

  const handleDeleteIntent = (experience: Experience) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const expDocCount = documents?.filter(d => d.experience_id === experience.id).length ?? 0

    if (expDocCount > 0) {
      setDeleteSheet({ visible: true, experience, documentCount: expDocCount })
      return
    }

    // Commit any already-pending delete before showing a new toast
    if (pendingDeleteRef.current) {
      clearTimeout(toastTimerRef.current)
      const prev = pendingDeleteRef.current
      pendingDeleteRef.current = null
      commitDelete(prev.experienceId, prev.snapshot)
    }

    const snapshot = queryClient.getQueryData<Experience[]>(queryKeys.experiences.all(tripId))
    queryClient.setQueryData<Experience[]>(
      queryKeys.experiences.all(tripId),
      (old = []) => old.filter(e => e.id !== experience.id)
    )

    pendingDeleteRef.current = { experienceId: experience.id, snapshot }
    setToastMessage(t('timeline_deleted', { title: experience.title }))
    setToastVisible(true)

    toastTimerRef.current = setTimeout(() => {
      const pending = pendingDeleteRef.current
      pendingDeleteRef.current = null
      setToastVisible(false)
      if (pending) commitDelete(pending.experienceId, pending.snapshot)
    }, 4000)
  }

  const handleUndo = () => {
    clearTimeout(toastTimerRef.current)
    const pending = pendingDeleteRef.current
    pendingDeleteRef.current = null
    if (pending?.snapshot) {
      queryClient.setQueryData(queryKeys.experiences.all(tripId), pending.snapshot)
    }
    setToastVisible(false)
  }

  const handleDeleteWithDocuments = () => {
    if (!deleteSheet.experience) return
    deleteExperience.mutate(deleteSheet.experience.id)
    setDeleteSheet(prev => ({ ...prev, visible: false }))
  }

  const handleCreate = async (data: CreateExperienceFormData) => {
    try {
      await createExperience.mutateAsync(data)
      setSheetVisible(false)
    } catch {
      // El error se muestra en el sheet
    }
  }

  const handleUpdate = async (data: CreateExperienceFormData) => {
    if (!editExperience) return
    try {
      await updateExperience.mutateAsync({ experienceId: editExperience.id, formData: data })
      setEditExperience(null)
    } catch {
      // El error se muestra en el sheet
    }
  }

  const experienceToFormData = (exp: Experience): CreateExperienceFormData => ({
    title: exp.title,
    type: exp.type,
    date: exp.date ?? new Date().toISOString().slice(0, 10),
    start_time: exp.start_time ?? undefined,
    end_time: exp.end_time ?? undefined,
    confirmation_code: exp.confirmation_code ?? undefined,
    destination_id: exp.destination_id ?? undefined,
    location: (
      typeof exp.location === 'object' &&
      exp.location !== null &&
      'name' in exp.location &&
      'lat' in exp.location &&
      'lng' in exp.location
    ) ? (exp.location as { name: string; lat: number; lng: number; city?: string }) : undefined,
  })

  const keyExtractor = useCallback(
    (entry: TimelineEntry, index: number) => {
      if (entry.type === 'header') return `header-${entry.title}`
      if (entry.type === 'city_banner') return `city-${entry.destination.id}-${index}`
      return entry.experience.id
    },
    []
  )

  const renderItem = useCallback(({ item: entry }: { item: TimelineEntry }) => {
    if (entry.type === 'city_banner') {
      return (
        <View className="flex-row mt-5">
          <View className="w-10 items-center">
            <View className={`w-[3px] h-3 ${entry.lineAbove ? 'bg-neutral-300 dark:bg-neutral-600' : 'bg-transparent'}`} />
            <Ionicons name="location" size={24} color={colors.primary[500]} />
            <View className="flex-1 w-[3px] bg-primary-500" />
          </View>
          <DestinationBanner destination={entry.destination} />
        </View>
      )
    }

    if (entry.type === 'header') {
      return (
        <View className="flex-row">
          <View className="w-10 items-center">
            {entry.title === UNDATED_SENTINEL ? (
              <View className="flex-1" />
            ) : (
              <>
                {entry.isFirst
                  ? <View className="flex-1" />
                  : <View className={`flex-1 w-[3px] ${entry.followsBanner ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600'}`} />
                }
                <View className={
                  entry.isToday
                    ? 'mt-2 w-4 h-4 rounded-full bg-primary-500 border-2 border-white dark:border-neutral-900'
                    : 'mt-2 w-3 h-3 rounded-full bg-neutral-400 dark:bg-neutral-600'
                } />
                <View className="h-2" />
                <View className="flex-1 w-[3px] bg-neutral-300 dark:bg-neutral-600 rounded-t-full" />
              </>
            )}
          </View>
          <DaySection date={entry.title === UNDATED_SENTINEL ? UNDATED_DISPLAY : entry.title} count={entry.count} />
        </View>
      )
    }

    const ratingData = ratingsMap?.[entry.experience.id]

    return (
      <View className="flex-row">
        <View className="w-10 items-center">
          {entry.isUndated
            ? <View className="flex-1" />
            : <View className="flex-1 w-[3px] bg-neutral-300 dark:bg-neutral-600" />
          }
        </View>
        <View className="flex-1 pr-4 pb-5">
          <StaggeredExperienceCardWrapper
            entry={entry}
            ratingData={ratingData}
            onDelete={() => handleDeleteIntent(entry.experience)}
            onEdit={() => setEditExperience(entry.experience)}
            onPress={() => router.push({
                pathname: '/(app)/trips/experience/[experienceId]',
                params: { experienceId: entry.experience.id, tripId },
              })}
          />
        </View>
      </View>
    )
  }, [isOwner, handleDeleteIntent, setEditExperience, ratingsMap])

  return (
    <View className="flex-1 bg-neutral-100 dark:bg-surface-900">
      <TripHeader scrollY={scrollY} />
      <View style={{ flex: 1 }}>
      {isLoading ? (
        <View className="px-5 pt-4 gap-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-5 gap-3">
          <Ionicons name="alert-circle-outline" size={32} color="#ef233c" />
          <Text className="text-base text-error text-center">{t('timeline_error_body')}</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="px-6 py-3 rounded-full border border-primary-500"
            activeOpacity={0.7}
          >
            <Text className="text-base text-primary-600 font-semibold">{t('common_retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          ref={flatListRef}
          data={rows}
          keyExtractor={keyExtractor}
          contentContainerClassName="pt-2 pb-24"
          renderItem={renderItem}
          onScrollToIndexFailed={() => {}}
          ListHeaderComponent={
            <DestinationChipsStrip
              destinations={destinations}
              onManage={() => setDestSheetVisible(true)}
              onDestinationPress={scrollToDestination}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={t('timeline_empty_title')}
              subtitle={t('timeline_empty_subtitle')}
              actionLabel={t('timeline_empty_action')}
              onAction={() => setSheetVisible(true)}
            />
          }
          onRefresh={refetch}
          refreshing={isLoading}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        />
      )}

      {!isLoading && (
        <Animated.View className="absolute right-5" style={[fabAnimStyle, { bottom: 16, pointerEvents: 'box-none' }]}>
          <TouchableOpacity
            onPress={() => setSheetVisible(true)}
            className="w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
            style={fabShadow}
          >
            <Ionicons name="add" size={28} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <UndoToast
        visible={toastVisible}
        message={toastMessage}
        onUndo={handleUndo}
      />

      <AddExperienceSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSubmit={handleCreate}
        isLoading={createExperience.isPending}
        error={createExperience.error?.message}
        minDate={trip?.start_date ? (() => { const [y, m, d] = trip.start_date.split('-').map(Number); return new Date(y, m - 1, d) })() : undefined}
        maxDate={trip?.end_date ? (() => { const [y, m, d] = trip.end_date.split('-').map(Number); return new Date(y, m - 1, d) })() : undefined}
        destinations={destinations}
      />

      <DeleteExperienceSheet
        visible={deleteSheet.visible}
        documentCount={deleteSheet.documentCount}
        onClose={() => setDeleteSheet(prev => ({ ...prev, visible: false }))}
        onConfirm={handleDeleteWithDocuments}
      />

      <AddExperienceSheet
        visible={editExperience !== null}
        onClose={() => setEditExperience(null)}
        onSubmit={handleUpdate}
        isLoading={updateExperience.isPending}
        error={updateExperience.error?.message}
        initialValues={editExperience ? experienceToFormData(editExperience) : undefined}
        mode="edit"
        destinations={destinations}
      />

      {trip && (
        <ManageDestinationsSheet
          visible={destSheetVisible}
          onClose={() => setDestSheetVisible(false)}
          tripId={tripId}
          tripStartDate={trip.start_date}
          tripEndDate={trip.end_date}
        />
      )}
      </View>
    </View>
  )
}
