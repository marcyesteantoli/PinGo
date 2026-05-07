import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockExperiences } from '@/dev/mockData'
import type { Experience } from '@types/index'

export function useExperiences(tripId: string) {
  return useQuery<Experience[]>({
    queryKey: queryKeys.experiences.all(tripId),
    queryFn: async () => {
      if (DEV_MODE) return [...(mockExperiences[tripId] ?? [])]
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: true, nullsFirst: false })
        .order('start_time', { ascending: true, nullsFirst: true })

      if (error) throw new Error(error.message)
      return data ?? []
    },
    staleTime: 1000 * 60 * 5,
  })
}
