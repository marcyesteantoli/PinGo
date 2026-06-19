import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useMemories } from '../useMemories'

beforeEach(() => jest.clearAllMocks())

const TRIP_ID = 'trip-mem-001'

function createTestContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  return { queryClient, wrapper }
}

// Builds the supabase .from().select().eq().order() chain used by useMemories
function mockMemoryRows(rows: any[], error: any = null) {
  const orderFn = jest.fn().mockResolvedValue({ data: rows, error })
  const eqFn = jest.fn().mockReturnValue({ order: orderFn })
  const selectFn = jest.fn().mockReturnValue({ eq: eqFn })
  ;(supabase.from as jest.Mock).mockReturnValue({ select: selectFn })
  return { selectFn, eqFn, orderFn }
}

function makeMemory(overrides: Partial<any> = {}): any {
  return {
    id: 'mem-1',
    trip_id: TRIP_ID,
    image_url: 'trips/memories/photo.jpg',
    created_at: '2025-06-01T10:00:00Z',
    ...overrides,
  }
}

describe('useMemories', () => {
  it('returns empty array when there are no memories', async () => {
    mockMemoryRows([])

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useMemories(TRIP_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('uses http URLs directly without signing', async () => {
    const httpMemory = makeMemory({ id: 'mem-http', image_url: 'https://picsum.photos/800/600' })

    mockMemoryRows([httpMemory])
    const createSignedUrlsMock = jest.fn()
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrls: createSignedUrlsMock })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useMemories(TRIP_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // No signing should occur for http URLs
    expect(createSignedUrlsMock).not.toHaveBeenCalled()
    expect(result.current.data?.[0].image_url).toBe('https://picsum.photos/800/600')
  })

  it('signs paths that do NOT start with http', async () => {
    const storageMemory = makeMemory({ id: 'mem-storage', image_url: 'trips/abc/photo.jpg' })

    mockMemoryRows([storageMemory])
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: jest.fn().mockResolvedValue({
        data: [{ signedUrl: 'https://signed.url/photo.jpg' }],
        error: null,
      }),
    })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useMemories(TRIP_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.[0].image_url).toBe('https://signed.url/photo.jpg')
  })

  it('calls createSignedUrls only with storage paths, not http URLs', async () => {
    const storageMemory = makeMemory({ id: 'mem-s', image_url: 'trips/photo.jpg' })
    const httpMemory = makeMemory({ id: 'mem-h', image_url: 'https://picsum.photos/200' })

    mockMemoryRows([storageMemory, httpMemory])
    const createSignedUrlsMock = jest.fn().mockResolvedValue({
      data: [{ signedUrl: 'https://signed.url/photo.jpg' }],
      error: null,
    })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrls: createSignedUrlsMock })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useMemories(TRIP_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Only storage path passed — http URL excluded
    expect(createSignedUrlsMock).toHaveBeenCalledWith(['trips/photo.jpg'], expect.any(Number))
    expect(createSignedUrlsMock).toHaveBeenCalledTimes(1)
  })

  it('includes signedUrl for storage paths and original URL for http paths', async () => {
    const storageMemory = makeMemory({ id: 'mem-s', image_url: 'trips/photo1.jpg' })
    const httpMemory = makeMemory({ id: 'mem-h', image_url: 'https://picsum.photos/300' })

    mockMemoryRows([storageMemory, httpMemory])
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: jest.fn().mockResolvedValue({
        data: [{ signedUrl: 'https://signed.url/photo1.jpg' }],
        error: null,
      }),
    })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useMemories(TRIP_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const data = result.current.data!
    const storageResult = data.find((m) => m.id === 'mem-s')
    const httpResult = data.find((m) => m.id === 'mem-h')

    expect(storageResult?.image_url).toBe('https://signed.url/photo1.jpg')
    expect(httpResult?.image_url).toBe('https://picsum.photos/300')
  })

  it('cacheKey is the original storage path (before signing)', async () => {
    const originalPath = 'trips/original/path.jpg'
    const storageMemory = makeMemory({ id: 'mem-cache', image_url: originalPath })

    mockMemoryRows([storageMemory])
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: jest.fn().mockResolvedValue({
        data: [{ signedUrl: 'https://signed.url/path.jpg' }],
        error: null,
      }),
    })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useMemories(TRIP_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // cacheKey must be the stable original path, not the rotated signed URL
    expect(result.current.data?.[0].cacheKey).toBe(originalPath)
    // image_url is replaced with signed URL
    expect(result.current.data?.[0].image_url).toBe('https://signed.url/path.jpg')
  })

  it('cacheKey is the http URL for external images', async () => {
    const externalUrl = 'https://picsum.photos/400'
    const httpMemory = makeMemory({ id: 'mem-ext', image_url: externalUrl })

    mockMemoryRows([httpMemory])
    const createSignedUrlsMock = jest.fn()
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrls: createSignedUrlsMock })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useMemories(TRIP_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.[0].cacheKey).toBe(externalUrl)
    expect(result.current.data?.[0].image_url).toBe(externalUrl)
  })

  it('passes ascending: false to order query for created_at descending', async () => {
    const { orderFn } = mockMemoryRows([])
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: jest.fn().mockResolvedValue({ data: [], error: null }),
    })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useMemories(TRIP_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(orderFn).toHaveBeenCalledWith('created_at', { ascending: false })
  })
})
