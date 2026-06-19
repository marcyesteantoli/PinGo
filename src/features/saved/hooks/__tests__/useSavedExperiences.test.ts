import React from 'react'
import { waitFor } from '@testing-library/react-native'
import { renderHook } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useSavedExperiences } from '../useSavedExperiences'
import { queryKeys } from '@lib/queryKeys'

beforeEach(() => jest.clearAllMocks())

const MOCK_USER = { id: 'user-xyz', email: 'user@example.com' }

// Saved rows returned by the first Supabase query
const SAVED_ROW_STORAGE = {
  experience_id: 'exp-1',
  saved_at: '2025-06-01T00:00:00Z',
  note: 'Must visit',
  price_paid: null,
  cover_photo_url: 'trips/exp-1/cover.jpg', // storage path (not http)
}

const SAVED_ROW_HTTP = {
  experience_id: 'exp-2',
  saved_at: '2025-05-01T00:00:00Z',
  note: null,
  price_paid: 25,
  cover_photo_url: 'https://example.com/photo.jpg', // direct HTTP url
}

const SAVED_ROW_NO_PHOTO = {
  experience_id: 'exp-3',
  saved_at: '2025-04-01T00:00:00Z',
  note: null,
  price_paid: null,
  cover_photo_url: null,
}

const EXPERIENCES = [
  { id: 'exp-1', title: 'Sagrada Familia', type: 'activity', location: 'Barcelona', trip_id: 'trip-1' },
  { id: 'exp-2', title: 'Eiffel Tower', type: 'activity', location: 'Paris', trip_id: 'trip-2' },
  { id: 'exp-3', title: 'Colosseum', type: 'activity', location: 'Rome', trip_id: null },
]

const TRIPS = [
  { id: 'trip-1', name: 'Spain Trip' },
  { id: 'trip-2', name: 'France Trip' },
]

// Pre-seeded auth wrapper — same pattern as useWishlistItems tests
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  queryClient.setQueryData(queryKeys.auth.currentUser(), MOCK_USER)

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// Helper: set up a mock Supabase chain for a specific table call.
// Returns a builder object whose `.mockResolvedValue` controls the terminal result.
function mockFromTable(table: string, result: any) {
  const terminal = jest.fn().mockResolvedValue(result)
  const chain: Record<string, jest.Mock> = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
  }
  // The last call in the chain resolves — we assign it to whichever method is called last.
  // For flexibility we make every terminal method (order, in, eq) resolve when no further chain.
  chain.order.mockResolvedValue(result)
  chain.in.mockResolvedValue(result)
  return chain
}

// Builds a complete Supabase `from` mock that handles all the tables called by useSavedExperiences.
function buildFromMock({
  savedRows,
  savedError = null,
  experiences,
  expError = null,
  attrRatings = [],
  attrError = null,
  trips = TRIPS,
}: {
  savedRows: any[]
  savedError?: any
  experiences: any[]
  expError?: any
  attrRatings?: any[]
  attrError?: any
  trips?: any[]
}) {
  ;(supabase.from as jest.Mock).mockImplementation((table: string) => {
    if (table === 'user_saved_experiences') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: savedRows, error: savedError }),
          }),
        }),
      }
    }
    if (table === 'experiences') {
      return {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({ data: experiences, error: expError }),
        }),
      }
    }
    if (table === 'experience_attribute_ratings') {
      return {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: attrRatings, error: attrError }),
          }),
        }),
      }
    }
    if (table === 'trips') {
      return {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({ data: trips, error: null }),
        }),
      }
    }
    return { select: jest.fn().mockReturnThis(), in: jest.fn().mockResolvedValue({ data: [], error: null }) }
  })
}

