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
const DATA_SCHEMA_VERSION = 2;
const TEMP_STORAGE_KEYS = {
  reservations: 'reservasTemp'
};
const COLLECTION_KEYS = {
  users: 'usuarios',
  reservationRequests: 'solicitudes_reserva'
};
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

function validatePhoneNumber(value) {
  const phone = sanitizeText(value);
  const digits = phone.replace(/\D/g, '');

  if (!phone) {
    return {
      valid: false,
      code: 'client/missing-phone',
      message: 'Escribe un número de WhatsApp o teléfono para crear tu cuenta.'
    };
  }

  if (digits.length < 10 || digits.length > 15) {
    return {
      valid: false,
      code: 'client/invalid-phone',
      message: 'Escribe un número real de 10 a 15 dígitos, con o sin prefijo internacional.'
    };
  }

  if (/^(\d)\1+$/.test(digits)) {
    return {
      valid: false,
      code: 'client/invalid-phone',
      message: 'El número no parece válido. Revisa tu WhatsApp o teléfono.'
    };
  }

  return {
    valid: true,
    value: phone,
    digits
  };
}

function validatePasswordStrength(value) {
  const password = String(value || '');

  if (password.length < 8) {
    return {
      valid: false,
      code: 'client/weak-password-format',
      message: 'La contraseña debe tener al menos 8 caracteres.'
    };
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return {
      valid: false,
      code: 'client/weak-password-format',
      message: 'La contraseña debe combinar al menos una letra y un número.'
    };
  }

  return {
    valid: true
  };
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

function safePositiveInteger(value, fallback = 0) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return fallback;
  }

  return Math.round(numeric);
}

function safeMoneyValue(value, fallback = 0) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return fallback;
  }

  return Number(numeric);
}

function toIsoTimestamp(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    const parsedString = new Date(value);
    return Number.isNaN(parsedString.getTime()) ? sanitizeText(value) : parsedString.toISOString();
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  if (typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000).toISOString();
  }

  return '';
}

