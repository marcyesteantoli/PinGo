import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockSettlements } from '@/dev/mockData'
import type { Settlement } from '@types/index'

export function useSettlements(tripId: string) {
  return useQuery<Settlement[]>({
    queryKey: queryKeys.settlements.all(tripId),
    queryFn: async () => {
      if (DEV_MODE) return [...(mockSettlements[tripId] ?? [])]
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
