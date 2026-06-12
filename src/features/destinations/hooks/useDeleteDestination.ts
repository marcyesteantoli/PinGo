import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'

export function useDeleteDestination(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (destinationId: string) => {
      const { error } = await supabase
        .from('trip_destinations')
        .delete()
        .eq('id', destinationId)

      if (error) throw new Error(error.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.destinations.byTrip(tripId) })
    },
  })
}
