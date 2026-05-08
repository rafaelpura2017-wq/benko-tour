import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";
import nodemailer from "nodemailer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const reservationsFile = path.join(dataDir, "reservations.json");
const ordersFile = path.join(dataDir, "orders.json");
const accessUsersFile = path.join(dataDir, "access-users.json");
const premiumAdminAuditFile = path.join(dataDir, "premium-admin-actions.json");

const PREMIUM_MEMBERSHIP_COLLECTION = "membresias_lengua";
const PREMIUM_REQUEST_COLLECTION = "solicitudes_membresia_lengua";

const app = express();
const port = Number(process.env.PORT || 8787);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "*";
const reservationEmail = process.env.BENKO_RESERVATION_EMAIL || "";
const adminApiKey = sanitizeText(process.env.ADMIN_API_KEY);
const adminAllowedEmails = String(process.env.ADMIN_ALLOWED_EMAILS || "")
  .split(",")
  .map((email) => sanitizeText(email).toLowerCase())
  .filter(Boolean);

let firebaseAdminContextPromise = null;

app.use(cors({ origin: frontendOrigin === "*" ? true : frontendOrigin }));
app.use(express.json({ limit: "1mb" }));

function sanitizeText(value, fallback = "") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function validateRequiredFields(payload, fields) {
  const missing = fields.filter((field) => !payload[field]);

  if (missing.length) {
    const error = new Error(`Faltan campos obligatorios: ${missing.join(", ")}`);
    error.status = 400;
    throw error;
  }
}

async function ensureDataFile(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]", "utf8");
  }
}

async function appendRecord(filePath, record) {
  await ensureDataFile(filePath);
  const raw = await fs.readFile(filePath, "utf8");
  const current = JSON.parse(raw);
  current.push({
    ...record,
    savedAt: new Date().toISOString()
  });
  await fs.writeFile(filePath, JSON.stringify(current, null, 2), "utf8");
}

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendOperationalEmail(subject, html, text) {
  const transporter = createTransporter();

  if (!transporter || !reservationEmail) {
    return { skipped: true };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: reservationEmail,
    subject,
    html,
    text
  });

  return { delivered: true };
}

function buildReservationEmail(payload) {
  return {
    subject: `Nueva reserva ${payload.reference} - ${payload.packageName}`,
    text: [
      `Referencia: ${payload.reference}`,
      `Nombre: ${payload.name}`,
      `Teléfono: ${payload.phone}`,
      `Fecha: ${payload.date}`,
      `Paquete: ${payload.packageName}`,
      `Viajeros: ${payload.travelers}`,
      `Idioma: ${payload.language}`,
      `Recogida: ${payload.pickup}`,
      `Total: ${payload.total}`,
      `Notas: ${payload.notes || "Sin notas"}`
    ].join("\n"),
    html: `
      <h2>Nueva reserva</h2>
      <p><strong>Referencia:</strong> ${payload.reference}</p>
      <p><strong>Nombre:</strong> ${payload.name}</p>
      <p><strong>Teléfono:</strong> ${payload.phone}</p>
      <p><strong>Fecha:</strong> ${payload.date}</p>
      <p><strong>Paquete:</strong> ${payload.packageName}</p>
      <p><strong>Viajeros:</strong> ${payload.travelers}</p>
      <p><strong>Idioma:</strong> ${payload.language}</p>
      <p><strong>Recogida:</strong> ${payload.pickup}</p>
      <p><strong>Total:</strong> ${payload.total}</p>
      <p><strong>Notas:</strong> ${payload.notes || "Sin notas"}</p>
    `
  };
}

function buildOrderEmail(payload) {
  const itemsHtml = payload.items
    .map((item) => `<li>${item.name} x${item.quantity} - ${item.price * item.quantity}</li>`)
    .join("");

  return {
    subject: `Nuevo pedido ${payload.reference} - tienda Benko Tour`,
    text: [
      `Referencia: ${payload.reference}`,
      `Ciudad: ${payload.city}`,
      `Total: ${payload.total}`,
      "Items:",
      ...payload.items.map((item) => `${item.name} x${item.quantity} - ${item.price * item.quantity}`)
    ].join("\n"),
    html: `
      <h2>Nuevo pedido de tienda</h2>
      <p><strong>Referencia:</strong> ${payload.reference}</p>
      <p><strong>Ciudad:</strong> ${payload.city}</p>
      <p><strong>Total:</strong> ${payload.total}</p>
      <ul>${itemsHtml}</ul>
    `
  };
}

