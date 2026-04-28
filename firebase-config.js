/**
 * Configuración de Firebase para Benko Tour
 * 
 * INSTRUCCIONES DE CONFIGURACIÓN:
 * 1. Ve a https://console.firebase.google.com/
 * 2. Crea un nuevo proyecto llamado "Benko Tour"
 * 3. En la sección "Autenticación", activa "Email/Password"
 * 4. En "Firestore Database", crea una base de datos en modo prueba
 * 5. Ve a Configuración del proyecto > General > Tus apps > Web
 * 6. Copia los valores de firebaseConfig y reemplaza los de abajo
 */

// Configuración de Firebase - ACTIVADA
const firebaseConfig = {
  apiKey: "AIzaSyCgjZ6q9rk5k65HxreQ5vekIYebiCv4Tlk",
  authDomain: "benko-tour.firebaseapp.com",
  projectId: "benko-tour",
  storageBucket: "benko-tour.firebasestorage.app",
  messagingSenderId: "179919843386",
  appId: "1:179919843386:web:37d887ee1972ba98c48503"
};

// Variable global para Firebase
let auth;
let db;
let currentUser = null;

// Inicializar Firebase
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si Firebase está disponible
  if (typeof firebase !== 'undefined') {
    try {
      // Inicializar la app
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      
      auth = firebase.auth();
      db = firebase.firestore();
      
      // Escuchar cambios de autenticación
      auth.onAuthStateChanged(function(user) {
        currentUser = user;
        actualizarUIUsuario(user);
      });
      
      console.log('Firebase inicializado correctamente');
    } catch (error) {
      console.error('Error al inicializar Firebase:', error);
    }
  } else {
    console.warn('Firebase no está cargado. Verifica que los scripts estén incluidos.');
  }
});

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Registrar nuevo usuario
 * @param {string} email - Correo electrónico
 * @param {string} password - Contraseña (mínimo 6 caracteres)
 * @param {object} datos - Datos adicionales del usuario
 */
async function registrarUsuario(email, password, datos = {}) {
  try {
    // Crear usuario en Authentication
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Guardar datos adicionales en Firestore
    await db.collection('usuarios').doc(user.uid).set({
      nombre: datos.nombre || '',
      telefono: datos.telefono || '',
      ciudad: datos.ciudad || '',
      email: email,
      fechaRegistro: firebase.firestore.FieldValue.serverTimestamp(),
      ultimoAcceso: firebase.firestore.FieldValue.serverTimestamp(),
      reservas: [],
      preferencias: {
        idioma: datos.idioma || 'español',
        recogida: datos.recogida || 'Bocagrande'
      }
    });
    
    return { 
      success: true, 
      user: user, 
      mensaje: 'Usuario registrado exitosamente' 
    };
    
  } catch (error) {
    console.error('Error en registro:', error);
    return { 
      success: false, 
      error: traducirErrorFirebase(error.code) 
    };
  }
}

/**
 * Iniciar sesión
 * @param {string} email - Correo electrónico
 * @param {string} password - Contraseña
 */
