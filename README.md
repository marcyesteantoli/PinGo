# PinGo 📍✈️

**PinGo** es una aplicación móvil colaborativa para la gestión integral de viajes en grupo. Centraliza en un único espacio todo lo que un grupo de viajeros necesita: planificación del itinerario, control de gastos compartidos, documentación del viaje y una galería de recuerdos colectiva — eliminando la fragmentación habitual entre chats, hojas de cálculo y carpetas dispersas.

Más allá del viaje en curso, PinGo también cuida la experiencia individual: permite guardar y visualizar en el mapa los lugares favoritos de viajes anteriores, y construir una lista de deseos personal con destinos, restaurantes y actividades pendientes.


## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Expo 54 + React Native 0.81 + Expo Router 6 |
| Lenguaje | TypeScript 5.3 (strict) |
| UI | NativeWind 4 + Tailwind CSS 3.4 |
| Estado / Formularios | TanStack Query 5 + React Hook Form + Zod |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Animaciones | React Native Reanimated 4 + Gesture Handler |
| Mapas | react-native-maps + Supercluster |
| Internacionalización | i18next + react-i18next (6 idiomas) |
| Suscripciones | RevenueCat SDK |
| Monitorización | Sentry React Native SDK |

---

## Servicios externos

### RevenueCat
Gestión de suscripciones in-app (iOS + Android). Ofrece planes mensual, anual y lifetime. Al completar una compra, un webhook de RevenueCat actualiza el campo en Supabase para reflejar el estado Pro en tiempo real.

### Sentry
Monitorización de errores y crashes en producción. Captura stack traces, sesiones de usuario y contexto de autenticación. Activo únicamente en builds de producción.

### Google Places API (New)
Autocompletado de ubicaciones al añadir experiencias al timeline. Usa session tokens para optimizar el coste de billing. Extrae coordenadas, nombre y localidad del lugar seleccionado.

### Google Maps
Visualización de mapas interactivos con marcadores personalizados y clustering de puntos mediante `supercluster`. Presente en saved experiences, wishlist y detalle de experiencia.

### Google Sign-In / Apple Sign-In
Autenticación OAuth nativa. El token obtenido se intercambia con Supabase Auth para crear la sesión. Apple Sign-In disponible exclusivamente en iOS.

### Supabase
Backend completo del proyecto:
- **Auth** — email/contraseña + OAuth (Google, Apple)
- **PostgreSQL + RLS** — acceso a datos restringido por pertenencia al viaje (`trip_collaborators`) y por `user_id`
- **Storage** — bucket `memories` (público, máx. 5 MB) y bucket `documents` (privado, máx. 20 MB con URLs firmadas)
- **Edge Functions (Deno):** `send-notification`, `revenuecat-webhook`, `schedule-trip-reminders` (cron diario 06:00 UTC), `flush-notification-batch`

### Expo Push Notifications
Tokens de dispositivo registrados en Supabase. Las notificaciones se envían desde las Edge Functions de Supabase e incluyen deep links que abren directamente la sección correspondiente del viaje (gasto, experiencia, recuerdo).

---

## Instalación y ejecución

> **Nota:** La app utiliza módulos nativos (notificaciones, almacenamiento seguro, mapas, autenticación con Google/Apple, etc.) que son incompatibles con Expo Go. Se requiere una build nativa.

---

