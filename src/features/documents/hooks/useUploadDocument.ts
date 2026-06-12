import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { DocumentPickerAsset } from 'expo-document-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import type { UploadDocumentFormData } from '../types'

type UploadDocumentParams = UploadDocumentFormData & { tripId: string; asset?: DocumentPickerAsset }

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, experience_id, tripId, asset }: UploadDocumentParams) => {
      if (!asset) return null

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

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

      if (uploadError) throw new Error('Error al subir el archivo. Inténtalo de nuevo.')

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
        throw new Error('Error al guardar el documento. Inténtalo de nuevo.')
      }
    },
    onSuccess: (_newDoc, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all(variables.tripId) })
    },
  })
}