function buildAccessUserEmail(payload) {
  return {
    subject: `Nuevo registro de acceso ${payload.id} - ${payload.name}`,
    text: [
      `ID: ${payload.id}`,
      `Nombre: ${payload.name}`,
      `Correo: ${payload.email}`,
      `WhatsApp: ${payload.phone || "Sin WhatsApp"}`,
      `Ciudad: ${payload.city || "Sin ciudad"}`,
      `Origen: ${payload.source || "web"}`,
      `Creado: ${payload.createdAt || "Sin fecha"}`
    ].join("\n"),
    html: `
      <h2>Nuevo registro de acceso</h2>
      <p><strong>ID:</strong> ${payload.id}</p>
      <p><strong>Nombre:</strong> ${payload.name}</p>
      <p><strong>Correo:</strong> ${payload.email}</p>
      <p><strong>WhatsApp:</strong> ${payload.phone || "Sin WhatsApp"}</p>
      <p><strong>Ciudad:</strong> ${payload.city || "Sin ciudad"}</p>
      <p><strong>Origen:</strong> ${payload.source || "web"}</p>
      <p><strong>Creado:</strong> ${payload.createdAt || "Sin fecha"}</p>
    `
  };
}

function createWompiSignature({ reference, amountInCents, currency, integritySecret, expirationTime }) {
  const base = `${reference}${amountInCents}${currency}${integritySecret}${expirationTime || ""}`;
  return crypto.createHash("sha256").update(base).digest("hex");
}

function normalizeItemsForMercadoPago(payload) {
  if (payload.items && payload.items.length) {
    return payload.items.map((item) => ({
      title: item.name,
      quantity: Number(item.quantity),
      currency_id: "COP",
      unit_price: Number(item.price)
    }));
  }

  return [
    {
      title: payload.packageName || payload.description || "Reserva Benko Tour",
      quantity: 1,
      currency_id: "COP",
      unit_price: Number(payload.total || 0)
    }
  ];
}

function resolveServiceAccountPath(configuredPath) {
  if (path.isAbsolute(configuredPath)) {
    return configuredPath;
  }
  return path.join(__dirname, configuredPath);
}

async function readServiceAccount() {
  const rawJson = sanitizeText(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (rawJson) {
    try {
      return JSON.parse(rawJson);
    } catch {
      const error = new Error("FIREBASE_SERVICE_ACCOUNT_JSON no es un JSON válido.");
      error.status = 500;
      throw error;
    }
  }

  const configuredPath = sanitizeText(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  if (!configuredPath) {
    return null;
  }

  const resolvedPath = resolveServiceAccountPath(configuredPath);

  try {
    const rawFile = await fs.readFile(resolvedPath, "utf8");
    return JSON.parse(rawFile);
  } catch {
    const error = new Error("No pudimos leer FIREBASE_SERVICE_ACCOUNT_PATH.");
    error.status = 500;
    throw error;
  }
}

async function getFirebaseAdminContext() {
  if (firebaseAdminContextPromise) {
    return firebaseAdminContextPromise;
  }

  firebaseAdminContextPromise = (async () => {
    let firebaseAdminModule;
    try {
      firebaseAdminModule = await import("firebase-admin");
    } catch {
      const error = new Error("Falta dependencia firebase-admin en backend. Ejecuta npm install en /backend.");
      error.status = 500;
      throw error;
    }

    const admin = firebaseAdminModule.default || firebaseAdminModule;
    const serviceAccount = await readServiceAccount();
    if (!serviceAccount) {
      const error = new Error("Configura FIREBASE_SERVICE_ACCOUNT_JSON o FIREBASE_SERVICE_ACCOUNT_PATH para usar el panel admin.");
      error.status = 500;
      throw error;
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    return {
      admin,
      db: admin.firestore()
    };
  })();

  return firebaseAdminContextPromise;
}

function serializeFirestoreDate(value) {
  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return sanitizeText(value);
}

function assertAdminRequest(req) {
  if (!adminApiKey) {
    const error = new Error("Configura ADMIN_API_KEY para habilitar endpoints admin.");
    error.status = 500;
    throw error;
  }

  const providedKey = sanitizeText(req.headers["x-admin-key"]);
  if (!providedKey || providedKey !== adminApiKey) {
    const error = new Error("Clave admin inválida.");
    error.status = 401;
    throw error;
  }

  const adminEmail = sanitizeText(
    req.headers["x-admin-email"] || req.body.adminEmail || req.query.adminEmail
  ).toLowerCase();

  if (adminAllowedEmails.length && !adminAllowedEmails.includes(adminEmail)) {
    const error = new Error("Este correo no está autorizado para acciones admin.");
    error.status = 403;
    throw error;
  }

  return adminEmail || "admin@local";
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "benko-tour-backend" });
});

