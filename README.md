# Benko Tour

Landing page comercial para turismo cultural en San Basilio de Palenque, con reservas, carrito de tienda, correo operativo y pagos preparados para Wompi y Mercado Pago.

## Estructura

- `index.html`: estructura principal de la landing
- `acceso.html`: página dedicada para iniciar sesión o crear cuenta
- `lengua-palenquera.html`: página principal de lengua (diccionario + traductor)
- `lengua-app.html`: app educativa de lengua con sesión gratis y sesión premium
- `app-lengua/`: app independiente tipo producto móvil (PWA) enfocada solo en aprendizaje de lengua palenquera
- `styles.css`: estilos visuales y responsive
- `script.js`: lógica del formulario, carrito y llamadas al backend
- `config.js`: configuración rápida del frontend
- `assets/images/products/`: fotos reales de tienda y placeholders listos para reemplazo
- `assets/images/brand/`: logos, favicon y piezas de marca propias
- `assets/images/experience/`: fotos del tour, comunidad y experiencia cultural
- `backend/server.js`: backend de ejemplo para guardar reservas, guardar pedidos, enviar correo y generar checkout
- `backend/.env.example`: variables necesarias para backend, correo, Wompi y Mercado Pago
- `backend/data/reservations.json`: almacenamiento local simple de reservas
- `backend/data/orders.json`: almacenamiento local simple de pedidos
- `backend/data/access-users.json`: almacenamiento local simple de registros creados desde acceso
- `benko-tour-optimizado.html`: versión previa de referencia

## Cómo abrir el frontend

1. Abre esta carpeta en Visual Studio Code.
2. Abre `index.html`.
3. Si tienes Live Server, ejecuta `Open with Live Server`.

## Modo app (PWA)

La web ya está preparada para instalarse como app en móvil o escritorio.

- `manifest.webmanifest`: define nombre, iconos, color y accesos rápidos.
- `service-worker.js`: activa caché base para carga más rápida y soporte offline parcial.
- Iconos PWA:
  - `assets/images/brand/pwa-icon-192.png`
  - `assets/images/brand/pwa-icon-512.png`
  - `assets/images/brand/apple-touch-icon-180.png`

Para probar localmente:

```bash
py -m http.server 5500
```

Luego abre `http://localhost:5500/index.html`.

Importante: para instalar y probar login social, no abras el HTML con `file://`; úsalo desde `localhost` o dominio HTTPS.

## App de lengua (gratis + premium)

- URL local: `http://localhost:5500/lengua-app.html`
- Ruta gratis: lecciones base + mini quiz + progreso local.
- Ruta premium: requiere sesión activa + verificación en Firestore.
- Estado premium real se lee en: `membresias_lengua/{uid}` (solo lectura para cliente).
- Solicitudes de revisión premium se crean en: `solicitudes_membresia_lengua/{requestId}`.
- Pagos premium usan los mismos endpoints configurados en `config.js`:
  - `payments.wompi.checkoutEndpoint`
  - `payments.mercadopago.preferenceEndpoint`

Para activar premium de forma automática después de pago:
1. Confirmar pago en tu flujo operativo.
2. Escribir/actualizar `membresias_lengua/{uid}` con `estado: "activa"` (o `pagada`/`vigente`).
3. El usuario pulsa **Verificar acceso** en `lengua-app.html` y se desbloquea sin código manual.

## App independiente (modo producto)

- URL local: `http://localhost:5500/app-lengua/index.html`
- Archivos base:
  - `app-lengua/index.html`
  - `app-lengua/app.css`
  - `app-lengua/app.js`
  - `app-lengua/lessons-data.js`
  - `app-lengua/manifest.webmanifest`
  - `app-lengua/sw.js`
- Objetivo: separar la experiencia de la landing y trabajarla como aplicación profesional de aprendizaje (móvil primero, PWA instalable, progreso gamificado, premium validado con Firebase).

## Publicación en Google Play (checklist)

Checklist recomendado para lanzar `app-lengua` de forma profesional para usuarios finales:

1. **Dominio y seguridad**
   - [ ] Publicar la app en URL HTTPS estable (no IP local).
   - [ ] Confirmar que `manifest.webmanifest` y `sw.js` cargan sin errores.
   - [ ] Verificar PWA en móvil (instalar, abrir offline parcial, navegación por tabs).

2. **Políticas y contenido legal**
   - [ ] Crear página de Política de Privacidad pública (URL accesible).
   - [ ] Definir correo de soporte para usuarios.
   - [ ] Preparar texto de manejo de datos (auth, progreso, premium, pagos).

