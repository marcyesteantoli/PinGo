import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { DEV_MODE } from '@/dev/mockData'
import type { SavedExperienceDetail } from './useSavedExperienceDetail'
import type { SavedExperienceItem } from '@app-types/index'

export function useUpsertSavedNote(experienceId: string) {
  const { data: user } = useCurrentUser()
  const queryClient = useQueryClient()
  const qKey = queryKeys.savedExperiences.note(experienceId)
  const detailKey = queryKeys.savedExperiences.detail(experienceId)
  const listKey = queryKeys.savedExperiences.byUser()

  return useMutation({
    mutationFn: async (note: string) => {
      if (DEV_MODE) return

      const { error } = await (supabase as any)
        .from('user_saved_experiences')
        .update({ note: note.trim() || null })
        .eq('user_id', user!.id)
        .eq('experience_id', experienceId)

      if (error) throw new Error(error.message)
    },
    onMutate: async (note) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: qKey }),
        queryClient.cancelQueries({ queryKey: detailKey }),
        queryClient.cancelQueries({ queryKey: listKey }),
      ])

      const snapshot = queryClient.getQueryData<string | null>(qKey)
      const detailSnapshot = queryClient.getQueryData<SavedExperienceDetail | null>(detailKey)
      const listSnapshot = queryClient.getQueryData<SavedExperienceItem[]>(listKey)

      queryClient.setQueryData<string | null>(qKey, note.trim() || null)

      if (detailSnapshot) {
        queryClient.setQueryData<SavedExperienceDetail | null>(detailKey, {
          ...detailSnapshot,
          note: note.trim() || null,
        })
      }

      if (listSnapshot) {
        queryClient.setQueryData<SavedExperienceItem[]>(
          listKey,
          listSnapshot.map((item) =>
            item.experience.id === experienceId
              ? { ...item, note: note.trim() || null }
              : item
          )
        )
      }

      return { snapshot, detailSnapshot, listSnapshot }
    },
    onError: (_, __, ctx) => {
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData(qKey, ctx.snapshot)
      }
      if (ctx?.detailSnapshot !== undefined) {
        queryClient.setQueryData(detailKey, ctx.detailSnapshot)
      }
      if (ctx?.listSnapshot !== undefined) {
        queryClient.setQueryData(listKey, ctx.listSnapshot)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qKey })
      queryClient.invalidateQueries({ queryKey: detailKey })
      queryClient.invalidateQueries({ queryKey: listKey })
    },
  })
}
