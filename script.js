const defaultConfig = {
  businessName: "Benko Tour",
  whatsappNumber: "573245065560",
  channels: {
    reservationApiUrl: "",
    orderApiUrl: "",
    accessApiUrl: "",
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
const catalogCartPanel = document.querySelector("[data-cart-panel]");
const catalogCartToggle = document.querySelector("[data-cart-toggle]");
const catalogCartPanelBody = document.querySelector("[data-cart-panel-body]");
const catalogCartToggleCount = document.querySelector("[data-cart-toggle-count]");
const catalogCartToggleAction = document.querySelector("[data-cart-toggle-action]");
const dateInput = bookingForm ? bookingForm.querySelector('input[name="date"]') : null;
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
const experienceRotatorElements = document.querySelectorAll("[data-experience-rotator]");

const cart = new Map();
const STORAGE_KEYS = {
  users: "benko-tour-users",
  session: "benko-tour-session",
  reviews: "benko-tour-reviews",
  cart: "benkoCart",
  cartPanelOpen: "benkoCartPanelOpen"
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
const experienceSlideDecks = {
  community: [
    {
      src: "./assets/images/experience/IMG_4836.JPG",
      alt: "Grupo de visitantes caminando por San Basilio de Palenque durante un tour cultural realizado por Benko Tour"
    },
    {
      src: "./assets/images/experience/PHOTO-2024-02-06-11-35-11.jpg",
      alt: "Grupo de visitantes frente a un mural colorido durante un tour cultural realizado en San Basilio de Palenque"
    },
    {
      src: "./assets/images/experience/san-basilio-de-palenque-tour-edited-1536x864.jpeg",
      alt: "Grupo de visitantes compartiendo una muestra cultural con la comunidad en San Basilio de Palenque"
    },
    {
      src: "./assets/images/experience/benkos tour.JPG",
      alt: "Visitantes posando entre instrumentos tradicionales dentro de un espacio cultural de Palenque"
    },
    {
      src: "./assets/images/experience/339850457_668394985054606_4815029087381544534_n.jpg",
      alt: "Demostración musical dentro de una casa tradicional durante la experiencia en Palenque"
    },
    {
      src: "./assets/images/experience/san-basilio-de-palenque-1536x864.jpeg",
      alt: "Vista del territorio de San Basilio de Palenque durante una experiencia guiada"
    }
  ],
  guide: [
    {
      src: "./assets/images/experience/IMG_4834.JPG",
      alt: "Guía local explicando una parada cultural durante un tour realizado en San Basilio de Palenque"
    },
    {
      src: "./assets/images/experience/IMG_6685.JPG",
      alt: "Guía de Benko Tour sonriendo durante una parada del recorrido cultural en Palenque"
    },
    {
      src: "./assets/images/experience/2FF12B6C-0A0F-4E69-8735-1F1DDA7A0548.jpg",
      alt: "Guía local explicando un mural poético durante el recorrido cultural"
    },
    {
      src: "./assets/images/experience/ae32684a-2f73-45bf-bd5e-0c5326ed45d5.jpg",
      alt: "Visitantes y guía junto a un símbolo de memoria afrodescendiente en Palenque"
    },
    {
      src: "./assets/images/experience/EE202B76-68E7-49CD-859C-EFD331B85BC1.jpg",
      alt: "Grupo de visitantes posando frente a un mural emblemático durante la ruta guiada"
    }
  ],
  music: [
    {
      src: "./assets/images/experience/palenque-cartagena-music-1536x1152.jpeg",
      alt: "Fachada colorida vinculada a la música y la expresión cultural de Palenque"
    },
    {
      src: "./assets/images/experience/74fc96e1-e03d-4191-8f13-0b732e814f68.jpg",
      alt: "Visitante en un espacio artístico lleno de firmas, instrumentos y memoria musical"
    },
    {
      src: "./assets/images/experience/9645eddd-2a0c-487b-a7f2-eeb04d64471e.jpg",
      alt: "Visitantes y guía posando entre instrumentos tradicionales dentro de un espacio cultural"
    },
    {
      src: "./assets/images/experience/339850457_668394985054606_4815029087381544534_n.jpg",
      alt: "Momento musical en una casa tradicional durante la experiencia en Palenque"
    }
  ],
  history: [
    {
      src: "./assets/images/experience/the-main-square-palenque-2.jpg",
      alt: "Monumento de Benkos Biohó en la plaza principal de San Basilio de Palenque"
    },
    {
      src: "./assets/images/experience/img_4599-1-edited-1536x864 (1).jpg",
      alt: "Monumento de Kid Pambelé como símbolo histórico y deportivo del territorio"
    },
    {
      src: "./assets/images/experience/FDE597DF-2D8B-4DC5-A6AD-EAD685DBB1D2.jpg",
      alt: "Visitantes junto a un mural que resalta memoria, identidad y orgullo afro"
    },
    {
      src: "./assets/images/experience/7267BA29-F8F8-4BCE-91B8-61590464BF03.jpg",
      alt: "Grupo de visitantes frente a un mural con mensaje de memoria y dignidad"
    }
  ]
};
const experienceRotators = Array.from(experienceRotatorElements).map((figure) => {
  const key = figure.dataset.experienceRotator || "";
  return {
    key,
    index: 0,
    isBusy: false,
    figure,
    image: figure.querySelector("[data-experience-image]"),
    slides: experienceSlideDecks[key] || []
  };
});

let activeAccessTab = "login";
let spotlightIndex = 0;
let reviewRotationTimer = null;
let experienceRotationTimer = null;

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

function slugifyValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function sanitizeCartItem(item) {
  const name = String(item && item.name ? item.name : "").trim();
  const id = String(item && item.id ? item.id : slugifyValue(name)).trim();
  const price = Number(item && item.price ? item.price : 0);
  const quantity = Number(item && item.quantity ? item.quantity : 0);

  if (!id || !name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
    return null;
  }

  return {
    id,
    name,
    price,
    quantity,
    category: String(item && item.category ? item.category : "").trim(),
    image: String(item && item.image ? item.image : "").trim()
  };
}

function getStoredCartItems() {
  const storedItems = loadStoredValue(STORAGE_KEYS.cart, []);
  return Array.isArray(storedItems)
    ? storedItems.map(sanitizeCartItem).filter(Boolean)
    : [];
}

function restoreCartState() {
  cart.clear();
  getStoredCartItems().forEach((item) => {
    cart.set(item.id, item);
  });
}

async function syncCartWithAccount(items) {
  if (typeof window.authFirebase === "undefined" || typeof window.authFirebase.guardarCarrito !== "function") {
    return;
  }

  try {
    const currentUser = typeof window.authFirebase.obtenerUsuarioActual === "function"
      ? window.authFirebase.obtenerUsuarioActual()
      : null;

    if (!currentUser) {
      return;
    }

    await window.authFirebase.guardarCarrito(items);
  } catch (error) {
    console.error("No se pudo sincronizar el carrito con la cuenta.", error);
  }
}

function saveCartState() {
  const items = Array.from(cart.values());
  saveStoredValue(STORAGE_KEYS.cart, items);
  void syncCartWithAccount(items);
}

function setCatalogCartPanelOpenState(isOpen, options = {}) {
  if (!catalogCartPanel || !catalogCartToggle) {
    return;
  }

  const shouldOpen = Boolean(isOpen);

  catalogCartPanel.classList.toggle("is-open", shouldOpen);
  catalogCartPanel.classList.toggle("is-collapsed", !shouldOpen);
  catalogCartToggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  catalogCartToggle.setAttribute("aria-label", shouldOpen ? "Ocultar carrito" : "Abrir carrito");

  if (catalogCartPanelBody) {
    catalogCartPanelBody.hidden = !shouldOpen;
  }

  if (catalogCartToggleAction) {
    catalogCartToggleAction.textContent = shouldOpen ? "Ocultar" : "Abrir";
  }

  if (!options.skipStorage) {
    saveStoredValue(STORAGE_KEYS.cartPanelOpen, shouldOpen);
  }
}

function setupCatalogCartPanel() {
  if (!catalogCartPanel || !catalogCartToggle) {
    return;
  }

  setCatalogCartPanelOpenState(false, { skipStorage: true });

  catalogCartToggle.addEventListener("click", () => {
    const isOpen = catalogCartPanel.classList.contains("is-open");
    setCatalogCartPanelOpenState(!isOpen);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && catalogCartPanel.classList.contains("is-open")) {
      setCatalogCartPanelOpenState(false);
    }
  });
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
  if (!accessSession) {
    return;
  }

  accessSession.replaceChildren();

  if (!user) {
    accessSession.append(
      createElement("strong", "", "Todavía no has guardado tus datos"),
      createElement("span", "", "Tu cuenta te permitirá guardar nombre, contacto y ciudad en este navegador para volver más rápido a reservar.")
    );
    return;
  }

  const detailLine = [user.email, user.phone, user.city].filter(Boolean).join(" · ");

  accessSession.append(
    createElement("strong", "", `Sesión lista para ${user.name}`),
    createElement("span", "", detailLine || "Tus datos básicos ya quedaron guardados en este navegador.")
  );
}

function syncBookingIdentity(user) {
  if (!bookingForm) {
    return;
  }

  const nameField = bookingForm.elements.namedItem("name");
  const phoneField = bookingForm.elements.namedItem("phone");

  if (nameField && !nameField.value && user && user.name) {
    nameField.value = user.name;
  }

  if (phoneField && !phoneField.value && user && user.phone) {
    phoneField.value = user.phone;
  }
}

function syncReviewFormState() {
  if (!reviewForm) {
    return;
  }

  const currentUser = getCurrentUser();
  const nameField = reviewForm.elements.namedItem("name");
  const cityField = reviewForm.elements.namedItem("city");

  reviewForm.classList.remove("benko-tour__feedback-form--locked");

  if (nameField && !nameField.value && currentUser && currentUser.name) {
    nameField.value = currentUser.name;
  }

  if (cityField && !cityField.value && currentUser && currentUser.city) {
    cityField.value = currentUser.city;
  }

  if (!currentUser) {
    setStatus(reviewStatus, "", "Puedes dejar tu opinión sin registrarte. Si vuelves a reservar, tu sesión puede guardar tus datos básicos.");
    return;
  }

  setStatus(reviewStatus, "", "Puedes valorar sin registrarte, y como ya iniciaste sesión tus datos básicos se completan más rápido.");
}

function renderAccessState() {
  const currentUser = getCurrentUser();

  renderAccessSession(currentUser);
  syncBookingIdentity(currentUser);
  syncReviewFormState();

  if (topLoginLink) {
    topLoginLink.textContent = currentUser ? "Mi cuenta" : "Iniciar sesión";
    topLoginLink.setAttribute("href", "./acceso.html#acceso");
  }

  if (!accessTabsContainer || !accessLoggedPanel || !accessLoggedCopy) {
    return;
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
  accessLoggedCopy.textContent = `${currentUser.name}, tu cuenta está activa en este navegador. Tus datos básicos quedan listos para reservar más rápido cuando quieras volver.`;
}

function updateRatingButtons(value) {
  ratingButtons.forEach((button) => {
    const buttonValue = Number(button.dataset.ratingValue || 0);
    button.classList.toggle("is-active", buttonValue <= value);
  });
}

function formatReviewDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(parsedDate);
}

function createReviewCard(review) {
  const article = createElement("article", "benko-tour__review-card benko-tour__review-card--stream");
  const head = createElement("div", "benko-tour__review-card-head");
  const identity = createElement("div", "benko-tour__review-card-identity");
  const name = createElement("strong", "benko-tour__review-card-name", review.name);
  const location = createElement(
    "span",
    "benko-tour__review-card-location",
    review.city ? `Visitante desde ${review.city}` : "Visitante del recorrido"
  );
  const badge = createElement("span", "benko-tour__review-badge", `${review.rating}/5`);
  const stars = createElement("div", "benko-tour__stars benko-tour__stars--display", getStarString(review.rating));
  const quote = createElement("p", "benko-tour__review-copy", `“${review.comment}”`);
  const meta = createElement("div", "benko-tour__review-meta");
  const packageMeta = createElement("span", "", review.packageName);
  const cityMeta = createElement("span", "", review.city || "Ciudad no indicada");
  const dateMeta = createElement("span", "", formatReviewDate(review.createdAt) || "Fecha reciente");

  identity.append(name, location);
  head.append(identity, badge);
  meta.append(packageMeta, cityMeta, dateMeta);
  article.append(head, stars, quote, meta);
  return article;
}

function renderReviewSpotlight(review) {
  if (!reviewSpotlight) {
    return;
  }

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
  if (!reviewAverage || !reviewAverageStars || !reviewCount || !reviewList) {
    return;
  }

  const reviews = getSortedReviews();
  const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = reviews.length ? totalRatings / reviews.length : 0;

  reviewAverage.textContent = averageRating.toFixed(1);
  reviewAverageStars.textContent = getStarString(averageRating);
  reviewAverageStars.setAttribute("aria-label", `Valoración promedio ${averageRating.toFixed(1)} de 5 estrellas`);
  reviewCount.textContent = `${reviews.length} voz${reviews.length === 1 ? "" : "es"} publicada${reviews.length === 1 ? "" : "s"}`;

  reviewList.replaceChildren();

  if (!reviews.length) {
    reviewList.append(createElement("p", "benko-tour__note", "Aún no hay opiniones publicadas en este momento."));
    reviewSpotlight.replaceChildren(createElement("p", "benko-tour__note", "Aún no hay opiniones para mostrar."));
    return;
  }

  reviews.slice(0, 5).forEach((review) => {
    reviewList.appendChild(createReviewCard(review));
  });

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

function swapExperienceSlide(rotator, nextIndex) {
  if (!rotator || !rotator.image || rotator.isBusy || rotator.slides.length < 2) {
    return;
  }

  const safeIndex = (nextIndex + rotator.slides.length) % rotator.slides.length;
  const nextSlide = rotator.slides[safeIndex];

  if (!nextSlide || rotator.image.getAttribute("src") === nextSlide.src) {
    rotator.index = safeIndex;
    return;
  }

  rotator.isBusy = true;

  const preloadImage = new Image();
  preloadImage.decoding = "async";
  preloadImage.src = nextSlide.src;
  preloadImage.onload = () => {
    rotator.image.classList.add("is-swapping");

    window.setTimeout(() => {
      rotator.image.src = nextSlide.src;
      rotator.image.alt = nextSlide.alt;
      rotator.index = safeIndex;

      window.requestAnimationFrame(() => {
        rotator.image.classList.remove("is-swapping");
        rotator.isBusy = false;
      });
    }, 180);
  };
  preloadImage.onerror = () => {
    rotator.isBusy = false;
  };
}

function startExperienceRotation() {
  if (!experienceRotators.length) {
    return;
  }

  window.clearInterval(experienceRotationTimer);

  if (experienceRotators.every((rotator) => rotator.slides.length < 2)) {
    return;
  }

  experienceRotationTimer = window.setInterval(() => {
    experienceRotators.forEach((rotator) => {
      if (rotator.slides.length > 1) {
        swapExperienceSlide(rotator, rotator.index + 1);
      }
    });
  }, 4600);
}

function getSelectedPackageData() {
  if (!packageSelect || packageSelect.selectedIndex < 0) {
    return {
      label: "Ruta principal",
      price: 0
    };
  }

  const option = packageSelect.options[packageSelect.selectedIndex];
  return {
    label: option.textContent.split(" - ")[0],
    price: Number(option.dataset.price || 0)
  };
}

function updateEstimate() {
  if (!travelersInput || !estimateTotal || !estimateCaption) {
    return;
  }

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

async function submitAccessUser(payload) {
  if (!appConfig.channels.accessApiUrl) {
    return { skipped: true };
  }

  return postJson(appConfig.channels.accessApiUrl, payload);
}

function buildAccessUserPayload(user) {
  return {
    id: user.id,
    name: user.name,
    city: user.city,
    phone: user.phone,
    email: user.email,
    createdAt: user.createdAt,
    source: "acceso-web"
  };
}

function buildBookingPayload() {
  if (!bookingForm) {
    return null;
  }

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

function addProductToCart(product) {
  const normalized = sanitizeCartItem({
    ...product,
    quantity: Number(product && product.quantity ? product.quantity : 1)
  });

  if (!normalized) {
    return null;
  }

  const existing = cart.get(normalized.id);

  if (existing) {
    existing.quantity += normalized.quantity;
    cart.set(normalized.id, existing);
  } else {
    cart.set(normalized.id, normalized);
  }

  saveCartState();
  renderCart();
  return cart.get(normalized.id) || normalized;
}

function setCartItemQuantity(id, nextQuantity) {
  const item = cart.get(id);

  if (!item) {
    return;
  }

  if (nextQuantity <= 0) {
    cart.delete(id);
  } else {
    item.quantity = nextQuantity;
    cart.set(id, item);
  }

  saveCartState();
  renderCart();
}

function removeCartItem(id) {
  if (!cart.has(id)) {
    return;
  }

  cart.delete(id);
  saveCartState();
  renderCart();
}

function clearCartState() {
  cart.clear();
  saveCartState();
  renderCart();
}

function buildCartPayload() {
  const items = getCartItems();
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    reference: createReference("SHOP"),
    type: "shop",
    description: "Pedido tienda Benko Tour",
    city: cartCityInput ? (cartCityInput.value.trim() || "Sin ciudad especificada") : "Sin ciudad especificada",
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
  if (!cartItemsContainer || !cartTotalElement || !cartCountElement) {
    return;
  }

  const items = getCartItems();
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  cartCountElement.textContent = String(count);
  cartTotalElement.textContent = `${formatCOP(total)} COP`;

  if (catalogCartToggleCount) {
    catalogCartToggleCount.textContent = String(count);
  }

  if (!items.length) {
    cartItemsContainer.innerHTML = `
      <div class="benko-tour__cart-empty-card">
        <strong>Tu carrito está listo</strong>
        <p class="benko-tour__cart-empty">Agrega productos desde gastronomía, música, moda u otras categorías y aquí verás el resumen completo.</p>
      </div>
    `;
    return;
  }

  cartItemsContainer.innerHTML = items.map((item) => `
    <div class="benko-tour__cart-item">
      <div class="benko-tour__cart-item-head">
        <div class="benko-tour__cart-item-copy">
          <strong>${item.name}</strong>
          <span>${formatCOP(item.price)} COP por unidad</span>
        </div>
        <button class="benko-tour__cart-remove" type="button" data-remove-id="${item.id}" aria-label="Quitar ${item.name}">Quitar</button>
      </div>
      <div class="benko-tour__cart-meta">
        <div class="benko-tour__cart-quantity" aria-label="Cantidad de ${item.name}">
          <button class="benko-tour__cart-step" type="button" data-cart-decrease="${item.id}" aria-label="Restar una unidad de ${item.name}">−</button>
          <span>${item.quantity}</span>
          <button class="benko-tour__cart-step" type="button" data-cart-increase="${item.id}" aria-label="Sumar una unidad de ${item.name}">+</button>
        </div>
        <strong>${formatCOP(item.price * item.quantity)} COP</strong>
      </div>
    </div>
  `).join("");

  cartItemsContainer.querySelectorAll("[data-remove-id]").forEach((button) => {
    button.addEventListener("click", () => {
      removeCartItem(button.dataset.removeId);
    });
  });

  cartItemsContainer.querySelectorAll("[data-cart-decrease]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.cartDecrease || "";
      const currentItem = cart.get(id);

      if (!currentItem) {
        return;
      }

      setCartItemQuantity(id, currentItem.quantity - 1);
    });
  });

  cartItemsContainer.querySelectorAll("[data-cart-increase]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.cartIncrease || "";
      const currentItem = cart.get(id);

      if (!currentItem) {
        return;
      }

      setCartItemQuantity(id, currentItem.quantity + 1);
    });
  });
}