3. **Cuenta y ficha en Play Console**
   - [ ] Crear app en Google Play Console (idioma ES, categoría Educación).
   - [ ] Completar nombre, descripción corta y descripción completa.
   - [ ] Cargar ícono 512x512, feature graphic y capturas (móvil + tablet).
   - [ ] Completar clasificación de contenido y formulario de seguridad de datos.

4. **Build Android (AAB/APK)**
   - [ ] Elegir estrategia:
     - PWA empaquetada (TWA/WebView) para publicar rápido.
     - Flutter/Android nativo si deseas más control offline/performance.
   - [ ] Generar **AAB firmado** para subida a Play.
   - [ ] Guardar keystore y credenciales de firma en lugar seguro.

5. **Pruebas antes de publicar**
   - [ ] Subir primero a **Internal testing** (equipo).
   - [ ] Validar login social, premium y navegación completa en Android real.
   - [ ] Revisar tiempos de carga, errores de consola y permisos.

6. **Salida a producción**
   - [ ] Publicar en **Closed testing** (grupo de usuarios).
   - [ ] Ajustar texto/UX según feedback.
   - [ ] Lanzar a **Production** y activar monitoreo de crashes/reseñas.

### Configuración de botones Play Store / APK en esta app

En `config.js` y `app-lengua/config.js`:

```js
languageApp: {
  distribution: {
    playStoreUrl: "",         // URL final de Google Play
    apkUrl: "",               // URL de descarga APK (opcional/beta)
    apkLabel: "Descargar APK (beta)",
    showApkOnDesktop: false   // true solo si también quieres mostrar APK en PC
  }
}
```

Cuando `playStoreUrl` tenga valor, aparecerá el botón **Google Play** en `app-lengua`.

## Cómo correr el backend

1. Entra a la carpeta `backend`
2. Instala dependencias:

```bash
npm install
```

3. Crea un archivo `.env` copiando `backend/.env.example`
4. Completa tus credenciales reales
5. Inicia el servidor:

```bash
npm run dev
```

Por defecto quedará en `http://localhost:8787`.

## Qué hace el backend

- `POST /api/reservations`
  Guarda reservas en `backend/data/reservations.json`
- `POST /api/orders`
  Guarda pedidos de tienda en `backend/data/orders.json`
- `POST /api/access/users`
  Guarda nuevos registros de acceso en `backend/data/access-users.json`
- `POST /api/payments/wompi/checkout`
  Genera la información necesaria para abrir Wompi Checkout Web
- `POST /api/payments/mercadopago/preference`
  Crea una preferencia de pago de Mercado Pago y devuelve el checkout
- `GET /api/health`
  Verificación simple del servidor

## Qué debes configurar

### Frontend

En `config.js`:

- `channels.reservationApiUrl`
- `channels.orderApiUrl`
- `channels.accessApiUrl`
- `channels.reservationEmail`
- `payments.wompi.checkoutEndpoint`
- `payments.mercadopago.preferenceEndpoint`

### Backend

En `backend/.env`:

- `BENKO_RESERVATION_EMAIL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `WOMPI_PUBLIC_KEY`
- `WOMPI_INTEGRITY_SECRET`
- `WOMPI_REDIRECT_URL`
- `MP_ACCESS_TOKEN`
- `MP_SUCCESS_URL`
- `MP_FAILURE_URL`
- `MP_PENDING_URL`

## Flujo de pago implementado

### Wompi

El backend genera la firma de integridad y devuelve los campos que el frontend envía al Checkout Web.

### Mercado Pago

El backend crea una preferencia de pago y el frontend abre el `init_point` devuelto por Mercado Pago.

## Correo operativo

Si llenas las variables SMTP, el backend enviará copia de reservas y pedidos al correo operativo que definas en `BENKO_RESERVATION_EMAIL`.

## Recomendaciones antes de publicar

- reemplazar testimonios de muestra por testimonios reales
- cambiar imágenes genéricas por fotos reales del proyecto
- agregar correo del cliente en el formulario si quieres comprobantes más completos
- conectar dominio propio
- agregar analítica
- montar respaldo en base de datos real si luego creces más

## Mantenimiento visual de tienda

- Guarda las fotos reales de producto en `assets/images/products/`
- Usa formato `webp` cuando puedas, con proporción recomendada `4:3`
- Mantén estos nombres para reemplazo directo:
  - `assets/images/products/camiseta-benko.webp`
  - `assets/images/products/tambor-alegre.webp`
  - `assets/images/products/mochila-artesanal.webp`
  - `assets/images/products/dulces-tipicos.webp`
- Cuando exista una foto real, reemplaza el bloque `benko-tour__product-media--placeholder` por `benko-tour__product-media--real` con una etiqueta `<img loading="lazy" decoding="async">`
- Escribe textos `alt` descriptivos del producto real y evita imágenes genéricas o de stock para la tienda
