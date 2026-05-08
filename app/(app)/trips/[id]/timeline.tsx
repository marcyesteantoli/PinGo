import { useState, useMemo, useRef } from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import { EmptyState } from '@components/ui/EmptyState'
import { SkeletonCard } from '@components/ui/Skeleton'
import { UndoToast } from '@components/ui/UndoToast'
import { TripHeader } from '@features/trips/components/TripHeader'
import { useTripContext } from '@features/trips/TripProvider'
import { AddExperienceSheet } from '@features/timeline/components/AddExperienceSheet'
import { DeleteExperienceSheet } from '@features/timeline/components/DeleteExperienceSheet'
import { DaySection } from '@features/timeline/components/DaySection'
import { ExperienceCard } from '@features/timeline/components/ExperienceCard'
import { useCreateExperience } from '@features/timeline/hooks/useCreateExperience'
import { useDeleteExperience } from '@features/timeline/hooks/useDeleteExperience'
import { useExperiences } from '@features/timeline/hooks/useExperiences'
import { useDocuments } from '@features/documents/hooks/useDocuments'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockExperiences } from '@/dev/mockData'
import type { Experience } from '@types/index'
import type { CreateExperienceFormData } from '@features/timeline/types'

type Section = { title: string; data: Experience[] }

type TimelineEntry =
  | { type: 'header'; title: string; count: number; isFirst: boolean; isToday: boolean }
  | { type: 'item'; experience: Experience; isUndated: boolean }

function groupByDate(experiences: Experience[]): Section[] {
  const groups: Record<string, Experience[]> = {}
  for (const exp of experiences) {
    const key = exp.date ?? 'Sin fecha'
    if (!groups[key]) groups[key] = []
    groups[key].push(exp)
  }
  const dated = Object.entries(groups)
    .filter(([k]) => k !== 'Sin fecha')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, data]) => ({ title, data }))
  const undated = groups['Sin fecha'] ?? []
  return undated.length > 0 ? [...dated, { title: 'Sin fecha', data: undated }] : dated
}

function toRows(sections: Section[]): TimelineEntry[] {
  const today = new Date().toISOString().slice(0, 10)
  const rows: TimelineEntry[] = []
  sections.forEach((s, i) => {
    const isUndated = s.title === 'Sin fecha'
    rows.push({
      type: 'header',
      title: s.title,
      count: s.data.length,
      isFirst: i === 0,
      isToday: !isUndated && s.title === today,
    })
    s.data.forEach(exp =>
      rows.push({ type: 'item', experience: exp, isUndated })
    )
  })
  return rows
}

interface DeleteSheetState {
  visible: boolean
  experience: Experience | null
  documentCount: number
}

export default function TimelineScreen() {
  const { tripId, isOwner } = useTripContext()
  const queryClient = useQueryClient()
  const { data: experiences, isLoading, error, refetch } = useExperiences(tripId)
  const { data: documents } = useDocuments(tripId)
  const createExperience = useCreateExperience(tripId)
  const deleteExperience = useDeleteExperience(tripId)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [deleteSheet, setDeleteSheet] = useState<DeleteSheetState>({
    visible: false,
    experience: null,
    documentCount: 0,
  })

  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const pendingDeleteRef = useRef<{
    experienceId: string
    snapshot: Experience[] | undefined
  } | null>(null)

  const rows = useMemo(
    () => toRows(groupByDate(experiences ?? [])),
    [experiences]
  )

  const commitDelete = async (experienceId: string, snapshot: Experience[] | undefined) => {
    if (DEV_MODE) {
      if (mockExperiences[tripId]) {
        mockExperiences[tripId] = mockExperiences[tripId].filter(e => e.id !== experienceId)
      }
      return
    }
    const { error } = await supabase.from('experiences').delete().eq('id', experienceId)
    if (error && snapshot) {
      queryClient.setQueryData(queryKeys.experiences.all(tripId), snapshot)
    } else if (!error) {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all(tripId) })
    }
  }

  const handleDeleteIntent = (experience: Experience) => {
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
    setToastMessage(`"${experience.title}" eliminada`)
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

  return (
    <View className="flex-1 bg-neutral-50">
      <TripHeader />

      {isLoading ? (
        <View className="px-5 pt-4 gap-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-base text-error text-center mb-4">{error.message}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text className="text-base text-primary-600 font-semibold">Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(entry) =>
            entry.type === 'header' ? `header-${entry.title}` : entry.experience.id
          }
          contentContainerClassName="pt-2 pb-24"
          renderItem={({ item: entry }) => {
            if (entry.type === 'header') {
              return (
                <View className="flex-row">
                  {/* Left track */}
                  <View className="w-10 items-center">
                    {entry.title === 'Sin fecha' ? (
                      <View className="flex-1" />
                    ) : (
                      <>
                        <View className="flex-1" />
                        <View className={
                          entry.isToday
                            ? 'mt-2 w-4 h-4 rounded-full bg-primary-500 border-2 border-white dark:border-neutral-900'
                            : 'mt-2 w-3 h-3 rounded-full bg-neutral-400 dark:bg-neutral-500'
                        } />
                        <View className="h-2" />
                        <View className="flex-1 w-[3px] bg-neutral-300 dark:bg-neutral-600 rounded-t-full" />
                      </>
                    )}
                  </View>
                  {/* Content */}
                  <DaySection date={entry.title} count={entry.count} />
                </View>
              )
            }

            return (
              <View className="flex-row">
                {/* Left track */}
                <View className="w-10 items-center">
                  {entry.isUndated
                    ? <View className="flex-1" />
                    : <View className="flex-1 w-[3px] bg-neutral-300 dark:bg-neutral-600" />
                  }
                </View>
                {/* Content */}
                <View className="flex-1 pr-4 pb-3">
                  <ExperienceCard
                    experience={entry.experience}
                    canDelete={isOwner}
                    onDelete={() => handleDeleteIntent(entry.experience)}
                  />
                </View>
              </View>
            )
          }}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="Sin experiencias"
              subtitle="Añade vuelos, hoteles, actividades y más"
              actionLabel="Añadir experiencia"
              onAction={() => setSheetVisible(true)}
            />
          }
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}

      {!isLoading && (
        <TouchableOpacity
          onPress={() => setSheetVisible(true)}
          className="absolute bottom-8 right-5 w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
          style={{ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
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
      />

      <DeleteExperienceSheet
        visible={deleteSheet.visible}
        documentCount={deleteSheet.documentCount}
        onClose={() => setDeleteSheet(prev => ({ ...prev, visible: false }))}
        onConfirm={handleDeleteWithDocuments}
      />
    </View>
  )
}
