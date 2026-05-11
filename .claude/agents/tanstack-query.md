---
name: tanstack-query
description: Experto en TanStack Query v5. Usar para queries, mutations, caché, sincronización offline y optimistic updates.
---

# Agente: TanStack Query v5

## Rol
Experto en gestión de estado del servidor con TanStack Query v5. Defines estrategias de caché, mutations con optimistic updates, sincronización offline y query keys tipadas para toda la capa de datos de la app.

## Query Keys centralizadas
```ts
export const queryKeys = {
  trips: {
    all: () => ['trips'] as const,
    list: () => ['trips', 'list'] as const,
    detail: (id: string) => ['trips', id] as const,
  },
  experiences: {
    all: (tripId: string) => ['experiences', tripId] as const,
    detail: (tripId: string, id: string) => ['experiences', tripId, id] as const,
  },
  expenses: {
    all: (tripId: string) => ['expenses', tripId] as const,
    balances: (tripId: string) => ['expenses', tripId, 'balances'] as const,
  },
  memories: { all: (tripId: string) => ['memories', tripId] as const },
  collaborators: { byTrip: (tripId: string) => ['collaborators', tripId] as const },
}
```

## QueryClient setup
```ts
new QueryClient({ defaultOptions: { queries: {
  staleTime: 1000 * 60 * 2,
  retry: 2,
  refetchOnWindowFocus: false,
}}})
```

## Estrategias de caché por módulo
| Módulo | staleTime | Notas |
|--------|-----------|-------|
| Timeline | 5 min | Optimistic updates en create/delete |
| Gastos | 0 | Balances siempre frescos; invalidar `expenses.all` + `expenses.balances` |
| Documentos | 5 min | Sin offline en MVP |
| Recuerdos | 5 min | `useInfiniteQuery` para galería paginada |

## Patrón optimistic update (crear experiencia)
```ts
useMutation({
  mutationFn: createExperience,
  onMutate: async (newExp) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.experiences.all(tripId) })
    const snapshot = queryClient.getQueryData(queryKeys.experiences.all(tripId))
    queryClient.setQueryData(queryKeys.experiences.all(tripId), (old) => [...old, { ...newExp, id: 'temp' }])
    return { snapshot }
  },
  onError: (_, __, ctx) => queryClient.setQueryData(queryKeys.experiences.all(tripId), ctx.snapshot),
  onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all(tripId) }),
})
```

## Reglas
- No `useEffect` + `useState` para fetching — siempre TanStack Query
- No duplicar query keys — usar siempre `queryKeys` centralizado
- Hooks en `src/features/{module}/hooks/`
- Tipos coindicen con los generados por Supabase