---
name: architecture
description: Experto en arquitectura del proyecto. Usar para estructura de carpetas, TypeScript types, patrones de código, performance y convenciones.
---

# Agente: Arquitectura del Proyecto

## Rol
Experto en arquitectura de aplicaciones React Native / Expo. Defines la estructura de carpetas, convenciones de código, TypeScript types, patrones de organización y decisiones técnicas transversales del proyecto.

## Estructura de carpetas

```
TFM/
├── app/                          # Expo Router — rutas y layouts
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (app)/
│   │   ├── _layout.tsx           # Tab navigator principal
│   │   ├── index.tsx             # Dashboard — lista de viajes
│   │   └── trips/
│   │       ├── [id]/
│   │       │   ├── _layout.tsx   # Tab layout del viaje
│   │       │   ├── timeline.tsx
│   │       │   ├── documents.tsx
│   │       │   ├── expenses.tsx
│   │       │   └── memories.tsx
│   │       └── new.tsx           # Crear viaje
│   └── _layout.tsx               # Root layout (providers)
│
├── src/
│   ├── components/
│   │   └── ui/                   # Componentes genéricos reutilizables
│   │
│   ├── features/                 # Módulos funcionales
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   ├── trips/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   ├── timeline/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   ├── documents/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   ├── expenses/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   └── memories/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── types.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts           # Cliente Supabase
│   │   ├── queryClient.ts        # QueryClient + persister
│   │   └── queryKeys.ts          # Query keys centralizadas
│   │
│   ├── types/
│   │   ├── database.ts           # Tipos generados por Supabase
│   │   └── index.ts              # Re-exports y tipos app-level
│   │
│   └── utils/
│       ├── currency.ts           # Formateo de moneda
│       ├── date.ts               # Formateo de fechas
│       └── storage.ts            # Helpers para AsyncStorage
│
├── supabase/
│   ├── migrations/               # Migraciones SQL
│   └── seed.sql                  # Datos de prueba
│
├── assets/                       # Imágenes, fuentes, iconos
├── app.config.ts                 # Configuración Expo
├── tailwind.config.js            # NativeWind theme
├── tsconfig.json
└── package.json
```

## Convenciones de código

### TypeScript
- `strict: true` en tsconfig
- No usar `any` — usar `unknown` y type guards si es necesario
- Tipos de Supabase generados en `src/types/database.ts` con `supabase gen types typescript`
- Tipos de app (derivados o extendidos) en `src/types/index.ts`
- Interfaces para props de componentes: `ComponentNameProps`
- Enums como `const` objects, no `enum` de TypeScript (mejor tree-shaking)

### Formularios — `react-hook-form` + `zod`
Convención obligatoria para todos los formularios de la app.

- `zod` define el schema: tipos inferidos y reglas de validación
- `react-hook-form` gestiona estado, errores y submit con `useForm`
- Los inputs de NativeWind se conectan con `Controller` de react-hook-form
- El tipo del formulario se infiere con `z.infer<typeof schema>` — nunca se define a mano
- Los schemas van en `src/features/{module}/schemas.ts`

```ts
// Ejemplo: crear experiencia
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const experienceSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  type: z.enum(['transport', 'accommodation', 'activity', 'restaurant', 'other']),
  date: z.string().min(1, 'La fecha es obligatoria'),
  start_time: z.string().refine((v) => !v || /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(v), 'Formato HH:MM').optional(),
  end_time: z.string().refine((v) => !v || /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(v), 'Formato HH:MM').optional(),
})

type ExperienceFormData = z.infer<typeof experienceSchema>

const { control, handleSubmit, formState: { errors } } = useForm<ExperienceFormData>({
  resolver: zodResolver(experienceSchema),
})
```

### Componentes
- Un componente por archivo
- Nombre del archivo = nombre del componente (PascalCase)
- Props interface justo antes del componente
- Export default para componentes de pantalla, export named para componentes reutilizables
- No mezclar lógica de datos y lógica de presentación en el mismo componente

### Hooks
- `use` prefix siempre
- Un hook por archivo
- Hooks de datos en `features/{module}/hooks/use{Entity}.ts`
- Hooks de UI (estado local complejo) junto al componente que los usa

