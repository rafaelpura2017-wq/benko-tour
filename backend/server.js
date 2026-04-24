import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import nodemailer from "nodemailer";
import { MercadoPagoConfig, Preference } from "mercadopago";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const reservationsFile = path.join(dataDir, "reservations.json");
const ordersFile = path.join(dataDir, "orders.json");
const accessUsersFile = path.join(dataDir, "access-users.json");

const app = express();
const port = Number(process.env.PORT || 8787);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "*";
const reservationEmail = process.env.BENKO_RESERVATION_EMAIL || "";

app.use(cors({ origin: frontendOrigin === "*" ? true : frontendOrigin }));
app.use(express.json({ limit: "1mb" }));

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

function validateRequiredFields(payload, fields) {
  const missing = fields.filter((field) => !payload[field]);

  if (missing.length) {
    const error = new Error(`Faltan campos obligatorios: ${missing.join(", ")}`);
    error.status = 400;
    throw error;
  }
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

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  res.status(status).send(error.message || "Error interno del servidor.");
});

Promise.all([ensureDataFile(reservationsFile), ensureDataFile(ordersFile), ensureDataFile(accessUsersFile)]).then(() => {
  app.listen(port, () => {
    console.log(`Benko Tour backend escuchando en http://localhost:${port}`);
  });
});
