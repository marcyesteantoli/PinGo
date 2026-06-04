import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockDocuments } from '@/dev/mockData'
import type { Document } from '@types/index'

export type DocumentWithExperience = Document & {
  experience_title: string | null
  file_url: string
}

type DocumentRow = Document & {
  experiences: { title: string } | null
}

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

      const rows = (data ?? []) as DocumentRow[]
      if (!rows.length) return []

      // Generate short-lived signed URLs on demand (15 min TTL).
      // staleTime (10 min) < TTL so queries always refetch before URLs expire.
      const paths = rows.map((d) => d.file_path)
      const { data: signed, error: signError } = await supabase.storage
        .from('documents')
        .createSignedUrls(paths, 15 * 60)

      if (signError) throw signError

      return rows.map((d, i) => ({
        ...d,
        file_url: signed[i]?.signedUrl ?? '',
        experience_title: d.experiences?.title ?? null,
      }))
    },
    staleTime: 1000 * 60 * 10,
  })
}
