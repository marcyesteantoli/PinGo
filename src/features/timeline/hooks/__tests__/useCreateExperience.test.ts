import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useCreateExperience } from '../useCreateExperience'
import { queryKeys } from '@lib/queryKeys'
import type { Experience } from '@app-types/index'

beforeEach(() => jest.clearAllMocks())

const TRIP_ID = 'trip-timeline-001'
const MOCK_USER = { id: 'user-creator', email: 'creator@example.com' }

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

function makeExperience(overrides: Partial<Experience> = {}): Experience {
  return {
    id: 'exp-existing',
    trip_id: TRIP_ID,
    title: 'Existing Experience',
    type: 'activity',
    date: '2025-07-01',
    start_time: '10:00',
    end_time: null,
    confirmation_code: null,
    location: null,
    destination_id: null,
    created_by: MOCK_USER.id,
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  } as Experience
}

const FORM_DATA = {
  title: 'New Activity',
  type: 'activity' as const,
  date: '2025-07-02',
  start_time: '09:00',
  end_time: '11:00',
  confirmation_code: 'CODE123',
  location: null,
  destination_id: null,
}

// Returns the chain for .from('experiences').insert(...).select().single()
function mockInsertChain(resolvedValue: any) {
  const singleFn = jest.fn().mockResolvedValue(resolvedValue)
  const selectFn = jest.fn().mockReturnValue({ single: singleFn })
  const insertFn = jest.fn().mockReturnValue({ select: selectFn })
  ;(supabase.from as jest.Mock).mockReturnValue({ insert: insertFn })
  return { insertFn, selectFn, singleFn }
}

