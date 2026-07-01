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

interface CreateStandaloneSavedExperienceInput {
  title: string
  type: Experience['type']
  location?: PickedLocation
  note?: string
  price_paid?: number | null
}

export function useCreateStandaloneSavedExperience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateStandaloneSavedExperienceInput) => {
      const location = input.location
        ? {
            name: input.location.name,
            lat: input.location.lat,
            lng: input.location.lng,
            ...(input.location.city ? { city: input.location.city } : {}),
          }
        : null

      const { data, error } = await supabase.rpc('create_standalone_saved_experience', {
        p_title: input.title.trim(),
        p_type: input.type,
        p_location: location,
        p_note: input.note?.trim() || null,
        p_price_paid: input.price_paid ?? null,
      })

      if (error) throw mapSupabaseError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedExperiences.byUser() })
    },
  })
}
