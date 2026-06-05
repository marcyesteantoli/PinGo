import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as FileSystem from 'expo-file-system/legacy'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { compressImage } from '@utils/image'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import type { ImagePickerAsset } from 'expo-image-picker'

export function useUploadSavedCoverPhoto(experienceId: string) {
  const { data: user } = useCurrentUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (asset: ImagePickerAsset): Promise<string> => {
      const userId = user!.id

      // 1. Fetch current path to clean up orphan after successful upload
      const { data: row } = await (supabase as any)
        .from('user_saved_experiences')
        .select('cover_photo_url')
        .eq('user_id', userId)
        .eq('experience_id', experienceId)
        .maybeSingle()
      const oldPath: string | null = row?.cover_photo_url ?? null

      // 2. Compress + convert to Uint8Array
      const compressed = await compressImage(asset.uri)
      const base64 = await FileSystem.readAsStringAsync(compressed.uri, { encoding: 'base64' })
      const bytes = new Uint8Array(atob(base64).split('').map((c) => c.charCodeAt(0)))

      // 3. Upload to saved-photos bucket
      const filename = `${experienceId}_${Date.now()}.jpg`
      const storagePath = `${userId}/${filename}`

      const { error: uploadError } = await supabase.storage
        .from('saved-photos')
        .upload(storagePath, bytes, { contentType: 'image/jpeg', upsert: false })

      if (uploadError) throw new Error(uploadError.message)

      // 4. Persist path in DB
      const { error: dbError } = await (supabase as any)
        .from('user_saved_experiences')
        .update({ cover_photo_url: storagePath })
        .eq('user_id', userId)
        .eq('experience_id', experienceId)

      if (dbError) {
        // Clean up orphan upload
        await supabase.storage.from('saved-photos').remove([storagePath])
        throw new Error(dbError.message)
      }

      // 5. Remove old file now that DB is updated
      if (oldPath) {
        await supabase.storage.from('saved-photos').remove([oldPath])
      }

      return storagePath
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedExperiences.byUser() })
      queryClient.invalidateQueries({ queryKey: queryKeys.savedExperiences.detail(experienceId) })
    },
  })
}
