import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import type { MemoryWithUrl } from './useMemories'

type DeleteMemoryParams = { memoryId: string; tripId: string }

export function useDeleteMemory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memoryId, tripId }: DeleteMemoryParams) => {
      const { error, count } = await supabase
        .from('memories')
        .delete({ count: 'exact' })
        .eq('id', memoryId)
      if (error) throw new Error(error.message)
      if (count === 0) throw new Error('not_authorized')
    },
    onMutate: async ({ memoryId, tripId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.memories.all(tripId) })
      const previous = queryClient.getQueryData<MemoryWithUrl[]>(queryKeys.memories.all(tripId))
      queryClient.setQueryData<MemoryWithUrl[]>(
        queryKeys.memories.all(tripId),
        (old = []) => old.filter((m) => m.id !== memoryId)
      )
      return { previous, tripId }
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.memories.all(context.tripId), context.previous)
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memories.all(variables.tripId) })
    },
  })
}
