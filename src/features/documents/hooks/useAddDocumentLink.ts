import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, DEMO_USER_ID, mockDocuments, mockExperiences } from '@/dev/mockData'
import type { AddLinkFormData } from '../types'

type AddLinkParams = AddLinkFormData & { tripId: string }

export function useAddDocumentLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, url, experience_id, tripId }: AddLinkParams) => {
      if (DEV_MODE) {
        const expTitle = mockExperiences[tripId]?.find((e) => e.id === experience_id)?.title ?? null
        const newDoc = {
          id: `demo-link-${Date.now()}`,
          experience_id,
          trip_id: tripId,
          name,
          file_path: null,
          file_type: null,
          document_type: 'link' as const,
          url,
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

      const { error } = await supabase.from('documents').insert({
        trip_id: tripId,
        experience_id,
        name,
        document_type: 'link',
        url,
        uploaded_by: user.id,
      })

      if (error) throw new Error('Error al guardar el enlace. Inténtalo de nuevo.')
    },
    onSuccess: (_data, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all(tripId) })
    },
  })
}
