import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'

export function useLeaveTrip() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (tripId) => {
      const { error } = await supabase.rpc('leave_trip', { p_trip_id: tripId })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_, tripId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() })
      supabase.functions.invoke('send-notification', {
        body: { event: 'member_left', trip_id: tripId, source_id: null, context: {} },
      }).catch(() => {})
    },
  })
}
