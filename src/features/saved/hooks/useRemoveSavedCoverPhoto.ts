import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { mapSupabaseError } from '@lib/errors'

export function useRemoveSavedCoverPhoto(experienceId: string) {
  const { data: user } = useCurrentUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const userId = user!.id

      const { data: row } = await (supabase as any)
        .from('user_saved_experiences')
        .select('cover_photo_url')
        .eq('user_id', userId)
        .eq('experience_id', experienceId)
        .maybeSingle()
      const storagePath: string | null = row?.cover_photo_url ?? null
      if (!storagePath) return

      const { error: dbError } = await (supabase as any)
        .from('user_saved_experiences')
        .update({ cover_photo_url: null })
        .eq('user_id', userId)
        .eq('experience_id', experienceId)

      if (dbError) throw mapSupabaseError(dbError)

      await supabase.storage.from('saved-photos').remove([storagePath])
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedExperiences.byUser() })
      queryClient.invalidateQueries({ queryKey: queryKeys.savedExperiences.detail(experienceId) })
    },
  })
}
