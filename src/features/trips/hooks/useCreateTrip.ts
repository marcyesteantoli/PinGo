import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, DEMO_USER_ID, mockTrips } from '@/dev/mockData'
import type { CreateTripFormData } from '../types'
import type { Trip } from '@types/index'

export function useCreateTrip() {
  const queryClient = useQueryClient()

  return useMutation<Trip, Error, CreateTripFormData>({
    mutationFn: async (formData) => {
      if (DEV_MODE) {
        const newTrip: Trip = {
          id: `demo-trip-${Date.now()}`,
          title: formData.title,
          start_date: formData.start_date,
          end_date: formData.end_date,
          currency: formData.currency ?? 'EUR',
          created_by: DEMO_USER_ID,
          join_code: 'DEMO01',
          created_at: new Date().toISOString(),
        }
        mockTrips.push(newTrip)
        return newTrip
      }

      const { data: trip, error: tripError } = await supabase
        .rpc('create_trip', {
          p_title: formData.title,
          p_start_date: formData.start_date,
          p_end_date: formData.end_date,
          p_currency: formData.currency ?? 'EUR',
        })
        .single()

      if (tripError) throw new Error(tripError.message)

      return trip as Trip
    },
    onSuccess: (newTrip) => {
      if (DEV_MODE) {
        queryClient.setQueryData<Trip[]>(queryKeys.trips.list(), (old = []) => [...old, newTrip])
        return
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() })
    },
  })
}
