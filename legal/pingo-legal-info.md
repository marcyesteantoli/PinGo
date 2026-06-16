# PinGo — Info para Termly.io

Copia y pega cada campo en el formulario de Termly al generar Privacy Policy y Terms & Conditions.
Sustituye los [ ] con tu información real antes de generar.

---

## BLOQUE 1 — Datos básicos del negocio
*(Termly los pide en el primer paso de cualquier documento)*

| Campo Termly | Valor |
|---|---|
| Business / App name | PinGo |
| Website or app URL | https://pingo.app |
| Type of site | Mobile App |
| Contact email | [TU EMAIL — ej. hola@pingo.app o marcyesteantoli@gmail.com] |
| Business country | Spain |
| Business state / region | [Tu comunidad autónoma — ej. Cataluña] |
| Business address | [Opcional — puedes poner ciudad: Barcelona, España] |

---

## BLOQUE 2 — Datos personales que recoge la app
*(Termly pregunta "What personal data do you collect?" — marca estas opciones)*

- [x] **First and last name** — requerido al registrarse
- [x] **Email address** — requerido para autenticación
- [x] **Profile photo / avatar** — opcional, el usuario la sube
- [x] **Photos and images** — fotos de viajes y recuerdos subidas por el usuario
- [x] **Files and documents** — documentos subidos por el usuario (PDFs, imágenes)
- [x] **Financial information** — gastos de viaje, importes, divisas, divisiones de deuda
- [x] **Location data (manual input)** — ubicaciones de experiencias introducidas manualmente por el usuario (NO rastreo GPS)
- [ ] ~~Precise geolocation~~ — NO, la app NO accede al GPS del dispositivo
- [ ] ~~Device identifiers~~ — NO
- [ ] ~~Usage analytics~~ — NO
- [ ] ~~Cookies~~ — NO (app móvil, no web)

---

## BLOQUE 3 — Cómo se recogen los datos
*(Termly pregunta "How do you collect this data?")*

- [x] **Directly from the user** — el usuario introduce su nombre, email, contraseña y contenido
- [x] **Third-party sign-in (OAuth)** — Apple Sign-In (nombre + email) y Google Sign-In (nombre + email + foto de perfil)
- [ ] ~~Automatically / tracking~~ — NO
- [ ] ~~Purchased from third parties~~ — NO

---

## BLOQUE 4 — Por qué se recogen los datos (purpose)
*(Termly pregunta "Why do you collect personal data?" — marca solo estas)*

- [x] **To provide the service** — la app no funciona sin los datos básicos
- [x] **Account management** — crear y gestionar la cuenta del usuario
- [x] **To enable collaboration** — compartir viajes con otros usuarios
- [ ] ~~Advertising~~ — NO
- [ ] ~~Analytics~~ — NO
- [ ] ~~Marketing~~ — NO
- [ ] ~~Sell to third parties~~ — NO

---

## BLOQUE 5 — Terceros que reciben datos
*(Termly pregunta "Do you share data with third parties?")*

**Sí. Lista de proveedores:**

### Supabase
- **Qué es:** Proveedor de infraestructura (base de datos, autenticación, almacenamiento)
- **Datos que recibe:** Todos los datos del usuario (almacenados en sus servidores)
- **Ubicación servidores:** EU (Europa) o US según configuración del proyecto
- **Privacy Policy Supabase:** https://supabase.com/privacy
- **Relación:** Service provider / Data Processor

### Google Maps / Places API
- **Qué es:** API de Google para autocompletar búsquedas de ubicación
- **Datos que recibe:** Texto de búsqueda de ubicaciones (ej. "Barcelona centro")
- **No recibe:** Datos personales del usuario
- **Privacy Policy Google:** https://policies.google.com/privacy
- **Relación:** Service provider

### Google Sign-In (OAuth)
- **Qué es:** Proveedor de autenticación de Google
- **Datos que recibe:** Nombre y email (solo en el momento del login)
- **Privacy Policy Google:** https://policies.google.com/privacy
- **Relación:** Authentication provider

### Apple Sign-In
- **Qué es:** Proveedor de autenticación de Apple (solo iOS)
- **Datos que recibe:** Nombre y email (solo en el momento del login)
- **Privacy Policy Apple:** https://www.apple.com/legal/privacy
- **Relación:** Authentication provider

---

## BLOQUE 6 — Retención de datos
*(Termly pregunta "How long do you retain personal data?")*

> Los datos se conservan mientras la cuenta del usuario está activa.
> Cuando el usuario elimina su cuenta desde la app:
> - El perfil se anonimiza inmediatamente (nombre y foto eliminados)
> - Los datos personales se borran permanentemente en el siguiente ciclo de purga programado
> - El usuario no puede volver a iniciar sesión una vez solicita la eliminación

