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
const topLoginLink = document.querySelector(".benko-tour__login");
const accessTabsContainer = document.querySelector(".benko-tour__access-tabs");
const accessTabButtons = document.querySelectorAll("[data-access-tab]");
const accessForms = document.querySelectorAll("[data-access-panel]");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const accessStatus = document.querySelector("#access-status");
const accessSession = document.querySelector("#access-session");
const accessLoggedPanel = document.querySelector("#access-logged-panel");
const accessLoggedCopy = document.querySelector("#access-logged-copy");
const logoutButton = document.querySelector("#logout-button");
const reviewForm = document.querySelector("#review-form");
const reviewStatus = document.querySelector("#review-status");
const reviewAverage = document.querySelector("#review-average");
const reviewAverageStars = document.querySelector("#review-average-stars");
const reviewCount = document.querySelector("#review-count");
const reviewSpotlight = document.querySelector("#review-spotlight");
const reviewList = document.querySelector("#review-list");
const reviewRatingInput = document.querySelector("#review-rating");
const ratingButtons = document.querySelectorAll(".benko-tour__rating-star");

const cart = new Map();
const STORAGE_KEYS = {
  users: "benko-tour-users",
  session: "benko-tour-session",
  reviews: "benko-tour-reviews"
};
const defaultReviews = [
  {
    id: "seed-1",
    name: "María C.",
    city: "Bogotá",
    packageName: "Ruta principal Cartagena - Palenque",
    rating: 5,
    comment: "La logística desde Cartagena fue muy clara, el almuerzo estuvo excelente y el recorrido se sintió auténtico, no turístico de mentira.",
    createdAt: "2026-01-18T10:00:00.000Z"
  },
  {
    id: "seed-2",
    name: "Equipo universitario",
    city: "Medellín",
    packageName: "Ruta Comunitaria",
    rating: 5,
    comment: "Llevamos un grupo académico y funcionó muy bien. La historia, la música y el contacto con la comunidad hicieron la experiencia memorable.",
    createdAt: "2026-02-03T10:00:00.000Z"
  },
  {
    id: "seed-3",
    name: "Familia viajera",
    city: "Cali",
    packageName: "Ruta principal Cartagena - Palenque",
    rating: 4,
    comment: "Nos encantó poder reservar rápido por WhatsApp y además comprar recuerdos en la misma página. Eso facilita mucho la conversión.",
    createdAt: "2026-02-14T10:00:00.000Z"
  }
];

let activeAccessTab = "login";
let spotlightIndex = 0;
let reviewRotationTimer = null;

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

