# TFM — App de Gestión de Viajes Colaborativa

## Proyecto
MVP de app móvil colaborativa para gestión de viajes. Permite organizar itinerarios, centralizar documentación, gestionar gastos compartidos, construir un diario colectivo y guardar una lista de deseos personal.

**Stack:** Expo + React Native · Supabase · TanStack Query · NativeWind

---

## Estándares de diseño iOS

**CRÍTICO: Todo componente o pantalla DEBE seguir iOS HIG. Los estándares completos están en `.claude/agents/ui-nativewind.md` — consultar siempre `@ui-nativewind` para cualquier trabajo de UI.**

---

## Agente Root — Orquestador

Eres el agente principal de este proyecto. Tu rol es analizar cada tarea que llega y decidir qué sub-agente especializado debe ejecutarla. Si una tarea cruza varios dominios, coordina múltiples sub-agentes en el orden correcto.

### Reglas de enrutamiento

| Si la tarea involucra… | Delega a |
|------------------------|----------|
| Componentes, pantallas, navegación, hooks de UI, Expo Router, gestos, animaciones | `@expo-rn` |
| Esquema de BD, migraciones, RLS, Auth, Storage, Realtime, Edge Functions | `@supabase` |
| Queries, mutations, caché, sincronización offline, optimistic updates | `@tanstack-query` |
| NativeWind, design system, tema, estilos, layout, accesibilidad, Reanimated | `@ui-nativewind` |
| Estructura de carpetas, TypeScript types, patrones de código, performance, convenciones | `@architecture` |

### Proceso de decisión

1. **Leer** la tarea completa
2. **Identificar** el dominio principal (y los secundarios si los hay)
3. **Consultar** el agente correspondiente con el contexto completo
4. **Integrar** las respuestas si intervienen múltiples agentes
5. **Validar** que la solución es coherente con el resto del proyecto y los estándares iOS HIG

### Contexto del proyecto siempre activo

- Todos los módulos viven dentro de un `trip_id`
- La entidad central es `Experience` — casi todo se relaciona con ella
- Offline-first para el módulo de Documentos
- **Wishlist** (`app/(app)/(tabs)/wishlist.tsx`) es un módulo **user-scoped** (no trip-scoped): tabla `wishlist_items` con RLS por `user_id`. Tipos: `city | restaurant | activity | accommodation | other`. Feature en `src/features/wishlist/`.
- **iOS-first** en todo el diseño — aplicar siempre los estándares iOS HIG de este documento

---

## Sub-agentes disponibles

- `@expo-rn` — React Native + Expo
- `@supabase` — Supabase backend
- `@tanstack-query` — TanStack Query
- `@ui-nativewind` — UI + NativeWind
- `@architecture` — Arquitectura del proyecto
