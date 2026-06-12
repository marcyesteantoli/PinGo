import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import type { JoinTripFormData } from '../types'

export function useJoinTrip() {
  const queryClient = useQueryClient()

  return useMutation<string, Error, JoinTripFormData>({
    mutationFn: async ({ join_code }) => {
      const { data: tripId, error } = await supabase
        .rpc('join_trip_by_code', { p_join_code: join_code.toUpperCase() })

      if (error) {
        if (error.message.includes('Invalid join code')) throw new Error('Código de viaje no encontrado')
        if (error.message.includes('Already a member')) throw new Error('Ya eres colaborador de este viaje')
        throw new Error(error.message)
      }

      return tripId as string
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() })
    },
  })
}
