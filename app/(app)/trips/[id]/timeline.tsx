import { useState, useMemo } from 'react'
import { SectionList, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { EmptyState } from '@components/ui/EmptyState'
import { SkeletonCard } from '@components/ui/Skeleton'
import { TripHeader } from '@features/trips/components/TripHeader'
import { useTripContext } from '@features/trips/TripProvider'
import { AddExperienceSheet } from '@features/timeline/components/AddExperienceSheet'
import { DaySection } from '@features/timeline/components/DaySection'
import { ExperienceCard } from '@features/timeline/components/ExperienceCard'
import { useCreateExperience } from '@features/timeline/hooks/useCreateExperience'
import { useDeleteExperience } from '@features/timeline/hooks/useDeleteExperience'
import { useExperiences } from '@features/timeline/hooks/useExperiences'
import type { Experience } from '@types/index'
import type { CreateExperienceFormData } from '@features/timeline/types'

function groupByDate(experiences: Experience[]) {
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

export default function TimelineScreen() {
  const { tripId, isOwner } = useTripContext()
  const { data: experiences, isLoading, error, refetch } = useExperiences(tripId)
  const createExperience = useCreateExperience(tripId)
  const deleteExperience = useDeleteExperience(tripId)
  const [sheetVisible, setSheetVisible] = useState(false)

  const sections = useMemo(() => groupByDate(experiences ?? []), [experiences])

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
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerClassName="pt-2 pb-24"
          renderSectionHeader={({ section }) => (
            <DaySection date={section.title} count={section.data.length} />
          )}
          renderItem={({ item }) => (
            <View className="mb-4 pl-10 pr-5">
              <ExperienceCard
                experience={item}
                canDelete={isOwner}
                onDelete={() => deleteExperience.mutate(item.id)}
              />
            </View>
          )}
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
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* FAB */}
      {!isLoading && (
        <TouchableOpacity
          onPress={() => setSheetVisible(true)}
          className="absolute bottom-8 right-5 w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
          style={{ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      )}

      <AddExperienceSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSubmit={handleCreate}
        isLoading={createExperience.isPending}
        error={createExperience.error?.message}
      />
    </View>
  )
}