function markCatalogMediaPlaceholder(media, image) {
  if (!media) {
    return;
  }

  const source = image ? image.getAttribute("src") || "" : "";
  const fileName = source.split("/").pop().split("?")[0];
  const altText = image ? String(image.getAttribute("alt") || "").trim() : "";

  if (fileName) {
    media.dataset.imageSlot = fileName;
  }

  if (altText) {
    media.dataset.imageAlt = altText;
  }

  media.classList.add("is-placeholder");

  if (image) {
    image.hidden = true;
    image.setAttribute("aria-hidden", "true");
  }
}

function getCatalogImageCandidates(source) {
  const baseSource = String(source || "").split("?")[0];

  if (!baseSource) {
    return [];
  }

  const candidates = new Set([baseSource]);
  const extensionMatch = baseSource.match(/\.([a-z0-9]+)$/i);
  const extension = extensionMatch ? extensionMatch[1].toLowerCase() : "";

  if (extension === "jpg" || extension === "jpeg") {
    candidates.add(`${baseSource}.png`);
    candidates.add(`${baseSource}.webp`);
    candidates.add(baseSource.replace(/\.(jpg|jpeg)$/i, ".png"));
    candidates.add(baseSource.replace(/\.(jpg|jpeg)$/i, ".webp"));
    candidates.add(baseSource.replace(/\.(jpg|jpeg)$/i, ".jpeg"));
    candidates.add(baseSource.replace(/\.(jpg|jpeg)$/i, ".JPG"));
    candidates.add(baseSource.replace(/\.(jpg|jpeg)$/i, ".JPEG"));
    candidates.add(baseSource.replace(/\.(jpg|jpeg)$/i, ".PNG"));
    candidates.add(baseSource.replace(/\.(jpg|jpeg)$/i, ".WEBP"));
  } else if (extension === "png") {
    candidates.add(baseSource.replace(/\.png$/i, ".jpg"));
    candidates.add(baseSource.replace(/\.png$/i, ".jpeg"));
    candidates.add(baseSource.replace(/\.png$/i, ".webp"));
  } else if (extension === "webp") {
    candidates.add(baseSource.replace(/\.webp$/i, ".jpg"));
    candidates.add(baseSource.replace(/\.webp$/i, ".jpeg"));
    candidates.add(baseSource.replace(/\.webp$/i, ".png"));
  }

  return Array.from(candidates).filter(Boolean);
}

