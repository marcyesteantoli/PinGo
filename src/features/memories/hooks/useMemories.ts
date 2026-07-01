import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { mapSupabaseError } from '@lib/errors'
import type { Memory } from '@app-types/index'

// `cacheKey` is the stable storage path (or http url for seed data) — used so
// expo-image cache survives signed URL token rotation.
export type MemoryWithUrl = Memory & { cacheKey: string }

export function useMemories(tripId: string) {
  return useQuery({
    queryKey: queryKeys.memories.all(tripId),
    queryFn: async (): Promise<MemoryWithUrl[]> => {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })

      if (error) throw mapSupabaseError(error)
      if (!data.length) return data

      // Only sign storage paths — skip full URLs (e.g. seed data from picsum.photos)
      const storageIndices: number[] = []
      const storagePaths: string[] = []
      data.forEach((m, i) => {
        if (!m.image_url.startsWith('http')) {
          storageIndices.push(i)
          storagePaths.push(m.image_url)
        }
      })

      const signedMap: Record<number, string> = {}
      if (storagePaths.length > 0) {
        const { data: signed, error: signError } = await supabase.storage
          .from('memories')
          .createSignedUrls(storagePaths, 3600)
        if (signError) throw mapSupabaseError(signError)
        storageIndices.forEach((idx, j) => {
          signedMap[idx] = signed[j]?.signedUrl ?? data[idx].image_url
        })
      }

      return data.map((memory, i) => ({
        ...memory,
        image_url: signedMap[i] ?? memory.image_url,
        cacheKey: memory.image_url,
      }))
    },
    staleTime: 1000 * 60 * 5,
  })
}
