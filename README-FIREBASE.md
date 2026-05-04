# Configuración de Firebase para Benko Tour

Guía paso a paso para activar el sistema de autenticación de usuarios.

## Paso 1: Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en **"Crear proyecto"**
3. Nombre del proyecto: `Benko Tour`
4. Desactiva Google Analytics (opcional)
5. Haz clic en **"Crear proyecto"**

## Paso 2: Agregar App Web

1. En la página de inicio del proyecto, haz clic en el icono **"</>"** (Web)
2. Registra la app:
   - **Nombre de la app**: `Benko Tour Web`
   - No habilitar Firebase Hosting
3. Haz clic en **"Registrar app"**
4. **Copia el objeto `firebaseConfig`** que aparece

## Paso 3: Configurar Autenticación

1. En el menú lateral, ve a **"Authentication"**
2. Haz clic en **"Comenzar"**
3. Activa **"Correo electrónico/Contraseña"**
4. Guarda la configuración

## Paso 4: Configurar Firestore Database

1. Ve a **"Firestore Database"** en el menú lateral
2. Haz clic en **"Crear base de datos"**
3. Selecciona **"Iniciar en modo de prueba"**
4. Elige la ubicación: `us-central` o `southamerica-east1` (más cercana)
5. Haz clic en **"Activar"**

## Paso 5: Reemplazar Configuración

Abre el archivo `firebase-config.js` y reemplaza estos valores:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY_REAL",
  authDomain: "benkotour.firebaseapp.com",
  projectId: "benkotour",
  storageBucket: "benkotour.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID_REAL",
  appId: "TU_APP_ID_REAL"
};
```

**Los valores los encuentras en:**
1. Firebase Console → Configuración del proyecto → General
2. Sección "Tus apps" → Selecciona la app web creada
3. Copia cada valor y pégalo en `firebase-config.js`

## Paso 6: Configurar Reglas de Seguridad (Importante)

1. Ve a **Firestore Database** → **Reglas**
2. Usa las reglas del archivo [firestore.rules](./firestore.rules)
3. Si prefieres copiar y pegar directo en Firebase, usa este bloque:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function stringBetween(value, min, max) {
      return value is string && value.size() >= min && value.size() <= max;
    }

    function stringMax(value, max) {
      return value is string && value.size() <= max;
    }

    function nonNegativeInt(value, max) {
      return value is int && value >= 0 && value <= max;
    }

    function nonNegativeNumber(value, max) {
      return (value is int || value is float) && value >= 0 && value <= max;
    }

    function oneOf(value, options) {
      return options.hasAny([value]);
    }

    function validReservationMaps() {
      return request.resource.data.cliente is map
        && request.resource.data.resumen is map
        && request.resource.data.seguimiento is map
        && request.resource.data.actividad is map;
    }

    function validReservationRequest(reservationId) {
      return request.resource.data.keys().hasAll([
          'id', 'schemaVersion', 'tipo', 'origen', 'canal', 'referencia', 'estado',
          'nombre', 'email', 'telefono', 'ciudad', 'fecha', 'paquete', 'paqueteNombre',
          'idioma', 'recogida', 'comentarios', 'adultos', 'ninos', 'bebes', 'personas',
          'precioAdulto', 'precioNino', 'precioTotal', 'moneda', 'fechaCreacion',
          'persistencia', 'seguimiento', 'actividad', 'cliente', 'resumen', 'fechaActualizacion'
        ])
        && request.resource.data.id == reservationId
        && request.resource.data.referencia == reservationId
        && request.resource.data.schemaVersion is int
        && request.resource.data.schemaVersion >= 2
        && request.resource.data.tipo == 'reserva-tour'
        && stringBetween(request.resource.data.origen, 3, 60)
        && stringBetween(request.resource.data.canal, 3, 30)
        && oneOf(request.resource.data.estado, ['pendiente', 'recibida', 'confirmada', 'pagada', 'cancelada'])
        && stringBetween(request.resource.data.nombre, 3, 120)
        && stringMax(request.resource.data.email, 160)
        && stringBetween(request.resource.data.telefono, 10, 30)
        && stringMax(request.resource.data.ciudad, 80)
        && stringBetween(request.resource.data.fecha, 8, 40)
        && oneOf(request.resource.data.paquete, ['comunitaria', 'principal', 'premium'])
        && stringBetween(request.resource.data.paqueteNombre, 3, 120)
        && stringBetween(request.resource.data.idioma, 2, 40)
        && stringBetween(request.resource.data.recogida, 3, 160)
        && stringMax(request.resource.data.comentarios, 500)
        && nonNegativeInt(request.resource.data.adultos, 20)
        && nonNegativeInt(request.resource.data.ninos, 10)
        && nonNegativeInt(request.resource.data.bebes, 5)
        && request.resource.data.personas is int
        && request.resource.data.personas >= 1
        && request.resource.data.personas <= 35
        && request.resource.data.personas == request.resource.data.adultos + request.resource.data.ninos + request.resource.data.bebes
        && nonNegativeNumber(request.resource.data.precioAdulto, 10000000)
        && nonNegativeNumber(request.resource.data.precioNino, 5000000)
        && nonNegativeNumber(request.resource.data.precioTotal, 50000000)
        && request.resource.data.moneda == 'COP'
        && request.resource.data.fechaCreacion is timestamp
        && request.resource.data.fechaActualizacion is timestamp
        && oneOf(request.resource.data.persistencia, ['database-public', 'database-account'])
        && validReservationMaps();
    }

    match /usuarios/{userId} {
      allow read, write: if isOwner(userId);
    }

    match /solicitudes_reserva/{reservationId} {
      allow create: if validReservationRequest(reservationId);
      allow read, update, delete: if false;
    }
  }
}
```

