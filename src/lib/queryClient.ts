import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { Sentry } from '@lib/sentry'

function reportToSentry(error: Error, context?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    if (context) scope.setContext('query', context)
    Sentry.captureException(error)
  })
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const maxRetries = typeof query.options.retry === 'number' ? query.options.retry : 3
      // Only report after all retries exhausted — avoids 3x noise with retry:2
      if (query.state.fetchFailureCount <= maxRetries) return
      reportToSentry(error as Error, {
        queryKey: JSON.stringify(query.queryKey),
        queryHash: query.queryHash,
      })
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      reportToSentry(error as Error, {
        mutationKey: mutation.options.mutationKey
          ? JSON.stringify(mutation.options.mutationKey)
          : undefined,
      })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})
