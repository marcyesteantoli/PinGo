import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockDestinations } from '@/dev/mockData'
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
      if (DEV_MODE) {
        const result: TripDestination = {
          id: formData.id ?? `demo-dest-${Date.now()}`,
          trip_id: tripId,
          name: formData.name,
          country: formData.country ?? null,
          lat: formData.lat ?? null,
          lng: formData.lng ?? null,
          start_date: formData.start_date,
          end_date: formData.end_date,
          sort_order: 0,
          created_at: new Date().toISOString(),
        }
        if (!mockDestinations[tripId]) mockDestinations[tripId] = []
        if (formData.id) {
          const idx = mockDestinations[tripId].findIndex(d => d.id === formData.id)
          if (idx !== -1) mockDestinations[tripId][idx] = result
        } else {
          mockDestinations[tripId].push(result)
        }
        mockDestinations[tripId].sort((a, b) => a.start_date.localeCompare(b.start_date))
        return result
      }

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
