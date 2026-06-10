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
          collaborators: (mockCollaborators[trip.id] ?? []).filter((c) => c.status === 'active'),
        }))
      }
      const { data, error } = await supabase
        .from('trips')
        .select('*, trip_collaborators(user_id, role, status, joined_at, profiles(name, avatar_url))')
        .order('start_date', { ascending: true })

      if (error) throw new Error(error.message)
      return (data ?? []).map(({ trip_collaborators, ...trip }) => ({
        ...trip,
        collaborators: (trip_collaborators ?? [])
          .filter((c: any) => c.status === 'active')
          .map((c: any) => ({
            user_id: c.user_id,
            role: c.role,
            status: c.status,
            joined_at: c.joined_at,
            name: c.profiles?.name ?? '',
            avatar_url: c.profiles?.avatar_url ?? null,
          })),
      }))
    },
  })
}
