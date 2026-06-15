import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { DocumentPickerAsset } from 'expo-document-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { LIMITS } from '@/config/limits'
import { fetchUserProStatus } from '@features/premium/hooks/useIsPro'
import type { UploadDocumentFormData } from '../types'

type UploadDocumentParams = UploadDocumentFormData & { tripId: string; asset?: DocumentPickerAsset }

export type UploadDocumentError =
  | { code: 'LIMIT_REACHED'; message: string }
  | { code: 'UPLOAD_FAILED'; message: string }
  | { code: 'DB_FAILED'; message: string }

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, experience_id, tripId, asset }: UploadDocumentParams) => {
      if (!asset) return null

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw { code: 'DB_FAILED', message: 'No hay sesión activa' } satisfies UploadDocumentError

      const { count, error: countError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('trip_id', tripId)

      if (countError) throw { code: 'DB_FAILED', message: 'Error al verificar el límite de documentos.' } satisfies UploadDocumentError

      const isUserPro = await fetchUserProStatus(user.id)
      const docLimit = isUserPro ? LIMITS.PRO_MAX_DOCUMENTS_PER_TRIP : LIMITS.FREE_MAX_DOCUMENTS_PER_TRIP

      if ((count ?? 0) >= docLimit) {
        throw {
          code: 'LIMIT_REACHED',
          message: `Este viaje ha alcanzado el límite de ${docLimit} documentos.`,
        } satisfies UploadDocumentError
      }

      const ext = asset.name.split('.').pop() ?? 'pdf'
      const filename = `${user.id}_${Date.now()}.${ext}`
      const storagePath = `documents/${tripId}/${experience_id}/${filename}`

      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      })
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, bytes, {
          upsert: false,
          contentType: asset.mimeType ?? 'application/pdf',
        })

      if (uploadError) throw { code: 'UPLOAD_FAILED', message: 'Error al subir el archivo. Inténtalo de nuevo.' } satisfies UploadDocumentError

      const { error: dbError } = await supabase.from('documents').insert({
        trip_id: tripId,
        experience_id,
        name,
        file_path: storagePath,
        file_type: asset.mimeType ?? 'application/pdf',
        uploaded_by: user.id,
      })

      if (dbError) {
        await supabase.storage.from('documents').remove([storagePath])
        throw { code: 'DB_FAILED', message: 'Error al guardar el documento. Inténtalo de nuevo.' } satisfies UploadDocumentError
      }
    },
    onSuccess: (_newDoc, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all(variables.tripId) })
    },
  })
}
