import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { DEV_MODE } from '@/dev/mockData'
import type { SavedExperienceItem } from '@types/index'

interface SavedMeta {
  note?: string | null
  price_paid?: number | null
  cover_photo_url?: string | null
}

/**
 * Upserts one or more metadata fields on user_saved_experiences.
 * Merges with existing values — only provided fields are updated.
 */
export function useUpsertSavedMeta(experienceId: string) {
  const { data: user } = useCurrentUser()
  const queryClient = useQueryClient()
  const listKey = queryKeys.savedExperiences.byUser()
  const detailKey = queryKeys.savedExperiences.detail(experienceId)
  const noteKey = queryKeys.savedExperiences.note(experienceId)

  return useMutation({
    mutationFn: async (meta: SavedMeta) => {
      if (DEV_MODE) return

      // Build update object — only defined fields
      const update: Record<string, unknown> = {}
      if (meta.note !== undefined) update.note = meta.note?.trim() || null
      if (meta.price_paid !== undefined) update.price_paid = meta.price_paid
      if (meta.cover_photo_url !== undefined) update.cover_photo_url = meta.cover_photo_url

      const { error } = await (supabase as any)
        .from('user_saved_experiences')
        .update(update)
        .eq('user_id', user!.id)
        .eq('experience_id', experienceId)

      if (error) throw new Error(error.message)
    },
    onMutate: async (meta) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: listKey }),
        queryClient.cancelQueries({ queryKey: detailKey }),
        queryClient.cancelQueries({ queryKey: noteKey }),
      ])

      const listSnapshot = queryClient.getQueryData<SavedExperienceItem[]>(listKey)

      // Optimistic update on list cache
      if (listSnapshot) {
        queryClient.setQueryData<SavedExperienceItem[]>(
          listKey,
          listSnapshot.map((item) =>
            item.experience.id === experienceId
              ? {
                  ...item,
                  ...(meta.note !== undefined && { note: meta.note?.trim() || null }),
                  ...(meta.price_paid !== undefined && { price_paid: meta.price_paid }),
                }
              : item
          )
        )
      }

      // Keep old note key in sync
      if (meta.note !== undefined) {
        queryClient.setQueryData<string | null>(noteKey, meta.note?.trim() || null)
      }

      return { listSnapshot }
    },
    onError: (_, __, ctx) => {
      if (ctx?.listSnapshot !== undefined) {
        queryClient.setQueryData(listKey, ctx.listSnapshot)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey })
      queryClient.invalidateQueries({ queryKey: detailKey })
      queryClient.invalidateQueries({ queryKey: noteKey })
    },
  })
}
