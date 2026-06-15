import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import type { WishlistItem, WishlistItemType } from '@app-types/index'

interface UpdateWishlistItemInput {
  name: string
  type: WishlistItemType
  location?: {
    name: string
    lat: number
    lng: number
    city?: string
  } | null
  note?: string
}

export function useUpdateWishlistItem(itemId: string) {
  const queryClient = useQueryClient()
  const listKey = queryKeys.wishlist.byUser()

  return useMutation({
    mutationFn: async (input: UpdateWishlistItemInput) => {
      const location = input.location
        ? {
            address: input.location.name,
            lat: input.location.lat,
            lng: input.location.lng,
            ...(input.location.city ? { city: input.location.city } : {}),
          }
        : null

      const { error } = await supabase
        .from('wishlist_items')
        .update({
          name: input.name.trim(),
          type: input.type,
          location,
          note: input.note?.trim() || null,
        })
        .eq('id', itemId)

      if (error) throw new Error(error.message)
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const snapshot = queryClient.getQueryData<WishlistItem[]>(listKey)
      queryClient.setQueryData<WishlistItem[]>(listKey, (prev) =>
        prev?.map((i) =>
          i.id === itemId
            ? {
                ...i,
                name: input.name.trim(),
                type: input.type,
                location: input.location
                  ? {
                      address: input.location.name,
                      lat: input.location.lat,
                      lng: input.location.lng,
                      city: input.location.city,
                    }
                  : null,
                note: input.note?.trim() || null,
              }
            : i
        ) ?? []
      )
      return { snapshot }
    },
    onError: (_, __, ctx) => {
      if (ctx?.snapshot) queryClient.setQueryData(listKey, ctx.snapshot)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey })
    },
  })
}