function tryNextCatalogImageSource(media, image) {
  const rawCandidates = image.dataset.catalogCandidates || "[]";
  const candidates = JSON.parse(rawCandidates);
  const currentIndex = Number(image.dataset.catalogCandidateIndex || 0);
  const nextIndex = currentIndex + 1;

  if (nextIndex >= candidates.length) {
    markCatalogMediaPlaceholder(media, image);
    return;
  }

  image.dataset.catalogCandidateIndex = String(nextIndex);
  image.hidden = false;
  image.removeAttribute("aria-hidden");
  image.src = candidates[nextIndex];
}

function setupCatalogPlaceholders() {
  document.querySelectorAll(".benko-tour__catalog-media").forEach((media) => {
    const image = media.querySelector(".benko-tour__catalog-image");

    if (!image || image.dataset.catalogReady === "true") {
      return;
    }

    const syncMeta = () => {
      const source = image.getAttribute("src") || "";
      const fileName = source.split("/").pop().split("?")[0];

      if (fileName) {
        media.dataset.imageSlot = fileName;
      }

      if (image.alt) {
        media.dataset.imageAlt = image.alt.trim();
      }
    };

    image.dataset.catalogReady = "true";
    image.dataset.catalogCandidates = JSON.stringify(getCatalogImageCandidates(image.getAttribute("src") || ""));
    image.dataset.catalogCandidateIndex = "0";
    syncMeta();

    image.addEventListener("load", () => {
      image.hidden = false;
      image.removeAttribute("aria-hidden");
      media.classList.remove("is-placeholder");
      syncMeta();
    });

    image.addEventListener("error", () => {
      tryNextCatalogImageSource(media, image);
    });

    if (!image.getAttribute("src")) {
      markCatalogMediaPlaceholder(media, image);
      return;
    }

    if (image.complete && image.naturalWidth === 0) {
      markCatalogMediaPlaceholder(media, image);
    }
  });
}