El APK está disponible en [GitHub Releases](https://github.com/marcyesteantoli/PinGo/releases/latest) — descarga directa sin necesidad de cuenta.

### Opción A — Dispositivo Android físico

**Requisitos:** dispositivo Android 10+ con "Fuentes desconocidas" activado en Ajustes → Seguridad.

1. Descargar el APK desde [GitHub Releases](https://github.com/marcyesteantoli/PinGo/releases/latest).
2. Abrir el archivo `.apk` en el dispositivo e instalar.
3. Iniciar sesión con el usuario de prueba (ver sección [Usuario de prueba](#usuario-de-prueba)).

---

### Opción B — Emulador Android (sin dispositivo físico)

**Requisitos:** [Android Studio](https://developer.android.com/studio) instalado con un AVD (Android Virtual Device) configurado.

1. Descargar el APK desde [GitHub Releases](https://github.com/marcyesteantoli/PinGo/releases/latest).
2. Abrir Android Studio → abre el AVD Manager (icono de dispositivo en la barra superior) y arranca un emulador.
3. Arrastrar el archivo `.apk` sobre la ventana del emulador — se instala automáticamente.
4. Iniciar sesión con el usuario de prueba (ver sección [Usuario de prueba](#usuario-de-prueba)).

---

## Estructura del proyecto
El proyecto utiliza una arquitectura híbrida basada en **rutas por archivos** (Expo Router) y organización **por módulos/dominios** (*feature-based*) dentro de `src/`.
```
app/                    # Rutas y navegación (Expo Router)
├── (auth)/             # Flujo de autenticación (Login y registro)
└── (app)/
├── (tabs)/         # Tabs principales (Viajes, Wishlist, Guardados)
├── trips/[id]/     # Detalle del viaje (Timeline, Gastos, Documentos, Recuerdos)
├── saved-experiences/
└── wishlist/

src/
├── features/           # Módulos por dominio aislado (ver detalle abajo)
├── components/         # Componentes globales y reutilizables de la UI
├── lib/                # Clientes de API, query keys y utilidades compartidas
├── types/              # Tipos globales y tipos autogenerados de Supabase
└── utils/              # Helpers genéricos (fechas, monedas, formato de imágenes)

supabase/
└── migrations/         # Esquema de base de datos, políticas RLS y Storage buckets
```

### Anatomía de una Feature

Cada módulo dentro de `src/features/` es autónomo y sigue esta estructura interna:

```
features/<nombre>/
├── hooks/       # useQuery / useMutation específicos del dominio
├── components/  # Componentes visuales del módulo
└── types.ts     # Tipos del dominio
```

Módulos disponibles: `auth` · `trips` · `timeline` · `expenses` · `documents` · `memories` · `wishlist` · `saved` · `onboarding`

---

## 🚀 Funcionalidades Principales

### 👥 Viajes en Grupo (Colaborativo)
* **Itinerarios dinámicos (Timeline):** Planificación y organización del viaje día a día con actividades, transporte, alojamiento y restaurantes. Incluye valoración de experiencias (1-10) con atributos específicos por tipo (confort, calidad, etc.) y exportación del itinerario a PDF.
* **Gestión de gastos:** Registro de gastos compartidos con cálculo automático de balances y liquidaciones entre participantes.
* **Documentación centralizada:** Adjuntos (PDF, imágenes) y reservas accesibles por experiencia. Soporta compartir documentos directamente desde otras apps (correo, navegador…) mediante Share Intent.
* **Galería de recuerdos:** Espacio colaborativo para subir fotos con pie de foto y revivir el viaje.
* **Notificaciones push:** Alertas automáticas a los miembros del viaje ante eventos relevantes (nuevo gasto, nuevo miembro, memoria subida, recordatorios de viaje próximo o en curso con deudas pendientes).

### 👤 Experiencia Individual (Personal)
* **Mapa de experiencias guardadas:** Guarda, organiza y visualiza en el mapa tus lugares favoritos y recomendaciones de viajes anteriores.
* **Lista de deseos (Wishlist):** Planifica tus próximos destinos, restaurantes y actividades pendientes con soporte de mapa y filtros por tipo.

### 🌍 Transversal
* **Internacionalización:** Interfaz disponible en 6 idiomas: español, inglés, alemán, francés, italiano y portugués.

---

## Recursos

| | |
|---|---|
| 📊 Presentación TFM | [Ver presentación](https://drive.google.com/file/d/1YLdASxtIepMr6HtHkxXb7BlLRbbYf5QQ/view?usp=sharing) |
| 🎬 Demo en vídeo | *Próximamente* |
| 📦 Descargar APK | [GitHub Releases](https://github.com/marcyesteantoli/PinGo/releases/latest) |


## Usuario de prueba

| Campo | Valor |
|-------|-------|
| Email | usertest@pingotest.app |
| Contraseña | Test1234! |
