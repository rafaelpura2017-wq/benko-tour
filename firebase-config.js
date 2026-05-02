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
const MEMBER_LEVEL = 'Comunidad Benko';
const DEFAULT_BENEFITS = [
  'Reserva más rápida',
  'Preferencias guardadas',
  'Perfil activo en Benko Tour'
];

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

function sanitizeText(value) {
  return String(value || '').trim();
}

function validateEmailAddress(value) {
  const email = sanitizeText(value).toLowerCase();

  if (!email) {
    return {
      valid: false,
      code: 'client/missing-email',
      message: 'Escribe un correo electrónico para continuar.'
    };
  }

  if (email.includes(' ')) {
    return {
      valid: false,
      code: 'client/invalid-email-format',
      message: 'El correo no puede tener espacios.'
    };
  }

  if (email.includes(',')) {
    return {
      valid: false,
      code: 'client/invalid-email-format',
      message: 'El correo debe usar punto y no coma en el dominio.'
    };
  }

  const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/;

  if (!strictEmailRegex.test(email)) {
    return {
      valid: false,
      code: 'client/invalid-email-format',
      message: 'Escribe un correo válido, por ejemplo: nombre@correo.com.'
    };
  }

  if (email.includes('..')) {
    return {
      valid: false,
      code: 'client/invalid-email-format',
      message: 'El correo no puede tener dos puntos seguidos.'
    };
  }

  const [localPart = '', domainPart = ''] = email.split('@');

  if (!localPart || !domainPart || localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      valid: false,
      code: 'client/invalid-email-format',
      message: 'Revisa el formato del correo antes de continuar.'
    };
  }

  const domainLabels = domainPart.split('.');
  const invalidDomainLabel = domainLabels.some((label) => !label || label.startsWith('-') || label.endsWith('-'));

  if (invalidDomainLabel) {
    return {
      valid: false,
      code: 'client/invalid-email-format',
      message: 'El dominio del correo no es válido.'
    };
  }

  return {
    valid: true,
    value: email
  };
}