function setupCatalogFilters() {
  document.querySelectorAll(".benko-tour__catalog-filters").forEach((filterGroup) => {
    if (filterGroup.dataset.catalogReady === "true") {
      return;
    }

    const section = filterGroup.closest(".benko-tour__section") || document;
    const grid = section.querySelector(".benko-tour__catalog-grid");
    const buttons = Array.from(filterGroup.querySelectorAll("[data-filter]"));
    const cards = grid ? Array.from(grid.querySelectorAll(".benko-tour__catalog-card")) : [];
    const result = section.querySelector("[data-catalog-result]");
    const empty = section.querySelector("[data-catalog-empty]");

    if (!grid || !buttons.length || !cards.length) {
      return;
    }

    const updateResult = (count, label, showAll) => {
      if (result) {
        result.textContent = showAll
          ? `${count} experiencias visibles`
          : `${count} experiencias en ${label.toLowerCase()}`;
      }

      if (empty) {
        empty.hidden = count !== 0;
      }
    };

    const applyFilter = (filterValue, filterLabel) => {
      let visibleCount = 0;

      cards.forEach((card) => {
        const categories = String(card.dataset.category || "").split(/\s+/).filter(Boolean);
        const matches = filterValue === "todos" || categories.includes(filterValue);
        card.hidden = !matches;

        if (matches) {
          visibleCount += 1;
        }
      });

      updateResult(visibleCount, filterLabel, filterValue === "todos");
    };

    filterGroup.dataset.catalogReady = "true";

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((candidate) => {
          candidate.classList.toggle("benko-tour__filter-btn--active", candidate === button);
          candidate.setAttribute("aria-pressed", candidate === button ? "true" : "false");
        });

        applyFilter(button.dataset.filter || "todos", button.textContent || "Todos");
      });
    });

    const activeButton =
      buttons.find((button) => button.classList.contains("benko-tour__filter-btn--active")) || buttons[0];

    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", button === activeButton ? "true" : "false");
    });

    applyFilter(activeButton.dataset.filter || "todos", activeButton.textContent || "Todos");
  });
}

