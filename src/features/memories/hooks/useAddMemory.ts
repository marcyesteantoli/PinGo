import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { compressImage } from '@utils/image'
import { LIMITS } from '@/config/limits'
import { DEV_MODE, DEMO_USER_ID, mockMemories } from '@/dev/mockData'
import type { MemoryWithUrl } from './useMemories'

export type AddMemoryParams = {
  tripId: string
  caption?: string
  asset?: ImagePicker.ImagePickerAsset // undefined en DEV_MODE
}

export type AddMemoriesParams = {
  tripId: string
  assets: ImagePicker.ImagePickerAsset[]
}

type AddMemoryError =
  | { code: 'LIMIT_REACHED'; message: string }
  | { code: 'UPLOAD_FAILED'; message: string }
  | { code: 'DB_FAILED'; message: string }

async function uploadMemory(
  asset: ImagePicker.ImagePickerAsset,
  tripId: string,
  userId: string,
  caption?: string
): Promise<MemoryWithUrl> {
  // 1. Comprimir
  const compressed = await compressImage(asset.uri)

  // 2. Preparar el fichero para upload
  const filename = `${userId}_${Date.now()}.jpg`
  const storagePath = `memories/${tripId}/${filename}`

  // fetch(file://).blob() returns empty blob on iOS — read as base64 instead
  const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
    encoding: 'base64',
  })
  const byteCharacters = atob(base64)
  const byteArray = new Uint8Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i)
  }

  // 3. Subir a Storage
  const { error: uploadError } = await supabase.storage
    .from('memories')
    .upload(storagePath, byteArray, { contentType: 'image/jpeg', upsert: false })

  if (uploadError) {
    throw {
      code: 'UPLOAD_FAILED',
      message: 'Error al subir la foto. Inténtalo de nuevo.',
    } satisfies AddMemoryError
  }

  // 4. Insertar en BD con storage path — si falla, limpiar el archivo subido
  // Guardamos el path (no la URL pública) para generar signed URLs al leer
  const { data, error: dbError } = await supabase
    .from('memories')
    .insert({ trip_id: tripId, user_id: userId, image_url: storagePath, caption })
    .select()
    .single()

  if (dbError) {
    // Limpieza: borrar el archivo huérfano de Storage
    await supabase.storage.from('memories').remove([storagePath])
    throw {
      code: 'DB_FAILED',
      message: 'Error al guardar el recuerdo. Inténtalo de nuevo.',
    } satisfies AddMemoryError
  }

  return { ...data, cacheKey: data.image_url }
}

export function useAddMemories() {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const mutation = useMutation({
    mutationFn: async ({ tripId, assets }: AddMemoriesParams): Promise<number> => {
      if (DEV_MODE) {
        const seeds = ['tokyo', 'kyoto', 'osaka', 'hiroshima', 'nara', 'nikko', 'hakone']
        setProgress({ done: 0, total: assets.length })
        for (let i = 0; i < assets.length; i++) {
          const seed = seeds[Math.floor(Math.random() * seeds.length)]
          const imageUrl = `https://picsum.photos/seed/${seed}${Date.now() + i}/800/600`
          const newMemory: MemoryWithUrl = {
            id: `demo-mem-${Date.now()}-${i}`,
            trip_id: tripId,
            user_id: DEMO_USER_ID,
            image_url: imageUrl,
            cacheKey: imageUrl,
            caption: null,
            created_at: new Date().toISOString(),
          }
          if (!mockMemories[tripId]) mockMemories[tripId] = []
          mockMemories[tripId].unshift(newMemory)
          queryClient.setQueryData<MemoryWithUrl[]>(
            queryKeys.memories.all(tripId),
            (old = []) => [newMemory, ...old]
          )
          setProgress({ done: i + 1, total: assets.length })
        }
        return assets.length
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user)
        throw { code: 'DB_FAILED', message: 'No hay sesión activa.' } satisfies AddMemoryError

      setProgress({ done: 0, total: assets.length })
      let uploaded = 0

      for (const asset of assets) {
        const memory = await uploadMemory(asset, tripId, user.id)
        queryClient.setQueryData<MemoryWithUrl[]>(
          queryKeys.memories.all(tripId),
          (old = []) => [memory, ...old]
        )
        uploaded++
        setProgress({ done: uploaded, total: assets.length })
      }

      return uploaded
    },
    onSettled: (_, __, variables) => {
      setProgress(null)
      if (DEV_MODE) return
      queryClient.invalidateQueries({ queryKey: queryKeys.memories.all(variables.tripId) })
    },
  })

  return { ...mutation, progress }
}

export function useAddMemory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tripId, caption, asset }: AddMemoryParams): Promise<MemoryWithUrl> => {
      // DEV_MODE: genera imagen mock aleatoria, ignora el asset real
      if (DEV_MODE) {
        const seeds = ['tokyo', 'kyoto', 'osaka', 'hiroshima', 'nara', 'nikko', 'hakone']
        const seed = seeds[Math.floor(Math.random() * seeds.length)]
        const imageUrl = `https://picsum.photos/seed/${seed}${Date.now()}/800/600`
        const newMemory: MemoryWithUrl = {
          id: `demo-mem-${Date.now()}`,
          trip_id: tripId,
          user_id: DEMO_USER_ID,
          image_url: imageUrl,
          cacheKey: imageUrl,
          caption: caption ?? null,
          created_at: new Date().toISOString(),
        }
        if (!mockMemories[tripId]) mockMemories[tripId] = []
        mockMemories[tripId].unshift(newMemory)
        return newMemory
      }

      // Double-check del límite antes del upload (el screen ya lo verifica antes de abrir el picker)
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

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw { code: 'DB_FAILED', message: 'No hay sesión activa.' } satisfies AddMemoryError

      // El asset llega ya seleccionado desde el screen
      if (!asset) throw { code: 'DB_FAILED', message: 'No se ha seleccionado ninguna imagen.' } satisfies AddMemoryError

      return uploadMemory(asset, tripId, user.id, caption)
    },
    onSuccess: (newMemory) => {
      queryClient.setQueryData<MemoryWithUrl[]>(
        queryKeys.memories.all(newMemory.trip_id),
        (old = []) => [newMemory, ...old]
      )
    },
    onSettled: (_, __, variables) => {
      if (DEV_MODE) return
      queryClient.invalidateQueries({ queryKey: queryKeys.memories.all(variables.tripId) })
    },
  })
}
