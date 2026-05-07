import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockTrips } from '@/dev/mockData'
import type { Trip } from '@types/index'

export function useTrips() {
  return useQuery<Trip[]>({
    queryKey: queryKeys.trips.list(),
    queryFn: async () => {
      if (DEV_MODE) return [...mockTrips]
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('start_date', { ascending: true })

      if (error) throw new Error(error.message)
      return data ?? []
    },
  })
}
