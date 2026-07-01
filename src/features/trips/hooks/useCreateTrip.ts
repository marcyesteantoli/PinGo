import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { maybePromptRating } from '@/hooks/useRatingPrompt'
import { AppError, mapSupabaseError } from '@lib/errors'
import type { CreateTripFormData } from '../types'
import type { Trip } from '@app-types/index'

export class ActiveTripLimitReachedError extends AppError {
  constructor(rawError?: unknown) {
    super('active_trip_limit_reached', rawError)
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
        const mapped = mapSupabaseError(tripError)
        if (mapped.key === 'active_trip_limit_reached') {
          throw new ActiveTripLimitReachedError(tripError)
        }
        throw mapped
      }

      return trip as Trip
    },
    onSuccess: () => {
      const currentTrips = queryClient.getQueryData<Trip[]>(queryKeys.trips.list())
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() })
      const newCount = (currentTrips?.length ?? 0) + 1
      if (newCount >= 2) maybePromptRating()
    },
  })
}
