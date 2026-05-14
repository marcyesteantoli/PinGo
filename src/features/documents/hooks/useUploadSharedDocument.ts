import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'

type Params = {
  tripId: string
  experienceId: string
  name: string
  fileUri: string
  mimeType: string
  fileName: string
}

export function useUploadSharedDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tripId, experienceId, name, fileUri, mimeType, fileName }: Params) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      const ext = fileName.split('.').pop() ?? 'pdf'
      const filename = `${user.id}_${Date.now()}.${ext}`
      const storagePath = `documents/${tripId}/${experienceId}/${filename}`

      const response = await fetch(fileUri)
      const blob = await response.blob()

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, blob, { upsert: false })

      if (uploadError) throw new Error('Error al subir el archivo. Inténtalo de nuevo.')

      const { data: signedData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(storagePath, 365 * 24 * 60 * 60)

      if (urlError || !signedData) throw new Error('Error al obtener la URL del documento.')

      const { error: dbError } = await supabase.from('documents').insert({
        trip_id: tripId,
        experience_id: experienceId,
        name,
        file_url: signedData.signedUrl,
        file_type: mimeType,
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
