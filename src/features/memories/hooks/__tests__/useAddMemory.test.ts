import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useAddMemory } from '../useAddMemory'
import { queryKeys } from '@lib/queryKeys'
import { LIMITS } from '@/config/limits'
import type { MemoryWithUrl } from '../useMemories'

// Mock compressImage
jest.mock('@utils/image', () => ({
  compressImage: jest.fn().mockResolvedValue({
    uri: 'file://compressed.jpg',
    base64: 'abc123==',
    width: 800,
    height: 600,
  }),
}))

// Mock expo-file-system/legacy — readAsStringAsync must return valid base64
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('YWJj'), // 'abc' in base64
  EncodingType: { Base64: 'base64' },
}))

// atob is not defined in the jest jsdom environment — provide a simple polyfill
if (typeof global.atob === 'undefined') {
  global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary')
}

beforeEach(() => jest.clearAllMocks())

const TRIP_ID = 'trip-mem-add-001'
const MOCK_USER = { id: 'user-uploader', email: 'uploader@example.com' }

const MOCK_ASSET = {
  uri: 'file://photo.jpg',
  width: 1200,
  height: 800,
  type: 'image',
  fileName: 'photo.jpg',
  fileSize: 500000,
} as any

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

function makeMemory(overrides: Partial<any> = {}): MemoryWithUrl {
  return {
    id: 'mem-new',
    trip_id: TRIP_ID,
    user_id: MOCK_USER.id,
    image_url: `memories/${TRIP_ID}/user-uploader_123.jpg`,
    caption: null,
    created_at: '2025-06-01T10:00:00Z',
    cacheKey: `memories/${TRIP_ID}/user-uploader_123.jpg`,
    ...overrides,
  }
}

// Sets up the count query: supabase.from('memories').select('*', {count:'exact',head:true}).eq(...)
// Returns { count, error }
function mockCountQuery(count: number, error: any = null) {
  const eqFn = jest.fn().mockResolvedValue({ count, error })
  const selectFn = jest.fn().mockReturnValue({ eq: eqFn })
  ;(supabase.from as jest.Mock).mockReturnValue({ select: selectFn })
  return { selectFn, eqFn }
}

// Sets up the insert chain after a successful upload:
// supabase.from('memories').insert(...).select().single() -> returns memory row
function mockInsertChain(data: any, error: any = null) {
  const singleFn = jest.fn().mockResolvedValue({ data, error })
  const selectFn = jest.fn().mockReturnValue({ single: singleFn })
  const insertFn = jest.fn().mockReturnValue({ select: selectFn })
  return { insertFn, selectFn, singleFn }
}

// Sets up storage upload mock
function mockStorageUpload(error: any = null) {
  const uploadFn = jest.fn().mockResolvedValue({ data: { path: 'some/path' }, error })
  ;(supabase.storage.from as jest.Mock).mockReturnValue({ upload: uploadFn, remove: jest.fn().mockResolvedValue({}) })
  return { uploadFn }
}

// Full happy-path mock: count OK, auth OK, upload OK, insert OK
function setupHappyPath(memoryData: any) {
  // First call: count query
  // Second call (in uploadMemory): insert — we need from() to behave differently per call
  let callCount = 0
  const { insertFn, singleFn } = mockInsertChain(memoryData)

  ;(supabase.from as jest.Mock).mockImplementation((table: string) => {
    callCount++
    if (callCount === 1) {
      // Count query
      const eqFn = jest.fn().mockResolvedValue({ count: 0, error: null })
      const selectFn = jest.fn().mockReturnValue({ eq: eqFn })
      return { select: selectFn }
    }
    // Insert query
    return { insert: insertFn }
  })

  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: MOCK_USER },
    error: null,
  })

  const uploadFn = jest.fn().mockResolvedValue({ data: {}, error: null })
  const removeFn = jest.fn().mockResolvedValue({})
  ;(supabase.storage.from as jest.Mock).mockReturnValue({ upload: uploadFn, remove: removeFn })

  return { insertFn, singleFn, uploadFn, removeFn }
}

