import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockDestinations } from '@/dev/mockData'
import type { TripDestination } from '@types/index'

export function useDestinations(tripId: string) {
  return useQuery<TripDestination[]>({
    queryKey: queryKeys.destinations.byTrip(tripId),
    queryFn: async () => {
      if (DEV_MODE) return mockDestinations[tripId] ?? []
      const { data, error } = await supabase
        .from('trip_destinations')
        .select('*')
        .eq('trip_id', tripId)
        .order('start_date', { ascending: true })

      if (error) throw new Error(error.message)
      return data ?? []
    },
    staleTime: 1000 * 60 * 5,
  })
}
