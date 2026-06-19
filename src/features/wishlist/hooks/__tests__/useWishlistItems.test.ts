import React from 'react'
import { waitFor } from '@testing-library/react-native'
import { renderHook } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useWishlistItems } from '../useWishlistItems'
import { queryKeys } from '@lib/queryKeys'
import type { WishlistItem } from '@app-types/index'

beforeEach(() => jest.clearAllMocks())

const MOCK_USER = { id: 'user-abc', email: 'test@example.com' }

// Creates a wrapper that pre-seeds the auth cache so useCurrentUser
// resolves immediately without hitting Supabase auth.
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  // Pre-seed the auth cache so useCurrentUser returns user without a network call
  queryClient.setQueryData(queryKeys.auth.currentUser(), MOCK_USER)

  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  )
}

const mockWishlistItems: WishlistItem[] = [
  {
    id: 'item-1',
    user_id: MOCK_USER.id,
    name: 'Tokyo',
    type: 'city',
    location: { city: 'Tokyo', country: 'Japan' },
    note: 'Someday!',
    added_at: '2025-01-01T00:00:00Z',
    visited_at: null,
  },
  {
    id: 'item-2',
    user_id: MOCK_USER.id,
    name: 'La Boqueria',
    type: 'restaurant',
    location: { city: 'Barcelona', country: 'Spain' },
    note: null,
    added_at: '2025-02-01T00:00:00Z',
    visited_at: '2025-03-15T00:00:00Z',
  },
]

describe('useWishlistItems', () => {
  it('returns empty array when Supabase returns no items', async () => {
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    }
    ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

    const { result } = await renderHook(() => useWishlistItems(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('returns correctly mapped items from Supabase', async () => {
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockWishlistItems, error: null }),
    }
    ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

    const { result } = await renderHook(() => useWishlistItems(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].id).toBe('item-1')
    expect(result.current.data![0].name).toBe('Tokyo')
    expect(result.current.data![1].id).toBe('item-2')
    expect(result.current.data![1].type).toBe('restaurant')
  })

  it('queries wishlist_items table with correct user_id', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null })
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
    ;(supabase.from as jest.Mock).mockReturnValue({ select: mockSelect })

    const { result } = await renderHook(() => useWishlistItems(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.from).toHaveBeenCalledWith('wishlist_items')
    expect(mockEq).toHaveBeenCalledWith('user_id', MOCK_USER.id)
  })

  it('isError is true when Supabase returns an error', async () => {
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      }),
    }
    ;(supabase.from as jest.Mock).mockReturnValue(mockChain)

    const { result } = await renderHook(() => useWishlistItems(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})