describe('useSavedExperiences', () => {
  it('returns empty array when user has no saved experiences', async () => {
    buildFromMock({ savedRows: [], experiences: [] })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: jest.fn().mockResolvedValue({ data: [], error: null }),
    })

    const { result } = await renderHook(() => useSavedExperiences(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('does NOT call createSignedUrls when there are no storage paths', async () => {
    // Only HTTP URLs — no storage paths to sign
    buildFromMock({
      savedRows: [SAVED_ROW_HTTP],
      experiences: [EXPERIENCES[1]],
    })
    const createSignedUrlsMock = jest.fn()
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: createSignedUrlsMock,
    })

    const { result } = await renderHook(() => useSavedExperiences(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(createSignedUrlsMock).not.toHaveBeenCalled()
  })

  it('calls createSignedUrls only with storage paths, not HTTP URLs', async () => {
    buildFromMock({
      savedRows: [SAVED_ROW_STORAGE, SAVED_ROW_HTTP],
      experiences: [EXPERIENCES[0], EXPERIENCES[1]],
    })
    const signedUrlResult = [
      { path: 'trips/exp-1/cover.jpg', signedUrl: 'https://signed.example.com/cover.jpg' },
    ]
    const createSignedUrlsMock = jest.fn().mockResolvedValue({ data: signedUrlResult, error: null })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: createSignedUrlsMock,
    })

    const { result } = await renderHook(() => useSavedExperiences(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Must be called with only the storage path, not the http URL
    expect(createSignedUrlsMock).toHaveBeenCalledWith(['trips/exp-1/cover.jpg'], 3600)
    expect(createSignedUrlsMock).not.toHaveBeenCalledWith(
      expect.arrayContaining(['https://example.com/photo.jpg']),
      expect.anything(),
    )
  })

  it('assigns signed URL for storage paths and direct URL for HTTP URLs', async () => {
    buildFromMock({
      savedRows: [SAVED_ROW_STORAGE, SAVED_ROW_HTTP],
      experiences: [EXPERIENCES[0], EXPERIENCES[1]],
    })
    const signedUrl = 'https://signed.example.com/cover.jpg'
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: jest.fn().mockResolvedValue({
        data: [{ path: 'trips/exp-1/cover.jpg', signedUrl }],
        error: null,
      }),
    })

    const { result } = await renderHook(() => useSavedExperiences(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const items = result.current.data!

    // exp-1 has storage path → must receive signed URL
    const exp1Item = items.find((i) => i.experience.id === 'exp-1')
    expect(exp1Item).toBeDefined()
    expect(exp1Item!.coverPhotoUrl).toBe(signedUrl)

    // exp-2 has direct HTTP url → must pass through unchanged
    const exp2Item = items.find((i) => i.experience.id === 'exp-2')
    expect(exp2Item).toBeDefined()
    expect(exp2Item!.coverPhotoUrl).toBe('https://example.com/photo.jpg')
  })

  it('coverPhotoUrl is null when cover_photo_url is null', async () => {
    buildFromMock({
      savedRows: [SAVED_ROW_NO_PHOTO],
      experiences: [EXPERIENCES[2]],
      trips: [],
    })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: jest.fn(),
    })

    const { result } = await renderHook(() => useSavedExperiences(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const items = result.current.data!
    expect(items).toHaveLength(1)
    expect(items[0].coverPhotoUrl).toBeNull()
  })

  it('isError is true when the saved experiences query fails', async () => {
    ;(supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'user_saved_experiences') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Network error' },
              }),
            }),
          }),
        }
      }
      return { select: jest.fn().mockReturnThis() }
    })

    const { result } = await renderHook(() => useSavedExperiences(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('handles createSignedUrls error gracefully (items still returned)', async () => {
    buildFromMock({
      savedRows: [SAVED_ROW_STORAGE],
      experiences: [EXPERIENCES[0]],
    })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      // Returns null data on error — hook does `signed ?? []` so no crash
      createSignedUrls: jest.fn().mockResolvedValue({ data: null, error: { message: 'Storage error' } }),
    })

    const { result } = await renderHook(() => useSavedExperiences(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const items = result.current.data!
    expect(items).toHaveLength(1)
    // Storage signing failed → coverPhotoUrl falls back to null
    expect(items[0].coverPhotoUrl).toBeNull()
  })

  it('correctly maps experience data including trip name', async () => {
    buildFromMock({
      savedRows: [SAVED_ROW_HTTP],
      experiences: [EXPERIENCES[1]], // exp-2, trip_id: 'trip-2'
    })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: jest.fn(),
    })

    const { result } = await renderHook(() => useSavedExperiences(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const item = result.current.data![0]

    expect(item.experience.id).toBe('exp-2')
    expect(item.experience.title).toBe('Eiffel Tower')
    expect(item.experience.trip?.name).toBe('France Trip')
    expect(item.saved_at).toBe('2025-05-01T00:00:00Z')
    expect(item.price_paid).toBe(25)
  })
})
