import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { AppError, mapSupabaseError } from '@lib/errors'
import type { AddLinkFormData } from '../types'

type AddLinkParams = AddLinkFormData & { tripId: string }

export function useAddDocumentLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, url, experience_id, tripId }: AddLinkParams) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new AppError('no_session')

      const { error } = await supabase.from('documents').insert({
        trip_id: tripId,
        experience_id,
        name,
        document_type: 'link',
        url,
        uploaded_by: user.id,
      })

      if (error) throw mapSupabaseError(error)
    },
    onSuccess: (_data, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all(tripId) })
    },
  })
}
