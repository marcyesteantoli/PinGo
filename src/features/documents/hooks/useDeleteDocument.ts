import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockDocuments } from '@/dev/mockData'

interface DeleteDocumentParams {
  documentId: string
  tripId: string
  fileUrl?: string | null
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ documentId, tripId, fileUrl }: DeleteDocumentParams) => {
      if (DEV_MODE) {
        if (mockDocuments[tripId]) {
          mockDocuments[tripId] = mockDocuments[tripId].filter((d) => d.id !== documentId)
        }
        return
      }

      // Extract storage path from signed URL if present
      if (fileUrl) {
        const match = fileUrl.match(/\/object\/sign\/documents\/(.+?)(\?|$)/)
        if (match?.[1]) {
          await supabase.storage.from('documents').remove([decodeURIComponent(match[1])])
        }
      }

      const { error } = await supabase.from('documents').delete().eq('id', documentId)
      if (error) throw new Error('Error al eliminar el documento.')
    },
    onSuccess: (_data, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all(tripId) })
    },
  })
}
