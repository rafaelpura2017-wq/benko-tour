# Benko Tour

Landing page comercial para turismo cultural en San Basilio de Palenque, con reservas, carrito de tienda, correo operativo y pagos preparados para Wompi y Mercado Pago.

## Estructura

- `index.html`: estructura principal de la landing
- `acceso.html`: página dedicada para iniciar sesión o crear cuenta
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
