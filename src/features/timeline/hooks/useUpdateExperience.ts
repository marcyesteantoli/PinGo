import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockExperiences } from '@/dev/mockData'
import type { CreateExperienceFormData } from '../types'
import type { Experience } from '@types/index'

export function useUpdateExperience(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ experienceId, formData }: { experienceId: string; formData: CreateExperienceFormData }) => {
      if (DEV_MODE) {
        if (mockExperiences[tripId]) {
          const idx = mockExperiences[tripId].findIndex(e => e.id === experienceId)
          if (idx !== -1) {
            mockExperiences[tripId][idx] = {
              ...mockExperiences[tripId][idx],
              title: formData.title,
              type: formData.type,
              date: formData.date || null,
              start_time: formData.start_time || null,
              end_time: formData.end_time || null,
              confirmation_code: formData.confirmation_code ?? null,
              location: formData.location ?? null,
              updated_at: new Date().toISOString(),
            }
            return mockExperiences[tripId][idx]
          }
        }
        return null
      }

      const { data, error } = await supabase
        .from('experiences')
        .update({
          title: formData.title,
          type: formData.type,
          date: formData.date || null,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          confirmation_code: formData.confirmation_code ?? null,
          location: formData.location ?? null,
        })
        .eq('id', experienceId)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data as Experience
    },
    onMutate: async ({ experienceId, formData }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.experiences.all(tripId) })
      const previous = queryClient.getQueryData<Experience[]>(queryKeys.experiences.all(tripId))

      queryClient.setQueryData<Experience[]>(
        queryKeys.experiences.all(tripId),
        (old = []) =>
          old.map(e =>
            e.id === experienceId
              ? {
                  ...e,
                  title: formData.title,
                  type: formData.type,
                  date: formData.date || null,
                  start_time: formData.start_time || null,
                  end_time: formData.end_time || null,
                  confirmation_code: formData.confirmation_code ?? null,
                  location: formData.location ?? null,
                }
              : e
          )
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
    },
  })
}