async function iniciarSesion(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Actualizar último acceso
    await db.collection('usuarios').doc(user.uid).update({
      ultimoAcceso: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Obtener datos completos del usuario
    const doc = await db.collection('usuarios').doc(user.uid).get();
    const datosUsuario = doc.data();
    
    return { 
      success: true, 
      user: user, 
      datos: datosUsuario,
      mensaje: 'Sesión iniciada correctamente'
    };
    
  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    return { 
      success: false, 
      error: traducirErrorFirebase(error.code) 
    };
  }
}

/**
 * Cerrar sesión
 */
async function cerrarSesion() {
  try {
    await auth.signOut();
    return { success: true, mensaje: 'Sesión cerrada' };
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Restablecer contraseña
 * @param {string} email - Correo electrónico
 */
async function restablecerPassword(email) {
  try {
    await auth.sendPasswordResetEmail(email);
    return { 
      success: true, 
      mensaje: 'Se ha enviado un enlace para restablecer tu contraseña a tu correo' 
    };
  } catch (error) {
    console.error('Error al restablecer password:', error);
    return { 
      success: false, 
      error: traducirErrorFirebase(error.code) 
    };
  }
}

/**
 * Obtener datos del usuario actual
 */
async function obtenerDatosUsuario() {
  if (!currentUser) return null;
  
  try {
    const doc = await db.collection('usuarios').doc(currentUser.uid).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('Error al obtener datos:', error);
    return null;
  }
}

/**
 * Actualizar datos del usuario
 * @param {object} datos - Datos a actualizar
 */
async function actualizarDatosUsuario(datos) {
  if (!currentUser) {
    return { success: false, error: 'No hay sesión activa' };
  }
  
  try {
    await db.collection('usuarios').doc(currentUser.uid).update({
      ...datos,
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, mensaje: 'Datos actualizados' };
  } catch (error) {
    console.error('Error al actualizar:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Traducir errores de Firebase a español
 */
function traducirErrorFirebase(codigo) {
  const errores = {
    'auth/email-already-in-use': 'Este correo ya está registrado. Intenta iniciar sesión.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/user-not-found': 'No existe una cuenta con este correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Credenciales inválidas. Verifica tu correo y contraseña.',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
    'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
    'auth/requires-recent-login': 'Por seguridad, vuelve a iniciar sesión.'
  };
  
  return errores[codigo] || 'Ha ocurrido un error. Intenta de nuevo.';
}

/**
 * Verificar si hay sesión activa
 */
function usuarioLogueado() {
  return currentUser !== null;
}

/**
 * Obtener el usuario actual
 */
function obtenerUsuarioActual() {
  return currentUser;
}

/**
 * Actualizar UI según estado de autenticación
 * Esta función puede ser personalizada en cada página
 */
function actualizarUIUsuario(user) {
  // Buscar elementos con IDs (nuevo sistema)
  const loginLink = document.getElementById('login-link');
  const userMenu = document.getElementById('user-menu');
  const logoutBtn = document.getElementById('logout-btn');
  const userName = document.getElementById('user-name-display');
  
  // Buscar elementos con clases (sistema antiguo, para compatibilidad)
  const loginLinkOld = document.querySelector('.benko-tour__login:not([id])');
  const logoutBtnOld = document.querySelector('.benko-tour__logout');
  const userNameOld = document.querySelector('.benko-tour__user-name:not([id])');
  
  if (user) {
    // Usuario logueado
    // Sistema nuevo con IDs
    if (loginLink) loginLink.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        await cerrarSesion();
        window.location.reload();
      };
    }
    
    // Sistema antiguo con clases
    if (loginLinkOld) loginLinkOld.style.display = 'none';
    if (logoutBtnOld) {
      logoutBtnOld.style.display = 'flex';
      logoutBtnOld.onclick = async () => {
        await cerrarSesion();
        window.location.reload();
      };
    }
    
    // Obtener y mostrar nombre del usuario
    obtenerDatosUsuario().then(datos => {
      const displayName = datos?.nombre || user.email?.split('@')[0] || 'Usuario';
      
      if (userName) {
        userName.textContent = displayName;
      }
      if (userNameOld) {
        userNameOld.textContent = `Hola, ${displayName}`;
        userNameOld.style.display = 'inline';
      }
    });
    
  } else {
    // Usuario no logueado
    // Sistema nuevo
    if (loginLink) loginLink.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (userName) userName.textContent = '';
    
    // Sistema antiguo
    if (loginLinkOld) loginLinkOld.style.display = 'flex';
    if (logoutBtnOld) logoutBtnOld.style.display = 'none';
    if (userNameOld) userNameOld.style.display = 'none';
  }
}

// ============================================
// GUARDAR/RECUPERAR EN LOCALSTORAGE (Opcional)
// ============================================

/**
 * Guardar reserva temporal en localStorage
 * (para cuando el usuario no está logueado)
 */
function guardarReservaTemporal(reserva) {
  const reservas = JSON.parse(localStorage.getItem('reservasTemp') || '[]');
  reservas.push({
    ...reserva,
    fechaGuardado: new Date().toISOString()
  });
  localStorage.setItem('reservasTemp', JSON.stringify(reservas));
}

/**
 * Migrar reservas temporales al usuario logueado
 */
async function migrarReservasTemporales() {
  if (!currentUser) return;
  
  const reservasTemp = JSON.parse(localStorage.getItem('reservasTemp') || '[]');
  if (reservasTemp.length === 0) return;
  
  try {
    const userRef = db.collection('usuarios').doc(currentUser.uid);
    const doc = await userRef.get();
    const datos = doc.data();
    
    const reservasActuales = datos.reservas || [];
    const nuevasReservas = [...reservasActuales, ...reservasTemp];
    
    await userRef.update({
      reservas: nuevasReservas
    });
    
    // Limpiar localStorage
    localStorage.removeItem('reservasTemp');
    console.log('Reservas temporales migradas exitosamente');
    
  } catch (error) {
    console.error('Error al migrar reservas:', error);
  }
}

// Exportar funciones para uso global
window.authFirebase = {
  registrar: registrarUsuario,
  login: iniciarSesion,
  logout: cerrarSesion,
  resetPassword: restablecerPassword,
  obtenerDatos: obtenerDatosUsuario,
  actualizarDatos: actualizarDatosUsuario,
  estaLogueado: usuarioLogueado,
  usuarioActual: obtenerUsuarioActual,
  migrarReservas: migrarReservasTemporales,
  guardarReservaTemp: guardarReservaTemporal
};
