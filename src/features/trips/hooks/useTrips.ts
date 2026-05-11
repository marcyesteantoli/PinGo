import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockTrips, mockCollaborators } from '@/dev/mockData'
import type { Trip, Collaborator } from '@types/index'

export type TripWithCollaborators = Trip & { collaborators: Collaborator[] }

export function useTrips() {
  return useQuery<TripWithCollaborators[]>({
    queryKey: queryKeys.trips.list(),
    queryFn: async () => {
      if (DEV_MODE) {
        return mockTrips.map(trip => ({
          ...trip,
          collaborators: mockCollaborators[trip.id] ?? [],
        }))
      }
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('start_date', { ascending: true })

      if (error) throw new Error(error.message)
      return (data ?? []).map(trip => ({ ...trip, collaborators: [] }))
    },
  })
}
