import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { mapSupabaseError } from '@lib/errors'

interface UpdateTripParams {
  tripId: string
  title: string
  start_date?: string
  end_date?: string
  currency?: string
}

export function useUpdateTrip() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, UpdateTripParams>({
    mutationFn: async ({ tripId, title, start_date, end_date, currency }) => {
      const updates: Record<string, string> = { title }
      if (start_date) updates.start_date = start_date
      if (end_date) updates.end_date = end_date
      if (currency) updates.currency = currency
      const { error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', tripId)
      if (error) throw mapSupabaseError(error)
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() })
      queryClient.invalidateQueries({ queryKey: queryKeys.collaborators.byTrip(tripId) })
    },
  })
}
