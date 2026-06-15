import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import type { WishlistItem } from '@app-types/index'
import type { AddWishlistItemInput } from '../types'

export function useAddWishlistItem() {
  const { data: user } = useCurrentUser()
  const queryClient = useQueryClient()
  const listKey = queryKeys.wishlist.byUser()

  return useMutation({
    mutationFn: async (input: AddWishlistItemInput) => {
      const location = input.location
        ? {
            address: input.location.name,
            lat: input.location.lat,
            lng: input.location.lng,
            ...(input.location.city ? { city: input.location.city } : {}),
          }
        : null

      const { data, error } = await supabase
        .from('wishlist_items')
        .insert({
          user_id: user!.id,
          name: input.name.trim(),
          type: input.type,
          location,
          note: input.note?.trim() || null,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data as WishlistItem
    },
    onSuccess: (newItem) => {
      queryClient.setQueryData<WishlistItem[]>(listKey, (prev) =>
        prev ? [newItem, ...prev] : [newItem]
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey })
    },
  })
}
