import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'

export function useToggleSaveExperience(experienceId: string) {
  const queryClient = useQueryClient()
  const isSavedKey = queryKeys.savedExperiences.isSaved(experienceId)
  const listKey = queryKeys.savedExperiences.byUser()

  return useMutation({
    mutationFn: async (currentlySaved: boolean) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      if (currentlySaved) {
        const { error } = await supabase
          .from('user_saved_experiences')
          .delete()
          .eq('user_id', user.id)
          .eq('experience_id', experienceId)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase
          .from('user_saved_experiences')
          .insert({ user_id: user.id, experience_id: experienceId })
        if (error) throw new Error(error.message)
      }
    },
    onMutate: async (currentlySaved) => {
      await queryClient.cancelQueries({ queryKey: isSavedKey })
      const snapshot = queryClient.getQueryData<boolean>(isSavedKey)
      queryClient.setQueryData<boolean>(isSavedKey, !currentlySaved)
      return { snapshot }
    },
    onError: (_, __, ctx) => {
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData(isSavedKey, ctx.snapshot)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: isSavedKey })
      queryClient.invalidateQueries({ queryKey: listKey })
    },
  })
}
