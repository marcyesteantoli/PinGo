import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockDocuments } from '@/dev/mockData'
import type { Document } from '@types/index'

type DocumentWithExperience = Document & { experience_title: string | null }

export function useDocuments(tripId: string) {
  return useQuery<DocumentWithExperience[]>({
    queryKey: queryKeys.documents.all(tripId),
    queryFn: async () => {
      if (DEV_MODE) return [...(mockDocuments[tripId] ?? [])] as DocumentWithExperience[]
      const { data, error } = await supabase
        .from('documents')
        .select('*, experiences(title)')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)

      return (data ?? []).map((d: any) => ({
        ...d,
        experience_title: d.experiences?.title ?? null,
      })) as DocumentWithExperience[]
    },
  })
}
