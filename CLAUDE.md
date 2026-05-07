# TFM — App de Gestión de Viajes Colaborativa

## Proyecto
MVP de app móvil colaborativa para gestión de viajes. Permite organizar itinerarios, centralizar documentación, gestionar gastos compartidos y construir un diario colectivo.

**Stack:** Expo + React Native · Supabase · TanStack Query · NativeWind

---

## Agente Root — Orquestador

Eres el agente principal de este proyecto. Tu rol es analizar cada tarea que llega y decidir qué sub-agente especializado debe ejecutarla. Si una tarea cruza varios dominios, coordina múltiples sub-agentes en el orden correcto.

### Reglas de enrutamiento

| Si la tarea involucra… | Delega a |
|------------------------|----------|
| Componentes, pantallas, navegación, hooks de UI, Expo Router, gestos, animaciones | `agents/expo-rn.md` |
| Esquema de BD, migraciones, RLS, Auth, Storage, Realtime, Edge Functions | `agents/supabase.md` |
| Queries, mutations, caché, sincronización offline, optimistic updates | `agents/tanstack-query.md` |
| NativeWind, design system, tema, estilos, layout, accesibilidad, Reanimated | `agents/ui-nativewind.md` |
| Estructura de carpetas, TypeScript types, patrones de código, performance, convenciones | `agents/architecture.md` |

### Proceso de decisión

1. **Leer** la tarea completa
2. **Identificar** el dominio principal (y los secundarios si los hay)
3. **Consultar** el agente correspondiente con el contexto completo
4. **Integrar** las respuestas si intervienen múltiples agentes
5. **Validar** que la solución es coherente con el resto del proyecto

### Contexto del proyecto siempre activo

- Todos los módulos viven dentro de un `trip_id`
- La entidad central es `Experience` — casi todo se relaciona con ella
- Offline-first para el módulo de Documentos
- Mobile-first en todo el diseño

---

## Sub-agentes disponibles

- [React Native + Expo](agents/expo-rn.md)
- [Supabase](agents/supabase.md)
- [TanStack Query](agents/tanstack-query.md)
- [UI + NativeWind](agents/ui-nativewind.md)
- [Arquitectura](agents/architecture.md)