function loadStoredValue(key, fallback) {
  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveStoredValue(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getUsers() {
  return loadStoredValue(STORAGE_KEYS.users, []);
}

function saveUsers(users) {
  saveStoredValue(STORAGE_KEYS.users, users);
}

function getSessionUserId() {
  return window.localStorage.getItem(STORAGE_KEYS.session) || "";
}

function setSessionUserId(userId) {
  window.localStorage.setItem(STORAGE_KEYS.session, userId);
}

function clearSessionUserId() {
  window.localStorage.removeItem(STORAGE_KEYS.session);
}

function getSortedReviews() {
  return [...loadStoredValue(STORAGE_KEYS.reviews, defaultReviews)].sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function saveReviews(reviews) {
  saveStoredValue(STORAGE_KEYS.reviews, reviews);
}

function getCurrentUser() {
  const sessionUserId = getSessionUserId();
  return getUsers().find((user) => user.id === sessionUserId) || null;
}

async function hashPassword(password) {
  if (window.crypto && window.crypto.subtle && typeof TextEncoder !== "undefined") {
    const encodedPassword = new TextEncoder().encode(password);
    const digest = await window.crypto.subtle.digest("SHA-256", encodedPassword);

    return Array.from(new Uint8Array(digest))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }

  return `legacy-${btoa(unescape(encodeURIComponent(password)))}`;
}

function getStarString(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const roundedRating = Math.round(safeRating);
  return `${"★".repeat(roundedRating)}${"☆".repeat(5 - roundedRating)}`;
}

function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent !== undefined) {
    element.textContent = textContent;
  }

  return element;
}

function setActiveAccessTab(tabName) {
  activeAccessTab = tabName;

  accessTabButtons.forEach((button) => {
    button.classList.toggle("benko-tour__access-tab--active", button.dataset.accessTab === tabName);
  });

  accessForms.forEach((form) => {
    form.classList.toggle("benko-tour__access-form--hidden", form.dataset.accessPanel !== tabName);
  });
}

function renderAccessSession(user) {
  accessSession.replaceChildren();

  if (!user) {
    accessSession.append(
      createElement("strong", "", "Todavía no has iniciado sesión"),
      createElement("span", "", "Tu cuenta te permitirá guardar acceso en este navegador y dejar valoraciones en la página.")
    );
    return;
  }

  accessSession.append(
    createElement("strong", "", `Sesión lista para ${user.name}`),
    createElement("span", "", `${user.email}${user.city ? ` · ${user.city}` : ""}`)
  );
}

function syncReviewFormState() {
  const currentUser = getCurrentUser();
  const reviewFields = reviewForm.querySelectorAll("input, select, textarea, button");

  reviewFields.forEach((field) => {
    if (field.type !== "hidden") {
      field.disabled = !currentUser;
    }
  });

  reviewForm.classList.toggle("benko-tour__feedback-form--locked", !currentUser);

  if (!currentUser) {
    reviewRatingInput.value = "";
    updateRatingButtons(0);
    setStatus(reviewStatus, "", "Inicia sesión para dejar tu opinión y tu calificación con estrellas.");
    return;
  }

  const cityField = reviewForm.elements.namedItem("city");

  if (cityField && !cityField.value && currentUser.city) {
    cityField.value = currentUser.city;
  }

  setStatus(reviewStatus, "", "Tu sesión está activa. Ya puedes compartir tu experiencia del tour.");
}

function renderAccessState() {
  const currentUser = getCurrentUser();

  renderAccessSession(currentUser);
  syncReviewFormState();

  if (topLoginLink) {
    topLoginLink.textContent = currentUser ? "Mi cuenta" : "Iniciar sesión";
  }

  if (!currentUser) {
    accessTabsContainer.classList.remove("benko-tour__hidden");
    accessLoggedPanel.classList.add("benko-tour__hidden");
    setActiveAccessTab(activeAccessTab);
    return;
  }

  accessTabsContainer.classList.add("benko-tour__hidden");
  accessLoggedPanel.classList.remove("benko-tour__hidden");
  accessForms.forEach((form) => form.classList.add("benko-tour__access-form--hidden"));
  accessLoggedCopy.textContent = `${currentUser.name}, tu cuenta está activa en este navegador. Ya puedes dejar opiniones, estrellas y volver más rápido cuando quieras.`;
}

function updateRatingButtons(value) {
  ratingButtons.forEach((button) => {
    const buttonValue = Number(button.dataset.ratingValue || 0);
    button.classList.toggle("is-active", buttonValue <= value);
  });
}

function createReviewCard(review) {
  const article = createElement("article", "benko-tour__review-card");
  const tag = createElement("span", "benko-tour__card-tag", `${review.rating} estrellas`);
  const stars = createElement("div", "benko-tour__stars", getStarString(review.rating));
  const quote = createElement("p", "", `“${review.comment}”`);
  const name = createElement("strong", "", review.name);
  const meta = createElement("div", "benko-tour__review-meta");
  const packageMeta = createElement("span", "", review.packageName);
  const cityMeta = createElement("span", "", review.city || "Sin ciudad");

  meta.append(packageMeta, cityMeta);
  article.append(tag, stars, quote, name, meta);
  return article;
}

function renderReviewSpotlight(review) {
  reviewSpotlight.replaceChildren();

  if (!review) {
    reviewSpotlight.append(createElement("p", "benko-tour__note", "Todavía no hay valoraciones para mostrar."));
    return;
  }

  const tag = createElement("span", "benko-tour__card-tag", "Opinión destacada");
  const stars = createElement("div", "benko-tour__stars benko-tour__stars--display", getStarString(review.rating));
  const quote = createElement("p", "benko-tour__review-spotlight-quote", `“${review.comment}”`);
  const meta = createElement("div", "benko-tour__review-spotlight-meta");
  const name = createElement("span", "benko-tour__review-spotlight-name", review.name);
  const packageMeta = createElement("span", "", review.packageName);
  const cityMeta = createElement("span", "", review.city || "Sin ciudad");

  meta.append(name, packageMeta, cityMeta);
  reviewSpotlight.append(tag, stars, quote, meta);
}

function renderReviews() {
  const reviews = getSortedReviews();
  const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = reviews.length ? totalRatings / reviews.length : 0;

  reviewAverage.textContent = averageRating.toFixed(1);
  reviewAverageStars.textContent = getStarString(averageRating);
  reviewAverageStars.setAttribute("aria-label", `Valoración promedio ${averageRating.toFixed(1)} de 5 estrellas`);
  reviewCount.textContent = `${reviews.length} opinion${reviews.length === 1 ? "" : "es"} compartida${reviews.length === 1 ? "" : "s"}`;

  reviewList.replaceChildren();
  reviews.slice(0, 3).forEach((review) => {
    reviewList.appendChild(createReviewCard(review));
  });

  if (!reviews.length) {
    reviewSpotlight.replaceChildren(createElement("p", "benko-tour__note", "Aún no hay opiniones para mostrar."));
    return;
  }

  if (spotlightIndex >= reviews.length) {
    spotlightIndex = 0;
  }

  renderReviewSpotlight(reviews[spotlightIndex]);
}

function startReviewRotation() {
  const reviews = getSortedReviews();

  window.clearInterval(reviewRotationTimer);

  if (reviews.length < 2) {
    return;
  }

  reviewRotationTimer = window.setInterval(() => {
    const latestReviews = getSortedReviews();
    spotlightIndex = (spotlightIndex + 1) % latestReviews.length;
    renderReviewSpotlight(latestReviews[spotlightIndex]);
  }, 5200);
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

accessTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveAccessTab(button.dataset.accessTab || "login");
  });
});

ratingButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const ratingValue = Number(button.dataset.ratingValue || 0);
    reviewRatingInput.value = String(ratingValue);
    updateRatingButtons(ratingValue);
  });
});

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!loginForm.reportValidity()) {
      return;
    }

    const formData = new FormData(loginForm);
    const email = normalizeEmail(formData.get("email"));
    const password = String(formData.get("password") || "");
    const users = getUsers();
    const user = users.find((candidate) => candidate.email === email);

    if (!user) {
      setStatus(accessStatus, "error", "No encontramos una cuenta con ese correo.");
      return;
    }

    const passwordHash = await hashPassword(password);

    if (user.passwordHash !== passwordHash) {
      setStatus(accessStatus, "error", "La contraseña no coincide. Intenta de nuevo.");
      return;
    }

    setSessionUserId(user.id);
    loginForm.reset();
    renderAccessState();
    setStatus(accessStatus, "success", `Bienvenido de nuevo, ${user.name}.`);
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!registerForm.reportValidity()) {
      return;
    }

    const formData = new FormData(registerForm);
    const name = String(formData.get("name") || "").trim();
    const city = String(formData.get("city") || "").trim();
    const email = normalizeEmail(formData.get("email"));
    const password = String(formData.get("password") || "");
    const users = getUsers();

    if (users.some((candidate) => candidate.email === email)) {
      setStatus(accessStatus, "error", "Ya existe una cuenta con ese correo. Inicia sesión o usa otro email.");
      return;
    }

    const newUser = {
      id: createReference("USR"),
      name,
      city,
      email,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString()
    };

    saveUsers([...users, newUser]);
    setSessionUserId(newUser.id);
    registerForm.reset();
    renderAccessState();
    setStatus(accessStatus, "success", `Tu cuenta quedó creada, ${newUser.name}.`);
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    clearSessionUserId();

    if (loginForm) {
      loginForm.reset();
    }

    if (registerForm) {
      registerForm.reset();
    }

    if (reviewForm) {
      reviewForm.reset();
    }

    reviewRatingInput.value = "";
    updateRatingButtons(0);
    setActiveAccessTab("login");
    renderAccessState();
    setStatus(accessStatus, "", "Tu sesión se cerró. Puedes volver a entrar cuando quieras.");
  });
}

if (reviewForm) {
  reviewForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const currentUser = getCurrentUser();

    if (!currentUser) {
      setStatus(reviewStatus, "error", "Inicia sesión para dejar tu valoración.");
      return;
    }

    if (!reviewForm.reportValidity()) {
      return;
    }

    if (!reviewRatingInput.value) {
      setStatus(reviewStatus, "error", "Selecciona primero una cantidad de estrellas.");
      return;
    }

    const formData = new FormData(reviewForm);
    const city = String(formData.get("city") || "").trim() || currentUser.city || "Sin ciudad";
    const newReview = {
      id: createReference("REV"),
      userId: currentUser.id,
      name: currentUser.name,
      city,
      packageName: String(formData.get("package") || "").trim(),
      rating: Number(reviewRatingInput.value),
      comment: String(formData.get("comment") || "").trim(),
      createdAt: new Date().toISOString()
    };

    saveReviews([...getSortedReviews(), newReview]);
    spotlightIndex = 0;
    reviewForm.reset();

    const cityField = reviewForm.elements.namedItem("city");

    if (cityField && currentUser.city) {
      cityField.value = currentUser.city;
    }

    reviewRatingInput.value = "";
    updateRatingButtons(0);
    renderReviews();
    startReviewRotation();
    setStatus(reviewStatus, "success", "Gracias por compartir tu experiencia con Benko Tour.");
  });
}

renderAccessState();
renderReviews();
startReviewRotation();
setActiveAccessTab(activeAccessTab);
renderCart();
