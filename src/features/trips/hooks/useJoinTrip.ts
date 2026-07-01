import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { mapSupabaseError } from '@lib/errors'
import { ActiveTripLimitReachedError } from './useCreateTrip'
import type { JoinTripFormData } from '../types'

export function useJoinTrip() {
  const queryClient = useQueryClient()

  return useMutation<string, Error, JoinTripFormData>({
    mutationFn: async ({ join_code }) => {
      const { data: tripId, error } = await supabase
        .rpc('join_trip_by_code', { p_join_code: join_code.toUpperCase() })

      if (error) {
        const mapped = mapSupabaseError(error)
        if (mapped.key === 'active_trip_limit_reached') throw new ActiveTripLimitReachedError(error)
        throw mapped
      }

      return tripId as string
    },
    onSuccess: (tripId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() })
      supabase.functions.invoke('send-notification', {
        body: { event: 'member_joined', trip_id: tripId, source_id: null, context: {} },
      }).catch(() => {})
    },
  })
}