function createRecordId(prefix = 'BNK') {
  const left = Date.now().toString(36).toUpperCase();
  const right = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${left}-${right}`;
}

function normalizeCartItem(raw = {}) {
  const itemId = sanitizeText(raw.id || raw.sku || raw.productoId) || createRecordId('ITEM');
  const itemName = sanitizeText(raw.name || raw.nombre || raw.producto) || 'Producto Benko';
  const itemPrice = safeMoneyValue(raw.price ?? raw.precio);
  const itemQuantity = Math.max(1, safePositiveInteger(raw.quantity ?? raw.cantidad, 1));
  const itemCurrency = sanitizeText(raw.currency || raw.moneda) || 'COP';

  return {
    id: itemId,
    sku: itemId,
    name: itemName,
    price: itemPrice,
    quantity: itemQuantity,
    total: itemPrice * itemQuantity,
    currency: itemCurrency
  };
}

function normalizeCartItems(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => normalizeCartItem(item))
    .filter((item) => sanitizeText(item.name));
}

function buildCartSummary(items = []) {
  const normalizedItems = normalizeCartItems(items);

  return {
    items: normalizedItems.length,
    units: normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
    total: normalizedItems.reduce((sum, item) => sum + item.total, 0),
    currency: 'COP'
  };
}

function normalizeReservationRecord(raw = {}, user = null) {
  const reservationId = sanitizeText(raw.id || raw.referencia || raw.reference) || createRecordId('RSV');
  const adults = safePositiveInteger(raw.adultos ?? raw.adults);
  const children = safePositiveInteger(raw.ninos ?? raw.children);
  const babies = safePositiveInteger(raw.bebes ?? raw.babies);
  const travelerFallback = adults + children + babies;
  const totalTravelers = Math.max(travelerFallback, safePositiveInteger(raw.personas ?? raw.travelers, travelerFallback));
  const adultPrice = safeMoneyValue(raw.precioAdulto ?? raw.adultPrice);
  const childPrice = safeMoneyValue(raw.precioNino ?? raw.childPrice, adultPrice > 0 ? adultPrice * 0.5 : 0);
  const totalPrice = safeMoneyValue(raw.precioTotal ?? raw.total, (adultPrice * adults) + (childPrice * children));
  const packageCode = sanitizeText(raw.paquete || raw.package) || 'principal';
  const packageName = sanitizeText(raw.paqueteNombre || raw.packageName) || packageCode;
  const customerEmail = sanitizeText(raw.email || user?.email || '').toLowerCase();
  const createdAt = toIsoTimestamp(raw.fechaCreacion || raw.createdAt || raw.fechaGuardado) || new Date().toISOString();

  return {
    id: reservationId,
    schemaVersion: DATA_SCHEMA_VERSION,
    tipo: 'reserva-tour',
    origen: sanitizeText(raw.origen || raw.origin) || 'web-reservas',
    canal: sanitizeText(raw.canal || raw.channel) || 'web',
    referencia: sanitizeText(raw.referencia || raw.reference) || reservationId,
    estado: sanitizeText(raw.estado || raw.status) || 'pendiente',
    nombre: sanitizeText(raw.nombre || raw.name),
    email: customerEmail,
    telefono: sanitizeText(raw.telefono || raw.phone),
    ciudad: sanitizeText(raw.ciudad || raw.city),
    fecha: sanitizeText(raw.fecha || raw.date),
    paquete: packageCode,
    paqueteNombre: packageName,
    idioma: sanitizeText(raw.idioma || raw.language) || 'Español',
    recogida: sanitizeText(raw.recogida || raw.pickup),
    comentarios: sanitizeText(raw.comentarios || raw.notes),
    adultos: adults,
    ninos: children,
    bebes: babies,
    personas: totalTravelers,
    precioAdulto: adultPrice,
    precioNino: childPrice,
    precioTotal: totalPrice,
    moneda: sanitizeText(raw.moneda || raw.currency) || 'COP',
    fechaCreacion: createdAt,
    cliente: {
      uid: user?.uid || sanitizeText(raw.uid),
      nombre: sanitizeText(raw.nombre || raw.name),
      email: customerEmail,
      telefono: sanitizeText(raw.telefono || raw.phone),
      ciudad: sanitizeText(raw.ciudad || raw.city)
    },
    resumen: {
      paquete: packageCode,
      paqueteNombre: packageName,
      fecha: sanitizeText(raw.fecha || raw.date),
      idioma: sanitizeText(raw.idioma || raw.language) || 'Español',
      recogida: sanitizeText(raw.recogida || raw.pickup),
      viajeros: totalTravelers,
      total: totalPrice
    }
  };
}

function normalizePurchaseRecord(raw = {}, user = null) {
  const purchaseId = sanitizeText(raw.id || raw.referencia || raw.reference) || createRecordId('ORD');
  const items = Array.isArray(raw.items)
    ? normalizeCartItems(raw.items)
    : Array.isArray(raw.productos)
      ? normalizeCartItems(raw.productos)
      : [];
  const total = safeMoneyValue(
    raw.total ?? raw.precioTotal,
    items.reduce((sum, item) => sum + item.total, 0)
  );
  const customerEmail = sanitizeText(raw.email || user?.email || '').toLowerCase();
  const createdAt = toIsoTimestamp(raw.fechaCreacion || raw.createdAt || raw.fechaGuardado) || new Date().toISOString();

  return {
    id: purchaseId,
    schemaVersion: DATA_SCHEMA_VERSION,
    tipo: 'compra-tienda',
    origen: sanitizeText(raw.origen || raw.origin) || 'web-tienda',
    canal: sanitizeText(raw.canal || raw.channel) || 'web',
    referencia: sanitizeText(raw.referencia || raw.reference) || purchaseId,
    estado: sanitizeText(raw.estado || raw.status) || 'pendiente',
    nombre: sanitizeText(raw.nombre || raw.name || raw.producto) || 'Pedido Benko',
    categoria: sanitizeText(raw.categoria || raw.category) || 'Tienda',
    ciudad: sanitizeText(raw.ciudad || raw.city),
    email: customerEmail,
    items,
    cantidad: safePositiveInteger(raw.cantidad, items.reduce((sum, item) => sum + item.quantity, 0)),
    total,
    moneda: sanitizeText(raw.moneda || raw.currency) || 'COP',
    fechaCreacion: createdAt,
    cliente: {
      uid: user?.uid || sanitizeText(raw.uid),
      email: customerEmail,
      ciudad: sanitizeText(raw.ciudad || raw.city)
    }
  };
}

function buildReservationRequestDocument(reserva, user = null) {
  const normalizedReservation = normalizeReservationRecord(reserva, user);

  return {
    ...normalizedReservation,
    schemaVersion: DATA_SCHEMA_VERSION,
    persistencia: user ? 'database-account' : 'database-public',
    seguimiento: {
      origen: sanitizeText(normalizedReservation.origen) || 'web-reservas',
      canal: sanitizeText(normalizedReservation.canal) || (user ? 'account' : 'guest'),
      ruta: window.location.pathname || '/reservas.html',
      estadoInterno: 'recibida'
    },
    actividad: {
      enviadaDesde: 'formulario-reservas',
      cuentaUid: user?.uid || '',
      cuentaEmailVerificada: Boolean(user?.emailVerified)
    }
  };
}

function normalizeUserData(raw = {}, user = null) {
  const preferencias = raw.preferencias || {};
  const reservas = Array.isArray(raw.reservas) ? raw.reservas.map((reserva) => normalizeReservationRecord(reserva, user)) : [];
  const compras = Array.isArray(raw.compras) ? raw.compras.map((compra) => normalizePurchaseRecord(compra, user)) : [];
  const carrito = normalizeCartItems(raw.carrito);
  const hasRuntimeVerificationState = typeof user?.emailVerified === 'boolean';
  const emailVerificado = hasRuntimeVerificationState
    ? Boolean(user.emailVerified)
    : Boolean(raw.cuenta?.emailVerificado);
  const estadoCuenta = emailVerificado ? 'Verificada' : 'Pendiente de verificación';

  const normalized = {
    ...raw,
    schemaVersion: typeof raw.schemaVersion === 'number' ? raw.schemaVersion : DATA_SCHEMA_VERSION,
    nombre: sanitizeText(raw.nombre),
    telefono: sanitizeText(raw.telefono),
    ciudad: sanitizeText(raw.ciudad),
    email: sanitizeText(raw.email || user?.email || '').toLowerCase(),
    reservas,
    compras,
    carrito,
    carritoResumen: {
      ...(raw.carritoResumen || {}),
      ...buildCartSummary(carrito)
    },
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
      reservas: reservas.length,
      compras: compras.length
    },
    onboarding: {
      bienvenidaVista: Boolean(raw.onboarding?.bienvenidaVista),
      ultimaSeccion: raw.onboarding?.ultimaSeccion || 'acceso'
    },
    actividad: {
      ultimaReservaAt: toIsoTimestamp(raw.actividad?.ultimaReservaAt || raw.ultimaReservaAt),
      ultimaCompraAt: toIsoTimestamp(raw.actividad?.ultimaCompraAt || raw.ultimaCompraAt),
      ultimoCarritoAt: toIsoTimestamp(raw.actividad?.ultimoCarritoAt || raw.carritoActualizado)
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
    schemaVersion: DATA_SCHEMA_VERSION,
    nombre: datos.nombre || datos.name,
    telefono: datos.telefono || datos.phone,
    ciudad: datos.ciudad || datos.city,
    email,
    reservas: [],
    compras: [],
    carrito: [],
    carritoResumen: buildCartSummary([]),
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
    },
    actividad: {
      ultimaReservaAt: '',
      ultimaCompraAt: '',
      ultimoCarritoAt: ''
    }
  }, user);

  return {
    ...draft,
    fechaRegistro: firebase.firestore.FieldValue.serverTimestamp(),
    ultimoAcceso: firebase.firestore.FieldValue.serverTimestamp(),
    fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
  };
}

function buildUserMergePayload(data = {}, user = null, overrides = {}) {
  const normalized = normalizeUserData(data, user);

  return {
    schemaVersion: DATA_SCHEMA_VERSION,
    nombre: normalized.nombre,
    ciudad: normalized.ciudad,
    telefono: normalized.telefono,
    email: normalized.email,
    recogida: normalized.recogida,
    preferencias: normalized.preferencias,
    cuenta: normalized.cuenta,
    beneficios: normalized.beneficios,
    estadisticas: {
      reservas: normalized.reservas.length,
      compras: normalized.compras.length
    },
    progreso: {
      perfilCompleto: calculateProfileCompletion(normalized)
    },
    onboarding: normalized.onboarding,
    carrito: normalized.carrito,
    carritoResumen: normalized.carritoResumen,
    actividad: normalized.actividad,
    fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp(),
    ...overrides
  };
}

async function ensureCurrentUserDocument() {
  if (!currentUser) {
    return null;
  }

  const userRef = db.collection(COLLECTION_KEYS.users).doc(currentUser.uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    await userRef.set(buildUserDocument(currentUser, currentUser.email || '', {}), { merge: true });
  }

  return userRef;
}

async function guardarReservaUsuario(reserva, options = {}) {
  const allowGuestFallback = options.allowGuestFallback !== false;
  const normalizedReservation = normalizeReservationRecord(reserva, currentUser);

  if (!currentUser) {
    if (allowGuestFallback) {
      guardarReservaTemporal(normalizedReservation);
      return {
        success: true,
        storage: 'temporary',
        reserva: normalizedReservation,
        mensaje: 'Reserva guardada temporalmente en este navegador.'
      };
    }

    return {
      success: false,
      error: 'No hay sesión activa para guardar la reserva.',
      errorCode: 'client/no-active-session'
    };
  }

  try {
    const userRef = await ensureCurrentUserDocument();
    const currentData = await obtenerDatosUsuario();
    const alreadyExists = Array.isArray(currentData?.reservas)
      ? currentData.reservas.some((item) => item.id === normalizedReservation.id)
      : false;

    if (alreadyExists) {
      return {
        success: true,
        storage: 'account',
        reserva: normalizedReservation,
        mensaje: 'La reserva ya estaba guardada en tu cuenta.'
      };
    }

    await userRef.update({
      schemaVersion: DATA_SCHEMA_VERSION,
      reservas: firebase.firestore.FieldValue.arrayUnion(normalizedReservation),
      'estadisticas.reservas': firebase.firestore.FieldValue.increment(1),
      'actividad.ultimaReservaAt': firebase.firestore.FieldValue.serverTimestamp(),
      ultimoAcceso: firebase.firestore.FieldValue.serverTimestamp(),
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      storage: 'account',
      reserva: normalizedReservation,
      mensaje: 'Reserva guardada correctamente en tu cuenta.'
    };
  } catch (error) {
    console.error('Error al guardar reserva del usuario:', error);
    return {
      success: false,
      error: traducirErrorFirebase(error.code) || error.message,
      errorCode: error.code
    };
  }
}

async function guardarReservaCompleta(reserva, options = {}) {
  const allowGuestFallback = options.allowGuestFallback !== false;
  const normalizedReservation = normalizeReservationRecord(reserva, currentUser);
  const result = {
    success: false,
    reserva: normalizedReservation,
    storage: {
      public: false,
      account: false,
      temporary: false
    },
    error: '',
    errorCode: ''
  };

  try {
    const reservationRequest = buildReservationRequestDocument(normalizedReservation, currentUser);

    await db.collection(COLLECTION_KEYS.reservationRequests).doc(normalizedReservation.id).set({
      ...reservationRequest,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    result.storage.public = true;
  } catch (publicError) {
    console.error('Error al guardar solicitud pública de reserva:', publicError);
    result.error = traducirErrorFirebase(publicError.code) || publicError.message || 'No pudimos guardar la solicitud pública.';
    result.errorCode = publicError.code || '';
  }

  if (currentUser) {
    const accountResult = await guardarReservaUsuario(normalizedReservation, { allowGuestFallback: false });

    if (accountResult.success) {
      result.storage.account = true;
    } else if (!result.error) {
      result.error = accountResult.error || 'No pudimos guardar la reserva en tu cuenta.';
      result.errorCode = accountResult.errorCode || '';
    }
  } else if (!result.storage.public && allowGuestFallback) {
    guardarReservaTemporal(normalizedReservation);
    result.storage.temporary = true;
  }

  result.success = result.storage.public || result.storage.account || result.storage.temporary;
  return result;
}

async function guardarCompraUsuario(compra) {
  if (!currentUser) {
    return {
      success: false,
      error: 'No hay sesión activa para guardar la compra.',
      errorCode: 'client/no-active-session'
    };
  }

  try {
    const normalizedPurchase = normalizePurchaseRecord(compra, currentUser);
    const userRef = await ensureCurrentUserDocument();
    const currentData = await obtenerDatosUsuario();
    const alreadyExists = Array.isArray(currentData?.compras)
      ? currentData.compras.some((item) => item.id === normalizedPurchase.id)
      : false;

    if (alreadyExists) {
      return {
        success: true,
        compra: normalizedPurchase,
        mensaje: 'La compra ya estaba guardada en tu cuenta.'
      };
    }

    await userRef.update({
      schemaVersion: DATA_SCHEMA_VERSION,
      compras: firebase.firestore.FieldValue.arrayUnion(normalizedPurchase),
      'estadisticas.compras': firebase.firestore.FieldValue.increment(1),
      'actividad.ultimaCompraAt': firebase.firestore.FieldValue.serverTimestamp(),
      ultimoAcceso: firebase.firestore.FieldValue.serverTimestamp(),
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      compra: normalizedPurchase,
      mensaje: 'Compra guardada correctamente en tu cuenta.'
    };
  } catch (error) {
    console.error('Error al guardar compra del usuario:', error);
    return {
      success: false,
      error: traducirErrorFirebase(error.code) || error.message,
      errorCode: error.code
    };
  }
}

async function guardarCarritoUsuario(items = []) {
  if (!currentUser) {
    return {
      success: false,
      error: 'No hay sesión activa para guardar el carrito.',
      errorCode: 'client/no-active-session'
    };
  }

  try {
    const userRef = await ensureCurrentUserDocument();
    const normalizedItems = normalizeCartItems(items);
    const cartSummary = buildCartSummary(normalizedItems);

    await userRef.set({
      schemaVersion: DATA_SCHEMA_VERSION,
      carrito: normalizedItems,
      carritoResumen: cartSummary,
      ultimoAcceso: firebase.firestore.FieldValue.serverTimestamp(),
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await userRef.update({
      'actividad.ultimoCarritoAt': firebase.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      carrito: normalizedItems,
      resumen: cartSummary,
      mensaje: 'Carrito guardado correctamente.'
    };
  } catch (error) {
    console.error('Error al guardar carrito del usuario:', error);
    return {
      success: false,
      error: traducirErrorFirebase(error.code) || error.message,
      errorCode: error.code
    };
  }
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
    const phoneCheck = validatePhoneNumber(datos.telefono || datos.phone);
    const passwordCheck = validatePasswordStrength(password);

    if (!emailCheck.valid) {
      return {
        success: false,
        error: emailCheck.message,
        errorCode: emailCheck.code
      };
    }

    if (!phoneCheck.valid) {
      return {
        success: false,
        error: phoneCheck.message,
        errorCode: phoneCheck.code
      };
    }

    if (!passwordCheck.valid) {
      return {
        success: false,
        error: passwordCheck.message,
        errorCode: passwordCheck.code
      };
    }

    const userCredential = await auth.createUserWithEmailAndPassword(emailCheck.value, password);
    const user = userCredential.user;
    const userRef = db.collection(COLLECTION_KEYS.users).doc(user.uid);
    const payload = buildUserDocument(user, emailCheck.value, {
      ...datos,
      telefono: phoneCheck.value,
      phone: phoneCheck.value
    });
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

    await userRef.set(buildUserMergePayload(storedData, finalUser, {
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    }), { merge: true });

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
    const userRef = db.collection(COLLECTION_KEYS.users).doc(user.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set(buildUserDocument(user, emailCheck.value, {}), { merge: true });
    }

    const refreshedDoc = await userRef.get();
    const datosUsuario = normalizeUserData(refreshedDoc.data(), user);

    await userRef.set(buildUserMergePayload({
      ...datosUsuario,
      cuenta: {
        ...datosUsuario.cuenta,
        estado: user.emailVerified ? 'Verificada' : 'Pendiente de verificación',
        emailVerificado: Boolean(user.emailVerified)
      }
    }, user, {
      ultimoAcceso: firebase.firestore.FieldValue.serverTimestamp(),
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    }), { merge: true });

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
      await db.collection(COLLECTION_KEYS.users).doc(currentUser.uid).set({
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

async function eliminarCuentaActual() {
  if (!currentUser) {
    return {
      success: false,
      error: 'No hay una sesión activa para cerrar la cuenta.',
      errorCode: 'client/no-active-session'
    };
  }

  try {
    const userToDelete = currentUser;
    const userId = userToDelete.uid;
    const userEmail = userToDelete.email || '';

    await userToDelete.delete();
    currentUser = null;

    try {
      await db.collection(COLLECTION_KEYS.users).doc(userId).delete();
    } catch (firestoreError) {
      console.warn('La cuenta de autenticación se eliminó, pero el documento del usuario no se pudo borrar automáticamente.', firestoreError);
    }

    localStorage.removeItem(TEMP_STORAGE_KEYS.reservations);
    localStorage.removeItem('benkoCart');

    return {
      success: true,
      mensaje: `La cuenta ${userEmail} fue cerrada correctamente.`
    };
  } catch (error) {
    console.error('Error al cerrar cuenta:', error);
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
    const userRef = db.collection(COLLECTION_KEYS.users).doc(currentUser.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      const payload = buildUserDocument(currentUser, currentUser.email || '', {});
      await userRef.set(payload, { merge: true });
      const createdDoc = await userRef.get();
      return normalizeUserData(createdDoc.data(), currentUser);
    }

    const normalized = normalizeUserData(doc.data(), currentUser);

    await userRef.set(buildUserMergePayload(normalized, currentUser, {
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    }), { merge: true });

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
    const shouldValidatePhone = Object.prototype.hasOwnProperty.call(datos || {}, 'telefono');
    const phoneCheck = shouldValidatePhone
      ? validatePhoneNumber(datos.telefono)
      : { valid: true, value: currentData?.telefono || '' };

    if (shouldValidatePhone && !phoneCheck.valid) {
      return {
        success: false,
        error: phoneCheck.message,
        errorCode: phoneCheck.code
      };
    }

    const mergedData = normalizeUserData({
      ...currentData,
      nombre: datos.nombre ?? currentData?.nombre,
      ciudad: datos.ciudad ?? currentData?.ciudad,
      telefono: shouldValidatePhone ? phoneCheck.value : currentData?.telefono,
      reservas: Array.isArray(datos.reservas) ? datos.reservas : currentData?.reservas,
      compras: Array.isArray(datos.compras) ? datos.compras : currentData?.compras,
      carrito: Array.isArray(datos.carrito) ? datos.carrito : currentData?.carrito,
      recogida: datos.recogida ?? currentData?.recogida,
      preferencias: {
        ...(currentData?.preferencias || {}),
        idioma: datos.idioma ?? currentData?.preferencias?.idioma,
        recogida: datos.recogida ?? currentData?.preferencias?.recogida
      }
    }, currentUser);

    await db.collection(COLLECTION_KEYS.users).doc(currentUser.uid).set(buildUserMergePayload(mergedData, currentUser, {
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    }), { merge: true });

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
    'client/missing-phone': 'Escribe un número de teléfono o WhatsApp válido.',
    'client/missing-password': 'Escribe tu contraseña para continuar.',
    'client/invalid-phone': 'El número de teléfono no parece válido.',
    'client/invalid-email-format': 'El correo electrónico no tiene un formato válido.',
    'client/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'client/weak-password-format': 'La contraseña debe tener al menos 8 caracteres e incluir letras y números.',
    'auth/email-already-in-use': 'Este correo ya está registrado. Intenta iniciar sesión.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/user-not-found': 'No existe una cuenta con este correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Credenciales inválidas. Verifica tu correo y contraseña.',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
    'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
    'auth/requires-recent-login': 'Por seguridad, vuelve a iniciar sesión antes de cerrar tu cuenta.'
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
  const reservas = JSON.parse(localStorage.getItem(TEMP_STORAGE_KEYS.reservations) || '[]');
  const normalizedReservation = normalizeReservationRecord({
    ...reserva,
    fechaGuardado: toIsoTimestamp(reserva?.fechaGuardado) || new Date().toISOString(),
    origen: reserva?.origen || 'web-reservas-temp',
    canal: reserva?.canal || 'guest'
  });
  const existingIds = new Set(reservas.map((item) => item.id));

  if (!existingIds.has(normalizedReservation.id)) {
    reservas.push(normalizedReservation);
  }

  localStorage.setItem(TEMP_STORAGE_KEYS.reservations, JSON.stringify(reservas));
}

/**
 * Migrar reservas temporales al usuario logueado
 */
async function migrarReservasTemporales() {
  if (!currentUser) return;
  
  const reservasTemp = JSON.parse(localStorage.getItem(TEMP_STORAGE_KEYS.reservations) || '[]');
  if (reservasTemp.length === 0) return;
  
  try {
    for (const reservaTemporal of reservasTemp) {
      const resultado = await guardarReservaUsuario(reservaTemporal, { allowGuestFallback: false });

      if (!resultado.success) {
        throw new Error(resultado.error || 'No pudimos migrar una de las reservas temporales.');
      }
    }

    localStorage.removeItem(TEMP_STORAGE_KEYS.reservations);
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
  deleteAccount: eliminarCuentaActual,
  resetPassword: restablecerPassword,
  reenviarVerificacion: reenviarVerificacionCorreo,
  validarEmail: validateEmailAddress,
  validarTelefono: validatePhoneNumber,
  obtenerDatos: obtenerDatosUsuario,
  actualizarDatos: actualizarDatosUsuario,
  estaLogueado: usuarioLogueado,
  usuarioActual: obtenerUsuarioActual,
  migrarReservas: migrarReservasTemporales,
  guardarReservaTemp: guardarReservaTemporal,
  guardarReserva: guardarReservaCompleta,
  guardarCompra: guardarCompraUsuario,
  guardarCarrito: guardarCarritoUsuario
};
