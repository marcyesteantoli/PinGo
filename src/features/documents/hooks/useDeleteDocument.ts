import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { AppError } from '@lib/errors'

interface DeleteDocumentParams {
  documentId: string
  tripId: string
  fileUrl?: string | null
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ documentId, tripId, fileUrl }: DeleteDocumentParams) => {
      // Extract storage path from signed URL if present
      if (fileUrl) {
        const match = fileUrl.match(/\/object\/sign\/documents\/(.+?)(\?|$)/)
        if (match?.[1]) {
          await supabase.storage.from('documents').remove([decodeURIComponent(match[1])])
        }
      }

      const { data, error } = await supabase.from('documents').delete().eq('id', documentId).select('id')
      if (error) throw new AppError('delete_error', error)
      if (!data || data.length === 0) throw new AppError('not_authorized')
    },
    onSuccess: (_data, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all(tripId) })
    },
  })
}
