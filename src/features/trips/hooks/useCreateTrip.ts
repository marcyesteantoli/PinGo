import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import type { CreateTripFormData } from '../types'
import type { Trip } from '@app-types/index'

export class ActiveTripLimitReachedError extends Error {
  constructor() {
    super('active_trip_limit_reached')
    this.name = 'ActiveTripLimitReachedError'
  }
}

export function useCreateTrip() {
  const queryClient = useQueryClient()

  return useMutation<Trip, Error, CreateTripFormData>({
    mutationFn: async (formData) => {
      const { data: trip, error: tripError } = await supabase
        .rpc('create_trip', {
          p_title: formData.title,
          p_start_date: formData.start_date,
          p_end_date: formData.end_date,
          p_currency: formData.currency ?? 'EUR',
        })
        .single()

      if (tripError) {
        if (tripError.message.includes('active_trip_limit_reached')) {
          throw new ActiveTripLimitReachedError()
        }
        throw new Error(tripError.message)
      }

      return trip as Trip
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() })
    },
  })
}
