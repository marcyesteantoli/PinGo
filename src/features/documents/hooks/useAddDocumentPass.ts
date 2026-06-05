import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, DEMO_USER_ID, mockDocuments, mockExperiences } from '@/dev/mockData'

type AddPassParams = {
  name: string
  experience_id: string
  tripId: string
}

export function useAddDocumentPass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, experience_id, tripId }: AddPassParams) => {
      if (DEV_MODE) {
        const expTitle = mockExperiences[tripId]?.find((e) => e.id === experience_id)?.title ?? null
        const newDoc = {
          id: `demo-pass-${Date.now()}`,
          experience_id,
          trip_id: tripId,
          name,
          file_path: 'mock/path/pass.pkpass',
          file_type: 'application/vnd.apple.pkpass',
          document_type: 'pass' as const,
          url: null,
          file_url: null,
          uploaded_by: DEMO_USER_ID,
          created_at: new Date().toISOString(),
          experience_title: expTitle,
        }
        if (!mockDocuments[tripId]) mockDocuments[tripId] = []
        mockDocuments[tripId].unshift(newDoc as any)
        return newDoc
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.apple.pkpass', 'application/octet-stream'],
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets[0]) return null

      const asset = result.assets[0]
      const filename = `${user.id}_${Date.now()}.pkpass`
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
          contentType: 'application/vnd.apple.pkpass',
        })

      if (uploadError) throw new Error('Error al subir el boarding pass. Inténtalo de nuevo.')

      const { error: dbError } = await supabase.from('documents').insert({
        trip_id: tripId,
        experience_id,
        name,
        file_path: storagePath,
        file_type: 'application/vnd.apple.pkpass',
        document_type: 'pass',
        uploaded_by: user.id,
      })

      if (dbError) {
        await supabase.storage.from('documents').remove([storagePath])
        throw new Error('Error al guardar el boarding pass. Inténtalo de nuevo.')
      }
    },
    onSuccess: (_data, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all(tripId) })
    },
  })
}
