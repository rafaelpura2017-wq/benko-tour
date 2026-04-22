const defaultConfig = {
  businessName: "Benko Tour",
  whatsappNumber: "573245065560",
  channels: {
    reservationApiUrl: "",
    orderApiUrl: "",
    reservationApiToken: "",
    reservationEmail: "",
    enableWhatsAppFallback: true
  },
  payments: {
    wompi: {
      provider: "Wompi",
      checkoutEndpoint: "",
      fallbackCheckoutUrl: ""
    },
    mercadopago: {
      provider: "Mercado Pago",
      preferenceEndpoint: "",
      fallbackCheckoutUrl: ""
    }
  }
};

const appConfig = {
  ...defaultConfig,
  ...(window.BENKO_CONFIG || {}),
  channels: {
    ...defaultConfig.channels,
    ...((window.BENKO_CONFIG && window.BENKO_CONFIG.channels) || {})
  },
  payments: {
    wompi: {
      ...defaultConfig.payments.wompi,
      ...((window.BENKO_CONFIG && window.BENKO_CONFIG.payments && window.BENKO_CONFIG.payments.wompi) || {})
    },
    mercadopago: {
      ...defaultConfig.payments.mercadopago,
      ...((window.BENKO_CONFIG && window.BENKO_CONFIG.payments && window.BENKO_CONFIG.payments.mercadopago) || {})
    }
  }
};

const formatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const packageSelect = document.querySelector("#package-select");
const travelersInput = document.querySelector("#travelers");
const estimateTotal = document.querySelector("#estimate-total");
const estimateCaption = document.querySelector("#estimate-caption");
const bookingForm = document.querySelector("#booking-form");
const bookingStatus = document.querySelector("#booking-status");
const bookingWhatsappButton = document.querySelector("#booking-whatsapp");
const bookingEmailButton = document.querySelector("#booking-email");
const reservationPayWompiButton = document.querySelector("#reservation-pay-wompi");
const reservationPayMercadoPagoButton = document.querySelector("#reservation-pay-mercadopago");
const packageButtons = document.querySelectorAll(".js-package-pick");
const addToCartButtons = document.querySelectorAll(".js-add-to-cart");
const cartItemsContainer = document.querySelector("#cart-items");
const cartTotalElement = document.querySelector("#cart-total");
const cartCountElement = document.querySelector("#cart-count");
const cartWhatsappButton = document.querySelector("#cart-checkout");
const cartEmailButton = document.querySelector("#cart-email");
const cartPayWompiButton = document.querySelector("#cart-pay-wompi");
const cartPayMercadoPagoButton = document.querySelector("#cart-pay-mercadopago");
const cartClearButton = document.querySelector("#cart-clear");
const cartStatus = document.querySelector("#cart-status");
const cartCityInput = document.querySelector("#cart-city");
const dateInput = bookingForm.querySelector('input[name="date"]');

const cart = new Map();

function formatCOP(value) {
  return formatter.format(value);
}

function setStatus(element, type, message) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.remove("benko-tour__status--success", "benko-tour__status--error");

  if (type === "success") {
    element.classList.add("benko-tour__status--success");
  }

  if (type === "error") {
    element.classList.add("benko-tour__status--error");
  }
}

function createReference(prefix) {
  return `${prefix}-${Date.now()}`;
}

function getSelectedPackageData() {
  const option = packageSelect.options[packageSelect.selectedIndex];
  return {
    label: option.textContent.split(" - ")[0],
    price: Number(option.dataset.price || 0)
  };
}

function updateEstimate() {
  const { label, price } = getSelectedPackageData();
  const travelers = Math.max(1, Number(travelersInput.value || 1));
  const total = price * travelers;

  estimateTotal.textContent = `${formatCOP(total)} COP`;
  estimateCaption.textContent = `${travelers} viajero${travelers > 1 ? "s" : ""} en ${label}`;
}