describe('useAddMemory', () => {
  describe('limit check', () => {
    it('throws LIMIT_REACHED when memories count >= MAX_PHOTOS_PER_TRIP', async () => {
      mockCountQuery(LIMITS.MAX_PHOTOS_PER_TRIP)
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: MOCK_USER },
        error: null,
      })

      const { wrapper } = createTestContext()
      const { result } = await renderHook(() => useAddMemory(), { wrapper })

      result.current.mutate({ tripId: TRIP_ID, asset: MOCK_ASSET })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect((result.current.error as any).code).toBe('LIMIT_REACHED')
    })

    it('proceeds when memories count is below limit', async () => {
      const memoryData = makeMemory()
      setupHappyPath({ ...memoryData, cacheKey: memoryData.image_url })

      const { wrapper } = createTestContext()
      const { result } = await renderHook(() => useAddMemory(), { wrapper })

      result.current.mutate({ tripId: TRIP_ID, asset: MOCK_ASSET })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })

  describe('compressImage', () => {
    it('calls compressImage with the asset URI', async () => {
      const { compressImage } = require('@utils/image')
      const memoryData = makeMemory()
      setupHappyPath({ ...memoryData, cacheKey: memoryData.image_url })

      const { wrapper } = createTestContext()
      const { result } = await renderHook(() => useAddMemory(), { wrapper })

      result.current.mutate({ tripId: TRIP_ID, asset: MOCK_ASSET })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(compressImage).toHaveBeenCalledWith(MOCK_ASSET.uri)
    })
  })

  describe('storage upload', () => {
    it('uploads to supabase storage from memories bucket', async () => {
      const memoryData = makeMemory()
      const { uploadFn } = setupHappyPath({ ...memoryData, cacheKey: memoryData.image_url })

      const { wrapper } = createTestContext()
      const { result } = await renderHook(() => useAddMemory(), { wrapper })

      result.current.mutate({ tripId: TRIP_ID, asset: MOCK_ASSET })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(supabase.storage.from).toHaveBeenCalledWith('memories')
      expect(uploadFn).toHaveBeenCalledWith(
        expect.stringContaining(`memories/${TRIP_ID}/`),
        expect.any(Uint8Array),
        expect.objectContaining({ contentType: 'image/jpeg', upsert: false })
      )
    })

    it('throws UPLOAD_FAILED and does NOT call DB insert when upload fails', async () => {
      let callCount = 0
      const insertFn = jest.fn()

      ;(supabase.from as jest.Mock).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          const eqFn = jest.fn().mockResolvedValue({ count: 0, error: null })
          const selectFn = jest.fn().mockReturnValue({ eq: eqFn })
          return { select: selectFn }
        }
        return { insert: insertFn }
      })

      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: MOCK_USER },
        error: null,
      })

      const uploadFn = jest.fn().mockResolvedValue({ data: null, error: { message: 'Storage error' } })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({ upload: uploadFn, remove: jest.fn() })

      const { wrapper } = createTestContext()
      const { result } = await renderHook(() => useAddMemory(), { wrapper })

      result.current.mutate({ tripId: TRIP_ID, asset: MOCK_ASSET })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect((result.current.error as any).code).toBe('UPLOAD_FAILED')
      expect(insertFn).not.toHaveBeenCalled()
    })
  })

  describe('DB insert failure cleanup', () => {
    it('removes orphan file from storage when DB insert fails', async () => {
      let callCount = 0

      ;(supabase.from as jest.Mock).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // Count query
          const eqFn = jest.fn().mockResolvedValue({ count: 0, error: null })
          const selectFn = jest.fn().mockReturnValue({ eq: eqFn })
          return { select: selectFn }
        }
        // Insert query fails
        const singleFn = jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
        const selectFn = jest.fn().mockReturnValue({ single: singleFn })
        const insertFn = jest.fn().mockReturnValue({ select: selectFn })
        return { insert: insertFn }
      })

      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: MOCK_USER },
        error: null,
      })

      const uploadFn = jest.fn().mockResolvedValue({ data: {}, error: null })
      const removeFn = jest.fn().mockResolvedValue({})
      ;(supabase.storage.from as jest.Mock).mockReturnValue({ upload: uploadFn, remove: removeFn })

      const { wrapper } = createTestContext()
      const { result } = await renderHook(() => useAddMemory(), { wrapper })

      result.current.mutate({ tripId: TRIP_ID, asset: MOCK_ASSET })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect((result.current.error as any).code).toBe('DB_FAILED')
      // remove must have been called with the storage path
      expect(removeFn).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining(`memories/${TRIP_ID}/`)])
      )
    })
  })

  describe('onSuccess', () => {
    it('prepends new memory to the cache', async () => {
      const memoryData = makeMemory({ id: 'mem-fresh' })
      setupHappyPath({ ...memoryData, cacheKey: memoryData.image_url })

      const { queryClient, wrapper } = createTestContext()
      const existingMemory = makeMemory({ id: 'mem-old' })
      queryClient.setQueryData(queryKeys.memories.all(TRIP_ID), [existingMemory])

      const { result } = await renderHook(() => useAddMemory(), { wrapper })
      result.current.mutate({ tripId: TRIP_ID, asset: MOCK_ASSET })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const cached = queryClient.getQueryData<MemoryWithUrl[]>(queryKeys.memories.all(TRIP_ID))!
      // New memory prepended
      expect(cached[0].id).toBe('mem-fresh')
      expect(cached[1].id).toBe('mem-old')
    })
  })

  describe('onSettled', () => {
    it('invalidates memories query for the tripId', async () => {
      const memoryData = makeMemory()
      setupHappyPath({ ...memoryData, cacheKey: memoryData.image_url })

      const { queryClient, wrapper } = createTestContext()
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

      const { result } = await renderHook(() => useAddMemory(), { wrapper })
      result.current.mutate({ tripId: TRIP_ID, asset: MOCK_ASSET })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.memories.all(TRIP_ID),
      })
    })
  })
})
