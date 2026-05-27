import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import type { WishlistItem } from '@types/index'

export function useUpdateWishlistNote(itemId: string) {
  const queryClient = useQueryClient()
  const listKey = queryKeys.wishlist.byUser()

  return useMutation({
    mutationFn: async (note: string) => {
      const { error } = await supabase
        .from('wishlist_items')
        .update({ note: note.trim() || null })
        .eq('id', itemId)

      if (error) throw new Error(error.message)
    },
    onMutate: async (note) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const snapshot = queryClient.getQueryData<WishlistItem[]>(listKey)
      queryClient.setQueryData<WishlistItem[]>(listKey, (prev) =>
        prev?.map((i) => (i.id === itemId ? { ...i, note: note.trim() || null } : i)) ?? []
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
