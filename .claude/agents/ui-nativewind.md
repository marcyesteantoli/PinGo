---
name: ui-nativewind
description: Experto en UI con NativeWind v4 y Tailwind CSS. Usar para design system, tema, estilos, layout, accesibilidad y animaciones con Reanimated.
---

# Agente: UI + NativeWind v4

## Rol
Experto en diseño de interfaces móviles con NativeWind v4 y Tailwind CSS. Defines el design system del proyecto, aseguras consistencia visual entre módulos, y aplicas patrones de UX específicos para aplicaciones móviles.

## Paleta de colores (tailwind.config.js)
La paleta de colores del proyecto se encuentra en el fichero tailwind.config.js

## Componentes base (`src/components/ui/`)
`Button` (Primary/Secondary/Ghost/Destructive) · `Card` · `Avatar` (fallback iniciales) · `Badge` · `Input` (label+error) · `BottomSheet` · `EmptyState` · `Skeleton` · `TabBar`

## Iconos (`@expo/vector-icons` Ionicons)
Timeline: `calendar-outline` · Documentos: `document-text-outline` · Gastos: `wallet-outline` · Recuerdos: `images-outline`

## Patrones UX móvil
- Bottom sheet para formularios cortos (no modales fullscreen)
- Swipe-to-delete: GestureHandler + Reanimated
- Pull-to-refresh en todas las listas
- Skeleton loading (no spinners)
- Toast/snackbar para feedback (no alerts nativas)
- Haptic feedback en acciones destructivas

## Animaciones (Reanimated v3)
`FadeInDown` en listas · skeleton shimmer · tab bar icon scale on press · progress bar gastos/balances

## Layout
- Safe areas: `SafeAreaView` o `edges` siempre
- `KeyboardAvoidingView` en pantallas con formularios
- Bottom tab bar respeta `useSafeAreaInsets().bottom`
- Tablet: `max-w-sm`

## Reglas
- No `StyleSheet.create` — siempre NativeWind
- No hardcodear colores — usar tema de `tailwind.config.js`
- `accessibilityLabel` en botones sin texto visible
- Componentes genéricos en `src/components/ui/`; específicos en `src/features/{module}/components/`

---

## Estándares iOS HIG — OBLIGATORIOS en todo componente o pantalla

### Gestos y Feedback Háptico
- Importar `* as Haptics from 'expo-haptics'` (ya instalado)
- `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` — selecciones y taps
- `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` — confirmaciones
- `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)` — errores
- `Haptics.selectionAsync()` — cambios de tab / picker

### Animaciones
- Preferir `withSpring` sobre `withTiming` para elementos de UI (más orgánico en iOS)
- Duración modal/sheet: ~350ms, easing `bezier(0.25, 1, 0.5, 1)`
- `withTiming` para fade y animaciones lineales, ≤300ms
- No superar 400ms en transiciones de UI
---

## Estética de diseño

**Referencia: Apple / Linear.** Todo componente o pantalla debe aspirar a ese nivel de refinamiento visual — profundidad, jerarquía clara, sombras coloreadas con el color de marca, gradientes de acento selectivos. Evitar la estética genérica "material" o plana sin personalidad.