---

## BLOQUE 7 — Región de usuarios (compliance)
*(Termly pregunta qué normativas aplican)*

- [x] **GDPR (European Union)** — la app tiene usuarios en la UE y el desarrollador está en España
- [ ] CCPA (California) — solo si prevés usuarios en California (recomendado marcarlo también)
- [ ] COPPA — NO aplica si la edad mínima es 16 años

---

## BLOQUE 8 — Menores de edad
*(Termly pregunta sobre Children's Privacy)*

> PinGo no está dirigida a menores de 16 años.
> No recopilamos conscientemente datos de menores de 16 años.
> Si detectamos que un usuario es menor de 16 años, eliminaremos su cuenta.
> Edad mínima requerida: **16 años**

---

## BLOQUE 9 — Derechos del usuario
*(Termly los incluye automáticamente para GDPR — confirma que estos son correctos)*

- [x] **Derecho de acceso** — el usuario puede ver sus datos en la app
- [x] **Derecho de rectificación** — el usuario puede editar su nombre y foto de perfil en la app
- [x] **Derecho de supresión** — el usuario puede eliminar su cuenta desde Perfil → Gestión de cuenta
- [x] **Derecho de portabilidad** — contacto por email para solicitar exportación
- [x] **Derecho de oposición** — contacto por email

**Email de contacto para ejercer derechos:** [TU EMAIL]

---

## BLOQUE 10 — Cookies
*(Termly pregunta "Do you use cookies?")*

> **No.** PinGo es una aplicación móvil nativa. No utiliza cookies.
> Utiliza almacenamiento local del dispositivo (AsyncStorage) para guardar la sesión y preferencias del usuario, lo cual no es una cookie bajo la definición legal.

---

## BLOQUE 11 — Cambios en la política
*(Termly pregunta cómo notificarás cambios)*

> Los cambios en la Política de Privacidad se notificarán a los usuarios mediante:
> - Notificación dentro de la app en el siguiente inicio de sesión
> - Email a la dirección de correo registrada
> La fecha de "última actualización" se actualizará en el documento.

---

---

# PARA TÉRMINOS Y CONDICIONES

*(Termly tiene un formulario separado para T&C — usa estos datos)*

## T&C Bloque 1 — Descripción del servicio

> PinGo es una aplicación móvil colaborativa para la gestión de viajes.
> Permite a los usuarios crear viajes, organizar itinerarios, centralizar documentación de viaje,
> gestionar gastos compartidos entre viajeros, construir un diario colectivo de recuerdos
> y guardar una lista de deseos personal de lugares y experiencias.

## T&C Bloque 2 — Requisitos de cuenta

- Edad mínima: 16 años
- El usuario es responsable de mantener la confidencialidad de su contraseña
- El usuario es responsable de todo el contenido que sube a la app

## T&C Bloque 3 — Contenido prohibido

> Queda prohibido subir a PinGo:
> - Contenido ilegal o que infrinja derechos de terceros
> - Contenido que infrinja derechos de propiedad intelectual de terceros
> - Contenido que contenga malware, spam o código malicioso
> - Información personal de terceros sin su consentimiento

## T&C Bloque 4 — Propiedad intelectual del contenido del usuario

> El usuario retiene la propiedad de todas las fotos, documentos y contenido que sube a PinGo.
> Al subir contenido, el usuario concede a PinGo una licencia limitada para almacenar
> y mostrar dicho contenido exclusivamente a los colaboradores del viaje correspondiente.
> PinGo no utiliza el contenido del usuario para ningún otro fin.

## T&C Bloque 5 — Limitación de responsabilidad

> PinGo no se responsabiliza de:
> - Pérdida de datos por fallos técnicos (recomendamos conservar copias de documentos importantes)
> - Errores en los cálculos de gastos compartidos derivados de datos introducidos incorrectamente por el usuario
> - Acciones realizadas por otros colaboradores dentro de un viaje compartido
> - Interrupciones del servicio

## T&C Bloque 6 — Terminación

> El usuario puede eliminar su cuenta en cualquier momento desde Perfil → Gestión de cuenta.
> PinGo se reserva el derecho de suspender cuentas que incumplan estos Términos.

## T&C Bloque 7 — Ley aplicable

> Estos Términos se rigen por la legislación española.
> Jurisdicción: España (tribunales de [tu ciudad]).

## T&C Bloque 8 — Contacto

> Para cualquier consulta sobre estos Términos:
> Email: [TU EMAIL]
> Nombre del responsable: [TU NOMBRE COMPLETO]
