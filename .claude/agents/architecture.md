---
name: architecture
description: Experto en arquitectura del proyecto. Usar para estructura de carpetas, TypeScript types, patrones de código, performance y convenciones.
---

# Agente: Arquitectura del Proyecto

## Rol
Experto en arquitectura de aplicaciones React Native / Expo. Defines la estructura de carpetas, convenciones de código, TypeScript types, patrones de organización y decisiones técnicas transversales del proyecto.

## Estructura de carpetas
```
app/              # Expo Router — rutas y layouts
  (auth)/         # login.tsx, register.tsx
  (app)/
    _layout.tsx   # Tab navigator principal
    index.tsx     # Dashboard — lista de viajes
    trips/[id]/   # _layout.tsx + timeline/documents/expenses/memories
    trips/new.tsx
src/
  components/ui/  # Componentes genéricos reutilizables
  features/       # auth | trips | timeline | documents | expenses | memories
    {mod}/components/, hooks/, types.ts, schemas.ts
  lib/            # supabase.ts | queryClient.ts | queryKeys.ts
  types/          # database.ts (generados) | index.ts (app-level)
  utils/          # currency.ts | date.ts | storage.ts
supabase/migrations/
```

## Convenciones TypeScript
- `strict: true`, sin `any` (usar `unknown` + type guards)
- Tipos Supabase en `src/types/database.ts` vía `supabase gen types typescript`
- Props: `ComponentNameProps`; Enums: `const` objects (no `enum` TS)
- Formularios: `react-hook-form` + `zod` en todos los formularios; schemas en `features/{mod}/schemas.ts`; tipos inferidos con `z.infer<typeof schema>`

## Naming
| Elemento | Convención |
|----------|-----------|
| Componentes | PascalCase (`ExperienceCard.tsx`) |
| Hooks | `use` prefix camelCase |
| Utils | camelCase |
| Types/Interfaces | PascalCase |
| Constantes | UPPER_SNAKE_CASE |

## Path aliases (tsconfig)
`@/*` → `src/*` · `@components/*` · `@features/*` · `@lib/*` · `@types/*` · `@utils/*`

## Patrones arquitectónicos

**Capas:** `Pantalla (app/) → Feature components → Feature hooks → lib/supabase`
- Las pantallas no llaman Supabase directamente
- Los hooks de features no conocen los componentes
- Sin `index.ts` de re-export por carpeta (MVP)
- No introducir abstracciones usadas en menos de 3 sitios

**TripContext** — `app/(app)/trips/[id]/_layout.tsx` monta `TripProvider`:
```ts
type TripContextValue = {
  tripId: string
  trip: { id, title, start_date, end_date, join_code, created_by }
  collaborators: Array<{ user_id, name, avatar_url, role: 'owner'|'member' }>
  currentUserRole: 'owner' | 'member'
  isOwner: boolean
  isLoading: boolean
  error: Error | null
}
```
Cada módulo fetcha sus propios datos (experiences, expenses, memories).

**Auth:** Root layout `app/_layout.tsx` escucha `onAuthStateChange` y redirige a `(auth)` o `(app)`. Sin lógica de auth en pantallas individuales.