function scrollToReservations() {
  const section = document.querySelector("#reservas");
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function openWhatsApp(message) {
  window.open(`https://wa.me/${appConfig.whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");
}

function openMailto(subject, body) {
  const email = appConfig.channels.reservationEmail;

  if (!email) {
    return false;
  }

  const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
  return true;
}

async function postJson(url, payload) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (appConfig.channels.reservationApiToken) {
    headers.Authorization = `Bearer ${appConfig.channels.reservationApiToken}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "La solicitud al backend falló.");
  }

  return response.json().catch(() => ({}));
}

async function submitReservation(payload) {
  if (!appConfig.channels.reservationApiUrl) {
    return { skipped: true };
  }

  return postJson(appConfig.channels.reservationApiUrl, payload);
}

async function submitOrder(payload) {
  if (!appConfig.channels.orderApiUrl) {
    return { skipped: true };
  }

  return postJson(appConfig.channels.orderApiUrl, payload);
}

function buildBookingPayload() {
  if (!bookingForm.reportValidity()) {
    return null;
  }

  const formData = new FormData(bookingForm);
  const { label, price } = getSelectedPackageData();
  const travelers = Math.max(1, Number(formData.get("travelers") || 1));
  const total = price * travelers;

  return {
    reference: createReference("BKT"),
    type: "reservation",
    packageName: label,
    packagePrice: price,
    travelers,
    total,
    currency: "COP",
    name: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    email: appConfig.channels.reservationEmail,
    date: String(formData.get("date") || "").trim(),
    language: String(formData.get("language") || "").trim(),
    pickup: String(formData.get("pickup") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
    description: `Reserva ${label} para ${travelers} viajero(s)`
  };
}

function buildBookingMessage(payload) {
  return [
    `Hola ${appConfig.businessName}, quiero reservar un itinerario.`,
    "",
    `Referencia: ${payload.reference}`,
    `Nombre: ${payload.name}`,
    `WhatsApp: ${payload.phone}`,
    `Fecha: ${payload.date}`,
    `Paquete: ${payload.packageName}`,
    `Viajeros: ${payload.travelers}`,
    `Idioma: ${payload.language}`,
    `Recogida en Cartagena: ${payload.pickup}`,
    `Estimado: ${formatCOP(payload.total)} COP`,
    `Notas: ${payload.notes || "Sin notas adicionales"}`
  ].join("\n");
}

function createHiddenForm(action, fields) {
  const form = document.createElement("form");
  form.action = action;
  form.method = "GET";
  form.target = "_blank";
  form.style.display = "none";

  Object.entries(fields).forEach(([name, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

async function launchWompiCheckout(payload, statusElement) {
  const endpoint = appConfig.payments.wompi.checkoutEndpoint;

  if (!endpoint && appConfig.payments.wompi.fallbackCheckoutUrl) {
    window.open(appConfig.payments.wompi.fallbackCheckoutUrl, "_blank");
    setStatus(statusElement, "success", "Se abrió el checkout de Wompi configurado por link.");
    return;
  }

  if (!endpoint) {
    setStatus(statusElement, "error", "Configura el endpoint de Wompi en config.js para activar este pago.");
    return;
  }

  const response = await postJson(endpoint, payload);

  if (!response.action || !response.fields) {
    throw new Error("El backend de Wompi no devolvió la información necesaria del checkout.");
  }

  createHiddenForm(response.action, response.fields);
  setStatus(statusElement, "success", "Se abrió Wompi en una nueva pestaña.");
}

async function launchMercadoPagoCheckout(payload, statusElement) {
  const endpoint = appConfig.payments.mercadopago.preferenceEndpoint;

  if (!endpoint && appConfig.payments.mercadopago.fallbackCheckoutUrl) {
    window.open(appConfig.payments.mercadopago.fallbackCheckoutUrl, "_blank");
    setStatus(statusElement, "success", "Se abrió el checkout de Mercado Pago configurado por link.");
    return;
  }

  if (!endpoint) {
    setStatus(statusElement, "error", "Configura el endpoint de Mercado Pago en config.js para activar este pago.");
    return;
  }

  const response = await postJson(endpoint, payload);
  const initPoint = response.initPoint || response.init_point || response.sandboxInitPoint || response.sandbox_init_point;

  if (!initPoint) {
    throw new Error("El backend de Mercado Pago no devolvió un checkout válido.");
  }

  window.open(initPoint, "_blank");
  setStatus(statusElement, "success", "Se abrió Mercado Pago en una nueva pestaña.");
}

async function handleReservationSubmit(channel = "auto") {
  const payload = buildBookingPayload();

  if (!payload) {
    setStatus(bookingStatus, "error", "Completa los campos obligatorios para continuar con la reserva.");
    return null;
  }

  const message = buildBookingMessage(payload);

  try {
    if (channel === "auto") {
      const response = await submitReservation(payload);

      if (!response.skipped) {
        setStatus(bookingStatus, "success", "La reserva fue guardada en el backend. Ya puedes completar el pago.");
        return payload;
      }
    }

    if (channel === "email") {
      const emailOpened = openMailto(`Nueva reserva ${payload.reference}`, message);

      if (emailOpened) {
        setStatus(bookingStatus, "success", "Se abrió tu cliente de correo con la reserva lista.");
      } else {
        setStatus(bookingStatus, "error", "Configura `reservationEmail` en config.js para usar correo.");
      }

      return payload;
    }

    if (channel === "whatsapp" || (channel === "auto" && appConfig.channels.enableWhatsAppFallback)) {
      openWhatsApp(message);
      setStatus(bookingStatus, "success", "Se abrió WhatsApp con la reserva lista para enviar.");
      return payload;
    }

    setStatus(bookingStatus, "error", "No hay canal configurado todavía para completar la reserva.");
    return payload;
  } catch (error) {
    setStatus(bookingStatus, "error", error.message);
    return payload;
  }
}

function getCartItems() {
  return Array.from(cart.values());
}

function buildCartPayload() {
  const items = getCartItems();
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    reference: createReference("SHOP"),
    type: "shop",
    description: "Pedido tienda Benko Tour",
    city: cartCityInput.value.trim() || "Sin ciudad especificada",
    currency: "COP",
    items,
    total
  };
}

function buildCartMessage(payload) {
  const lines = payload.items.map((item) => `- ${item.name} x${item.quantity}: ${formatCOP(item.price * item.quantity)} COP`);
  return [
    `Hola ${appConfig.businessName}, quiero comprar estos productos:`,
    "",
    `Referencia: ${payload.reference}`,
    ...lines,
    "",
    `Ciudad para envío o entrega: ${payload.city}`,
    `Total estimado: ${formatCOP(payload.total)} COP`
  ].join("\n");
}

function renderCart() {
  const items = getCartItems();
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  cartCountElement.textContent = String(count);
  cartTotalElement.textContent = `${formatCOP(total)} COP`;

  if (!items.length) {
    cartItemsContainer.innerHTML = '<p class="benko-tour__cart-empty">Todavía no has agregado productos.</p>';
    return;
  }

  cartItemsContainer.innerHTML = items.map((item) => `
    <div class="benko-tour__cart-item">
      <div class="benko-tour__cart-item-head">
        <strong>${item.name}</strong>
        <button class="benko-tour__cart-remove" type="button" data-remove-id="${item.id}">Quitar</button>
      </div>
      <div class="benko-tour__cart-meta">
        <span>Cantidad: ${item.quantity}</span>
        <span>${formatCOP(item.price * item.quantity)} COP</span>
      </div>
    </div>
  `).join("");

  cartItemsContainer.querySelectorAll("[data-remove-id]").forEach((button) => {
    button.addEventListener("click", () => {
      cart.delete(button.dataset.removeId);
      renderCart();
    });
  });
}

packageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.dataset.package;

    if (!selected) {
      return;
    }

    packageSelect.value = selected;
    updateEstimate();
    scrollToReservations();
  });
});

addToCartButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.id;
    const name = button.dataset.name;
    const price = Number(button.dataset.price || 0);

    if (!id || !name || !price) {
      return;
    }

    const existing = cart.get(id);

    if (existing) {
      existing.quantity += 1;
      cart.set(id, existing);
    } else {
      cart.set(id, { id, name, price, quantity: 1 });
    }

    renderCart();
    setStatus(cartStatus, "success", `${name} fue agregado al carrito.`);
  });
});

packageSelect.addEventListener("change", updateEstimate);
travelersInput.addEventListener("input", updateEstimate);
updateEstimate();

if (dateInput) {
  dateInput.min = new Date().toISOString().split("T")[0];
}

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleReservationSubmit("auto");
});

bookingWhatsappButton.addEventListener("click", async () => {
  await handleReservationSubmit("whatsapp");
});

bookingEmailButton.addEventListener("click", async () => {
  await handleReservationSubmit("email");
});

reservationPayWompiButton.addEventListener("click", async () => {
  const payload = buildBookingPayload();

  if (!payload) {
    setStatus(bookingStatus, "error", "Completa primero la reserva antes de pagar.");
    return;
  }

  try {
    await submitReservation(payload);
    await launchWompiCheckout(payload, bookingStatus);
  } catch (error) {
    setStatus(bookingStatus, "error", error.message);
  }
});

