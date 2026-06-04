# TripSync — Estrategia de Monetización

## Modelo: Freemium + Per-Trip Unlock

**Decisión:** Sin ads. Freemium con subscription mensual/anual + pago único por viaje premium.

**Razón:** Ads destruyen estética iOS HIG. App colaborativa = fricción se multiplica por N colaboradores. Categoría (Wanderlog Pro, TripIt Pro) es ad-free premium.

---

## Límites Free vs Premium

| Módulo | Límite Free | Límite Premium | Notas |
|---|---|---|---|
| Viajes activos/futuros | 3 | Ilimitados | Pasados: siempre accesibles read-only (no penalizar lealtad) |
| Colaboradores/viaje | 3 personas | Ilimitados | **Palanca más potente** — convierte al añadir 4º amigo |
| Fotos (recuerdos) | 50 por viaje | 150 por viaje | Ver §Modelo de Memories para la lógica completa |
| Documentos | 3 por viaje | Ilimitados | 3 fuerza conversión antes |
| Wishlist items | 20 items | Ilimitados | Suficiente para probar, poco para uso real |
| Categorías de gasto custom | Solo categorías base | Custom ilimitadas | Viajeros frecuentes quieren personalizar |
| Multi-divisa en gastos | 1 divisa | Ilimitadas | Internacional siempre lo necesita |
| Export PDF (itinerario/gastos) | ❌ nunca free | ✅ | Feature clara de valor, convierte bien |

---

## Modelo de Memories (Fotos)

### Límites
- **Soft cap (free):** 50 fotos por viaje — usuarios sin premium no pueden subir la foto 51+
- **Hard cap (todos):** 150 fotos por viaje — nadie puede superar este límite, enforced con DB trigger
- La **visualización es siempre libre** — todos los colaboradores ven todas las fotos sin restricción

### Quién puede subir fotos 51–150

| Situación | ¿Puede subir 51–150? |
|---|---|
| Usuario free, viaje NO premium | ❌ |
| Usuario premium (Pro o trip_unlock), viaje NO premium | ✅ |
| Usuario free, viaje ES premium | ✅ |
| Usuario premium, viaje ES premium | ✅ |

**Viaje premium** = algún colaborador tiene `trip_unlock` para ese viaje O tiene subscripción Pro activa.  
Cuando el viaje es premium, **todos los colaboradores** (incluidos free) pueden subir hasta 150.

### Lógica de código
```
canExceedSoftCap = isUserPremium || isTripPremium
```
- `isUserPremium` → hook `useTripPremium(tripId)` — chequea el usuario actual
- `isTripPremium` → hook `useTripSharedPremium(tripId)` — chequea si ALGÚN colaborador es premium

### Implementación
- `src/config/limits.ts`: `MAX_PHOTOS_PER_TRIP = 50`, `PREMIUM_MAX_PHOTOS_PER_TRIP = 150`
- `supabase/migrations/20260603000003_memories_hard_cap.sql`: trigger DB para hard cap
- `src/features/premium/hooks/useTripSharedPremium.ts`: hook de viaje compartido premium
- `src/features/memories/hooks/useAddMemory.ts`: recibe `isPremium` (= `canExceedSoftCap`) y aplica lógica

### Rationale
Memories es un álbum compartido — restringir la visualización por usuario no tiene sentido semántico ("¿qué 50 fotos de las 100 ve el usuario free?"). El gate vive únicamente en el upload. El modelo cooperativo (un pago desbloquea para el grupo) crea dinámica social positiva de conversión.

---

## Pricing

| Plan | Precio | Notas |
|---|---|---|
| Trip Unlock | €1.99–2.99 pago único | Sin límites en ese viaje |
| Pro mensual | ~€4.99/mes | |
| Pro anual | ~€34.99/año | ~30% descuento vs mensual, mejora LTV |

---

## Roadmap por Fases

| Fase | Cuándo | Acción |
|---|---|---|
| Launch | Ahora | Free only. Sin ads. Sin paywall. Construir datos. |
| Mes 2 | Post-launch | Analytics: dónde chocan usuarios con límites |
| Mes 3–4 | ~100 MAU | Implementar freemium en friction points que datos revelen |
| Mes 4–6 | ~500 MAU | Afiliados — Viator primero, Booking.com segundo |
| Mes 8+ | Según tracción | Per-trip unlock, push anual, multi-currency gating |

---

## Afiliados — Cuándo y Cómo

Delay hasta ~500 MAU. Razones: thresholds de aprobación, datos de journey del usuario necesarios, early adopters son los más sensibles.

**Prioridad:** Viator > Booking.com > Skyscanner.

**Integración:** Contextual only ("Este restaurante está guardado — ¿quieres reservarlo?"), nunca CTA primaria. Viator encaja directo con entidad `Experience`.
