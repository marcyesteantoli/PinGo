import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockMemories } from '@/dev/mockData'
import type { Memory } from '@types/index'

type DeleteMemoryParams = { memoryId: string; tripId: string }

export function useDeleteMemory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memoryId, tripId }: DeleteMemoryParams) => {
      if (DEV_MODE) {
        if (mockMemories[tripId]) {
          mockMemories[tripId] = mockMemories[tripId].filter((m) => m.id !== memoryId)
        }
        return
      }
      const { error } = await supabase.from('memories').delete().eq('id', memoryId)
      if (error) throw new Error(error.message)
    },
    onMutate: async ({ memoryId, tripId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.memories.all(tripId) })
      const previous = queryClient.getQueryData<Memory[]>(queryKeys.memories.all(tripId))
      queryClient.setQueryData<Memory[]>(
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
      if (DEV_MODE) return
      queryClient.invalidateQueries({ queryKey: queryKeys.memories.all(variables.tripId) })
    },
  })
}