function buildMemberCode(uid = '') {
  const normalized = String(uid || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
  return `BENKO-${normalized.slice(0, 6).padEnd(6, '0')}`;
}

function calculateProfileCompletion(profile = {}) {
  const checkpoints = [
    profile.nombre,
    profile.email,
    profile.telefono,
    profile.ciudad,
    profile.recogida || profile.preferencias?.recogida,
    profile.preferencias?.idioma
  ];

  const completed = checkpoints.filter((item) => sanitizeText(item)).length;
  return Math.round((completed / checkpoints.length) * 100);
}

function normalizeUserData(raw = {}, user = null) {
  const preferencias = raw.preferencias || {};
  const reservas = Array.isArray(raw.reservas) ? raw.reservas : [];
  const compras = Array.isArray(raw.compras) ? raw.compras : [];
  const hasRuntimeVerificationState = typeof user?.emailVerified === 'boolean';
  const emailVerificado = hasRuntimeVerificationState
    ? Boolean(user.emailVerified)
    : Boolean(raw.cuenta?.emailVerificado);
  const estadoCuenta = emailVerificado ? 'Verificada' : 'Pendiente de verificación';

  const normalized = {
    ...raw,
    nombre: sanitizeText(raw.nombre),
    telefono: sanitizeText(raw.telefono),
    ciudad: sanitizeText(raw.ciudad),
    email: raw.email || user?.email || '',
    reservas,
    compras,
    recogida: sanitizeText(raw.recogida || preferencias.recogida),
    preferencias: {
      idioma: sanitizeText(preferencias.idioma || raw.idiomaPreferido) || 'Español',
      recogida: sanitizeText(preferencias.recogida || raw.recogida),
      intereses: Array.isArray(preferencias.intereses) ? preferencias.intereses : []
    },
    cuenta: {
      codigoMiembro: raw.cuenta?.codigoMiembro || buildMemberCode(user?.uid),
      estado: hasRuntimeVerificationState ? estadoCuenta : (raw.cuenta?.estado || estadoCuenta),
      nivel: raw.cuenta?.nivel || MEMBER_LEVEL,
      origen: raw.cuenta?.origen || 'web-acceso',
      emailVerificado
    },
    beneficios: Array.isArray(raw.beneficios) && raw.beneficios.length ? raw.beneficios : DEFAULT_BENEFITS,
    estadisticas: {
      reservas: typeof raw.estadisticas?.reservas === 'number' ? raw.estadisticas.reservas : reservas.length,
      compras: typeof raw.estadisticas?.compras === 'number' ? raw.estadisticas.compras : compras.length
    },
    onboarding: {
      bienvenidaVista: Boolean(raw.onboarding?.bienvenidaVista),
      ultimaSeccion: raw.onboarding?.ultimaSeccion || 'acceso'
    }
  };

  normalized.progreso = {
    perfilCompleto: typeof raw.progreso?.perfilCompleto === 'number'
      ? raw.progreso.perfilCompleto
      : calculateProfileCompletion(normalized)
  };

  return normalized;
}

function buildUserDocument(user, email, datos = {}) {
  const draft = normalizeUserData({
    nombre: datos.nombre || datos.name,
    telefono: datos.telefono || datos.phone,
    ciudad: datos.ciudad || datos.city,
    email,
    reservas: [],
    compras: [],
    recogida: datos.recogida || datos.pickup || '',
    preferencias: {
      idioma: datos.idioma || datos.language || 'Español',
      recogida: datos.recogida || datos.pickup || '',
      intereses: Array.isArray(datos.intereses) ? datos.intereses : []
    },
    cuenta: {
      codigoMiembro: buildMemberCode(user?.uid),
      estado: user?.emailVerified ? 'Verificada' : 'Pendiente de verificación',
      nivel: MEMBER_LEVEL,
      origen: 'web-acceso'
    },
    beneficios: DEFAULT_BENEFITS,
    estadisticas: {
      reservas: 0,
      compras: 0
    },
    onboarding: {
      bienvenidaVista: false,
      ultimaSeccion: 'acceso'
    }
  }, user);

  return {
    ...draft,
    fechaRegistro: firebase.firestore.FieldValue.serverTimestamp(),
    ultimoAcceso: firebase.firestore.FieldValue.serverTimestamp(),
    fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
  };
}

/**
 * Registrar nuevo usuario
 * @param {string} email - Correo electrónico
 * @param {string} password - Contraseña (mínimo 6 caracteres)
 * @param {object} datos - Datos adicionales del usuario
 */
async function registrarUsuario(email, password, datos = {}) {
  try {
    const emailCheck = validateEmailAddress(email);

    if (!emailCheck.valid) {
      return {
        success: false,
        error: emailCheck.message,
        errorCode: emailCheck.code
      };
    }

    if (String(password || '').length < 6) {
      return {
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres.',
        errorCode: 'client/weak-password'
      };
    }

    const userCredential = await auth.createUserWithEmailAndPassword(emailCheck.value, password);
    const user = userCredential.user;
    const userRef = db.collection('usuarios').doc(user.uid);
    const payload = buildUserDocument(user, emailCheck.value, datos);
    let verificationSent = false;

    await userRef.set(payload, { merge: true });

    if (user && !user.emailVerified) {
      try {
        await user.sendEmailVerification();
        verificationSent = true;
      } catch (verificationError) {
        console.warn('No se pudo enviar el correo de verificación en este momento.', verificationError);
      }

      await user.reload();
    }

    const finalUser = auth.currentUser || user;

    const storedDoc = await userRef.get();
    const storedData = normalizeUserData({
      ...storedDoc.data(),
      cuenta: {
        ...(storedDoc.data()?.cuenta || {}),
        estado: finalUser?.emailVerified ? 'Verificada' : 'Pendiente de verificación',
        emailVerificado: Boolean(finalUser?.emailVerified)
      }
    }, finalUser);

    await userRef.set({
      email: emailCheck.value,
      cuenta: storedData.cuenta,
      progreso: storedData.progreso,
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { 
      success: true, 
      user: finalUser, 
      datos: storedData,
      verificationSent,
      mensaje: 'Usuario registrado exitosamente' 
    };
  } catch (error) {
    console.error('Error en registro:', error);
    return { 
      success: false, 
      error: traducirErrorFirebase(error.code),
      errorCode: error.code
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
    const emailCheck = validateEmailAddress(email);

    if (!emailCheck.valid) {
      return {
        success: false,
        error: emailCheck.message,
        errorCode: emailCheck.code
      };
    }

    if (!sanitizeText(password)) {
      return {
        success: false,
        error: 'Escribe tu contraseña para iniciar sesión.',
        errorCode: 'client/missing-password'
      };
    }

    const userCredential = await auth.signInWithEmailAndPassword(emailCheck.value, password);
    const user = userCredential.user;
    await user.reload();
    const userRef = db.collection('usuarios').doc(user.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set(buildUserDocument(user, emailCheck.value, {}), { merge: true });
    }

    const refreshedDoc = await userRef.get();
    const datosUsuario = normalizeUserData(refreshedDoc.data(), user);

    await userRef.set({
      email: datosUsuario.email,
      recogida: datosUsuario.recogida,
      ultimoAcceso: firebase.firestore.FieldValue.serverTimestamp(),
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp(),
      preferencias: datosUsuario.preferencias,
      cuenta: {
        ...datosUsuario.cuenta,
        estado: user.emailVerified ? 'Verificada' : 'Pendiente de verificación',
        emailVerificado: Boolean(user.emailVerified)
      },
      progreso: {
        perfilCompleto: calculateProfileCompletion(datosUsuario)
      },
      estadisticas: {
        reservas: datosUsuario.reservas.length,
        compras: datosUsuario.compras.length
      }
    }, { merge: true });

    return { 
      success: true, 
      user: user, 
      datos: {
        ...datosUsuario,
        progreso: {
          perfilCompleto: calculateProfileCompletion(datosUsuario)
        }
      },
      mensaje: 'Sesión iniciada correctamente'
    };
  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    return { 
      success: false, 
      error: traducirErrorFirebase(error.code),
      errorCode: error.code
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
    const emailCheck = validateEmailAddress(email);

    if (!emailCheck.valid) {
      return {
        success: false,
        error: emailCheck.message,
        errorCode: emailCheck.code
      };
    }

    await auth.sendPasswordResetEmail(emailCheck.value);
    return { 
      success: true, 
      mensaje: 'Se ha enviado un enlace para restablecer tu contraseña a tu correo' 
    };
  } catch (error) {
    console.error('Error al restablecer password:', error);
    return { 
      success: false, 
      error: traducirErrorFirebase(error.code),
      errorCode: error.code
    };
  }
}

async function reenviarVerificacionCorreo() {
  if (!currentUser) {
    return {
      success: false,
      error: 'No hay una sesión activa para reenviar la verificación.',
      errorCode: 'client/no-active-session'
    };
  }

  try {
    await currentUser.reload();

    if (currentUser.emailVerified) {
      await db.collection('usuarios').doc(currentUser.uid).set({
        cuenta: {
          emailVerificado: true,
          estado: 'Verificada'
        },
        fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return {
        success: true,
        mensaje: 'Tu correo ya está verificado. Ya puedes seguir usando tu cuenta con normalidad.'
      };
    }

    await currentUser.sendEmailVerification();
    return {
      success: true,
      mensaje: 'Hemos reenviado el correo de verificación.'
    };
  } catch (error) {
    console.error('Error al reenviar verificación:', error);
    return {
      success: false,
      error: traducirErrorFirebase(error.code),
      errorCode: error.code
    };
  }
}

/**
 * Obtener datos del usuario actual
 */
async function obtenerDatosUsuario() {
  if (!currentUser) return null;
  
  try {
    await currentUser.reload();
    const userRef = db.collection('usuarios').doc(currentUser.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      const payload = buildUserDocument(currentUser, currentUser.email || '', {});
      await userRef.set(payload, { merge: true });
      const createdDoc = await userRef.get();
      return normalizeUserData(createdDoc.data(), currentUser);
    }

    const normalized = normalizeUserData(doc.data(), currentUser);

    await userRef.set({
      email: normalized.email,
      recogida: normalized.recogida,
      preferencias: normalized.preferencias,
      cuenta: normalized.cuenta,
      progreso: normalized.progreso,
      estadisticas: normalized.estadisticas,
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return normalized;
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
    const currentData = await obtenerDatosUsuario();
    const mergedData = normalizeUserData({
      ...currentData,
      nombre: datos.nombre ?? currentData?.nombre,
      ciudad: datos.ciudad ?? currentData?.ciudad,
      telefono: datos.telefono ?? currentData?.telefono,
      recogida: datos.recogida ?? currentData?.recogida,
      preferencias: {
        ...(currentData?.preferencias || {}),
        idioma: datos.idioma ?? currentData?.preferencias?.idioma,
        recogida: datos.recogida ?? currentData?.preferencias?.recogida
      }
    }, currentUser);

    await db.collection('usuarios').doc(currentUser.uid).set({
      nombre: mergedData.nombre,
      ciudad: mergedData.ciudad,
      telefono: mergedData.telefono,
      recogida: mergedData.recogida,
      preferencias: mergedData.preferencias,
      progreso: {
        perfilCompleto: calculateProfileCompletion(mergedData)
      },
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

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
    'client/no-active-session': 'No hay una sesión activa para completar esta acción.',
    'client/missing-email': 'Escribe un correo electrónico para continuar.',
    'client/missing-password': 'Escribe tu contraseña para continuar.',
    'client/invalid-email-format': 'El correo electrónico no tiene un formato válido.',
    'client/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
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
  reenviarVerificacion: reenviarVerificacionCorreo,
  validarEmail: validateEmailAddress,
  obtenerDatos: obtenerDatosUsuario,
  actualizarDatos: actualizarDatosUsuario,
  estaLogueado: usuarioLogueado,
  usuarioActual: obtenerUsuarioActual,
  migrarReservas: migrarReservasTemporales,
  guardarReservaTemp: guardarReservaTemporal
};
