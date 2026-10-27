# 🎾 Pádel Master – Gestor de Torneos

Plataforma gratuita con **3 links distintos**:

| Archivo | Para quién | Qué hace |
|---|---|---|
| `index.html` | Jugadores | Horarios, resultados, posiciones y llaves **en vivo**. No tiene ningún botón ni acceso de admin. |
| `inscripcion.html` | Quien no puede ir al club | Formulario de inscripción. Guarda la pareja y avisa por WhatsApp al dueño. |
| `admin.html` | Solo el dueño | Login con email y contraseña reales. Carga de resultados, sorteos, inscripciones. |

## Estructura de carpetas

```
padel-master/
├── index.html          ← link de jugadores
├── inscripcion.html    ← link de inscripción
├── admin.html          ← panel del dueño (NO compartir)
├── firestore.rules     ← reglas de seguridad de la base de datos
├── css/
│   └── styles.css
└── js/
    ├── config.js       ← ÚNICO archivo que tenés que completar
    ├── tailwind.config.js
    ├── utils.js
    ├── db.js           ← base de datos (Firebase / modo demo)
    ├── logic.js        ← posiciones
    ├── sorteo.js       ← sorteos de zonas y llaves
    ├── shell.js        ← diseño compartido
    ├── app.js          ← fixture, posiciones, llaves, buscador
    ├── public.js       ← arranque de index.html
    ├── inscripcion.js  ← arranque de inscripcion.html
    └── admin.js        ← arranque y acciones del panel
```

---

## PASO 1 · Probarlo en tu computadora (sin configurar nada)

1. Instalá **Visual Studio Code** y la extensión **Live Server** (de Ritwick Dey).
2. Abrí la carpeta `padel-master` en VS Code (Archivo → Abrir carpeta).
3. Clic derecho sobre `index.html` → **Open with Live Server**.
4. Probá `admin.html` de la misma forma. En **modo demo** entrás con cualquier email y la contraseña **1234**.

> En modo demo los datos viven solo en tu navegador. Abrí `admin.html` e `index.html` en dos pestañas y vas a ver que se actualizan solas.

---

## PASO 2 · Crear la base de datos gratis (Firebase)

1. Entrá a <https://console.firebase.google.com> con tu cuenta de Google → **Agregar proyecto** (poné un nombre; podés desactivar Google Analytics).
2. En la pantalla principal tocá el ícono **`</>` (Web)** → poné un apodo → **Registrar app**. Te muestra un bloque `firebaseConfig`. **Copiá esos valores en `js/config.js`** (apiKey, authDomain, projectId, etc.).
3. Menú **Compilación → Firestore Database → Crear base de datos** → ubicación `southamerica-east1` (São Paulo) → **modo producción**.
4. En Firestore, pestaña **Reglas**: borrá lo que hay, pegá el contenido de `firestore.rules`, **cambiá `dueno@tuclub.com` por tu email real** y tocá **Publicar**.
5. Menú **Compilación → Authentication → Comenzar → Correo electrónico/contraseña → Habilitar**.
6. En Authentication → pestaña **Usuarios → Agregar usuario**: el email y contraseña del dueño. (Esta es la clave del panel; elegí una fuerte.)
7. En `js/config.js` completá también:
   - `adminEmail`: el mismo email del paso anterior.
   - `whatsappDueno`: ej. `5493704123456` (549 + código de área sin 0 + número sin 15).

El plan gratuito (Spark) alcanza de sobra para un club.

---

## PASO 3 · Publicarlo gratis (GitHub Pages)

1. Creá cuenta en <https://github.com> → **New repository** (público) → por ejemplo `torneo-padel`.
2. **Add file → Upload files** → arrastrá **todo el contenido** de la carpeta (con `css` y `js`) → **Commit**.
3. **Settings → Pages → Branch: main / (root) → Save**. En 1–2 minutos queda en:
   `https://TU-USUARIO.github.io/torneo-padel/`
4. **Importante:** en Firebase → Authentication → **Configuración → Dominios autorizados** → agregá `TU-USUARIO.github.io`.

Tus links finales:

- Jugadores: `https://TU-USUARIO.github.io/torneo-padel/index.html`
- Inscripción: `https://TU-USUARIO.github.io/torneo-padel/inscripcion.html`
- Dueño (privado, guardalo en favoritos): `https://TU-USUARIO.github.io/torneo-padel/admin.html`

Alternativas igual de gratis: **Netlify Drop** (arrastrás la carpeta en <https://app.netlify.com/drop>) o **Vercel**.

---

## Cómo se usa (flujo del torneo)

1. **Inscripciones:** los jugadores se anotan por el link o vos los cargás en *Inscriptos → Inscribir*. Las que llegan por link aparecen como **PENDIENTE** (con aviso 🔔 y contador); las confirmás con un toque.
2. **Sorteo → Sortear zonas** (por categoría y rama: Caballeros / Damas / Mixto). Arma las zonas al azar y todos los partidos de la fase de grupos.
3. **Horarios:** en *Horarios & Fixture* tocá el ícono del reloj de cada partido y poné día, hora y cancha.
4. **Cargar resultados:** botón *Cargar* en cada partido. Los jugadores lo ven al instante en su link.
5. **Sorteo → Generar llave:** toma los 2 primeros de cada zona y arma octavos / cuartos / semifinal / final (según cuántos clasifiquen; con cantidades impares asigna pases directos y evita cruces de la misma zona).
6. Al cargar el resultado de cada partido de la llave, **el ganador pasa solo** a la siguiente instancia.
7. *Eliminación directa* hace una llave al azar sin zonas.

## Seguridad

- El `admin.html` no está enlazado desde ningún lado y usa **login real**. No hay PIN en la URL.
- La seguridad real está en `firestore.rules`: aunque alguien adivine la dirección del panel, **no puede escribir** sin la cuenta del dueño.
- Los teléfonos de los jugadores **solo los lee el dueño**.
- No compartas nunca el link de `admin.html`.

## Sobre el WhatsApp automático

La pareja queda guardada en la base de datos **automáticamente**. El aviso a tu WhatsApp se abre **ya redactado** al terminar la inscripción (y hay un botón por si el celular lo bloquea); la persona solo toca "Enviar". Un envío 100 % automático sin que nadie toque nada requiere la API de WhatsApp Business (de pago) o un servicio intermedio; se puede sumar más adelante.
