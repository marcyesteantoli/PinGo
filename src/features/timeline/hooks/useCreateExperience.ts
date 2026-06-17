import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import type { CreateExperienceFormData } from '../types'
import type { Experience } from '@app-types/index'

function notifyExperienceAdded(experienceId: string, tripId: string, title: string) {
  supabase.functions.invoke('send-notification', {
    body: {
      event: 'experience_added',
      trip_id: tripId,
      source_id: experienceId,
      context: { title },
    },
  }).catch(() => {})
}

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
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          confirmation_code: formData.confirmation_code ?? null,
          location: formData.location ?? null,
          destination_id: formData.destination_id ?? null,
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
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        confirmation_code: formData.confirmation_code ?? null,
        location: formData.location ?? null,
        destination_id: formData.destination_id ?? null,
        created_by: '',
        updated_at: new Date().toISOString(),
      } as Experience

      queryClient.setQueryData<Experience[]>(
        queryKeys.experiences.all(tripId),
        (old = []) => {
          const next = [...old, temp]
          return next.sort((a, b) => {
            if (!a.date && !b.date) return 0
            if (!a.date) return 1
            if (!b.date) return -1
            const dateCompare = a.date.localeCompare(b.date)
            if (dateCompare !== 0) return dateCompare
            if (!a.start_time && !b.start_time) return 0
            if (!a.start_time) return 1
            if (!b.start_time) return -1
            return a.start_time.localeCompare(b.start_time)
          })
        }
      )

      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.experiences.all(tripId), context.previous)
      }
    },
    onSuccess: (newExp) => {
      if (!newExp) return
      queryClient.setQueryData<Experience[]>(
        queryKeys.experiences.all(tripId),
        (old = []) => {
          const withoutTemp = old.filter((e) => !e.id.startsWith('temp_'))
          const next = [...withoutTemp, newExp]
          return next.sort((a, b) => {
            if (!a.date && !b.date) return 0
            if (!a.date) return 1
            if (!b.date) return -1
            const dateCompare = a.date.localeCompare(b.date)
            if (dateCompare !== 0) return dateCompare
            if (!a.start_time && !b.start_time) return 0
            if (!a.start_time) return 1
            if (!b.start_time) return -1
            return a.start_time.localeCompare(b.start_time)
          })
        }
      )

      notifyExperienceAdded(newExp.id, tripId, newExp.title)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all(tripId) })
    },
  })
}
