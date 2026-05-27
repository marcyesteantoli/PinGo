import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import type { WishlistItem } from '@types/index'

export function useWishlistItems() {
  const { data: user } = useCurrentUser()

  return useQuery<WishlistItem[]>({
    queryKey: queryKeys.wishlist.byUser(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', user!.id)
        .order('added_at', { ascending: false })

      if (error) throw new Error(error.message)
      return (data ?? []) as WishlistItem[]
    },
    enabled: !!user?.id,
  })
}
