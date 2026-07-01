import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { mapSupabaseError } from '@lib/errors'
import type { Experience } from '@app-types/index'

export function useExperiences(tripId: string) {
  return useQuery<Experience[]>({
    queryKey: queryKeys.experiences.all(tripId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: true, nullsFirst: false })
        .order('start_time', { ascending: true, nullsFirst: true })

      if (error) throw mapSupabaseError(error)
      return data ?? []
    },
    staleTime: 1000 * 60 * 5,
  })
}
