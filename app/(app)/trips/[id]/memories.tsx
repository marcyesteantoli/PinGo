import { useState } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useSharedValue } from 'react-native-reanimated'
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
import { DEV_MODE } from '@/dev/mockData'
import type { Memory } from '@types/index'

export default function MemoriesScreen() {
  const { tripId, isOwner, collaborators } = useTripContext()
  const { data: memories, isLoading } = useMemories(tripId)
  const addMemory = useAddMemory()
  const deleteMemory = useDeleteMemory()
  const { data: currentUser } = useCurrentUser()

  const [captionSheetVisible, setCaptionSheetVisible] = useState(false)
  const [pendingAsset, setPendingAsset] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)

  const insets = useSafeAreaInsets()
  const count = memories?.length ?? 0
  const scrollY = useSharedValue(0)

  const getUploader = (userId: string) => collaborators.find((c) => c.user_id === userId)

  // Flujo: FAB → galería → preview+caption → subir
  const handlePickImage = async () => {
    // 1. Verificar límite antes de abrir el picker
    if (count >= LIMITS.MAX_PHOTOS_PER_TRIP) return

    // En DEV_MODE simulamos una imagen de galería con picsum para ver el flujo real
    if (DEV_MODE) {
      const seeds = ['tokyo', 'kyoto', 'osaka', 'hiroshima', 'nara']
      const seed = seeds[Math.floor(Math.random() * seeds.length)]
      setPendingAsset({ uri: `https://picsum.photos/seed/${seed}${Date.now()}/800/600` } as ImagePicker.ImagePickerAsset)
      setCaptionSheetVisible(true)
      return
    }

    // 2. Pedir permiso
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Acceso a fotos denegado',
        'Ve a Ajustes > Privacidad > Fotos y permite el acceso a TripSync.',
        [{ text: 'Entendido', style: 'default' }]
      )
      return
    }

    // 3. Abrir galería
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    })

    if (result.canceled || !result.assets[0]) return

    // 4. Guardar asset y mostrar sheet de caption
    setPendingAsset(result.assets[0])
    setCaptionSheetVisible(true)
  }

  const handleAddMemory = async (caption?: string) => {
    try {
      await addMemory.mutateAsync({ tripId, caption, asset: pendingAsset ?? undefined })
      setCaptionSheetVisible(false)
      setPendingAsset(null)
    } catch {
      // El error se muestra en el sheet a través de errorMessage
    }
  }

  const handleCloseSheet = () => {
    setCaptionSheetVisible(false)
    setPendingAsset(null)
    addMemory.reset()
  }

  const errorMessage = (() => {
    const err = addMemory.error as any
    if (!err) return null
    if (err.code === 'LIMIT_REACHED') return err.message
    return err.message ?? 'Ha ocurrido un error. Inténtalo de nuevo.'
  })()

  return (
    <View className="flex-1 bg-neutral-100 dark:bg-surface-900">
      <TripHeader scrollY={scrollY} />

      {/* Counter */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          {count} de {LIMITS.MAX_PHOTOS_PER_TRIP} fotos
        </Text>
        <View className="flex-row items-center gap-1">
          <View
            className="h-1.5 rounded-full bg-primary-500"
            style={{ width: Math.max(4, (count / LIMITS.MAX_PHOTOS_PER_TRIP) * 80) }}
          />
          <View
            className="h-1.5 rounded-full bg-secondary-100 dark:bg-secondary-900/30"
            style={{ width: Math.max(0, 80 - (count / LIMITS.MAX_PHOTOS_PER_TRIP) * 80) }}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="px-5 gap-3">
          {[1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : !memories?.length ? (
        <EmptyState
          icon="images-outline"
          title="Sin recuerdos"
          subtitle="Guarda los mejores momentos del viaje"
          actionLabel="Añadir foto"
          onAction={handlePickImage}
        />
      ) : (
        <MemoryGrid
          memories={memories}
          onPress={(m) => setSelectedMemory(m)}
          scrollY={scrollY}
        />
      )}

      {/* FAB */}
      {!isLoading && count < LIMITS.MAX_PHOTOS_PER_TRIP && (
        <TouchableOpacity
          onPress={handlePickImage}
          className="absolute right-5 w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
          style={{ bottom: insets.bottom + 16, ...fabShadow }}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      )}

      <AddMemoryCaption
        visible={captionSheetVisible}
        onClose={handleCloseSheet}
        onSubmit={handleAddMemory}
        isLoading={addMemory.isPending}
        error={errorMessage}
        imageUri={pendingAsset?.uri}
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
        uploaderName={
          selectedMemory ? (getUploader(selectedMemory.user_id)?.name ?? 'Desconocido') : undefined
        }
        uploaderAvatar={
          selectedMemory ? getUploader(selectedMemory.user_id)?.avatar_url : undefined
        }
      />
    </View>
  )
}