describe('useCreateExperience', () => {
  describe('mutationFn', () => {
    it('calls supabase.from(experiences).insert with trip_id, created_by and form fields', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: MOCK_USER },
        error: null,
      })
      const SERVER_EXP = makeExperience({ id: 'exp-new', title: 'New Activity' })
      const { insertFn } = mockInsertChain({ data: SERVER_EXP, error: null })

      const { wrapper } = createTestContext()
      const { result } = await renderHook(() => useCreateExperience(TRIP_ID), { wrapper })

      result.current.mutate(FORM_DATA)
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(supabase.from).toHaveBeenCalledWith('experiences')
      expect(insertFn).toHaveBeenCalledWith(
        expect.objectContaining({
          trip_id: TRIP_ID,
          created_by: MOCK_USER.id,
          title: 'New Activity',
          type: 'activity',
          date: '2025-07-02',
          start_time: '09:00',
          end_time: '11:00',
          confirmation_code: 'CODE123',
        })
      )
    })

    it('throws when no active session', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const { wrapper } = createTestContext()
      const { result } = await renderHook(() => useCreateExperience(TRIP_ID), { wrapper })

      result.current.mutate(FORM_DATA)
      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('onMutate — optimistic update', () => {
    it('inserts a temporary experience with id starting with temp_', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: MOCK_USER },
        error: null,
      })
      let resolveInsert!: (val: any) => void
      const singleFn = jest.fn().mockReturnValue(new Promise((res) => { resolveInsert = res }))
      const selectFn = jest.fn().mockReturnValue({ single: singleFn })
      const insertFn = jest.fn().mockReturnValue({ select: selectFn })
      ;(supabase.from as jest.Mock).mockReturnValue({ insert: insertFn })

      const { queryClient, wrapper } = createTestContext()
      const existing = makeExperience()
      queryClient.setQueryData(queryKeys.experiences.all(TRIP_ID), [existing])

      const { result } = await renderHook(() => useCreateExperience(TRIP_ID), { wrapper })
      result.current.mutate(FORM_DATA)

      await waitFor(() => {
        const cached = queryClient.getQueryData<Experience[]>(queryKeys.experiences.all(TRIP_ID))
        return !!cached && cached.length === 2
      })

      const cached = queryClient.getQueryData<Experience[]>(queryKeys.experiences.all(TRIP_ID))!
      const tempItem = cached.find((e) => e.id.startsWith('temp_'))
      expect(tempItem).toBeDefined()
      expect(tempItem!.title).toBe('New Activity')

      // Resolve to clean up
      resolveInsert({ data: makeExperience({ id: 'exp-new' }), error: null })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })

    it('sorts by date ascending with nulls at the end', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: MOCK_USER },
        error: null,
      })
      let resolveInsert!: (val: any) => void
      const singleFn = jest.fn().mockReturnValue(new Promise((res) => { resolveInsert = res }))
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: singleFn }) }),
      })

      const expWithDate = makeExperience({ id: 'exp-date', date: '2025-08-01', start_time: null })
      const expNoDate = makeExperience({ id: 'exp-nodate', date: null, start_time: null })

      const { queryClient, wrapper } = createTestContext()
      // Pre-populate with a dated item and a null-date item
      queryClient.setQueryData(queryKeys.experiences.all(TRIP_ID), [expNoDate, expWithDate])

      const { result } = await renderHook(() => useCreateExperience(TRIP_ID), { wrapper })

      // Mutate with a date between expWithDate and expNoDate
      result.current.mutate({ ...FORM_DATA, date: '2025-07-15', start_time: undefined })

      await waitFor(() => {
        const cached = queryClient.getQueryData<Experience[]>(queryKeys.experiences.all(TRIP_ID))
        return !!cached && cached.length === 3
      })

      const cached = queryClient.getQueryData<Experience[]>(queryKeys.experiences.all(TRIP_ID))!
      // Date order: 2025-08-01, 2025-07-15 (new temp), then null
      // Actually ascending: 2025-07-15 < 2025-08-01, then null last
      expect(cached[0].date).toBe('2025-07-15')
      expect(cached[1].date).toBe('2025-08-01')
      expect(cached[2].date).toBeNull()

      resolveInsert({ data: makeExperience({ id: 'exp-new' }), error: null })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })

    it('sorts by start_time ascending when dates are equal', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: MOCK_USER },
        error: null,
      })
      let resolveInsert!: (val: any) => void
      const singleFn = jest.fn().mockReturnValue(new Promise((res) => { resolveInsert = res }))
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: singleFn }) }),
      })

      const sameDate = '2025-07-10'
      const expLate = makeExperience({ id: 'exp-late', date: sameDate, start_time: '15:00' })
      const expNoTime = makeExperience({ id: 'exp-notime', date: sameDate, start_time: null })

      const { queryClient, wrapper } = createTestContext()
      queryClient.setQueryData(queryKeys.experiences.all(TRIP_ID), [expLate, expNoTime])

      const { result } = await renderHook(() => useCreateExperience(TRIP_ID), { wrapper })
      result.current.mutate({ ...FORM_DATA, date: sameDate, start_time: '08:00' })

      await waitFor(() => {
        const cached = queryClient.getQueryData<Experience[]>(queryKeys.experiences.all(TRIP_ID))
        return !!cached && cached.length === 3
      })

      const cached = queryClient.getQueryData<Experience[]>(queryKeys.experiences.all(TRIP_ID))!
      // Same date: 08:00 first, 15:00 second, null last
      expect(cached[0].start_time).toBe('08:00')
      expect(cached[1].start_time).toBe('15:00')
      expect(cached[2].start_time).toBeNull()

      resolveInsert({ data: makeExperience({ id: 'exp-new' }), error: null })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })

  describe('onSuccess', () => {
    it('replaces temp item with the real server experience', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: MOCK_USER },
        error: null,
      })
      const SERVER_EXP = makeExperience({ id: 'exp-server-real', title: 'New Activity' })
      mockInsertChain({ data: SERVER_EXP, error: null })

      const { queryClient, wrapper } = createTestContext()

      const { result } = await renderHook(() => useCreateExperience(TRIP_ID), { wrapper })
      result.current.mutate(FORM_DATA)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const cached = queryClient.getQueryData<Experience[]>(queryKeys.experiences.all(TRIP_ID))!
      const tempItems = cached.filter((e) => e.id.startsWith('temp_'))
      const realItem = cached.find((e) => e.id === 'exp-server-real')

      expect(tempItems).toHaveLength(0)
      expect(realItem).toBeDefined()
    })
  })

  describe('onError', () => {
    it('restores the previous cache snapshot on error', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: MOCK_USER },
        error: null,
      })
      const singleFn = jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: singleFn }) }),
      })

      const { queryClient, wrapper } = createTestContext()
      const existing = makeExperience()
      queryClient.setQueryData(queryKeys.experiences.all(TRIP_ID), [existing])

      const { result } = await renderHook(() => useCreateExperience(TRIP_ID), { wrapper })
      result.current.mutate(FORM_DATA)

      await waitFor(() => expect(result.current.isError).toBe(true))

      const cached = queryClient.getQueryData<Experience[]>(queryKeys.experiences.all(TRIP_ID))!
      expect(cached).toHaveLength(1)
      expect(cached[0].id).toBe('exp-existing')
    })
  })

  describe('onSettled', () => {
    it('invalidates experiences query for the tripId', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: MOCK_USER },
        error: null,
      })
      const SERVER_EXP = makeExperience({ id: 'exp-new' })
      mockInsertChain({ data: SERVER_EXP, error: null })

      const { queryClient, wrapper } = createTestContext()
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

      const { result } = await renderHook(() => useCreateExperience(TRIP_ID), { wrapper })
      result.current.mutate(FORM_DATA)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.experiences.all(TRIP_ID),
      })
    })
  })
})
