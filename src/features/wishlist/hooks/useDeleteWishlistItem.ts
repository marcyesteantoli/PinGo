import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import type { WishlistItem } from '@app-types/index'

export function useDeleteWishlistItem() {
  const queryClient = useQueryClient()
  const listKey = queryKeys.wishlist.byUser()

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', itemId)

      if (error) throw new Error(error.message)
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const snapshot = queryClient.getQueryData<WishlistItem[]>(listKey)
      queryClient.setQueryData<WishlistItem[]>(listKey, (prev) =>
        prev?.filter((i) => i.id !== itemId) ?? []
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
