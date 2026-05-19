import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { DEV_MODE } from '@/dev/mockData'

export function useUpsertSavedNote(experienceId: string) {
  const { data: user } = useCurrentUser()
  const queryClient = useQueryClient()
  const qKey = queryKeys.savedExperiences.note(experienceId)

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
      await queryClient.cancelQueries({ queryKey: qKey })
      const snapshot = queryClient.getQueryData<string | null>(qKey)
      queryClient.setQueryData<string | null>(qKey, note.trim() || null)
      return { snapshot }
    },
    onError: (_, __, ctx) => {
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData(qKey, ctx.snapshot)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qKey })
    },
  })
}
