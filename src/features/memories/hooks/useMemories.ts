import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockMemories } from '@/dev/mockData'
import type { Memory } from '@types/index'

export function useMemories(tripId: string) {
  return useQuery({
    queryKey: queryKeys.memories.all(tripId),
    queryFn: async (): Promise<Memory[]> => {
      if (DEV_MODE) return [...(mockMemories[tripId] ?? [])]
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5,
  })
}