function pulseCartButton(button, message = "Agregado") {
  if (!button) {
    return;
  }

  const previousLabel = button.dataset.defaultLabel || button.textContent || "";
  button.dataset.defaultLabel = previousLabel;
  button.textContent = message;
  button.disabled = true;

  window.setTimeout(() => {
    button.textContent = previousLabel;
    button.disabled = false;
  }, 1400);
}

function extractCatalogProduct(button) {
  const card = button.closest(".benko-tour__catalog-card");

  if (!card) {
    return null;
  }

  const title = card.querySelector("h3");
  const price = card.querySelector(".benko-tour__catalog-price");
  const image = card.querySelector(".benko-tour__catalog-image");
  const name = title ? title.textContent.trim() : "";
  const numericPrice = Number(String(price ? price.textContent : "").replace(/[^\d]/g, ""));

  if (!name || !numericPrice) {
    return null;
  }

  return {
    id: button.dataset.id || `${card.dataset.category || "catalogo"}-${slugifyValue(name)}`,
    name,
    price: numericPrice,
    quantity: 1,
    category: card.dataset.category || "",
    image: image ? image.getAttribute("src") || "" : ""
  };
}

function setupCatalogCartButtons() {
  document.querySelectorAll(".benko-tour__catalog-card .benko-tour__button--sm").forEach((button) => {
    if (button.dataset.cartReady === "true") {
      return;
    }

    const product = extractCatalogProduct(button);

    if (!product) {
      return;
    }

    button.dataset.cartReady = "true";
    button.dataset.id = product.id;
    button.dataset.name = product.name;
    button.dataset.price = String(product.price);
    button.type = "button";
    button.classList.add("js-add-to-cart");
    button.textContent = "Agregar al carrito";

    button.addEventListener("click", (event) => {
      event.preventDefault();

      const addedProduct = addProductToCart(product);

      if (!addedProduct) {
        return;
      }

      setStatus(cartStatus, "success", `${product.name} fue agregado al carrito.`);
      pulseCartButton(button);
    });
  });
}

packageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.dataset.package;

    if (!selected || !packageSelect) {
      return;
    }

    packageSelect.value = selected;
    updateEstimate();
    scrollToReservations();
  });
});

addToCartButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const product = sanitizeCartItem({
      id: button.dataset.id,
      name: button.dataset.name,
      price: Number(button.dataset.price || 0),
      quantity: 1
    });

    if (!product) {
      return;
    }

    addProductToCart(product);
    setStatus(cartStatus, "success", `${product.name} fue agregado al carrito.`);
    pulseCartButton(button);
  });
});

if (packageSelect) {
  const packageFromUrl = new URLSearchParams(window.location.search).get("package");
  const packageExists = Array.from(packageSelect.options).some((option) => option.value === packageFromUrl);

  if (packageFromUrl && packageExists) {
    packageSelect.value = packageFromUrl;
  }

  packageSelect.addEventListener("change", updateEstimate);
}

if (travelersInput) {
  travelersInput.addEventListener("input", updateEstimate);
}

updateEstimate();

if (dateInput) {
  dateInput.min = new Date().toISOString().split("T")[0];
}

if (bookingForm && !bookingForm.hasAttribute("data-custom-submit-flow")) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleReservationSubmit("auto");
  });
}

if (bookingWhatsappButton) {
  bookingWhatsappButton.addEventListener("click", async () => {
    await handleReservationSubmit("whatsapp");
  });
}

