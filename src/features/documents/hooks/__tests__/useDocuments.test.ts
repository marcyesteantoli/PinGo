import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useDocuments } from '../useDocuments'

beforeEach(() => jest.clearAllMocks())

const TRIP_ID = 'trip-docs-001'

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

// Builds the supabase .from().select().eq().order() chain
function mockDocumentRows(rows: any[], error: any = null) {
  const orderFn = jest.fn().mockResolvedValue({ data: rows, error })
  const eqFn = jest.fn().mockReturnValue({ order: orderFn })
  const selectFn = jest.fn().mockReturnValue({ eq: eqFn })
  ;(supabase.from as jest.Mock).mockReturnValue({ select: selectFn })
  return { selectFn, eqFn, orderFn }
}

function makeDoc(overrides: Partial<any> = {}): any {
  return {
    id: 'doc-1',
    trip_id: TRIP_ID,
    document_type: 'file',
    file_path: 'trips/doc1.pdf',
    created_at: '2025-01-01T00:00:00Z',
    experiences: null,
    ...overrides,
  }
}

describe('useDocuments', () => {
  it('returns empty array when there are no documents', async () => {
    mockDocumentRows([])

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useDocuments(TRIP_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('does not pass link documents to createSignedUrls', async () => {
    const linkDoc = makeDoc({ id: 'doc-link', document_type: 'link', file_path: 'https://example.com/doc' })
    const fileDoc = makeDoc({ id: 'doc-file', document_type: 'file', file_path: 'trips/file.pdf' })

    mockDocumentRows([linkDoc, fileDoc])
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: jest.fn().mockResolvedValue({
        data: [{ signedUrl: 'https://signed.url/file.pdf' }],
        error: null,
      }),
    })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useDocuments(TRIP_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // createSignedUrls should only have been called with the storage path, not the link's file_path
    const storageFromMock = supabase.storage.from as jest.Mock
    const createSignedUrlsMock = storageFromMock.mock.results[0]?.value?.createSignedUrls as jest.Mock
    expect(createSignedUrlsMock).toHaveBeenCalledWith(['trips/file.pdf'], expect.any(Number))
  })

  it('uses presigned URL directly for paths starting with https://', async () => {
    const presignedDoc = makeDoc({
      id: 'doc-presigned',
      document_type: 'pass',
      file_path: 'https://cdn.example.com/legacy-doc.pdf',
    })

    mockDocumentRows([presignedDoc])
    const createSignedUrlsMock = jest.fn()
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: createSignedUrlsMock,
    })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useDocuments(TRIP_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Storage paths starting with https:// should NOT trigger createSignedUrls
    expect(createSignedUrlsMock).not.toHaveBeenCalled()
    // The presigned URL should be used directly as file_url
    expect(result.current.data?.[0].file_url).toBe('https://cdn.example.com/legacy-doc.pdf')
  })

  it('signs paths that do NOT start with https://', async () => {
    const storageDoc = makeDoc({
      id: 'doc-storage',
      document_type: 'file',
      file_path: 'trips/abc/boarding.pdf',
    })

    mockDocumentRows([storageDoc])
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: jest.fn().mockResolvedValue({
        data: [{ signedUrl: 'https://signed.url/boarding.pdf' }],
        error: null,
      }),
    })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useDocuments(TRIP_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.[0].file_url).toBe('https://signed.url/boarding.pdf')
  })

  it('calls createSignedUrls only with storage paths, not https:// paths', async () => {
    const storageDoc = makeDoc({ id: 'doc-s', document_type: 'file', file_path: 'trips/storage.pdf' })
    const presignedDoc = makeDoc({ id: 'doc-p', document_type: 'file', file_path: 'https://cdn.example.com/p.pdf' })

    mockDocumentRows([storageDoc, presignedDoc])
    const createSignedUrlsMock = jest.fn().mockResolvedValue({
      data: [{ signedUrl: 'https://fresh.signed/storage.pdf' }],
      error: null,
    })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: createSignedUrlsMock,
    })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useDocuments(TRIP_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Only the storage path (not the https:// path) should be passed to createSignedUrls
    expect(createSignedUrlsMock).toHaveBeenCalledWith(['trips/storage.pdf'], expect.any(Number))
    expect(createSignedUrlsMock).toHaveBeenCalledTimes(1)
  })

  it('documents have correct file_url assigned after signing', async () => {
    const docA = makeDoc({ id: 'doc-a', document_type: 'file', file_path: 'trips/a.pdf' })
    const docB = makeDoc({ id: 'doc-b', document_type: 'file', file_path: 'trips/b.pdf' })

    mockDocumentRows([docA, docB])
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: jest.fn().mockResolvedValue({
        data: [
          { signedUrl: 'https://signed.url/a.pdf' },
          { signedUrl: 'https://signed.url/b.pdf' },
        ],
        error: null,
      }),
    })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useDocuments(TRIP_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const docs = result.current.data!
    const docAResult = docs.find((d) => d.id === 'doc-a')
    const docBResult = docs.find((d) => d.id === 'doc-b')
    expect(docAResult?.file_url).toBe('https://signed.url/a.pdf')
    expect(docBResult?.file_url).toBe('https://signed.url/b.pdf')
  })

  it('link documents have file_url: null', async () => {
    const linkDoc = makeDoc({
      id: 'doc-link-only',
      document_type: 'link',
      file_path: null,
    })

    mockDocumentRows([linkDoc])
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: jest.fn().mockResolvedValue({ data: [], error: null }),
    })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useDocuments(TRIP_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.[0].file_url).toBeNull()
  })

  it('maps experience_title from nested experiences object', async () => {
    const docWithExp = makeDoc({
      id: 'doc-exp',
      document_type: 'link',
      file_path: null,
      experiences: { title: 'Sagrada Familia' },
    })

    mockDocumentRows([docWithExp])
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: jest.fn().mockResolvedValue({ data: [], error: null }),
    })

    const { wrapper } = createTestContext()
    const { result } = await renderHook(() => useDocuments(TRIP_ID), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.[0].experience_title).toBe('Sagrada Familia')
  })
})
