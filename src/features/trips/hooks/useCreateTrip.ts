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
          created_by: DEMO_USER_ID,
          join_code: 'DEMO01',
          created_at: new Date().toISOString(),
        }
        mockTrips.push(newTrip)
        return newTrip
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          title: formData.title,
          start_date: formData.start_date,
          end_date: formData.end_date,
          created_by: user.id,
        })
        .select()
        .single()

      if (tripError) throw new Error(tripError.message)

      const { error: collabError } = await supabase
        .from('trip_collaborators')
        .insert({ trip_id: trip.id, user_id: user.id, role: 'owner' })

      if (collabError) throw new Error(collabError.message)

      return trip
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
