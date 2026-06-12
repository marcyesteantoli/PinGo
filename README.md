# PinGo

App móvil colaborativa para gestión de viajes. Permite organizar itinerarios, centralizar documentación, gestionar gastos compartidos y construir un diario colectivo.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Expo 52 + React Native 0.76 + Expo Router v4 |
| UI | NativeWind v4 + Tailwind CSS v3.4 |
| Estado | TanStack Query v5 + React Hook Form + Zod |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Lenguaje | TypeScript 5.3 (strict) |

## Funcionalidades

- **Timeline** — Itinerario por días con experiencias (actividades, transporte, alojamiento)
- **Gastos** — Registro de gastos compartidos con cálculo de balances y liquidaciones
- **Documentos** — Adjuntos por experiencia con soporte offline-first
- **Recuerdos** — Galería colaborativa de fotos con captions
- **Colaboradores** — Acceso por código de invitación con roles (owner / member)

## Estructura del proyecto

```
app/                    # Rutas (Expo Router file-based)
│   (auth)/             # Login y registro
│   (app)/              # Rutas autenticadas
│       index.tsx       # Dashboard — lista de viajes
│       trips/[id]/     # Tabs del viaje: timeline, expenses, documents, memories
│
src/
│   components/ui/      # Componentes base reutilizables
│   features/           # Módulos por dominio (auth, trips, timeline, expenses, documents, memories)
│   lib/                # Clientes (supabase, queryClient, queryKeys)
│   types/              # Tipos globales y tipos generados de Supabase
│   utils/              # Helpers de fecha, moneda e imagen
│
supabase/
│   migrations/         # Esquema, RLS y Storage buckets
│
agents/                 # Agentes especializados para Claude Code
```

Cada feature sigue la misma estructura interna:

```
features/<nombre>/
    hooks/      # useQuery / useMutation específicos del dominio
    components/ # Componentes visuales del módulo
    types.ts    # Tipos del dominio
```

## Base de datos

Tablas principales y sus relaciones:

```
profiles ──┐
           ├── trips ──── trip_collaborators
           │       └──── experiences ──── documents
           │                    └──────── experience_ratings
           ├── expenses ── expense_splits
           └── memories
```

Storage buckets:
- `memories` (público) — Fotos, máx 5 MB, formatos: JPEG / PNG / WebP
- `documents` (privado) — PDFs y adjuntos, máx 20 MB

Row Level Security habilitado en todas las tablas: un usuario solo accede a los datos de viajes en los que es colaborador.

## Puesta en marcha

### Requisitos

- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- Cuenta y proyecto en [Supabase](https://supabase.com)

### Instalación

```bash
git clone https://github.com/marcyesteantoli/TripSync.git
cd TripSync
npm install
```

### Variables de entorno

Copia el fichero de ejemplo y rellena tus credenciales de Supabase:

```bash
cp .env.example .env.local
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

### Migraciones de base de datos

```bash
supabase db push
```

### Generar tipos de Supabase

```bash
npm run supabase:types
```

### Desarrollo

```bash
npm start        # Metro bundler + QR para Expo Go
npm run android  # Emulador Android
npm run ios      # Simulador iOS (requiere macOS)
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor de desarrollo |
| `npm run android` | Abre en emulador Android |
| `npm run ios` | Abre en simulador iOS |
| `npm run lint` | Ejecuta ESLint |
| `npm run type-check` | Comprueba tipos TypeScript sin compilar |
| `npm run supabase:types` | Regenera tipos desde el esquema de Supabase |

## Path aliases

```ts
@/*           →  src/*
@components/* →  src/components/*
@features/*   →  src/features/*
@lib/*        →  src/lib/*
@types/*      →  src/types/*
@utils/*      →  src/utils/*
```

## Decisiones de arquitectura

- **Feature-based organization** — cada módulo es autónomo y no depende de otros módulos
- **TripContext** — los cuatro tabs del viaje comparten un único contexto cargado en el layout padre
- **Query keys centralizadas** — `src/lib/queryKeys.ts` como fuente única de verdad para TanStack Query
- **Offline-first en Documentos** — los adjuntos se gestionan con caché local prioritaria
- **LargeSecureStore** — wrapper sobre Expo Secure Store para superar el límite de 2 KB del token de sesión