app.post("/api/reservations", async (req, res, next) => {
  try {
    validateRequiredFields(req.body, ["reference", "name", "phone", "date", "packageName", "travelers", "total"]);
    await appendRecord(reservationsFile, req.body);

    const email = buildReservationEmail(req.body);
    const emailStatus = await sendOperationalEmail(email.subject, email.html, email.text);

    res.json({
      ok: true,
      saved: true,
      emailed: Boolean(emailStatus.delivered),
      reference: req.body.reference
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (req, res, next) => {
  try {
    validateRequiredFields(req.body, ["reference", "items", "total"]);
    await appendRecord(ordersFile, req.body);

    const email = buildOrderEmail(req.body);
    const emailStatus = await sendOperationalEmail(email.subject, email.html, email.text);

    res.json({
      ok: true,
      saved: true,
      emailed: Boolean(emailStatus.delivered),
      reference: req.body.reference
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/access/users", async (req, res, next) => {
  try {
    validateRequiredFields(req.body, ["id", "name", "email"]);
    await appendRecord(accessUsersFile, req.body);

    const email = buildAccessUserEmail(req.body);
    const emailStatus = await sendOperationalEmail(email.subject, email.html, email.text);

    res.json({
      ok: true,
      saved: true,
      emailed: Boolean(emailStatus.delivered),
      userId: req.body.id
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/payments/wompi/checkout", async (req, res, next) => {
  try {
    validateRequiredFields(req.body, ["reference", "total"]);

    if (!process.env.WOMPI_PUBLIC_KEY || !process.env.WOMPI_INTEGRITY_SECRET) {
      const error = new Error("Configura WOMPI_PUBLIC_KEY y WOMPI_INTEGRITY_SECRET en el backend.");
      error.status = 500;
      throw error;
    }

    const amountInCents = Number(req.body.total) * 100;
    const expirationTime = "";
    const signature = createWompiSignature({
      reference: req.body.reference,
      amountInCents,
      currency: "COP",
      integritySecret: process.env.WOMPI_INTEGRITY_SECRET,
      expirationTime
    });

    res.json({
      provider: "wompi",
      action: "https://checkout.wompi.co/p/",
      fields: {
        "public-key": process.env.WOMPI_PUBLIC_KEY,
        currency: "COP",
        "amount-in-cents": amountInCents,
        reference: req.body.reference,
        "signature:integrity": signature,
        "redirect-url": process.env.WOMPI_REDIRECT_URL || "",
        "customer-data:full-name": req.body.name || "",
        "customer-data:phone-number": req.body.phone || "",
        "customer-data:email": req.body.email || reservationEmail || "",
        "shipping-address:city": req.body.city || "Cartagena",
        "shipping-address:country": "CO"
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/payments/mercadopago/preference", async (req, res, next) => {
  try {
    validateRequiredFields(req.body, ["reference", "total"]);

    if (!process.env.MP_ACCESS_TOKEN) {
      const error = new Error("Configura MP_ACCESS_TOKEN en el backend.");
      error.status = 500;
      throw error;
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN
    });

    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        external_reference: req.body.reference,
        items: normalizeItemsForMercadoPago(req.body),
        back_urls: {
          success: process.env.MP_SUCCESS_URL || process.env.WOMPI_REDIRECT_URL || "",
          failure: process.env.MP_FAILURE_URL || process.env.WOMPI_REDIRECT_URL || "",
          pending: process.env.MP_PENDING_URL || process.env.WOMPI_REDIRECT_URL || ""
        },
        auto_return: "approved"
      }
    });

    res.json({
      provider: "mercadopago",
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/premium/requests", async (req, res, next) => {
  try {
    const adminEmail = assertAdminRequest(req);
    const statusFilter = sanitizeText(req.query.status, "pendiente").toLowerCase();
    const context = await getFirebaseAdminContext();
    const snapshot = await context.db.collection(PREMIUM_REQUEST_COLLECTION).limit(250).get();

    const requests = snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        userUid: sanitizeText(data.userUid),
        userEmail: sanitizeText(data.userEmail).toLowerCase(),
        userName: sanitizeText(data.userName),
        tipoSolicitud: sanitizeText(data.tipoSolicitud),
        estado: sanitizeText(data.estado, "pendiente"),
        referenciaPago: sanitizeText(data.referenciaPago),
        proveedor: sanitizeText(data.proveedor),
        precio: Number(data.precio || 0),
        moneda: sanitizeText(data.moneda, "COP"),
        createdAt: serializeFirestoreDate(data.createdAt),
        updatedAt: serializeFirestoreDate(data.updatedAt),
        reviewedAt: serializeFirestoreDate(data.reviewedAt),
        reviewedBy: sanitizeText(data.reviewedBy),
        notasRevision: sanitizeText(data.notasRevision)
      };
    }).filter((item) => {
      if (statusFilter === "all") {
        return true;
      }
      return sanitizeText(item.estado, "pendiente").toLowerCase() === statusFilter;
    }).sort((a, b) => {
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });

    res.json({
      ok: true,
      admin: adminEmail,
      count: requests.length,
      requests
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/premium/approve", async (req, res, next) => {
  try {
    const adminEmail = assertAdminRequest(req);
    validateRequiredFields(req.body, ["requestId"]);

    const context = await getFirebaseAdminContext();
    const requestId = sanitizeText(req.body.requestId);
    const requestRef = context.db.collection(PREMIUM_REQUEST_COLLECTION).doc(requestId);
    const requestSnapshot = await requestRef.get();

    if (!requestSnapshot.exists) {
      const error = new Error("No encontramos esa solicitud premium.");
      error.status = 404;
      throw error;
    }

    const requestData = requestSnapshot.data() || {};
    const userUid = sanitizeText(requestData.userUid || req.body.userUid);
    if (!userUid) {
      const error = new Error("La solicitud no contiene userUid.");
      error.status = 400;
      throw error;
    }

    const now = context.admin.firestore.FieldValue.serverTimestamp();
    await context.db.collection(PREMIUM_MEMBERSHIP_COLLECTION).doc(userUid).set({
      id: userUid,
      uid: userUid,
      userUid,
      userEmail: sanitizeText(requestData.userEmail).toLowerCase(),
      plan: "lengua-premium",
      producto: sanitizeText(requestData.producto, "Membresía premium lengua palenquera"),
      estado: "activa",
      status: "activa",
      source: "panel-admin",
      proveedor: sanitizeText(requestData.proveedor),
      referenciaPago: sanitizeText(requestData.referenciaPago),
      reviewedBy: adminEmail,
      activatedAt: now,
      updatedAt: now
    }, { merge: true });

    await requestRef.set({
      estado: "aprobada",
      reviewedAt: now,
      reviewedBy: adminEmail,
      notasRevision: sanitizeText(req.body.notes),
      updatedAt: now
    }, { merge: true });

    await appendRecord(premiumAdminAuditFile, {
      action: "approve",
      requestId,
      userUid,
      adminEmail,
      notes: sanitizeText(req.body.notes),
      source: "api/admin/premium/approve"
    });

    res.json({
      ok: true,
      requestId,
      userUid,
      status: "activa",
      message: "Solicitud aprobada y premium activado automáticamente."
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/premium/reject", async (req, res, next) => {
  try {
    const adminEmail = assertAdminRequest(req);
    validateRequiredFields(req.body, ["requestId"]);

    const context = await getFirebaseAdminContext();
    const requestId = sanitizeText(req.body.requestId);
    const requestRef = context.db.collection(PREMIUM_REQUEST_COLLECTION).doc(requestId);
    const requestSnapshot = await requestRef.get();

    if (!requestSnapshot.exists) {
      const error = new Error("No encontramos esa solicitud premium.");
      error.status = 404;
      throw error;
    }

    const now = context.admin.firestore.FieldValue.serverTimestamp();
    await requestRef.set({
      estado: "rechazada",
      reviewedAt: now,
      reviewedBy: adminEmail,
      notasRevision: sanitizeText(req.body.notes),
      updatedAt: now
    }, { merge: true });

    await appendRecord(premiumAdminAuditFile, {
      action: "reject",
      requestId,
      adminEmail,
      notes: sanitizeText(req.body.notes),
      source: "api/admin/premium/reject"
    });

    res.json({
      ok: true,
      requestId,
      status: "rechazada",
      message: "Solicitud marcada como rechazada."
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  res.status(status).send(error.message || "Error interno del servidor.");
});

Promise.all([
  ensureDataFile(reservationsFile),
  ensureDataFile(ordersFile),
  ensureDataFile(accessUsersFile),
  ensureDataFile(premiumAdminAuditFile)
]).then(() => {
  app.listen(port, () => {
    console.log(`Benko Tour backend escuchando en http://localhost:${port}`);
  });
});
