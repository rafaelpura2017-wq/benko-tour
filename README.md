# Benko Tour

Landing page comercial para turismo cultural en San Basilio de Palenque, con reservas, carrito de tienda, correo operativo y pagos preparados para Wompi y Mercado Pago.

## Estructura

- `index.html`: estructura principal de la landing
- `styles.css`: estilos visuales y responsive
- `script.js`: lógica del formulario, carrito y llamadas al backend
- `config.js`: configuración rápida del frontend
- `backend/server.js`: backend de ejemplo para guardar reservas, guardar pedidos, enviar correo y generar checkout
- `backend/.env.example`: variables necesarias para backend, correo, Wompi y Mercado Pago
- `backend/data/reservations.json`: almacenamiento local simple de reservas
- `backend/data/orders.json`: almacenamiento local simple de pedidos
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
