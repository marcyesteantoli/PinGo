import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { compressImage } from '@utils/image'
import { LIMITS } from '@/config/limits'
import type { Memory } from '@types/index'

type AddMemoryParams = {
  tripId: string
  caption?: string
}

type AddMemoryError =
  | { code: 'LIMIT_REACHED'; message: string }
  | { code: 'PERMISSION_DENIED'; message: string }
  | { code: 'NO_IMAGE_SELECTED'; message: string }
  | { code: 'UPLOAD_FAILED'; message: string }
  | { code: 'DB_FAILED'; message: string }

async function pickAndValidate(tripId: string): Promise<ImagePicker.ImagePickerAsset> {
  // 1. Verificar límite ANTES de abrir la galería
  const { count, error: countError } = await supabase
    .from('memories')
    .select('*', { count: 'exact', head: true })
    .eq('trip_id', tripId)

  if (countError) throw { code: 'DB_FAILED', message: 'Error al verificar el límite de fotos.' }

  if ((count ?? 0) >= LIMITS.MAX_PHOTOS_PER_TRIP) {
    throw {
      code: 'LIMIT_REACHED',
      message: `Este viaje ha alcanzado el límite de ${LIMITS.MAX_PHOTOS_PER_TRIP} fotos.`,
    } satisfies AddMemoryError
  }

  // 2. Verificar permiso
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') {
    throw {
      code: 'PERMISSION_DENIED',
      message: 'Necesitamos acceso a tus fotos para añadir recuerdos.',
    } satisfies AddMemoryError
  }

  // 3. Abrir galería
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1, // sin compresión aquí — la hacemos nosotros
    allowsEditing: false,
  })

  if (result.canceled || !result.assets[0]) {
    throw { code: 'NO_IMAGE_SELECTED', message: '' } satisfies AddMemoryError
  }

  return result.assets[0]
}

async function uploadMemory(
  asset: ImagePicker.ImagePickerAsset,
  tripId: string,
  userId: string,
  caption?: string
): Promise<Memory> {
  // 4. Comprimir
  const compressed = await compressImage(asset.uri)

  // 5. Preparar el fichero para upload
  const filename = `${userId}_${Date.now()}.jpg`
  const storagePath = `memories/${tripId}/${filename}`

  const response = await fetch(compressed.uri)
  const blob = await response.blob()

  // 6. Subir a Storage
  const { error: uploadError } = await supabase.storage
    .from('memories')
    .upload(storagePath, blob, { contentType: 'image/jpeg', upsert: false })

  if (uploadError) {
    throw { code: 'UPLOAD_FAILED', message: 'Error al subir la foto. Inténtalo de nuevo.' } satisfies AddMemoryError
  }

  // 7. Obtener URL pública
  const { data: { publicUrl } } = supabase.storage.from('memories').getPublicUrl(storagePath)

  // 8. Insertar en BD — si falla, limpiar el archivo subido
  const { data, error: dbError } = await supabase
    .from('memories')
    .insert({ trip_id: tripId, user_id: userId, image_url: publicUrl, caption })
    .select()
    .single()

  if (dbError) {
    // Limpieza: borrar el archivo huérfano de Storage
    await supabase.storage.from('memories').remove([storagePath])
    throw { code: 'DB_FAILED', message: 'Error al guardar el recuerdo. Inténtalo de nuevo.' } satisfies AddMemoryError
  }

  return data
}

export function useAddMemory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tripId, caption }: AddMemoryParams): Promise<Memory> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw { code: 'DB_FAILED', message: 'No hay sesión activa.' }

      const asset = await pickAndValidate(tripId)
      return uploadMemory(asset, tripId, user.id, caption)
    },
    onSuccess: (newMemory) => {
      queryClient.setQueryData<Memory[]>(
        queryKeys.memories.all(newMemory.trip_id),
        (old = []) => [newMemory, ...old]
      )
    },
  })
}
