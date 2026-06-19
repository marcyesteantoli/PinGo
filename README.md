# PinGo 📍✈️

**PinGo** es una aplicación móvil colaborativa diseñada para simplificar la gestión y organización de viajes en grupo, sin descuidar la experiencia individual del viajero.

## 🚀 Funcionalidades Principales

### 👥 Viajes en Grupo (Colaborativo)
* **Itinerarios dinámicos (Timeline):** Planificación y organización del viaje día a día con actividades, transporte, alojamiento y restaurantes.
* **Gestión de gastos:** Registro de gastos compartidos con cálculo automático de balances y liquidaciones.
* **Documentación centralizada:** Adjuntos y reservas accesibles por experiencia en un solo lugar.
* **Galería de recuerdos:** Espacio común colaborativo para subir fotos y revivir el viaje.

### 👤 Experiencia Individual (Personal)
* **Mapa de experiencias:** Guarda, organiza y visualiza en el mapa tus lugares favoritos y recomendaciones de viajes anteriores.
* **Lista de deseos (Wishlist):** Planifica tus próximos destinos, restaurantes y actividades pendientes con soporte de mapa.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Expo 54 + React Native 0.81 + Expo Router 6 |
| Lenguaje | TypeScript 5.3 (strict) |
| UI | NativeWind 4 + Tailwind CSS 3.4 |
| Estado / Formularios | TanStack Query 5 + React Hook Form + Zod |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Animaciones | React Native Reanimated 4 + Gesture Handler |
| Mapas | react-native-maps + Supercluster |

---

## Instalación y ejecución

### Requisitos

- Node.js 20+
- Expo Go (dispositivo físico) o simulador iOS / emulador Android

### Instalación

```bash
git clone https://github.com/marcyesteantoli/PinGo.git
cd PinGo
npm install
```

### Variables de entorno

Las credenciales del proyecto están incluidas en `.env.example`. No es necesario crear una cuenta de Supabase ni configurar claves de API, solo pasarlas al archivo .env.local

```bash
cp .env.example .env.local
```

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor de desarrollo |
| `npm run ios` | Abre en simulador iOS |
| `npm run android` | Abre en emulador Android |
| `npm run lint` | Ejecuta ESLint |
| `npm run type-check` | Comprueba tipos TypeScript sin compilar |
| `npm run supabase:types` | Regenera tipos desde el esquema de Supabase |

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

## Usuario de prueba

| Campo | Valor |
|-------|-------|
| Email | usertest@pingotest.app |
| Contraseña | Test1234! |
