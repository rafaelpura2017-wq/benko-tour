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
2. Reemplaza las reglas con estas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir que usuarios autenticados lean/escriban sus propios datos
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Publica las reglas

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
    ├── nombre: "Juan Pérez"
    ├── email: "juan@email.com"
    ├── telefono: "+57 300 123 4567"
    ├── ciudad: "Bogotá"
    ├── fechaRegistro: timestamp
    ├── ultimoAcceso: timestamp
    ├── reservas: []
    └── preferencias: {
        idioma: "español",
        recogida: "Bocagrande"
    }
```

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
