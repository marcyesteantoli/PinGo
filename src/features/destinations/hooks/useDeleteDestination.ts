import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { mapSupabaseError } from '@lib/errors'

export function useDeleteDestination(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (destinationId: string) => {
      const { error } = await supabase
        .from('trip_destinations')
        .delete()
        .eq('id', destinationId)

      if (error) throw mapSupabaseError(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.destinations.byTrip(tripId) })
    },
  })
}