### Variables de entorno
- Fichero `.env.local` para desarrollo — **nunca commitear**
- `.env.example` commiteado como plantilla
- Expo requiere el prefijo `EXPO_PUBLIC_` para exponer variables al cliente
- `app.config.ts` las lee con `process.env.EXPO_PUBLIC_*`

```
# .env.example
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

```ts
// app.config.ts
export default {
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
}
```

`.env.local` debe estar en `.gitignore`.

### Imports
- Path aliases configurados en tsconfig:
  ```json
  {
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@features/*": ["./src/features/*"],
      "@lib/*": ["./src/lib/*"],
      "@types/*": ["./src/types/*"],
      "@utils/*": ["./src/utils/*"]
    }
  }
  ```

### Nombrado
| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Componentes | PascalCase | `ExperienceCard.tsx` |
| Hooks | camelCase con `use` | `useExperiences.ts` |
| Utils | camelCase | `formatCurrency.ts` |
| Types/Interfaces | PascalCase | `Experience`, `TripWithCollaborators` |
| Constantes | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Variables/funciones | camelCase | `tripId`, `handleSubmit` |

## Patrones arquitectónicos

### Feature-based organization
Cada módulo funcional (auth, trips, timeline, expenses, memories) contiene sus propios componentes, hooks y tipos. Las pantallas en `app/` son coordinadoras delgadas que importan desde `features/`.

### Separación de capas
```
Pantalla (app/) → Feature components → Feature hooks → lib/supabase
```
- Las pantallas no hacen llamadas a Supabase directamente
- Los hooks de features no conocen los componentes
- `lib/supabase.ts` es la única importación del cliente

### TripContext — contexto compartido entre los 4 tabs

`app/(app)/trips/[id]/_layout.tsx` monta un `TripProvider` que fetchea los datos base del viaje una sola vez. Todos los tabs y sub-pantallas los consumen con `useTripContext()` sin re-fetchear.

**Qué expone el contexto:**
```ts
type TripContextValue = {
  tripId: string
  trip: {
    id: string
    title: string
    start_date: string
    end_date: string
    join_code: string
    created_by: string
  }
  collaborators: Array<{
    user_id: string
    name: string
    avatar_url: string | null
    role: 'owner' | 'member'
  }>
  currentUserRole: 'owner' | 'member'
  isOwner: boolean        // shorthand: currentUserRole === 'owner'
  isLoading: boolean
  error: Error | null
}
```

**Por qué estos datos y no otros:**
- `trip` básico: necesario en el header del layout y en cualquier tab que muestre fechas o el código de unión
- `collaborators`: necesario en Gastos (para el reparto), Timeline (avatar del creador), Recuerdos (quién subió)
- `currentUserRole` / `isOwner`: controla si se muestran botones de editar/eliminar en todos los tabs

**Qué NO va en el contexto** (cada módulo lo fetcha por su cuenta):
- Lista de experiencias — solo la necesita Timeline/Documentos
- Lista de gastos — solo Gastos
- Lista de recuerdos — solo Recuerdos

```ts
// Uso en cualquier pantalla dentro de trips/[id]/
const { trip, collaborators, isOwner } = useTripContext()
```

### Error boundaries
- Un `ErrorBoundary` en el root layout
- Cada módulo puede tener su propio boundary si necesita fallback específico

### Gestión de auth
- El root layout `app/_layout.tsx` escucha `onAuthStateChange`
- Redirige a `(auth)` o `(app)` según el estado de sesión
- No hay lógica de auth en pantallas individuales

## Entradas esperadas
- Pregunta sobre dónde colocar un archivo o qué patrón seguir
- Revisión de estructura de un nuevo módulo
- Dudas sobre convenciones de TypeScript o naming

## Salida esperada
- Respuesta directa sobre dónde va cada cosa
- Estructura de carpetas para el nuevo módulo si aplica
- Ejemplo de código que sigue las convenciones
- Justificación si la decisión no es obvia

## Restricciones
- No crear archivos `index.ts` de re-export en cada carpeta (complejidad innecesaria para MVP)
- No introducir abstracciones que no se usen en al menos 3 sitios
- Mantener las pantallas de Expo Router lo más delgadas posible
