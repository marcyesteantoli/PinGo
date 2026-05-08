import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockExperiences } from '@/dev/mockData'
import type { Experience } from '@types/index'

export function useDeleteExperience(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (experienceId: string) => {
      if (DEV_MODE) {
        if (mockExperiences[tripId]) {
          mockExperiences[tripId] = mockExperiences[tripId].filter((e) => e.id !== experienceId)
        }
        return
      }

      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', experienceId)

      if (error) throw new Error(error.message)
    },
    onMutate: async (experienceId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.experiences.all(tripId) })
      const previous = queryClient.getQueryData<Experience[]>(queryKeys.experiences.all(tripId))

      queryClient.setQueryData<Experience[]>(
        queryKeys.experiences.all(tripId),
        (old = []) => old.filter((e) => e.id !== experienceId)
      )

      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.experiences.all(tripId), context.previous)
      }
    },
    onSettled: () => {
      if (DEV_MODE) return
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all(tripId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all(tripId) })
    },
  })
}
