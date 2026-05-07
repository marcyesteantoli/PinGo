import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EmptyState } from '@components/ui/EmptyState'
import { SkeletonCard } from '@components/ui/Skeleton'
import { TripHeader } from '@features/trips/components/TripHeader'
import { useTripContext } from '@features/trips/TripProvider'
import { AddMemoryCaption } from '@features/memories/components/AddMemoryCaption'
import { MemoryDetail } from '@features/memories/components/MemoryDetail'
import { MemoryGrid } from '@features/memories/components/MemoryGrid'
import { useAddMemory } from '@features/memories/hooks/useAddMemory'
import { useMemories } from '@features/memories/hooks/useMemories'
import { LIMITS } from '@/config/limits'
import type { Memory } from '@types/index'

export default function MemoriesScreen() {
  const { tripId, isOwner, collaborators } = useTripContext()
  const { data: memories, isLoading, refetch } = useMemories(tripId)
  const addMemory = useAddMemory()
  const [captionSheetVisible, setCaptionSheetVisible] = useState(false)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)

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
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
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
          className="absolute bottom-8 right-5 w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
          style={{ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
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
        canDelete={isOwner || selectedMemory?.user_id !== undefined}
        onDelete={(id) => {
          setSelectedMemory(null)
        }}
        uploaderName={selectedMemory ? (getUploader(selectedMemory.user_id)?.name ?? 'Desconocido') : undefined}
        uploaderAvatar={selectedMemory ? getUploader(selectedMemory.user_id)?.avatar_url : undefined}
      />
    </SafeAreaView>
  )
}
