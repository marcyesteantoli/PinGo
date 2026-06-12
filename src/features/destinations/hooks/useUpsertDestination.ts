import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import type { TripDestination } from '@app-types/index'

export type DestinationFormData = {
  id?: string
  name: string
  country?: string | null
  lat?: number | null
  lng?: number | null
  start_date: string
  end_date: string
}

export function useUpsertDestination(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: DestinationFormData): Promise<TripDestination> => {
      if (formData.id) {
        const { data, error } = await supabase
          .from('trip_destinations')
          .update({
            name: formData.name,
            country: formData.country ?? null,
            lat: formData.lat ?? null,
            lng: formData.lng ?? null,
            start_date: formData.start_date,
            end_date: formData.end_date,
          })
          .eq('id', formData.id)
          .select()
          .single()

        if (error) throw new Error(error.message)
        return data as TripDestination
      }

      const { data, error } = await supabase
        .from('trip_destinations')
        .insert({
          trip_id: tripId,
          name: formData.name,
          country: formData.country ?? null,
          lat: formData.lat ?? null,
          lng: formData.lng ?? null,
          start_date: formData.start_date,
          end_date: formData.end_date,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data as TripDestination
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.destinations.byTrip(tripId) })
    },
  })
}