if (bookingEmailButton) {
  bookingEmailButton.addEventListener("click", async () => {
    await handleReservationSubmit("email");
  });
}

if (reservationPayWompiButton) {
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
}

if (reservationPayMercadoPagoButton) {
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
}

if (cartWhatsappButton) {
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
}

if (cartEmailButton) {
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
}

if (cartPayWompiButton) {
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
}

if (cartPayMercadoPagoButton) {
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
}

if (cartClearButton) {
  cartClearButton.addEventListener("click", () => {
    clearCartState();
    setStatus(cartStatus, "", "El carrito quedó vacío.");
  });
}

accessTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveAccessTab(button.dataset.accessTab || "login");
  });
});

ratingButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!reviewRatingInput) {
      return;
    }

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
    const phone = String(formData.get("phone") || "").trim();
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
      phone,
      email,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString()
    };

    saveUsers([...users, newUser]);
    setSessionUserId(newUser.id);
    registerForm.reset();
    renderAccessState();

    try {
      const response = await submitAccessUser(buildAccessUserPayload(newUser));

      if (!response.skipped) {
        setStatus(accessStatus, "success", `Tu cuenta quedó creada, ${newUser.name}. El registro también quedó guardado para el equipo de Benko Tour.`);
        return;
      }
    } catch (error) {
      console.error("No se pudo enviar el registro de acceso al backend.", error);
      setStatus(accessStatus, "success", `Tu cuenta quedó creada, ${newUser.name}. Tus datos quedaron guardados en este navegador, pero no se pudo confirmar el envío al equipo en este momento.`);
      return;
    }

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

    if (reviewRatingInput) {
      reviewRatingInput.value = "";
    }
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

    if (!reviewForm.reportValidity()) {
      return;
    }

    if (!reviewRatingInput.value) {
      setStatus(reviewStatus, "error", "Selecciona primero una cantidad de estrellas.");
      return;
    }

    const formData = new FormData(reviewForm);
    const reviewerName = String(formData.get("name") || "").trim() || (currentUser ? currentUser.name : "") || "Visitante";
    const city = String(formData.get("city") || "").trim() || (currentUser ? currentUser.city : "") || "Sin ciudad";
    const newReview = {
      id: createReference("REV"),
      userId: currentUser ? currentUser.id : "",
      name: reviewerName,
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
    const nameField = reviewForm.elements.namedItem("name");

    if (nameField && currentUser && currentUser.name) {
      nameField.value = currentUser.name;
    }

    if (cityField && currentUser && currentUser.city) {
      cityField.value = currentUser.city;
    }

    reviewRatingInput.value = "";
    updateRatingButtons(0);
    renderReviews();
    startReviewRotation();
    setStatus(reviewStatus, "success", "Gracias por compartir tu experiencia con Benko Tour.");
  });
}