4. Publica las reglas
5. Si más adelante quieres un nivel todavía más fuerte contra spam, mueve la creación pública de reservas a una **Cloud Function** o a tu propio backend y deja que el cliente nunca escriba directo en `solicitudes_reserva`.

## Paso 7: Probar la Configuración

1. Abre `acceso.html` en tu navegador
2. Intenta crear una cuenta de prueba
3. Si ves errores en la consola, verifica:
   - Los valores de `firebaseConfig` estén correctos
   - La autenticación por email/password esté activada
   - Las reglas de Firestore permitan escritura

## Estructura de Datos Guardados

Cuando un usuario se registra, se guarda en Firestore:

```
colección: usuarios
  documento: {uid-del-usuario}
    ├── schemaVersion: 2
    ├── nombre: "Juan Pérez"
    ├── email: "juan@email.com"
    ├── telefono: "+57 300 123 4567"
    ├── ciudad: "Bogotá"
    ├── recogida: "Bocagrande"
    ├── fechaRegistro: timestamp
    ├── ultimoAcceso: timestamp
    ├── fechaActualizacion: timestamp
    ├── reservas: [
    │   {
    │     id: "RSV-...",
    │     tipo: "reserva-tour",
    │     estado: "pendiente",
    │     paquete: "principal",
    │     paqueteNombre: "Ruta principal",
    │     fecha: "2026-05-10",
    │     personas: 4,
    │     precioTotal: 1280000,
    │     cliente: {
    │       uid: "...",
    │       nombre: "Juan Pérez",
    │       email: "juan@email.com"
    │     }
    │   }
    │ ]
    ├── compras: []
    ├── carrito: [
    │   {
    │     id: "tambor-alegre",
    │     name: "Tambor alegre artesanal",
    │     price: 395000,
    │     quantity: 1,
    │     total: 395000
    │   }
    │ ]
    ├── carritoResumen: {
    │   items: 1,
    │   units: 1,
    │   total: 395000,
    │   currency: "COP"
    │ }
    ├── estadisticas: {
    │   reservas: 1,
    │   compras: 0
    │ }
    ├── cuenta: {
    │   codigoMiembro: "BENKO-ABC123",
    │   estado: "Pendiente de verificación",
    │   nivel: "Comunidad Benko",
    │   emailVerificado: false
    │ }
    ├── progreso: {
    │   perfilCompleto: 83
    │ }
    └── preferencias: {
        idioma: "español",
        recogida: "Bocagrande"
    }
```

Notas importantes:
- `reservas` ya no se reemplaza completo cada vez: ahora se agregan registros estructurados para evitar perder datos.
- `carrito` se guarda como snapshot limpio con resumen de totales.
- `schemaVersion` ayuda a migrar el modelo de datos sin romper cuentas anteriores.
- `estadisticas`, `progreso` y `cuenta` se recalculan para mantener la cuenta coherente.

## Funciones Disponibles

Después de la configuración, puedes usar estas funciones en cualquier página:

```javascript
// Registrar usuario
await window.authFirebase.registrar(email, password, {
  nombre: "Juan",
  telefono: "+57 300...",
  ciudad: "Cartagena"
});

// Iniciar sesión
await window.authFirebase.login(email, password);

// Cerrar sesión
await window.authFirebase.logout();

// Verificar si hay sesión activa
if (window.authFirebase.estaLogueado()) {
  const datos = await window.authFirebase.obtenerDatos();
  console.log(datos.nombre);
}

// Actualizar datos
await window.authFirebase.actualizarDatos({
  ciudad: "Barranquilla"
});

// Guardar una reserva de forma robusta
await window.authFirebase.guardarReserva({
  nombre: "Juan",
  telefono: "+57 300...",
  fecha: "2026-05-10",
  paquete: "principal",
  paqueteNombre: "Ruta principal",
  personas: 4,
  precioTotal: 1280000
});

// Guardar el carrito del usuario
await window.authFirebase.guardarCarrito([
  { id: "tambor-alegre", name: "Tambor alegre artesanal", price: 395000, quantity: 1 }
]);
```

## Troubleshooting

### Error: "Firebase no está configurado"
- Verifica que los scripts de Firebase estén cargados en el HTML
- Revisa que `firebase-config.js` tenga los valores correctos

### Error: "auth/invalid-api-key"
- El `apiKey` en `firebase-config.js` es incorrecto
- Copia el valor exacto de Firebase Console

### Error: "permission-denied"
- Las reglas de Firestore no permiten escritura
- Usa las reglas del Paso 6
- Si la colección `solicitudes_reserva` no aparece, normalmente el problema es que las reglas aún no permiten `create`

### Usuarios no se guardan en Firestore
- Verifica que Firestore Database esté creada
- Revisa la consola del navegador (F12) para errores

## Seguridad Adicional (Opcional)

Para producción, considera:

1. **Restringir dominios**: 
   - Firebase Console → Authentication → Settings → Authorized domains
   - Agrega tu dominio de GitHub Pages

2. **Activar verificación de email**:
   - Ve a Authentication → Templates → Email address verification
   - Personaliza el correo de verificación

3. **Reglas de Firestore más estrictas**:
   ```javascript
   match /usuarios/{userId} {
     allow create: if request.auth != null && request.auth.uid == userId;
     allow read, update: if request.auth != null && request.auth.uid == userId;
     allow delete: if false; // No permitir eliminar
   }
   ```

## Límites del Plan Gratuito (Spark)

- **Autenticación**: 10,000 usuarios/mes
- **Firestore**: 50,000 lecturas/día, 20,000 escrituras/día
- **Almacenamiento**: 1GB total

Para un sitio de turismo local, estos límites son más que suficientes.

---

**¿Problemas?** Revisa la consola del navegador (F12 → Console) para ver mensajes de error específicos.
