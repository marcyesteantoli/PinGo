import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { mapSupabaseError } from '@lib/errors'
import type { Document } from '@app-types/index'

export type DocumentWithExperience = Document & {
  experience_title: string | null
  file_url: string | null
}

type DocumentRow = Document & {
  experiences: { title: string } | null
}

export function useDocuments(tripId: string) {
  return useQuery<DocumentWithExperience[]>({
    queryKey: queryKeys.documents.all(tripId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*, experiences(title)')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })

      if (error) throw mapSupabaseError(error)

      const rows = (data ?? []) as DocumentRow[]
      if (!rows.length) return []

      // Only file/pass types have storage paths that need signed URLs
      const fileRows = rows.filter((d) => d.document_type !== 'link' && d.file_path)

      const signedMap: Record<string, string> = {}

      // Rows where file_path is already a full URL (seeded/legacy data) — use directly
      const preSignedRows = fileRows.filter((d) => d.file_path!.startsWith('https://'))
      preSignedRows.forEach((d) => { signedMap[d.id] = d.file_path! })

      // Rows with relative storage paths — generate fresh signed URLs
      const storageRows = fileRows.filter((d) => !d.file_path!.startsWith('https://'))
      if (storageRows.length > 0) {
        const paths = storageRows.map((d) => d.file_path!)
        const { data: signed, error: signError } = await supabase.storage
          .from('documents')
          .createSignedUrls(paths, 15 * 60)

        if (signError) throw mapSupabaseError(signError)
        storageRows.forEach((d, i) => {
          signedMap[d.id] = signed[i]?.signedUrl ?? ''
        })
      }

      return rows.map((d) => ({
        ...d,
        file_url: signedMap[d.id] ?? null,
        experience_title: d.experiences?.title ?? null,
      }))
    },
    staleTime: 1000 * 60 * 10,
  })
}
