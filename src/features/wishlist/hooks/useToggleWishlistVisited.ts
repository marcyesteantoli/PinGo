import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { maybePromptRating } from '@/hooks/useRatingPrompt'
import type { WishlistItem } from '@app-types/index'

export function useToggleWishlistVisited() {
  const queryClient = useQueryClient()
  const listKey = queryKeys.wishlist.byUser()

  return useMutation({
    mutationFn: async ({ itemId, currentVisitedAt }: { itemId: string; currentVisitedAt: string | null }) => {
      const newValue = currentVisitedAt ? null : new Date().toISOString()
      const { error } = await supabase
        .from('wishlist_items')
        .update({ visited_at: newValue })
        .eq('id', itemId)

      if (error) throw new Error(error.message)
      return newValue
    },
    onMutate: async ({ itemId, currentVisitedAt }) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const snapshot = queryClient.getQueryData<WishlistItem[]>(listKey)
      const newValue = currentVisitedAt ? null : new Date().toISOString()
      queryClient.setQueryData<WishlistItem[]>(listKey, (prev) =>
        prev?.map((i) => (i.id === itemId ? { ...i, visited_at: newValue } : i)) ?? []
      )
      return { snapshot }
    },
    onSuccess: (newValue) => {
      if (newValue !== null) maybePromptRating()
    },
    onError: (_, __, ctx) => {
      if (ctx?.snapshot) queryClient.setQueryData(listKey, ctx.snapshot)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey })
    },
  })
}
