import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import type { Settlement } from '@app-types/index'

export function useSettlements(tripId: string) {
  return useQuery<Settlement[]>({
    queryKey: queryKeys.settlements.all(tripId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_settlements')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return data ?? []
    },
    staleTime: 0,
  })
}
