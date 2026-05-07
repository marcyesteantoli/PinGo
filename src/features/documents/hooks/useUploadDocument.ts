import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import type { UploadDocumentFormData } from '../types'

type UploadDocumentParams = UploadDocumentFormData & { tripId: string }

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, experience_id, tripId }: UploadDocumentParams) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        throw new Error('Necesitamos acceso a tus archivos para subir documentos.')
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
        allowsEditing: false,
      })

      if (result.canceled || !result.assets[0]) return null

      const asset = result.assets[0]
      const ext = asset.uri.split('.').pop() ?? 'jpg'
      const filename = `${user.id}_${Date.now()}.${ext}`
      const storagePath = `documents/${tripId}/${experience_id}/${filename}`

      const response = await fetch(asset.uri)
      const blob = await response.blob()

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, blob, { upsert: false })

      if (uploadError) throw new Error('Error al subir el archivo. Inténtalo de nuevo.')

      // Signed URL válida 1 año
      const { data: signedData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(storagePath, 365 * 24 * 60 * 60)

      if (urlError || !signedData) throw new Error('Error al obtener la URL del documento.')

      const { error: dbError } = await supabase.from('documents').insert({
        trip_id: tripId,
        experience_id,
        name,
        file_url: signedData.signedUrl,
        file_type: asset.mimeType ?? 'image/jpeg',
        uploaded_by: user.id,
      })

      if (dbError) {
        await supabase.storage.from('documents').remove([storagePath])
        throw new Error('Error al guardar el documento. Inténtalo de nuevo.')
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all(variables.tripId) })
    },
  })
}
