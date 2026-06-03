import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockDestinations } from '@/dev/mockData'

export function useDeleteDestination(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (destinationId: string) => {
      if (DEV_MODE) {
        if (mockDestinations[tripId]) {
          const idx = mockDestinations[tripId].findIndex(d => d.id === destinationId)
          if (idx !== -1) mockDestinations[tripId].splice(idx, 1)
        }
        return
      }
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
