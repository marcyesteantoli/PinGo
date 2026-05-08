import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fabShadow } from '@lib/shadows'
import { EmptyState } from '@components/ui/EmptyState'
import { SkeletonCard } from '@components/ui/Skeleton'
import { TripHeader } from '@features/trips/components/TripHeader'
import { useTripContext } from '@features/trips/TripProvider'
import { AddMemoryCaption } from '@features/memories/components/AddMemoryCaption'
import { MemoryDetail } from '@features/memories/components/MemoryDetail'
import { MemoryGrid } from '@features/memories/components/MemoryGrid'
import { useAddMemory } from '@features/memories/hooks/useAddMemory'
import { useDeleteMemory } from '@features/memories/hooks/useDeleteMemory'
import { useMemories } from '@features/memories/hooks/useMemories'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { LIMITS } from '@/config/limits'
import type { Memory } from '@types/index'

export default function MemoriesScreen() {
  const { tripId, isOwner, collaborators } = useTripContext()
  const { data: memories, isLoading, refetch } = useMemories(tripId)
  const addMemory = useAddMemory()
  const deleteMemory = useDeleteMemory()
  const { data: currentUser } = useCurrentUser()
  const [captionSheetVisible, setCaptionSheetVisible] = useState(false)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const insets = useSafeAreaInsets()

  const count = memories?.length ?? 0

  const getUploader = (userId: string) => collaborators.find((c) => c.user_id === userId)

  const handleAddMemory = async (caption?: string) => {
    try {
      await addMemory.mutateAsync({ tripId, caption })
      setCaptionSheetVisible(false)
    } catch (err: any) {
      if (err?.code === 'NO_IMAGE_SELECTED') {
        setCaptionSheetVisible(false)
        return
      }
      // Otros errores se muestran en el sheet
    }
  }

  const errorMessage = (() => {
    const err = addMemory.error as any
    if (!err) return null
    if (err.code === 'LIMIT_REACHED') return err.message
    if (err.code === 'PERMISSION_DENIED') return 'Ve a Ajustes > Privacidad para permitir el acceso a fotos.'
    return err.message
  })()

  return (
    <View className="flex-1 bg-neutral-50">
      <TripHeader />

      {/* Counter */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className="text-sm text-neutral-500">
          {count} de {LIMITS.MAX_PHOTOS_PER_TRIP} fotos
        </Text>
        <View className="flex-row items-center gap-1">
          <View
            className="h-1.5 rounded-full bg-primary-500"
            style={{ width: Math.max(4, (count / LIMITS.MAX_PHOTOS_PER_TRIP) * 80) }}
          />
          <View
            className="h-1.5 rounded-full bg-neutral-200"
            style={{ width: Math.max(0, 80 - (count / LIMITS.MAX_PHOTOS_PER_TRIP) * 80) }}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="px-5 gap-3">
          {[1, 2].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : !memories?.length ? (
        <EmptyState
          icon="images-outline"
          title="Sin recuerdos"
          subtitle="Guarda los mejores momentos del viaje"
          actionLabel="Añadir foto"
          onAction={() => setCaptionSheetVisible(true)}
        />
      ) : (
        <MemoryGrid
          memories={memories}
          onPress={(m) => setSelectedMemory(m)}
        />
      )}

      {/* FAB */}
      {!isLoading && count < LIMITS.MAX_PHOTOS_PER_TRIP && (
        <TouchableOpacity
          onPress={() => setCaptionSheetVisible(true)}
          className="absolute right-5 w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
          style={{ bottom: insets.bottom + 16, ...fabShadow }}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      )}

      <AddMemoryCaption
        visible={captionSheetVisible}
        onClose={() => setCaptionSheetVisible(false)}
        onSubmit={handleAddMemory}
        isLoading={addMemory.isPending}
        error={errorMessage}
      />

      <MemoryDetail
        memory={selectedMemory}
        visible={!!selectedMemory}
        onClose={() => setSelectedMemory(null)}
        canDelete={isOwner || selectedMemory?.user_id === currentUser?.id}
        onDelete={(id) => {
          deleteMemory.mutate({ memoryId: id, tripId })
          setSelectedMemory(null)
        }}
        uploaderName={selectedMemory ? (getUploader(selectedMemory.user_id)?.name ?? 'Desconocido') : undefined}
        uploaderAvatar={selectedMemory ? getUploader(selectedMemory.user_id)?.avatar_url : undefined}
      />
    </View>
  )
}
