import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { mapSupabaseError } from '@lib/errors'
import type { Experience } from '@app-types/index'

interface PickedLocation {
  name: string
  lat: number
  lng: number
  city?: string
}

interface UpdateSavedExperienceInfoInput {
  title: string
  type: Experience['type']
  location?: PickedLocation
}

export function useUpdateSavedExperienceInfo(experienceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateSavedExperienceInfoInput) => {
      const location = input.location
        ? {
            name: input.location.name,
            lat: input.location.lat,
            lng: input.location.lng,
            ...(input.location.city ? { city: input.location.city } : {}),
          }
        : null

      const { error } = await supabase
        .from('experiences')
        .update({
          title: input.title.trim(),
          type: input.type,
          location,
        })
        .eq('id', experienceId)

      if (error) throw mapSupabaseError(error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedExperiences.detail(experienceId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.savedExperiences.byUser() })
    },
  })
}
