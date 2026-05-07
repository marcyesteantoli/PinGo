import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import type { CreateExperienceFormData } from '../types'
import type { Experience } from '@types/index'

export function useCreateExperience(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: CreateExperienceFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      const { data, error } = await supabase
        .from('experiences')
        .insert({
          trip_id: tripId,
          title: formData.title,
          type: formData.type,
          date: formData.date || null,
          time_slot: formData.time_slot ?? null,
          confirmation_code: formData.confirmation_code ?? null,
          location: formData.location ?? null,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data as Experience
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.experiences.all(tripId) })
      const previous = queryClient.getQueryData<Experience[]>(queryKeys.experiences.all(tripId))

      const temp = {
        id: `temp_${Date.now()}`,
        trip_id: tripId,
        title: formData.title,
        type: formData.type,
        date: formData.date || null,
        time_slot: formData.time_slot ?? null,
        confirmation_code: formData.confirmation_code ?? null,
        location: formData.location ?? null,
        created_by: '',
        updated_at: new Date().toISOString(),
      } as Experience

      queryClient.setQueryData<Experience[]>(
        queryKeys.experiences.all(tripId),
        (old = []) => [...old, temp]
      )

      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.experiences.all(tripId), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all(tripId) })
    },
  })
}
