import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { useRatings } from '../useRatings'

beforeEach(() => jest.clearAllMocks())

const EXPERIENCE_ID = 'exp-001'
const USER_ID = 'user-me'

// Creates a wrapper with the auth cache pre-seeded so useCurrentUser resolves
// synchronously (staleTime: Infinity means it won't re-fetch).
function createTestContext(userId: string | null = USER_ID) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  // Pre-seed the auth cache to avoid a race between useCurrentUser and useRatings
  const user = userId ? { id: userId, email: 'test@example.com' } : null
  queryClient.setQueryData(queryKeys.auth.currentUser(), user)

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  return { queryClient, wrapper }
}

function mockRatings(rows: any[]) {
  ;(supabase.from as jest.Mock).mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: rows, error: null }),
    }),
  })
}

describe('useRatings', () => {
  it('returns avg: null and count: 0 when there are no ratings', async () => {
    mockRatings([])

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useRatings(EXPERIENCE_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.avg).toBeNull()
    expect(result.current.data?.count).toBe(0)
    expect(result.current.data?.ratings).toHaveLength(0)
  })

  it('calculates avg correctly to 1 decimal place', async () => {
    mockRatings([
      { user_id: 'user-a', rating: 7, experience_id: EXPERIENCE_ID, profiles: null },
      { user_id: 'user-b', rating: 8, experience_id: EXPERIENCE_ID, profiles: null },
      { user_id: 'user-c', rating: 9, experience_id: EXPERIENCE_ID, profiles: null },
    ])

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useRatings(EXPERIENCE_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // (7 + 8 + 9) / 3 = 8.0
    expect(result.current.data?.avg).toBe(8)
    expect(result.current.data?.count).toBe(3)
  })

  it('rounds avg to 1 decimal: (7 + 8) / 2 = 7.5', async () => {
    mockRatings([
      { user_id: 'user-a', rating: 7, experience_id: EXPERIENCE_ID, profiles: null },
      { user_id: 'user-b', rating: 8, experience_id: EXPERIENCE_ID, profiles: null },
    ])

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useRatings(EXPERIENCE_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Math.round((7.5) * 10) / 10 = 7.5
    expect(result.current.data?.avg).toBe(7.5)
    expect(result.current.data?.count).toBe(2)
  })

  it('rounds avg to 1 decimal for non-exact division', async () => {
    // (7 + 8 + 6) / 3 = 7.0
    mockRatings([
      { user_id: 'user-a', rating: 7, experience_id: EXPERIENCE_ID, profiles: null },
      { user_id: 'user-b', rating: 8, experience_id: EXPERIENCE_ID, profiles: null },
      { user_id: 'user-c', rating: 6, experience_id: EXPERIENCE_ID, profiles: null },
    ])

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useRatings(EXPERIENCE_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.avg).toBe(7)
    expect(result.current.data?.count).toBe(3)
  })

  it('count equals the number of ratings returned', async () => {
    const rows = [
      { user_id: 'u1', rating: 5, experience_id: EXPERIENCE_ID, profiles: null },
      { user_id: 'u2', rating: 6, experience_id: EXPERIENCE_ID, profiles: null },
      { user_id: 'u3', rating: 7, experience_id: EXPERIENCE_ID, profiles: null },
      { user_id: 'u4', rating: 8, experience_id: EXPERIENCE_ID, profiles: null },
    ]
    mockRatings(rows)

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useRatings(EXPERIENCE_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.count).toBe(rows.length)
  })

  it('userRating is the rating value for the current user', async () => {
    mockRatings([
      { user_id: 'user-other', rating: 6, experience_id: EXPERIENCE_ID, profiles: null },
      { user_id: USER_ID, rating: 9, experience_id: EXPERIENCE_ID, profiles: null },
    ])

    const { wrapper } = createTestContext(USER_ID)
    const { result } = await renderHook(() => useRatings(EXPERIENCE_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.userRating).toBe(9)
  })

  it('userRating is null when current user has not rated', async () => {
    mockRatings([
      { user_id: 'user-other', rating: 7, experience_id: EXPERIENCE_ID, profiles: null },
    ])

    const { wrapper } = createTestContext(USER_ID)
    const { result } = await renderHook(() => useRatings(EXPERIENCE_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.userRating).toBeNull()
  })

  it('userRating is null when userId is null (not authenticated)', async () => {
    mockRatings([
      { user_id: 'user-other', rating: 8, experience_id: EXPERIENCE_ID, profiles: null },
    ])

    // Auth cache seeded with null user
    const { wrapper } = createTestContext(null)
    const { result } = await renderHook(() => useRatings(EXPERIENCE_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // userId is undefined (user is null) so find() won't match → userRating is null
    expect(result.current.data?.userRating).toBeNull()
  })
})