reservationPayMercadoPagoButton.addEventListener("click", async () => {
  const payload = buildBookingPayload();

  if (!payload) {
    setStatus(bookingStatus, "error", "Completa primero la reserva antes de pagar.");
    return;
  }

  try {
    await submitReservation(payload);
    await launchMercadoPagoCheckout(payload, bookingStatus);
  } catch (error) {
    setStatus(bookingStatus, "error", error.message);
  }
});

cartWhatsappButton.addEventListener("click", async () => {
  const payload = buildCartPayload();

  if (!payload.items.length) {
    setStatus(cartStatus, "error", "Agrega al menos un producto al carrito antes de continuar.");
    return;
  }

  try {
    await submitOrder(payload);
  } catch (error) {
    setStatus(cartStatus, "error", error.message);
    return;
  }

  openWhatsApp(buildCartMessage(payload));
  setStatus(cartStatus, "success", "Se abrió WhatsApp con el pedido listo para enviar.");
});

cartEmailButton.addEventListener("click", async () => {
  const payload = buildCartPayload();

  if (!payload.items.length) {
    setStatus(cartStatus, "error", "Agrega al menos un producto al carrito antes de continuar.");
    return;
  }

  try {
    await submitOrder(payload);
  } catch (error) {
    setStatus(cartStatus, "error", error.message);
    return;
  }

  const emailOpened = openMailto(`Pedido tienda ${payload.reference}`, buildCartMessage(payload));

  if (emailOpened) {
    setStatus(cartStatus, "success", "Se abrió tu cliente de correo con el pedido listo.");
  } else {
    setStatus(cartStatus, "error", "Configura `reservationEmail` en config.js para usar correo.");
  }
});

cartPayWompiButton.addEventListener("click", async () => {
  const payload = buildCartPayload();

  if (!payload.items.length) {
    setStatus(cartStatus, "error", "Agrega al menos un producto al carrito antes de pagar.");
    return;
  }

  try {
    await submitOrder(payload);
    await launchWompiCheckout(payload, cartStatus);
  } catch (error) {
    setStatus(cartStatus, "error", error.message);
  }
});

cartPayMercadoPagoButton.addEventListener("click", async () => {
  const payload = buildCartPayload();

  if (!payload.items.length) {
    setStatus(cartStatus, "error", "Agrega al menos un producto al carrito antes de pagar.");
    return;
  }

  try {
    await submitOrder(payload);
    await launchMercadoPagoCheckout(payload, cartStatus);
  } catch (error) {
    setStatus(cartStatus, "error", error.message);
  }
});

cartClearButton.addEventListener("click", () => {
  cart.clear();
  renderCart();
  setStatus(cartStatus, "", "El carrito quedó vacío.");
});

renderCart();
