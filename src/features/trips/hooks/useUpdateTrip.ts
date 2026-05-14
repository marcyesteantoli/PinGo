import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockTrips } from '@/dev/mockData'

interface UpdateTripParams {
  tripId: string
  title: string
}

export function useUpdateTrip() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, UpdateTripParams>({
    mutationFn: async ({ tripId, title }) => {
      if (DEV_MODE) {
        const trip = mockTrips.find(t => t.id === tripId)
        if (trip) trip.title = title
        return
      }
      const { error } = await supabase
        .from('trips')
        .update({ title })
        .eq('id', tripId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() })
    },
  })
}