function initMobileMenu() {
  const hamburger = document.querySelector(".benko-tour__hamburger");
  const mobileMenu = document.querySelector(".benko-tour__mobile-menu");

  if (!hamburger || !mobileMenu || hamburger.dataset.menuReady === "true") {
    return;
  }

  const closeMenu = () => {
    hamburger.setAttribute("aria-expanded", "false");
    mobileMenu.hidden = true;
  };

  hamburger.dataset.menuReady = "true";

  hamburger.addEventListener("click", (event) => {
    event.stopPropagation();
    const isExpanded = hamburger.getAttribute("aria-expanded") === "true";
    hamburger.setAttribute("aria-expanded", isExpanded ? "false" : "true");
    mobileMenu.hidden = isExpanded;
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!hamburger.contains(event.target) && !mobileMenu.contains(event.target)) {
      closeMenu();
    }
  });
}

restoreCartState();
window.addToCart = addProductToCart;
window.removeFromCart = removeCartItem;
window.clearCart = clearCartState;
window.updateCartUI = () => {
  restoreCartState();
  renderCart();
};

renderAccessState();
renderReviews();
startReviewRotation();
startExperienceRotation();
setActiveAccessTab(activeAccessTab);
renderCart();
setupCatalogCartPanel();
setupCatalogPlaceholders();
setupCatalogFilters();
setupCatalogCartButtons();
initMobileMenu();
