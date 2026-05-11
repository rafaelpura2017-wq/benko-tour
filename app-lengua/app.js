(function() {
  "use strict";

  const STORAGE_KEY = "palenque-lengua-v2";
  const PREMIUM_MEMBERSHIP_COLLECTION = "membresias_lengua";
  const PREMIUM_REQUEST_COLLECTION = "solicitudes_membresia_lengua";
  const MAX_HEARTS = 5;
  const PASS_THRESHOLD = 0.67;
  const XP_PER_CORRECT = 4;
  const ALLOWED_VIEWS = ["home", "explore", "learn", "dictionary", "premium", "profile", "admin"];
  const ALLOWED_LEVELS = ["A1", "A2", "B1"];
  const ACCESS_PAGE_FILE = "index.html";
  const DASHBOARD_PAGE_FILE = "dashboard.html";

  const data = window.BENKO_LENGUA_APP_DATA || { units: [] };
  const dictionaryPayload = window.benkoPalenqueraDictionary || {};
  const dictionaryEntries = Array.isArray(dictionaryPayload.entries) ? dictionaryPayload.entries : [];

  const appConfig = window.BENKO_CONFIG || {};
  const paymentConfig = appConfig.payments || {};
  const languageAppConfig = appConfig.languageApp || {};
  const premiumConfig = Object.assign(
    {
      productId: "lengua-premium",
      productName: "Membresía premium lengua palenquera",
      priceCop: 189000
    },
    languageAppConfig.premium || {}
  );
  const distributionConfig = Object.assign(
    {
      playStoreUrl: "",
      apkUrl: "",
      apkLabel: "Descargar APK (beta)",
      showApkOnDesktop: false
    },
    languageAppConfig.distribution || {}
  );
  const adminConfig = Object.assign(
    {
      requestsEndpoint: "",
      approveEndpoint: "",
      rejectEndpoint: ""
    },
    languageAppConfig.admin || {}
  );

  const adminEmails = Array.isArray(languageAppConfig.adminEmails)
    ? languageAppConfig.adminEmails.map(function(email) {
        return sanitizeText(email).toLowerCase();
      }).filter(Boolean)
    : [];

  const elements = {
    splash: document.getElementById("pv-splash"),
    onboardingCard: document.getElementById("onboarding-card"),
    profileNameInput: document.getElementById("profile-name"),
    dailyGoalSelect: document.getElementById("daily-goal"),
    startLearningButton: document.getElementById("start-learning-btn"),
    skipOnboardingButton: document.getElementById("skip-onboarding-btn"),
    installButton: document.getElementById("install-app-btn"),
    playStoreButton: document.getElementById("playstore-btn"),
    apkDownloadButton: document.getElementById("apk-download-btn"),
    distributionNote: document.getElementById("distribution-note"),

    authUserName: document.getElementById("auth-user-name"),
    authUserEmail: document.getElementById("auth-user-email"),
    authNote: document.getElementById("auth-note"),
    authLoginWrap: document.getElementById("auth-login-wrap"),
    authRegisterWrap: document.getElementById("auth-register-wrap"),
    authEmailInput: document.getElementById("auth-email-input"),
    authLoginEmailFeedback: document.getElementById("auth-login-email-feedback"),
    authPasswordInput: document.getElementById("auth-password-input"),
    authLoginPasswordFeedback: document.getElementById("auth-login-password-feedback"),
    authEmailSubmitButton: document.getElementById("auth-email-submit-btn"),
    authForgotButton: document.getElementById("auth-forgot-btn"),
    authOpenRegisterButton: document.getElementById("auth-open-register-btn"),
    authBackLoginButton: document.getElementById("auth-back-login-btn"),
    authRegisterNameInput: document.getElementById("auth-register-name"),
    authRegisterNameFeedback: document.getElementById("auth-register-name-feedback"),
    authRegisterPhoneInput: document.getElementById("auth-register-phone"),
    authRegisterPhoneFeedback: document.getElementById("auth-register-phone-feedback"),
    authRegisterEmailInput: document.getElementById("auth-register-email"),
    authRegisterEmailFeedback: document.getElementById("auth-register-email-feedback"),
    authRegisterPasswordInput: document.getElementById("auth-register-password"),
    authRegisterPasswordFeedback: document.getElementById("auth-register-password-feedback"),
    authRegisterSubmitButton: document.getElementById("auth-register-submit-btn"),
    authTermsLoginCheck: document.getElementById("auth-terms-login-check"),
    authTermsRegisterCheck: document.getElementById("auth-terms-register-check"),
    authPhoneInput: document.getElementById("auth-phone-input"),
    authCountryCode: document.getElementById("auth-country-code"),
    authSmsConsentCheck: document.getElementById("auth-sms-consent-check"),
    authPhoneNextButton: document.getElementById("auth-phone-next-btn"),
    authCodeWrap: document.getElementById("auth-code-wrap"),
    authCodeInput: document.getElementById("auth-code-input"),
    authVerifyCodeButton: document.getElementById("auth-verify-code-btn"),
    authResendCodeButton: document.getElementById("auth-resend-code-btn"),
    authGoogleButton: document.getElementById("auth-google-btn"),
    authAppleButton: document.getElementById("auth-apple-btn"),
    authFacebookButton: document.getElementById("auth-facebook-btn"),
    authLogoutButton: document.getElementById("auth-logout-btn"),

    xpValue: document.getElementById("xp-value"),
    streakValue: document.getElementById("streak-value"),
    streakValueInline: document.getElementById("streak-value-inline"),
    heartsValue: document.getElementById("hearts-value"),
    dailyStatusNote: document.getElementById("daily-status-note"),
    goalProgressCopy: document.getElementById("goal-progress-copy"),
    goalProgressBar: document.getElementById("goal-progress-bar"),

    levelProgressNote: document.getElementById("level-progress-note"),
    heroLevelValue: document.getElementById("hero-level-value"),
    heroProgressBar: document.getElementById("hero-progress-bar"),
    heroProgressValue: document.getElementById("hero-progress-value"),
    heroNextLesson: document.getElementById("hero-next-lesson"),
    heroNextMeta: document.getElementById("hero-next-meta"),
    wordDayTerm: document.getElementById("word-of-day-term"),
    wordDayTranslation: document.getElementById("word-of-day-translation"),
    wordDayDescription: document.getElementById("word-of-day-description"),
    wordDayTheme: document.getElementById("word-of-day-theme"),

    courseMap: document.getElementById("course-map"),
    continueLastButton: document.getElementById("continue-last-btn"),

    lessonTitle: document.getElementById("lesson-title"),
    lessonSubtitle: document.getElementById("lesson-subtitle"),
    lessonProgressChip: document.getElementById("lesson-progress-chip"),
    questionPrompt: document.getElementById("question-prompt"),
    questionOptions: document.getElementById("question-options"),
    questionFeedback: document.getElementById("question-feedback"),
    nextQuestionButton: document.getElementById("next-question-btn"),
    finishLessonButton: document.getElementById("finish-lesson-btn"),
    playPronunciationButton: document.getElementById("play-pronunciation-btn"),

    dictionarySearch: document.getElementById("dictionary-search"),
    dictionaryList: document.getElementById("dictionary-list"),

    premiumStateTitle: document.getElementById("premium-state-title"),
    premiumStateCopy: document.getElementById("premium-state-copy"),
    premiumReference: document.getElementById("premium-reference"),
    premiumPayWompiButton: document.getElementById("premium-pay-wompi-btn"),
    premiumPayMpButton: document.getElementById("premium-pay-mp-btn"),
    premiumRequestButton: document.getElementById("premium-request-btn"),
    premiumSyncButton: document.getElementById("premium-sync-btn"),
    premiumNote: document.getElementById("premium-note"),

    profileNameKpi: document.getElementById("profile-name-kpi"),
    profileGoalKpi: document.getElementById("profile-goal-kpi"),
    profileCompletedKpi: document.getElementById("profile-completed-kpi"),
    profilePremiumKpi: document.getElementById("profile-premium-kpi"),
    resetProgressButton: document.getElementById("reset-progress-btn"),

    adminApiKeyInput: document.getElementById("admin-api-key"),
    adminStatusFilter: document.getElementById("admin-status-filter"),
    adminLoadButton: document.getElementById("admin-load-btn"),
    adminNote: document.getElementById("admin-note"),
    adminRequestsList: document.getElementById("admin-requests-list"),
    bottomNav: document.querySelector(".pv-bottom-nav")
  };

  const views = Array.from(document.querySelectorAll("[data-view]"));
  const tabs = Array.from(document.querySelectorAll("[data-tab]"));
  const quickViewButtons = Array.from(document.querySelectorAll("[data-go-view]"));
  const levelFilterButtons = Array.from(document.querySelectorAll("[data-level-filter]"));

  let deferredInstallPrompt = null;
  let lessonSession = null;
  let questionAudioElement = null;
  let authWatchAttached = false;
  let lastPhoneLoginRequest = null;
  let lastKnownAuthUid = "";
  let authMode = "login";
  let authTransitionLayer = null;
  let authTransitionTimer = null;
  let authTransitionFallbackTimer = null;

  const state = Object.assign(
    {
      onboardingDone: false,
      profileName: "Visitante",
      dailyGoal: 10,
      xp: 0,
      xpToday: 0,
      lastXpDate: "",
      hearts: MAX_HEARTS,
      streakDays: 1,
      lastActiveDate: "",
      completedLessons: {},
      lastLessonId: "",
      activeView: "home",
      cefrFilter: "all",
      premium: {
        active: false,
        status: "pendiente",
        source: "none",
        requestId: ""
      }
    },
    readStorage(STORAGE_KEY, {})
  );

  function readStorage(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function sanitizeText(value, fallback) {
    const normalized = String(value || "").trim();
    return normalized || (fallback || "");
  }

  function normalizeDateKey(date) {
    return date.toISOString().slice(0, 10);
  }

  function getTodayKey() {
    return normalizeDateKey(new Date());
  }

  function getDateDiffInDays(previousKey, nextKey) {
    const previous = new Date(previousKey + "T00:00:00Z");
    const next = new Date(nextKey + "T00:00:00Z");
    return Math.round((next.getTime() - previous.getTime()) / 86400000);
  }

  function formatCOP(amount) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(Number(amount || 0));
  }

  function createReference(prefix) {
    const left = Date.now().toString(36).toUpperCase();
    const right = Math.random().toString(36).slice(2, 8).toUpperCase();
    return prefix + "-" + left + "-" + right;
  }

  function normalizeLevel(level, fallback) {
    const normalized = sanitizeText(level, fallback || "A1").toUpperCase();
    return ALLOWED_LEVELS.includes(normalized) ? normalized : (fallback || "A1");
  }

  function getAuthUser() {
    if (window.authFirebase && typeof window.authFirebase.obtenerUsuarioActual === "function") {
      try {
        const helperUser = window.authFirebase.obtenerUsuarioActual();
        if (helperUser) {
          return helperUser;
        }
      } catch (_) {
        // noop
      }
    }

    if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length && typeof firebase.auth === "function") {
      try {
        return firebase.auth().currentUser;
      } catch (_) {
        return null;
      }
    }

    return null;
  }

  async function waitAuthUser(timeoutMs) {
    if (window.authFirebase && typeof window.authFirebase.esperarAuth === "function") {
      try {
        const user = await window.authFirebase.esperarAuth(timeoutMs || 2500);
        if (user) {
          return user;
        }
      } catch (_) {
        // noop
      }
    }

    return getAuthUser();
  }

  function getFirestore() {
    if (typeof firebase === "undefined" || !firebase.apps || !firebase.apps.length || typeof firebase.firestore !== "function") {
      return null;
    }

    try {
      return firebase.firestore();
    } catch (_) {
      return null;
    }
  }

  function resolveView(value) {
    const view = sanitizeText(value).toLowerCase();
    return ALLOWED_VIEWS.includes(view) ? view : "home";
  }

  function getCurrentPath() {
    return sanitizeText(window.location.pathname).toLowerCase();
  }

  function getAppBasePath() {
    const pathname = window.location.pathname || "/";
    const lastSlash = pathname.lastIndexOf("/");
    if (lastSlash < 0) {
      return "/";
    }
    return pathname.slice(0, lastSlash + 1) || "/";
  }

  function getCanonicalOrigin() {
    return window.location.origin;
  }

  function isDashboardPage() {
    const path = getCurrentPath();
    return /\/dashboard(?:\.html|\/index(?:\.html)?)?\/?$/.test(path);
  }

  function buildPageUrl(fileName, viewName) {
    const view = resolveView(viewName || "explore");
    const origin = getCanonicalOrigin();
    const basePath = getAppBasePath();
    return origin + basePath + sanitizeText(fileName) + "#" + view;
  }

  function buildDashboardPageUrl(viewName, preferCleanUrl) {
    const dashboardPath = preferCleanUrl ? "dashboard" : DASHBOARD_PAGE_FILE;
    return buildPageUrl(dashboardPath, viewName);
  }

  function redirectToDashboard(viewName, options) {
    const settings = options || {};
    const targetView = resolveView(viewName || "explore");
    if (isDashboardPage()) {
      setActiveView(targetView);
      hideAuthTransition();
      return;
    }

    const useCleanUrl = settings.forceHtml ? false : settings.preferCleanUrl !== false;
    window.location.replace(buildDashboardPageUrl(targetView, useCleanUrl));
  }

  function redirectToAccess() {
    if (!isDashboardPage()) {
      return;
    }
    window.location.replace(buildPageUrl(ACCESS_PAGE_FILE, "home"));
  }

  function ensureAuthTransitionLayer() {
    if (authTransitionLayer || !document.body) {
      return authTransitionLayer;
    }

    const layer = document.createElement("div");
    layer.className = "pv-auth-transition";
    layer.setAttribute("aria-hidden", "true");
    layer.innerHTML =
      "<div class=\"pv-auth-transition-card\" role=\"status\" aria-live=\"polite\">" +
      "<span class=\"pv-auth-transition-chip\">KUMAINA</span>" +
      "<div class=\"pv-auth-transition-icon\" aria-hidden=\"true\">✓</div>" +
      "<h2 class=\"pv-auth-transition-title\">Entrando a tu panel...</h2>" +
      "<p class=\"pv-auth-transition-copy\">Estamos preparando tus lecciones, juegos y cultura viva.</p>" +
      "<button class=\"pv-auth-transition-cta\" type=\"button\" data-auth-transition-cta>Entrar ahora</button>" +
      "<div class=\"pv-auth-transition-track\"><span></span></div>" +
      "<div class=\"pv-auth-transition-dots\" aria-hidden=\"true\"><i></i><i></i><i></i></div>" +
      "</div>";

    document.body.appendChild(layer);
    authTransitionLayer = layer;
    return authTransitionLayer;
  }

  function showAuthTransition(title, copy, tone) {
    if (isDashboardPage()) {
      return;
    }

    const layer = ensureAuthTransitionLayer();
    if (!layer) {
      return;
    }

    const titleEl = layer.querySelector(".pv-auth-transition-title");
    const copyEl = layer.querySelector(".pv-auth-transition-copy");
    if (titleEl) {
      titleEl.textContent = sanitizeText(title, "Entrando a tu panel...");
    }
    if (copyEl) {
      copyEl.textContent = sanitizeText(copy, "Estamos preparando tus lecciones, juegos y cultura viva.");
    }

    layer.classList.toggle("is-success", sanitizeText(tone).toLowerCase() === "success");
    layer.classList.add("is-visible");
    document.body.classList.add("pv-lock-scroll");
  }

  function hideAuthTransition() {
    if (!authTransitionLayer) {
      return;
    }

    authTransitionLayer.classList.remove("is-visible");
    document.body.classList.remove("pv-lock-scroll");
  }

  function setAuthTransitionAction(viewName) {
    const layer = ensureAuthTransitionLayer();
    if (!layer) {
      return;
    }
    const button = layer.querySelector("[data-auth-transition-cta]");
    if (!button) {
      return;
    }
    const targetView = resolveView(viewName || "explore");
    button.onclick = function() {
      redirectToDashboard(targetView, { forceHtml: true });
    };
  }

  function clearAuthTransitionTimers() {
    if (authTransitionTimer) {
      window.clearTimeout(authTransitionTimer);
      authTransitionTimer = null;
    }
    if (authTransitionFallbackTimer) {
      window.clearTimeout(authTransitionFallbackTimer);
      authTransitionFallbackTimer = null;
    }
  }

  function runDashboardTransition(viewName, options) {
    const transition = options || {};
    const targetView = resolveView(viewName || "explore");
    if (isDashboardPage()) {
      setActiveView(targetView);
      return;
    }

    clearAuthTransitionTimers();
    setAuthTransitionAction(targetView);

    showAuthTransition(
      sanitizeText(transition.title, "Entrando a tu panel..."),
      sanitizeText(transition.copy, "Kumaina está sincronizando tu progreso para continuar donde quedaste."),
      transition.tone
    );

    authTransitionTimer = window.setTimeout(function() {
      redirectToDashboard(targetView, { preferCleanUrl: true });
      authTransitionFallbackTimer = window.setTimeout(function() {
        if (!isDashboardPage()) {
          redirectToDashboard(targetView, { forceHtml: true });
        }
      }, 1700);
    }, Math.max(480, Number(transition.delayMs || 760)));
  }

  function renderWordOfDay() {
    if (!elements.wordDayTerm && !elements.wordDayTranslation && !elements.wordDayDescription && !elements.wordDayTheme) {
      return;
    }

    if (!dictionaryEntries.length) {
      if (elements.wordDayTerm) {
        elements.wordDayTerm.textContent = "Kumaina";
      }
      if (elements.wordDayTranslation) {
        elements.wordDayTranslation.textContent = "¿Cómo estás?";
      }
      if (elements.wordDayDescription) {
        elements.wordDayDescription.textContent = "Saludo cotidiano para iniciar conversación en palenquero.";
      }
      if (elements.wordDayTheme) {
        elements.wordDayTheme.textContent = "Saludos";
      }
      return;
    }

    const dayKey = getTodayKey().replace(/-/g, "");
    const numericKey = Number(dayKey);
    const index = Number.isFinite(numericKey) ? numericKey % dictionaryEntries.length : 0;
    const entry = dictionaryEntries[Math.abs(index)] || {};

    if (elements.wordDayTerm) {
      elements.wordDayTerm.textContent = sanitizeText(entry.term, "Kumaina");
    }
    if (elements.wordDayTranslation) {
      elements.wordDayTranslation.textContent = sanitizeText(entry.translation, "¿Cómo estás?");
    }
    if (elements.wordDayDescription) {
      elements.wordDayDescription.textContent = sanitizeText(entry.description, "Expresión de uso cotidiano.");
    }
    if (elements.wordDayTheme) {
      elements.wordDayTheme.textContent = sanitizeText(entry.themeLabel || entry.theme, "Cultura");
    }
  }

  function hideSplashScreen() {
    if (!elements.splash) {
      return;
    }
    window.setTimeout(function() {
      elements.splash.classList.add("is-hidden");
    }, 850);
  }

  function setActiveView(viewName, syncHash) {
    const nextView = resolveView(viewName);
    state.activeView = nextView;

    views.forEach(function(view) {
      view.classList.toggle("is-active", view.dataset.view === nextView);
    });

    tabs.forEach(function(tab) {
      tab.classList.toggle("is-active", tab.dataset.tab === nextView);
    });

    updateOnboardingVisibility();

    if (syncHash !== false) {
      const nextHash = "#" + nextView;
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, "", nextHash);
      }
    }

    const activeElement = document.activeElement;
    if (activeElement && (activeElement.matches("[data-tab]") || activeElement.matches("[data-go-view]"))) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    saveState();
  }

  function getLessonLevel(lesson, unit) {
    const unitLevel = unit && unit.cefrLevel ? unit.cefrLevel : "A1";
    return normalizeLevel(lesson && (lesson.cefrLevel || lesson.level), unitLevel);
  }

  function isLessonPremiumLocked(lesson, unit) {
    return !state.premium.active && getLessonLevel(lesson, unit) === "B1";
  }

  function flattenLessons(options) {
    const settings = Object.assign(
      {
        respectLevelFilter: false,
        includeLocked: true
      },
      options || {}
    );

    const targetLevel = normalizeLevel(state.cefrFilter, "A1");
    const includeAll = state.cefrFilter === "all";

    return (data.units || []).flatMap(function(unit) {
      return (unit.lessons || []).map(function(lesson) {
        const normalizedLevel = getLessonLevel(lesson, unit);
        return Object.assign({}, lesson, {
          unitId: unit.id,
          unitName: unit.name,
          unitLevel: normalizeLevel(unit.cefrLevel || normalizedLevel, normalizedLevel),
          normalizedLevel: normalizedLevel
        });
      }).filter(function(lesson) {
        if (settings.respectLevelFilter && !includeAll && lesson.normalizedLevel !== targetLevel) {
          return false;
        }
        if (!settings.includeLocked && isLessonPremiumLocked(lesson, { cefrLevel: lesson.unitLevel })) {
          return false;
        }
        return true;
      });
    });
  }

  function findLessonById(lessonId) {
    return flattenLessons({ respectLevelFilter: false, includeLocked: true }).find(function(lesson) {
      return lesson.id === lessonId;
    }) || null;
  }

  function getFirstIncompleteLesson(options) {
    return flattenLessons(options).find(function(lesson) {
      return !state.completedLessons[lesson.id];
    }) || flattenLessons(options)[0] || null;
  }

  function getCompletedCount() {
    return Object.values(state.completedLessons).filter(Boolean).length;
  }

  function getTotalLessonsCount() {
    return flattenLessons({ respectLevelFilter: false, includeLocked: true }).length;
  }

  function getCurrentGoalProgress() {
    const goal = Number(state.dailyGoal || 10);
    const todayXP = Number(state.xpToday || 0);
    const ratio = goal > 0 ? Math.min(1, todayXP / goal) : 0;
    return {
      goal: goal,
      xp: todayXP,
      ratio: ratio
    };
  }

  function syncDailyState() {
    const today = getTodayKey();

    if (!state.lastActiveDate) {
      state.lastActiveDate = today;
    } else if (state.lastActiveDate !== today) {
      const dayDiff = getDateDiffInDays(state.lastActiveDate, today);
      if (dayDiff === 1) {
        state.streakDays = Math.max(1, Number(state.streakDays || 1) + 1);
      } else if (dayDiff > 1) {
        state.streakDays = 1;
      }

      state.hearts = MAX_HEARTS;
      state.lastActiveDate = today;
    }

    if (!state.lastXpDate || state.lastXpDate !== today) {
      state.lastXpDate = today;
      state.xpToday = 0;
    }
  }

  function updateTopStats() {
    elements.xpValue.textContent = Math.max(0, Number(state.xp || 0)) + " XP";
    elements.streakValue.textContent = state.streakDays + (state.streakDays === 1 ? " día" : " días");
    if (elements.streakValueInline) {
      elements.streakValueInline.textContent = elements.streakValue.textContent;
    }
    elements.heartsValue.textContent = Math.max(0, Number(state.hearts || 0)) + " ❤";

    const goalProgress = getCurrentGoalProgress();
    elements.goalProgressCopy.textContent = goalProgress.xp + " / " + goalProgress.goal + " XP";
    elements.goalProgressBar.style.width = Math.round(goalProgress.ratio * 100) + "%";

    if (state.hearts <= 1) {
      elements.dailyStatusNote.textContent = "Tus corazones están bajos. Haz pausas cortas y evita perder intentos.";
    } else if (goalProgress.ratio >= 1) {
      elements.dailyStatusNote.textContent = "Meta diaria cumplida. Si quieres, subimos de nivel con otra lección.";
    } else {
      elements.dailyStatusNote.textContent = "Vas bien. Completa una lección más para acercarte a tu meta del día.";
    }

    updateHeroHighlights();
  }

  function updateProfilePanel() {
    elements.profileNameKpi.textContent = sanitizeText(state.profileName, "Visitante");
    elements.profileGoalKpi.textContent = Number(state.dailyGoal || 10) + " XP";
    elements.profileCompletedKpi.textContent = String(getCompletedCount()) + " / " + String(getTotalLessonsCount());
    elements.profilePremiumKpi.textContent = state.premium.active ? "Activa" : "Pendiente";
  }

  function updateHeroHighlights() {
    if (!elements.heroLevelValue && !elements.heroProgressBar && !elements.heroProgressValue && !elements.heroNextLesson && !elements.heroNextMeta) {
      return;
    }

    const completed = getCompletedCount();
    const total = getTotalLessonsCount();
    const percent = total ? Math.round((completed / total) * 100) : 0;
    const rankLabel = percent >= 85
      ? "Raíz ancestral"
      : percent >= 65
        ? "Maestro"
        : percent >= 45
          ? "Guardián"
          : percent >= 20
            ? "Aprendiz"
            : "Semilla";
    const rankLevel = Math.max(1, Math.ceil((percent || 1) / 20));

    if (elements.heroLevelValue) {
      elements.heroLevelValue.textContent = "Nivel " + rankLevel + " · " + rankLabel;
    }

    if (elements.heroProgressBar) {
      const safeProgress = Math.max(percent, total ? 8 : 0);
      elements.heroProgressBar.style.width = safeProgress + "%";
    }

    if (elements.heroProgressValue) {
      elements.heroProgressValue.textContent = percent + "%";
    }

    const suggestion = findLessonById(state.lastLessonId) ||
      getFirstIncompleteLesson({ respectLevelFilter: false, includeLocked: false }) ||
      flattenLessons({ respectLevelFilter: false, includeLocked: true })[0] ||
      null;

    if (elements.heroNextLesson) {
      elements.heroNextLesson.textContent = suggestion
        ? sanitizeText(suggestion.title, "Siguiente lección")
        : "Siguiente lección";
    }

    if (elements.heroNextMeta) {
      if (suggestion) {
        elements.heroNextMeta.textContent = sanitizeText(suggestion.unitName, "Ruta diaria") + " · " + suggestion.normalizedLevel;
      } else {
        elements.heroNextMeta.textContent = "Activa nuevas lecciones para continuar.";
      }
    }
  }

  function setAuthNote(message, type) {
    if (!elements.authNote) {
      return;
    }
    elements.authNote.textContent = message;
    elements.authNote.classList.remove("is-success", "is-error");
    if (type === "success") {
      elements.authNote.classList.add("is-success");
    }
    if (type === "error") {
      elements.authNote.classList.add("is-error");
    }
  }

  function enrichAuthErrorMessage(baseMessage, errorCode) {
    const code = sanitizeText(errorCode).toLowerCase();
    const origin = sanitizeText(window.location.origin);

    if (
      code === "auth/invalid-api-key" ||
      code === "auth/app-not-authorized" ||
      code === "auth/unauthorized-domain"
    ) {
      return (
        sanitizeText(baseMessage, "No se pudo iniciar sesión.") +
        " Origen actual: " + origin +
        ". Usa https://benko-tour.web.app y valida en Firebase: Authentication > Settings > Authorized domains (benko-tour.web.app y benko-tour.firebaseapp.com)."
      );
    }

    if (code === "auth/operation-not-allowed") {
      return (
        sanitizeText(baseMessage, "Este método no está habilitado.") +
        " Activa en Firebase Authentication > Sign-in method el proveedor que estás usando (Google, Phone, etc.)."
      );
    }

    return sanitizeText(baseMessage, "Ha ocurrido un error. Intenta de nuevo.");
  }

  function setAuthCodeVisible(isVisible) {
    if (!elements.authCodeWrap) {
      return;
    }
    elements.authCodeWrap.hidden = !isVisible;
  }

  function setButtonPending(button, pending, pendingText, idleText) {
    if (!button) {
      return;
    }

    if (!button.dataset.idleText) {
      button.dataset.idleText = sanitizeText(button.textContent, idleText || "");
    }

    const defaultIdleText = idleText || button.dataset.idleText;
    button.dataset.pending = pending ? "true" : "false";
    button.disabled = Boolean(pending);
    button.textContent = pending ? sanitizeText(pendingText, defaultIdleText) : defaultIdleText;

    if (
      (button === elements.authPhoneNextButton || button === elements.authEmailSubmitButton || button === elements.authRegisterSubmitButton) &&
      !pending
    ) {
      refreshAuthSubmitState();
    }
  }

  async function resetPhoneVerificationUI(options) {
    const shouldCancelRemote = !options || options.cancelRemote !== false;
    setAuthCodeVisible(false);
    if (elements.authCodeInput) {
      elements.authCodeInput.value = "";
    }
    lastPhoneLoginRequest = null;

    if (shouldCancelRemote && window.authFirebase && typeof window.authFirebase.cancelarFlujoTelefono === "function") {
      try {
        await window.authFirebase.cancelarFlujoTelefono();
      } catch (_) {
        // noop
      }
    }
  }

  function getEmailValidation(value) {
    const email = sanitizeText(value).toLowerCase();
    if (!email) {
      return { valid: false, empty: true, message: "Escribe tu correo electrónico." };
    }
    const isValid = /\S+@\S+\.\S+/.test(email);
    return {
      valid: isValid,
      empty: false,
      message: isValid ? "Correo válido." : "Correo inválido. Revisa el formato (ej: nombre@dominio.com)."
    };
  }

  function getPasswordValidation(value) {
    const password = String(value || "");
    if (!password) {
      return { valid: false, empty: true, message: "Escribe tu contraseña." };
    }
    const isStrong = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
    return {
      valid: isStrong,
      empty: false,
      message: isStrong ? "Contraseña segura." : "Debe tener 8+ caracteres con letras y números."
    };
  }

  function getNameValidation(value) {
    const fullName = sanitizeText(value);
    if (!fullName) {
      return { valid: false, empty: true, message: "Escribe tu nombre completo." };
    }
    const isValid = fullName.length >= 3;
    return {
      valid: isValid,
      empty: false,
      message: isValid ? "Nombre correcto." : "El nombre debe tener al menos 3 caracteres."
    };
  }

  function getPhoneValidation(value) {
    const phone = sanitizeText(value);
    if (!phone) {
      return { valid: false, empty: true, message: "Escribe tu número celular." };
    }
    const digits = phone.replace(/\D/g, "");
    const isValid = digits.length >= 10;
    return {
      valid: isValid,
      empty: false,
      message: isValid ? "Celular válido." : "El celular debe tener al menos 10 dígitos."
    };
  }

  function setAuthFieldState(inputEl, feedbackEl, validation) {
    if (!inputEl) {
      return;
    }

    const status = validation && !validation.empty ? (validation.valid ? "valid" : "invalid") : "neutral";
    inputEl.classList.remove("is-valid", "is-invalid");
    if (status === "valid") {
      inputEl.classList.add("is-valid");
    }
    if (status === "invalid") {
      inputEl.classList.add("is-invalid");
    }

    if (feedbackEl) {
      feedbackEl.classList.remove("is-valid", "is-invalid");
      if (status === "valid") {
        feedbackEl.classList.add("is-valid");
      }
      if (status === "invalid") {
        feedbackEl.classList.add("is-invalid");
      }
      feedbackEl.textContent = sanitizeText(validation && validation.message);
    }
  }

  function refreshAuthValidationUI() {
    const loginEmailValidation = getEmailValidation(elements.authEmailInput && elements.authEmailInput.value);
    const loginPasswordValidation = getPasswordValidation(elements.authPasswordInput && elements.authPasswordInput.value);
    const registerNameValidation = getNameValidation(elements.authRegisterNameInput && elements.authRegisterNameInput.value);
    const registerPhoneValidation = getPhoneValidation(elements.authRegisterPhoneInput && elements.authRegisterPhoneInput.value);
    const registerEmailValidation = getEmailValidation(elements.authRegisterEmailInput && elements.authRegisterEmailInput.value);
    const registerPasswordValidation = getPasswordValidation(elements.authRegisterPasswordInput && elements.authRegisterPasswordInput.value);

    setAuthFieldState(elements.authEmailInput, elements.authLoginEmailFeedback, loginEmailValidation);
    setAuthFieldState(elements.authPasswordInput, elements.authLoginPasswordFeedback, loginPasswordValidation);
    setAuthFieldState(elements.authRegisterNameInput, elements.authRegisterNameFeedback, registerNameValidation);
    setAuthFieldState(elements.authRegisterPhoneInput, elements.authRegisterPhoneFeedback, registerPhoneValidation);
    setAuthFieldState(elements.authRegisterEmailInput, elements.authRegisterEmailFeedback, registerEmailValidation);
    setAuthFieldState(elements.authRegisterPasswordInput, elements.authRegisterPasswordFeedback, registerPasswordValidation);
  }

  function canSubmitLoginAccess() {
    const acceptedTerms = Boolean(elements.authTermsLoginCheck && elements.authTermsLoginCheck.checked);
    const emailValidation = getEmailValidation(elements.authEmailInput && elements.authEmailInput.value);
    const passwordValidation = getPasswordValidation(elements.authPasswordInput && elements.authPasswordInput.value);
    return acceptedTerms && emailValidation.valid && passwordValidation.valid;
  }

  function canSubmitRegisterAccess() {
    const acceptedTerms = Boolean(elements.authTermsRegisterCheck && elements.authTermsRegisterCheck.checked);
    const nameValidation = getNameValidation(elements.authRegisterNameInput && elements.authRegisterNameInput.value);
    const phoneValidation = getPhoneValidation(elements.authRegisterPhoneInput && elements.authRegisterPhoneInput.value);
    const emailValidation = getEmailValidation(elements.authRegisterEmailInput && elements.authRegisterEmailInput.value);
    const passwordValidation = getPasswordValidation(elements.authRegisterPasswordInput && elements.authRegisterPasswordInput.value);
    return acceptedTerms && nameValidation.valid && phoneValidation.valid && emailValidation.valid && passwordValidation.valid;
  }

  function setAuthMode(nextMode) {
    const normalizedMode = nextMode === "register" ? "register" : "login";
    authMode = normalizedMode;

    if (elements.authLoginWrap) {
      elements.authLoginWrap.hidden = normalizedMode !== "login";
    }

    if (elements.authRegisterWrap) {
      elements.authRegisterWrap.hidden = normalizedMode !== "register";
    }

    refreshAuthValidationUI();
    refreshAuthSubmitState();
  }

  function refreshAuthSubmitState() {
    refreshAuthValidationUI();

    if (elements.authEmailSubmitButton) {
      const loginPending = Boolean(elements.authEmailSubmitButton.dataset.pending === "true");
      const canLogin = canSubmitLoginAccess();
      elements.authEmailSubmitButton.disabled = loginPending || !canLogin;
    }

    if (elements.authRegisterSubmitButton) {
      const registerPending = Boolean(elements.authRegisterSubmitButton.dataset.pending === "true");
      const canRegister = canSubmitRegisterAccess();
      elements.authRegisterSubmitButton.disabled = registerPending || !canRegister;
    }
  }

  function setPremiumNote(message, type) {
    elements.premiumNote.textContent = message;
    elements.premiumNote.classList.remove("is-success", "is-error");
    if (type === "success") {
      elements.premiumNote.classList.add("is-success");
    }
    if (type === "error") {
      elements.premiumNote.classList.add("is-error");
    }
  }

  function setDistributionNote(message, type) {
    if (!elements.distributionNote) {
      return;
    }
    elements.distributionNote.textContent = message;
    elements.distributionNote.classList.remove("is-success", "is-error");
    if (type === "success") {
      elements.distributionNote.classList.add("is-success");
    }
    if (type === "error") {
      elements.distributionNote.classList.add("is-error");
    }
  }

  function setAdminNote(message, type) {
    if (!elements.adminNote) {
      return;
    }
    elements.adminNote.textContent = message;
    elements.adminNote.classList.remove("is-success", "is-error");
    if (type === "success") {
      elements.adminNote.classList.add("is-success");
    }
    if (type === "error") {
      elements.adminNote.classList.add("is-error");
    }
  }

  function updatePremiumUI() {
    if (state.premium.active) {
      elements.premiumStateTitle.textContent = "Estado: premium activo";
      elements.premiumStateCopy.textContent = "Tu acceso premium está verificado y habilitado en esta cuenta.";
      setPremiumNote("Membresía activa. Ya puedes usar rutas avanzadas y próximos módulos de certificación.", "success");
      return;
    }

    elements.premiumStateTitle.textContent = "Estado: " + (state.premium.status || "pendiente");
    elements.premiumStateCopy.textContent = getAuthUser()
      ? "Si ya pagaste, reporta la referencia y pulsa Verificar acceso."
      : "Inicia sesión para vincular premium a tu cuenta.";
  }

  function updateAuthUI() {
    const user = getAuthUser();
    const displayName = sanitizeText(user && user.displayName, "");
    const email = sanitizeText(user && user.email, "");

    if (user) {
      setAuthCodeVisible(false);
      if (elements.authCodeInput) {
        elements.authCodeInput.value = "";
      }
      lastPhoneLoginRequest = null;
      if (elements.authUserName) {
        elements.authUserName.textContent = displayName || "Cuenta conectada";
      }
      if (elements.authUserEmail) {
        elements.authUserEmail.textContent = email || "Sesión activa";
      }
      if (elements.authLogoutButton) {
        elements.authLogoutButton.hidden = false;
      }
    } else {
      if (elements.authUserName) {
        elements.authUserName.textContent = "Invitado";
      }
      if (elements.authUserEmail) {
        elements.authUserEmail.textContent = "Inicia sesión para sincronizar progreso, premium y admin.";
      }
      if (elements.authLogoutButton) {
        elements.authLogoutButton.hidden = true;
      }
    }

    refreshAuthSubmitState();
  }

  function applyPostLoginEntry(user, options) {
    if (!user) {
      return;
    }

    const config = options || {};

    const userDisplayName = sanitizeText(user.displayName, "");
    let changed = false;

    if (sanitizeText(state.profileName, "Visitante") === "Visitante" && userDisplayName) {
      state.profileName = userDisplayName;
      changed = true;
    }

    if (!state.onboardingDone) {
      state.onboardingDone = true;
      changed = true;
    }

    if (changed) {
      saveState();
    }

    updateOnboardingVisibility();
    updateProfilePanel();
    updateTopStats();
    updateAuthUI();
    updateAdminAccessUI();

    const requestedView = sanitizeText(config.preferredView, "");
    const preferredView = requestedView
      ? resolveView(requestedView)
      : (state.activeView === "home" ? "explore" : state.activeView);

    if (isDashboardPage()) {
      setActiveView(preferredView);
      setAuthNote(
        sanitizeText(config.dashboardMessage, "Sesión iniciada. Ya puedes continuar tu ruta de aprendizaje."),
        "success"
      );
      return;
    }

    setAuthNote(
      sanitizeText(config.accessMessage, "Sesión iniciada. Redirigiendo a tu panel..."),
      "success"
    );
    runDashboardTransition(preferredView, {
      title: sanitizeText(config.transitionTitle, "Entrando a tu panel..."),
      copy: sanitizeText(config.transitionCopy, "Kumaina está sincronizando tu progreso para continuar donde quedaste."),
      delayMs: config.transitionDelayMs || 760,
      tone: sanitizeText(config.transitionTone)
    });
  }

  function canUseAdminPanel() {
    const user = getAuthUser();
    if (!user) {
      return false;
    }

    if (!adminEmails.length) {
      return true;
    }

    const email = sanitizeText(user.email).toLowerCase();
    return adminEmails.includes(email);
  }

  function updateAdminAccessUI() {
    const adminTab = tabs.find(function(tab) { return tab.dataset.tab === "admin"; });
    const canUseAdmin = canUseAdminPanel();
    const showAdminTab = Boolean(adminTab && canUseAdmin);

    if (adminTab) {
      adminTab.hidden = !canUseAdmin;
    }
    if (elements.bottomNav) {
      elements.bottomNav.classList.toggle("is-admin-visible", showAdminTab);
    }

    if (!canUseAdmin && state.activeView === "admin") {
      setActiveView("explore");
    }

    if (!elements.adminNote) {
      return;
    }

    const user = getAuthUser();
    if (!user) {
      setAdminNote("Inicia sesión para usar el panel admin.", "error");
      return;
    }

    if (!canUseAdmin) {
      setAdminNote("Tu cuenta no está autorizada como admin en config.js (adminEmails).", "error");
      return;
    }

    setAdminNote("Listo para revisar solicitudes premium.", "success");
  }

  function setActiveLevelFilter(level) {
    const normalized = sanitizeText(level).toUpperCase();
    state.cefrFilter = normalized === "ALL" || !normalized ? "all" : normalizeLevel(normalized, "A1");
    saveState();

    levelFilterButtons.forEach(function(button) {
      const buttonLevel = sanitizeText(button.dataset.levelFilter, "all").toUpperCase();
      const active = state.cefrFilter === "all"
        ? buttonLevel === "ALL"
        : buttonLevel === state.cefrFilter;
      button.classList.toggle("is-active", active);
    });

    renderCourseMap();
    renderLevelProgress();
  }

  function renderLevelProgress() {
    if (!elements.levelProgressNote) {
      return;
    }

    const totals = { A1: 0, A2: 0, B1: 0 };
    const done = { A1: 0, A2: 0, B1: 0 };

    flattenLessons({ respectLevelFilter: false, includeLocked: true }).forEach(function(lesson) {
      const level = normalizeLevel(lesson.normalizedLevel || lesson.level, "A1");
      totals[level] += 1;
      if (state.completedLessons[lesson.id]) {
        done[level] += 1;
      }
    });

    const lines = ALLOWED_LEVELS.map(function(level) {
      return level + ": " + done[level] + "/" + totals[level];
    });

    const filterLabel = state.cefrFilter === "all" ? "Todos" : state.cefrFilter;
    elements.levelProgressNote.textContent = "Filtro activo: " + filterLabel + " · Progreso " + lines.join(" · ");
  }

  function renderCourseMap() {
    const host = elements.courseMap;
    if (!host) {
      return;
    }

    const targetLevel = state.cefrFilter === "all" ? "all" : normalizeLevel(state.cefrFilter, "A1");
    const fragment = document.createDocumentFragment();
    let hasVisibleLessons = false;

    (data.units || []).forEach(function(unit) {
      const unitLessons = (unit.lessons || []).map(function(lesson) {
        return Object.assign({}, lesson, {
          normalizedLevel: getLessonLevel(lesson, unit)
        });
      }).filter(function(lesson) {
        if (targetLevel === "all") {
          return true;
        }
        return lesson.normalizedLevel === targetLevel;
      });

      if (!unitLessons.length) {
        return;
      }

      hasVisibleLessons = true;
      const unitCard = document.createElement("article");
      unitCard.className = "pv-unit";

      const doneCount = unitLessons.filter(function(lesson) {
        return Boolean(state.completedLessons[lesson.id]);
      }).length;
      const ratio = unitLessons.length ? doneCount / unitLessons.length : 0;

      const header = document.createElement("div");
      header.className = "pv-unit-head";
      header.innerHTML =
        "<div><h3>" + sanitizeText(unit.name, "Unidad") + "</h3><p>" + sanitizeText(unit.description, "") + "</p></div>" +
        "<div class=\"pv-progress\"><div class=\"pv-progress-bar\"><span style=\"width:" + Math.round(ratio * 100) + "%\"></span></div><span>" + doneCount + "/" + unitLessons.length + "</span></div>";
      unitCard.appendChild(header);

      const list = document.createElement("div");
      list.className = "pv-lesson-list";

      unitLessons.forEach(function(lesson, lessonIndex) {
        const done = Boolean(state.completedLessons[lesson.id]);
        const locked = isLessonPremiumLocked(lesson, unit);
        const unitLessonIndex = lessonIndex + 1;
        const lessonRow = document.createElement("div");
        lessonRow.className = "pv-lesson" + (done ? " is-done" : "") + (locked ? " is-locked" : "");
        lessonRow.dataset.level = lesson.normalizedLevel;
        lessonRow.innerHTML =
          "<div class=\"pv-lesson-left\">" +
          "<span class=\"pv-lesson-index\">" + unitLessonIndex + "</span>" +
          "<div class=\"pv-lesson-copy\"><strong>" + sanitizeText(lesson.title, "Lección") + "</strong><span>" +
          sanitizeText(lesson.description, lesson.normalizedLevel + " · +" + lesson.xp + " XP") +
          (locked ? " · Requiere Premium" : "") +
          "</span></div></div>" +
          "<div class=\"pv-lesson-art\" data-tone=\"" + (unitLessonIndex % 4) + "\"></div>";

        const actions = document.createElement("div");
        actions.className = "pv-lesson-actions";

        const startButton = document.createElement("button");
        startButton.type = "button";
        startButton.className = "pv-lesson-go" + (locked ? " is-locked-btn" : "");
        startButton.textContent = locked ? "★" : "→";
        startButton.setAttribute("aria-label", locked ? "Desbloquear premium" : "Ir a lección");
        startButton.setAttribute("title", locked ? "Desbloquear premium" : (done ? "Repetir lección" : "Empezar lección"));
        startButton.addEventListener("click", function() {
          if (locked) {
            setPremiumNote("Las lecciones B1 se habilitan cuando premium esté activo.", "error");
            setActiveView("premium");
            return;
          }
          startLesson(lesson.id);
          setActiveView("learn");
        });

        actions.appendChild(startButton);
        lessonRow.appendChild(actions);
        list.appendChild(lessonRow);
      });

      unitCard.appendChild(list);
      fragment.appendChild(unitCard);
    });

    if (!hasVisibleLessons) {
      host.innerHTML = "<div class=\"pv-note\">No hay lecciones para este nivel todavía.</div>";
      updateHeroHighlights();
      return;
    }

    host.replaceChildren(fragment);
    updateHeroHighlights();
  }

  function renderDictionary() {
    const search = sanitizeText(elements.dictionarySearch.value).toLowerCase();
    const filtered = dictionaryEntries.filter(function(entry) {
      if (!search) {
        return true;
      }
      const stack = [
        entry.term,
        entry.translation,
        entry.description,
        entry.themeLabel,
        entry.theme,
        (entry.tags || []).join(" ")
      ].join(" ").toLowerCase();
      return stack.includes(search);
    }).slice(0, 120);

    if (!filtered.length) {
      elements.dictionaryList.innerHTML = "<div class=\"pv-note\">No encontramos resultados con ese criterio.</div>";
      return;
    }

    const fragment = document.createDocumentFragment();
    filtered.forEach(function(entry) {
      const card = document.createElement("article");
      card.className = "pv-dictionary-item";
      card.innerHTML =
        "<strong>" + sanitizeText(entry.term, "Sin término") + " · " + sanitizeText(entry.translation, "Sin traducción") + "</strong>" +
        "<p>" + sanitizeText(entry.description, "Sin descripción disponible.") + "</p>";
      fragment.appendChild(card);
    });

    elements.dictionaryList.replaceChildren(fragment);
  }

  function updateOnboardingVisibility() {
    if (!elements.onboardingCard) {
      return;
    }

    const shouldShow = !state.onboardingDone && state.activeView === "explore";
    elements.onboardingCard.hidden = !shouldShow;
    if (!shouldShow) {
      return;
    }

    elements.profileNameInput.value = sanitizeText(state.profileName, "");
    elements.dailyGoalSelect.value = String(Number(state.dailyGoal || 10));
  }

  function hydrateLessonUIWithoutSession() {
    elements.lessonTitle.textContent = "Selecciona una lección";
    elements.lessonSubtitle.textContent = "Elige una ruta desde Inicio para comenzar.";
    elements.lessonProgressChip.textContent = "0/0";
    elements.questionPrompt.textContent = "Todavía no hay pregunta activa.";
    elements.questionOptions.replaceChildren();
    elements.questionFeedback.textContent = "Cuando inicies una lección verás aquí la retroalimentación.";
    elements.questionFeedback.classList.remove("is-ok", "is-bad");
    elements.nextQuestionButton.disabled = true;
    elements.finishLessonButton.disabled = true;
    if (elements.playPronunciationButton) {
      elements.playPronunciationButton.disabled = true;
    }
  }

  function stopPronunciation() {
    if (questionAudioElement) {
      questionAudioElement.pause();
      questionAudioElement.currentTime = 0;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  async function playPronunciation(question) {
    if (!question) {
      return;
    }

    stopPronunciation();

    const audioUrl = sanitizeText(question.audioUrl);
    if (audioUrl) {
      questionAudioElement = questionAudioElement || new Audio();
      questionAudioElement.src = audioUrl;
      await questionAudioElement.play();
      return;
    }

    if (!("speechSynthesis" in window)) {
      elements.questionFeedback.textContent = "Tu navegador no soporta síntesis de voz para pronunciación.";
      elements.questionFeedback.classList.remove("is-ok");
      elements.questionFeedback.classList.add("is-bad");
      return;
    }

    const phrase = sanitizeText(question.audioText || question.prompt);
    if (!phrase) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "es-CO";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  function renderLessonQuestion() {
    if (!lessonSession) {
      hydrateLessonUIWithoutSession();
      return;
    }

    const lesson = lessonSession.lesson;
    const total = lesson.questions.length;
    const index = lessonSession.questionIndex;
    const question = lesson.questions[index];

    elements.lessonTitle.textContent = lesson.title;
    elements.lessonSubtitle.textContent = lesson.unitName + " · " + lesson.normalizedLevel + " · +" + lesson.xp + " XP al completar";
    elements.lessonProgressChip.textContent = (index + 1) + "/" + total;
    elements.questionPrompt.textContent = question.prompt;

    if (elements.playPronunciationButton) {
      elements.playPronunciationButton.disabled = false;
    }

    const optionsFragment = document.createDocumentFragment();
    question.options.forEach(function(option, optionIndex) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pv-option";
      button.textContent = option;

      if (lessonSession.answered) {
        if (optionIndex === question.answer) {
          button.classList.add("is-correct");
        } else if (optionIndex === lessonSession.selectedOption) {
          button.classList.add("is-wrong");
        }
      }

      button.addEventListener("click", function() {
        handleAnswer(optionIndex);
      });

      optionsFragment.appendChild(button);
    });

    elements.questionOptions.replaceChildren(optionsFragment);

    if (!lessonSession.answered) {
      elements.questionFeedback.textContent = "Escoge la mejor opción para continuar.";
      elements.questionFeedback.classList.remove("is-ok", "is-bad");
      elements.nextQuestionButton.disabled = true;
      elements.finishLessonButton.disabled = true;
    } else {
      const isLast = index === total - 1;
      elements.nextQuestionButton.disabled = isLast;
      elements.finishLessonButton.disabled = !isLast;
    }
  }

  function startLesson(lessonId) {
    const lesson = findLessonById(lessonId);
    if (!lesson) {
      return;
    }

    if (isLessonPremiumLocked(lesson, { cefrLevel: lesson.unitLevel })) {
      setPremiumNote("Este contenido B1 requiere premium activo.", "error");
      setActiveView("premium");
      return;
    }

    if (state.hearts <= 0) {
      elements.questionFeedback.textContent = "Sin corazones por hoy. Vuelve mañana o activa premium.";
      elements.questionFeedback.classList.remove("is-ok");
      elements.questionFeedback.classList.add("is-bad");
      return;
    }

    state.lastLessonId = lessonId;
    lessonSession = {
      lesson: lesson,
      questionIndex: 0,
      score: 0,
      answered: false,
      selectedOption: -1,
      wrongAnswers: 0
    };

    saveState();
    renderLessonQuestion();
  }

  function applyXP(value) {
    const amount = Math.max(0, Number(value || 0));
    state.xp = Math.max(0, Number(state.xp || 0) + amount);
    state.xpToday = Math.max(0, Number(state.xpToday || 0) + amount);
    saveState();
    updateTopStats();
  }

  function consumeHeart() {
    state.hearts = Math.max(0, Number(state.hearts || 0) - 1);
    saveState();
    updateTopStats();
  }

  function handleAnswer(optionIndex) {
    if (!lessonSession || lessonSession.answered) {
      return;
    }

    const question = lessonSession.lesson.questions[lessonSession.questionIndex];
    const correct = optionIndex === question.answer;
    lessonSession.answered = true;
    lessonSession.selectedOption = optionIndex;

    if (correct) {
      lessonSession.score += 1;
      applyXP(XP_PER_CORRECT);
      elements.questionFeedback.textContent = "Bien hecho. " + sanitizeText(question.hint, "Respuesta correcta.");
      elements.questionFeedback.classList.remove("is-bad");
      elements.questionFeedback.classList.add("is-ok");
    } else {
      lessonSession.wrongAnswers += 1;
      consumeHeart();
      elements.questionFeedback.textContent = "Casi. " + sanitizeText(question.hint, "Revisa e inténtalo en la siguiente.");
      elements.questionFeedback.classList.remove("is-ok");
      elements.questionFeedback.classList.add("is-bad");
    }

    renderLessonQuestion();
  }

  function goNextQuestion() {
    if (!lessonSession || !lessonSession.answered) {
      return;
    }

    lessonSession.questionIndex += 1;
    lessonSession.answered = false;
    lessonSession.selectedOption = -1;
    renderLessonQuestion();
  }

  function finishCurrentLesson() {
    if (!lessonSession) {
      return;
    }

    const lesson = lessonSession.lesson;
    const total = lesson.questions.length;
    const percent = total ? lessonSession.score / total : 0;
    const passed = percent >= PASS_THRESHOLD;

    if (passed) {
      const firstTime = !state.completedLessons[lesson.id];
      state.completedLessons[lesson.id] = true;
      if (firstTime) {
        applyXP(lesson.xp);
      }
      elements.questionFeedback.textContent = "Lección completada con " + Math.round(percent * 100) + "%. Excelente progreso.";
      elements.questionFeedback.classList.remove("is-bad");
      elements.questionFeedback.classList.add("is-ok");
    } else {
      elements.questionFeedback.textContent = "Tu resultado fue " + Math.round(percent * 100) + "%. Repite la lección para consolidar.";
      elements.questionFeedback.classList.remove("is-ok");
      elements.questionFeedback.classList.add("is-bad");
    }

    saveState();
    lessonSession = null;
    renderCourseMap();
    renderLevelProgress();
    updateProfilePanel();
    updateTopStats();
    stopPronunciation();

    window.setTimeout(function() {
      hydrateLessonUIWithoutSession();
    }, 1800);
  }

  function buildPremiumPayload(providerLabel) {
    const authUser = getAuthUser();
    const amount = Number(premiumConfig.priceCop || 189000);
    const reference = createReference("LNGPAY");

    return {
      reference: reference,
      type: "lengua-premium",
      packageCode: premiumConfig.productId,
      packageName: premiumConfig.productName,
      description: "Acceso premium app Palenque Lengua Viva",
      total: amount,
      currency: "COP",
      name: sanitizeText(state.profileName, "Cliente Benko"),
      phone: "",
      email: sanitizeText(authUser && authUser.email, appConfig.channels && appConfig.channels.reservationEmail),
      city: "Cartagena",
      provider: String(providerLabel || "").toLowerCase(),
      items: [
        {
          id: premiumConfig.productId,
          sku: premiumConfig.productId,
          name: premiumConfig.productName,
          price: amount,
          quantity: 1
        }
      ]
    };
  }

  async function postJson(url, payload, extraHeaders) {
    const headers = Object.assign({ "Content-Type": "application/json" }, extraHeaders || {});
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload || {})
    });

    const contentType = response.headers.get("content-type") || "";
    const responseData = contentType.includes("application/json")
      ? await response.json()
      : { message: await response.text() };

    if (!response.ok) {
      throw new Error(responseData.message || responseData.error || "No pudimos procesar la solicitud.");
    }

    return responseData;
  }

  async function fetchJson(url, headers) {
    const response = await fetch(url, {
      method: "GET",
      headers: headers || {}
    });

    const contentType = response.headers.get("content-type") || "";
    const responseData = contentType.includes("application/json")
      ? await response.json()
      : { message: await response.text() };

    if (!response.ok) {
      throw new Error(responseData.message || responseData.error || "No pudimos completar la consulta.");
    }

    return responseData;
  }

  function createHiddenForm(action, fields) {
    const form = document.createElement("form");
    form.action = action;
    form.method = "GET";
    form.target = "_blank";
    form.style.display = "none";

    Object.entries(fields).forEach(function(entry) {
      const key = entry[0];
      const value = entry[1];
      if (value === undefined || value === null || value === "") {
        return;
      }
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  async function createPremiumRequest(kind, payload) {
    const db = getFirestore();
    const authUser = await waitAuthUser(2500);

    if (!db || !authUser) {
      throw new Error("Inicia sesión para registrar tu solicitud premium.");
    }

    const requestId = createReference("LNGREQ");
    await db.collection(PREMIUM_REQUEST_COLLECTION).doc(requestId).set({
      id: requestId,
      schemaVersion: 1,
      userUid: authUser.uid,
      userEmail: sanitizeText(authUser.email).toLowerCase(),
      userName: sanitizeText(state.profileName, authUser.displayName || ""),
      tipoSolicitud: kind,
      estado: "pendiente",
      plan: "lengua-premium",
      producto: premiumConfig.productName,
      precio: Number(premiumConfig.priceCop || 189000),
      moneda: "COP",
      referenciaPago: sanitizeText(elements.premiumReference.value || payload.reference || ""),
      proveedor: sanitizeText(payload.provider || ""),
      canal: "web-lengua-app",
      origen: window.location.pathname || "/app-lengua/index.html",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    state.premium.requestId = requestId;
    saveState();
    return requestId;
  }

  function normalizePremiumStatus(status) {
    return sanitizeText(status).toLowerCase();
  }

  function isPremiumActiveByStatus(status) {
    const normalized = normalizePremiumStatus(status);
    return ["activa", "pagada", "vigente", "aprobada", "trial"].includes(normalized);
  }

  async function syncPremiumFromCloud(showFeedback) {
    const db = getFirestore();
    const authUser = await waitAuthUser(2500);

    if (!authUser) {
      state.premium.active = false;
      state.premium.status = "requiere sesión";
      state.premium.source = "guest";
      saveState();
      updatePremiumUI();
      updateProfilePanel();
      updateAdminAccessUI();
      if (showFeedback) {
        setPremiumNote("Debes iniciar sesión para validar premium en la nube.", "error");
      }
      return false;
    }

    if (!db) {
      if (showFeedback) {
        setPremiumNote("No hay conexión con Firestore para validar premium.", "error");
      }
      return false;
    }

    try {
      const snapshot = await db.collection(PREMIUM_MEMBERSHIP_COLLECTION).doc(authUser.uid).get();
      const payload = snapshot.exists ? (snapshot.data() || {}) : {};
      const status = payload.estado || payload.status || "pendiente";

      state.premium.active = isPremiumActiveByStatus(status);
      state.premium.status = String(status || "pendiente");
      state.premium.source = snapshot.exists ? "cloud" : "none";
      saveState();
      updatePremiumUI();
      updateProfilePanel();
      renderCourseMap();

      if (showFeedback) {
        if (state.premium.active) {
          setPremiumNote("Premium activo y verificado en tu cuenta.", "success");
        } else {
          setPremiumNote("Aún no aparece activa tu membresía. Si ya pagaste, reporta referencia.", "error");
        }
      }

      return state.premium.active;
    } catch (_) {
      if (showFeedback) {
        setPremiumNote("No pudimos verificar premium ahora. Intenta nuevamente.", "error");
      }
      return false;
    }
  }

  async function payWithWompi() {
    const endpoint = paymentConfig.wompi && paymentConfig.wompi.checkoutEndpoint;
    const fallback = paymentConfig.wompi && paymentConfig.wompi.fallbackCheckoutUrl;
    const authUser = await waitAuthUser(2500);

    if (!authUser) {
      setPremiumNote("Primero inicia sesión para vincular tu compra premium.", "error");
      return;
    }

    if (!endpoint && fallback) {
      window.open(fallback, "_blank");
      setPremiumNote("Abrimos Wompi por enlace directo.", "success");
      return;
    }

    if (!endpoint) {
      setPremiumNote("Configura el endpoint Wompi en config.js para continuar.", "error");
      return;
    }

    const payload = buildPremiumPayload("wompi");
    const response = await postJson(endpoint, payload);

    if (!response.action || !response.fields) {
      throw new Error("Wompi no devolvió campos de checkout.");
    }

    createHiddenForm(response.action, response.fields);
    const requestId = await createPremiumRequest("checkout-wompi", payload);
    setPremiumNote("Wompi abierto. Solicitud " + requestId + " registrada. Al pagar, pulsa Verificar acceso.", "success");
  }

  async function payWithMercadoPago() {
    const endpoint = paymentConfig.mercadopago && paymentConfig.mercadopago.preferenceEndpoint;
    const fallback = paymentConfig.mercadopago && paymentConfig.mercadopago.fallbackCheckoutUrl;
    const authUser = await waitAuthUser(2500);

    if (!authUser) {
      setPremiumNote("Primero inicia sesión para vincular tu compra premium.", "error");
      return;
    }

    if (!endpoint && fallback) {
      window.open(fallback, "_blank");
      setPremiumNote("Abrimos Mercado Pago por enlace directo.", "success");
      return;
    }

    if (!endpoint) {
      setPremiumNote("Configura el endpoint Mercado Pago en config.js para continuar.", "error");
      return;
    }

    const payload = buildPremiumPayload("mercadopago");
    const response = await postJson(endpoint, payload);
    const initPoint = response.initPoint || response.init_point || response.sandboxInitPoint || response.sandbox_init_point;

    if (!initPoint) {
      throw new Error("Mercado Pago no devolvió un checkout válido.");
    }

    window.open(initPoint, "_blank");
    const requestId = await createPremiumRequest("checkout-mercadopago", payload);
    setPremiumNote("Mercado Pago abierto. Solicitud " + requestId + " registrada. Al pagar, pulsa Verificar acceso.", "success");
  }

  async function loginWithProvider(providerKey) {
    if (!window.authFirebase || typeof window.authFirebase.loginConProveedor !== "function") {
      setAuthNote("No encontramos el módulo de autenticación social cargado.", "error");
      return;
    }

    const providerLabel = {
      google: "Google",
      apple: "Apple",
      facebook: "Facebook",
      microsoft: "Microsoft"
    }[providerKey] || providerKey;

    setAuthNote("Conectando con " + providerLabel + "...", "success");
    const result = await window.authFirebase.loginConProveedor(providerKey, {
      nombre: sanitizeText(state.profileName)
    });

    if (!result || !result.success) {
      setAuthNote(
        enrichAuthErrorMessage(
          (result && result.error) || ("No se pudo iniciar sesión con " + providerLabel + "."),
          result && result.errorCode
        ),
        "error"
      );
      return;
    }

    if (result.pendingRedirect) {
      setAuthNote(result.mensaje || ("Redirigiendo a " + providerLabel + "..."), "success");
      return;
    }

    const user = result.user || getAuthUser();
    if (user && sanitizeText(state.profileName, "Visitante") === "Visitante" && sanitizeText(user.displayName)) {
      state.profileName = sanitizeText(user.displayName);
      saveState();
    }

    applyPostLoginEntry(user, { preferredView: "explore" });
    if (!user && (state.activeView === "home" || state.activeView === "explore")) {
      state.onboardingDone = true;
      saveState();
      updateOnboardingVisibility();
      setActiveView("explore");
    }
    setAuthNote(result.mensaje || ("Sesión iniciada con " + providerLabel + "."), "success");
    syncPremiumFromCloud(false);
  }

  async function logoutUser() {
    try {
      if (window.authFirebase && typeof window.authFirebase.logout === "function") {
        await window.authFirebase.logout();
      } else if (typeof firebase !== "undefined" && typeof firebase.auth === "function") {
        await firebase.auth().signOut();
      }
      await resetPhoneVerificationUI();
      setAuthNote("Sesión cerrada correctamente.", "success");
      updateAuthUI();
      updateAdminAccessUI();
      syncPremiumFromCloud(false);
      redirectToAccess();
    } catch (_) {
      setAuthNote("No pudimos cerrar sesión ahora. Intenta de nuevo.", "error");
    }
  }

  function getAdminHeaders() {
    const apiKey = sanitizeText(elements.adminApiKeyInput && elements.adminApiKeyInput.value);
    const user = getAuthUser();
    const email = sanitizeText(user && user.email).toLowerCase();
    return {
      "x-admin-key": apiKey,
      "x-admin-email": email
    };
  }

  function getAdminEndpoint(type) {
    if (type === "requests") {
      return sanitizeText(adminConfig.requestsEndpoint);
    }
    if (type === "approve") {
      return sanitizeText(adminConfig.approveEndpoint);
    }
    if (type === "reject") {
      return sanitizeText(adminConfig.rejectEndpoint);
    }
    return "";
  }

  function renderAdminRequests(items) {
    if (!elements.adminRequestsList) {
      return;
    }

    if (!Array.isArray(items) || !items.length) {
      elements.adminRequestsList.innerHTML = "<div class=\"pv-note\">No hay solicitudes para este estado.</div>";
      return;
    }

    const fragment = document.createDocumentFragment();

    items.forEach(function(item) {
      const card = document.createElement("article");
      card.className = "pv-admin-item";

      const title = document.createElement("strong");
      title.textContent = sanitizeText(item.userName, "Sin nombre") + " · " + sanitizeText(item.userEmail, "Sin correo");

      const meta = document.createElement("p");
      meta.className = "pv-admin-meta";
      meta.textContent =
        "ID: " + sanitizeText(item.id, "-") +
        " | Estado: " + sanitizeText(item.estado, "pendiente") +
        " | Ref: " + sanitizeText(item.referenciaPago, "-") +
        " | Precio: " + formatCOP(item.precio || premiumConfig.priceCop);

      card.appendChild(title);
      card.appendChild(meta);

      if (sanitizeText(item.estado).toLowerCase() === "pendiente") {
        const noteField = document.createElement("textarea");
        noteField.placeholder = "Nota opcional para aprobación o rechazo";
        noteField.rows = 2;

        const actions = document.createElement("div");
        actions.className = "pv-actions";

        const approveButton = document.createElement("button");
        approveButton.type = "button";
        approveButton.className = "pv-btn";
        approveButton.textContent = "Aprobar y activar";
        approveButton.addEventListener("click", function() {
          reviewPremiumRequest(item.id, "approve", noteField.value);
        });

        const rejectButton = document.createElement("button");
        rejectButton.type = "button";
        rejectButton.className = "pv-btn-ghost";
        rejectButton.textContent = "Rechazar";
        rejectButton.addEventListener("click", function() {
          reviewPremiumRequest(item.id, "reject", noteField.value);
        });

        actions.appendChild(approveButton);
        actions.appendChild(rejectButton);
        card.appendChild(noteField);
        card.appendChild(actions);
      }

      fragment.appendChild(card);
    });

    elements.adminRequestsList.replaceChildren(fragment);
  }

  async function loadAdminRequests() {
    if (!canUseAdminPanel()) {
      setAdminNote("Tu cuenta no puede usar el panel admin en esta app.", "error");
      return;
    }

    const endpoint = getAdminEndpoint("requests");
    if (!endpoint) {
      setAdminNote("Falta config de requestsEndpoint en config.js.", "error");
      return;
    }

    const headers = getAdminHeaders();
    if (!headers["x-admin-key"]) {
      setAdminNote("Escribe la clave admin backend para continuar.", "error");
      return;
    }

    const status = sanitizeText(elements.adminStatusFilter && elements.adminStatusFilter.value, "pendiente").toLowerCase();
    const url = status && status !== "all"
      ? endpoint + "?status=" + encodeURIComponent(status)
      : endpoint;

    const response = await fetchJson(url, headers);
    const requests = Array.isArray(response.requests) ? response.requests : [];
    renderAdminRequests(requests);
    setAdminNote("Solicitudes cargadas: " + requests.length, "success");
  }

  async function reviewPremiumRequest(requestId, mode, notes) {
    if (!canUseAdminPanel()) {
      setAdminNote("No tienes permiso para esta operación.", "error");
      return;
    }

    const endpoint = getAdminEndpoint(mode === "approve" ? "approve" : "reject");
    if (!endpoint) {
      setAdminNote("Falta endpoint admin para " + mode + " en config.js.", "error");
      return;
    }

    const headers = getAdminHeaders();
    if (!headers["x-admin-key"]) {
      setAdminNote("Escribe la clave admin backend para continuar.", "error");
      return;
    }

    const payload = {
      requestId: sanitizeText(requestId),
      notes: sanitizeText(notes),
      adminEmail: headers["x-admin-email"]
    };

    const response = await postJson(endpoint, payload, headers);
    const statusMessage = mode === "approve"
      ? "Solicitud aprobada y membresía activada."
      : "Solicitud rechazada.";
    setAdminNote(response.message || statusMessage, "success");
    await loadAdminRequests();
    await syncPremiumFromCloud(false);
  }

  function wireTabs() {
    tabs.forEach(function(tab) {
      tab.addEventListener("click", function() {
        const next = tab.dataset.tab;
        if (next === "admin" && !canUseAdminPanel()) {
          setAdminNote("Solo admins autorizados pueden abrir este panel.", "error");
          return;
        }
        setActiveView(next);
      });
    });

    quickViewButtons.forEach(function(button) {
      button.addEventListener("click", function() {
        const view = button.dataset.goView;
        if (view) {
          setActiveView(view);
        }
      });
    });

    window.addEventListener("hashchange", function() {
      const hashView = resolveView((window.location.hash || "").replace("#", ""));
      if (hashView === "admin" && !canUseAdminPanel()) {
        setActiveView("home", false);
        return;
      }
      setActiveView(hashView, false);
    });
  }

  function wireOnboarding() {
    elements.startLearningButton.addEventListener("click", function() {
      const name = sanitizeText(elements.profileNameInput.value, "Visitante");
      const goal = Number(elements.dailyGoalSelect.value || 10);
      state.profileName = name;
      state.dailyGoal = goal;
      state.onboardingDone = true;
      saveState();
      updateOnboardingVisibility();
      updateProfilePanel();
      updateTopStats();
      setActiveView("learn");
    });

    elements.skipOnboardingButton.addEventListener("click", function() {
      state.onboardingDone = true;
      saveState();
      updateOnboardingVisibility();
      setActiveView("learn");
    });
  }

  function wireLevelFilters() {
    levelFilterButtons.forEach(function(button) {
      button.addEventListener("click", function() {
        setActiveLevelFilter(button.dataset.levelFilter || "all");
      });
    });
  }

  function wireLearningActions() {
    elements.continueLastButton.addEventListener("click", function() {
      const lesson = findLessonById(state.lastLessonId) || getFirstIncompleteLesson({
        respectLevelFilter: true,
        includeLocked: false
      }) || getFirstIncompleteLesson({
        respectLevelFilter: false,
        includeLocked: false
      });
      if (!lesson) {
        return;
      }
      startLesson(lesson.id);
      setActiveView("learn");
    });

    elements.nextQuestionButton.addEventListener("click", function() {
      goNextQuestion();
    });

    elements.finishLessonButton.addEventListener("click", function() {
      finishCurrentLesson();
    });

    if (elements.playPronunciationButton) {
      elements.playPronunciationButton.addEventListener("click", async function() {
        if (!lessonSession) {
          return;
        }
        const question = lessonSession.lesson.questions[lessonSession.questionIndex];
        try {
          await playPronunciation(question);
        } catch (_) {
          elements.questionFeedback.textContent = "No pudimos reproducir la pronunciación en este momento.";
          elements.questionFeedback.classList.remove("is-ok");
          elements.questionFeedback.classList.add("is-bad");
        }
      });
    }
  }

  function wireDictionary() {
    elements.dictionarySearch.addEventListener("input", function() {
      renderDictionary();
    });
  }

  function wirePremium() {
    elements.premiumSyncButton.addEventListener("click", function() {
      syncPremiumFromCloud(true);
    });

    elements.premiumRequestButton.addEventListener("click", async function() {
      try {
        const authUser = await waitAuthUser(2500);
        if (!authUser) {
          setPremiumNote("Inicia sesión antes de reportar pago.", "error");
          return;
        }
        const requestId = await createPremiumRequest("revision-manual", {
          reference: sanitizeText(elements.premiumReference.value)
        });
        setPremiumNote("Solicitud registrada: " + requestId + ". Te avisaremos cuando quede activa.", "success");
      } catch (error) {
        setPremiumNote(error.message || "No pudimos registrar la solicitud.", "error");
      }
    });

    elements.premiumPayWompiButton.addEventListener("click", async function() {
      try {
        await payWithWompi();
      } catch (error) {
        setPremiumNote(error.message || "No pudimos abrir Wompi.", "error");
      }
    });

    elements.premiumPayMpButton.addEventListener("click", async function() {
      try {
        await payWithMercadoPago();
      } catch (error) {
        setPremiumNote(error.message || "No pudimos abrir Mercado Pago.", "error");
      }
    });
  }

  function wireAuth() {
    function isUserNotFoundError(code) {
      const normalizedCode = sanitizeText(code).toLowerCase();
      return normalizedCode === "auth/user-not-found" || normalizedCode === "client/user-not-found";
    }

    async function submitEmailAccess() {
      if (!window.authFirebase || typeof window.authFirebase.login !== "function" || typeof window.authFirebase.registrar !== "function") {
        setAuthNote("No encontramos el módulo de autenticación. Recarga la app.", "error");
        return;
      }

      const email = sanitizeText(elements.authEmailInput && elements.authEmailInput.value).toLowerCase();
      const password = String((elements.authPasswordInput && elements.authPasswordInput.value) || "");
      const acceptedTerms = Boolean(elements.authTermsLoginCheck && elements.authTermsLoginCheck.checked);

      if (!acceptedTerms) {
        setAuthNote("Debes aceptar Términos y Política de Privacidad para continuar.", "error");
        refreshAuthSubmitState();
        return;
      }

      if (!email || !email.includes("@")) {
        setAuthNote("Escribe un correo válido para continuar.", "error");
        refreshAuthSubmitState();
        return;
      }

      if (password.length < 8) {
        setAuthNote("La contraseña debe tener al menos 8 caracteres.", "error");
        refreshAuthSubmitState();
        return;
      }

      setButtonPending(elements.authEmailSubmitButton, true, "Entrando...", "Entrar");

      let loginResult = null;
      try {
        loginResult = await window.authFirebase.login(email, password);
      } catch (_) {
        loginResult = {
          success: false,
          error: "No se pudo iniciar sesión en este momento.",
          errorCode: "client/login-failed"
        };
      }

      if (loginResult && loginResult.success) {
        const authUser = loginResult.user || getAuthUser();
        applyPostLoginEntry(authUser, {
          preferredView: "explore",
          accessMessage: "¡Bienvenido de nuevo! Entrando a tu panel...",
          dashboardMessage: "Sesión iniciada. Continuemos tu ruta de aprendizaje.",
          transitionTitle: "¡Bienvenido de nuevo!",
          transitionCopy: "Estamos recuperando tu progreso y tus módulos activos.",
          transitionDelayMs: 820,
          transitionTone: "success"
        });
        setAuthNote(loginResult.mensaje || "Sesión iniciada correctamente.", "success");
        syncPremiumFromCloud(false);
        setButtonPending(elements.authEmailSubmitButton, false, "Entrando...", "Entrar");
        return;
      }

      if (isUserNotFoundError(loginResult && loginResult.errorCode)) {
        setAuthNote("No encontramos esa cuenta. Usa la opción «Crear cuenta» para registrarte.", "error");
        setButtonPending(elements.authEmailSubmitButton, false, "Entrando...", "Entrar");
        setAuthMode("register");
        if (elements.authRegisterEmailInput && !sanitizeText(elements.authRegisterEmailInput.value)) {
          elements.authRegisterEmailInput.value = email;
        }
        return;
      }

      setAuthNote(
        enrichAuthErrorMessage(
          (loginResult && loginResult.error) || "No se pudo iniciar sesión.",
          loginResult && loginResult.errorCode
        ),
        "error"
      );
      setButtonPending(elements.authEmailSubmitButton, false, "Entrando...", "Entrar");
    }

    async function createBasicAccount() {
      if (!window.authFirebase || typeof window.authFirebase.registrar !== "function") {
        setAuthNote("No encontramos el módulo de registro. Recarga la app.", "error");
        return;
      }

      const fullName = sanitizeText(elements.authRegisterNameInput && elements.authRegisterNameInput.value);
      const phone = sanitizeText(elements.authRegisterPhoneInput && elements.authRegisterPhoneInput.value);
      const email = sanitizeText(elements.authRegisterEmailInput && elements.authRegisterEmailInput.value).toLowerCase();
      const password = String((elements.authRegisterPasswordInput && elements.authRegisterPasswordInput.value) || "");
      const acceptedTerms = Boolean(elements.authTermsRegisterCheck && elements.authTermsRegisterCheck.checked);

      if (!acceptedTerms) {
        setAuthNote("Debes aceptar Términos y Política de Privacidad para crear la cuenta.", "error");
        refreshAuthSubmitState();
        return;
      }

      if (fullName.length < 3) {
        setAuthNote("Escribe tu nombre completo para crear la cuenta.", "error");
        refreshAuthSubmitState();
        return;
      }

      if (phone.replace(/\D/g, "").length < 10) {
        setAuthNote("Escribe un celular válido para crear la cuenta.", "error");
        refreshAuthSubmitState();
        return;
      }

      if (!email || !email.includes("@")) {
        setAuthNote("Escribe un correo válido para crear la cuenta.", "error");
        refreshAuthSubmitState();
        return;
      }

      if (password.length < 8) {
        setAuthNote("La contraseña debe tener al menos 8 caracteres.", "error");
        refreshAuthSubmitState();
        return;
      }

      setButtonPending(elements.authRegisterSubmitButton, true, "Creando cuenta...", "Crear cuenta");

      let registerResult = null;
      try {
        registerResult = await window.authFirebase.registrar(email, password, {
          nombre: fullName,
          telefono: phone,
          phone: phone,
          legalAcceptance: {
            termsAccepted: true,
            privacyAccepted: true,
            acceptedAt: new Date().toISOString()
          }
        });
      } catch (_) {
        registerResult = {
          success: false,
          error: "No se pudo crear la cuenta en este momento.",
          errorCode: "client/register-failed"
        };
      }

      if (!registerResult || !registerResult.success) {
        setAuthNote(
          enrichAuthErrorMessage(
            (registerResult && registerResult.error) || "No se pudo crear la cuenta.",
            registerResult && registerResult.errorCode
          ),
          "error"
        );
        setButtonPending(elements.authRegisterSubmitButton, false, "Creando cuenta...", "Crear cuenta");
        return;
      }

      if (sanitizeText(state.profileName, "Visitante") === "Visitante" || !sanitizeText(state.profileName)) {
        state.profileName = fullName;
        saveState();
      }

      const createdUser = registerResult.user || getAuthUser();
      applyPostLoginEntry(createdUser, {
        preferredView: "explore",
        accessMessage: "Cuenta creada con éxito. Entrando a tu panel...",
        dashboardMessage: "Cuenta creada y sesión activa.",
        transitionTitle: "¡Cuenta creada con éxito!",
        transitionCopy: "Tu perfil básico ya está guardado. Estamos preparando tu primera ruta.",
        transitionDelayMs: 1280,
        transitionTone: "success"
      });
      const createdMessage = registerResult.verificationSent
        ? "Cuenta creada. Revisa tu correo para verificarla."
        : "Cuenta creada correctamente.";
      setAuthNote(createdMessage, "success");
      syncPremiumFromCloud(false);
      setButtonPending(elements.authRegisterSubmitButton, false, "Creando cuenta...", "Crear cuenta");
    }

    async function sendPasswordReset() {
      if (!window.authFirebase || typeof window.authFirebase.resetPassword !== "function") {
        setAuthNote("No encontramos el módulo de recuperación de contraseña.", "error");
        return;
      }

      const email = sanitizeText(elements.authEmailInput && elements.authEmailInput.value).toLowerCase();
      if (!email || !email.includes("@")) {
        setAuthNote("Escribe tu correo primero para enviarte el enlace de recuperación.", "error");
        return;
      }

      const result = await window.authFirebase.resetPassword(email);
      if (!result || !result.success) {
        setAuthNote(
          enrichAuthErrorMessage(
            (result && result.error) || "No pudimos enviar el correo de recuperación.",
            result && result.errorCode
          ),
          "error"
        );
        return;
      }

      setAuthNote(result.mensaje || "Te enviamos un enlace de recuperación a tu correo.", "success");
    }

    if (elements.authEmailSubmitButton) {
      elements.authEmailSubmitButton.addEventListener("click", function() {
        submitEmailAccess().catch(function() {
          setButtonPending(elements.authEmailSubmitButton, false, "Entrando...", "Entrar");
          setAuthNote("No se pudo completar el acceso en este momento.", "error");
        });
      });
    }

    if (elements.authRegisterSubmitButton) {
      elements.authRegisterSubmitButton.addEventListener("click", function() {
        createBasicAccount().catch(function() {
          setButtonPending(elements.authRegisterSubmitButton, false, "Creando cuenta...", "Crear cuenta");
          setAuthNote("No se pudo crear la cuenta en este momento.", "error");
        });
      });
    }

    if (elements.authForgotButton) {
      elements.authForgotButton.addEventListener("click", function() {
        sendPasswordReset().catch(function() {
          setAuthNote("No pudimos enviar el enlace de recuperación ahora.", "error");
        });
      });
    }

    if (elements.authEmailInput) {
      elements.authEmailInput.addEventListener("input", function() {
        refreshAuthSubmitState();
      });
    }

    if (elements.authPasswordInput) {
      elements.authPasswordInput.addEventListener("input", function() {
        refreshAuthSubmitState();
      });
      elements.authPasswordInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
          event.preventDefault();
          if (elements.authEmailSubmitButton && !elements.authEmailSubmitButton.disabled) {
            elements.authEmailSubmitButton.click();
          }
        }
      });
    }

    if (elements.authRegisterNameInput) {
      elements.authRegisterNameInput.addEventListener("input", function() {
        refreshAuthSubmitState();
      });
    }

    if (elements.authRegisterPhoneInput) {
      elements.authRegisterPhoneInput.addEventListener("input", function() {
        refreshAuthSubmitState();
      });
    }

    if (elements.authRegisterEmailInput) {
      elements.authRegisterEmailInput.addEventListener("input", function() {
        refreshAuthSubmitState();
      });
    }

    if (elements.authRegisterPasswordInput) {
      elements.authRegisterPasswordInput.addEventListener("input", function() {
        refreshAuthSubmitState();
      });
      elements.authRegisterPasswordInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
          event.preventDefault();
          if (elements.authRegisterSubmitButton && !elements.authRegisterSubmitButton.disabled) {
            elements.authRegisterSubmitButton.click();
          }
        }
      });
    }

    if (elements.authTermsLoginCheck) {
      elements.authTermsLoginCheck.addEventListener("change", function() {
        refreshAuthSubmitState();
      });
    }

    if (elements.authTermsRegisterCheck) {
      elements.authTermsRegisterCheck.addEventListener("change", function() {
        refreshAuthSubmitState();
      });
    }

    if (elements.authOpenRegisterButton) {
      elements.authOpenRegisterButton.addEventListener("click", function() {
        setAuthMode("register");
        if (elements.authRegisterEmailInput && !sanitizeText(elements.authRegisterEmailInput.value)) {
          elements.authRegisterEmailInput.value = sanitizeText(elements.authEmailInput && elements.authEmailInput.value).toLowerCase();
        }
      });
    }

    if (elements.authBackLoginButton) {
      elements.authBackLoginButton.addEventListener("click", function() {
        setAuthMode("login");
        if (elements.authEmailInput && !sanitizeText(elements.authEmailInput.value)) {
          elements.authEmailInput.value = sanitizeText(elements.authRegisterEmailInput && elements.authRegisterEmailInput.value).toLowerCase();
        }
      });
    }

    if (elements.authGoogleButton) {
      elements.authGoogleButton.addEventListener("click", function() {
        loginWithProvider("google").catch(function() {
          setAuthNote("No se pudo iniciar con Google.", "error");
        });
      });
    }

    if (elements.authAppleButton) {
      elements.authAppleButton.addEventListener("click", function() {
        loginWithProvider("apple").catch(function() {
          setAuthNote("No se pudo iniciar con Apple.", "error");
        });
      });
    }

    if (elements.authFacebookButton) {
      elements.authFacebookButton.addEventListener("click", function() {
        loginWithProvider("facebook").catch(function() {
          setAuthNote("No se pudo iniciar con Facebook.", "error");
        });
      });
    }

    if (elements.authLogoutButton) {
      elements.authLogoutButton.addEventListener("click", function() {
        logoutUser();
      });
    }

    if (
      !authWatchAttached &&
      typeof firebase !== "undefined" &&
      firebase.apps &&
      firebase.apps.length &&
      typeof firebase.auth === "function"
    ) {
      authWatchAttached = true;
      firebase.auth().onAuthStateChanged(function(user) {
        const uid = sanitizeText(user && user.uid, "");
        const isNewLogin = Boolean(uid) && uid !== lastKnownAuthUid;
        lastKnownAuthUid = uid;

        if (!user && isDashboardPage()) {
          redirectToAccess();
          return;
        }

        if (user && sanitizeText(state.profileName, "Visitante") === "Visitante" && sanitizeText(user.displayName)) {
          state.profileName = sanitizeText(user.displayName);
          saveState();
          updateOnboardingVisibility();
          updateProfilePanel();
        }

        if (isNewLogin) {
          applyPostLoginEntry(user, { preferredView: "explore" });
        }

        updateAuthUI();
        updateAdminAccessUI();
        syncPremiumFromCloud(false);
      });
    }

    setAuthMode("login");
  }

  function wireAdmin() {
    if (!elements.adminLoadButton) {
      return;
    }

    elements.adminLoadButton.addEventListener("click", function() {
      loadAdminRequests().catch(function(error) {
        setAdminNote(error.message || "No pudimos cargar solicitudes admin.", "error");
      });
    });
  }

  function wireProfile() {
    elements.resetProgressButton.addEventListener("click", function() {
      state.xp = 0;
      state.xpToday = 0;
      state.hearts = MAX_HEARTS;
      state.completedLessons = {};
      state.lastLessonId = "";
      saveState();
      renderCourseMap();
      renderLevelProgress();
      updateTopStats();
      updateProfilePanel();
      hydrateLessonUIWithoutSession();
      stopPronunciation();
    });
  }

  function wireInstallPrompt() {
    if (!elements.installButton) {
      return;
    }

    window.addEventListener("beforeinstallprompt", function(event) {
      event.preventDefault();
      deferredInstallPrompt = event;
      elements.installButton.classList.add("is-visible");
    });

    elements.installButton.addEventListener("click", async function() {
      if (!deferredInstallPrompt) {
        return;
      }
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      elements.installButton.classList.remove("is-visible");
    });
  }

  function wireDistributionActions() {
    const playStoreUrl = sanitizeText(distributionConfig.playStoreUrl);
    const apkUrl = sanitizeText(distributionConfig.apkUrl);
    const apkLabel = sanitizeText(distributionConfig.apkLabel, "Descargar APK (beta)");
    const showApkOnDesktop = Boolean(distributionConfig.showApkOnDesktop);
    const isAndroid = /Android/i.test((window.navigator && window.navigator.userAgent) || "");

    if (elements.playStoreButton) {
      elements.playStoreButton.hidden = !playStoreUrl;
      elements.playStoreButton.addEventListener("click", function() {
        if (!playStoreUrl) {
          setDistributionNote("Falta configurar playStoreUrl en config.js.", "error");
          return;
        }
        window.open(playStoreUrl, "_blank", "noopener,noreferrer");
      });
    }

    const showApkButton = Boolean(apkUrl) && (isAndroid || showApkOnDesktop);
    if (elements.apkDownloadButton) {
      elements.apkDownloadButton.hidden = !showApkButton;
      elements.apkDownloadButton.textContent = apkLabel;
      elements.apkDownloadButton.addEventListener("click", function() {
        if (!apkUrl) {
          setDistributionNote("Falta configurar apkUrl en config.js.", "error");
          return;
        }
        window.open(apkUrl, "_blank", "noopener,noreferrer");
      });
    }

    if (playStoreUrl) {
      setDistributionNote("Ya puedes instalar desde Google Play.", "success");
      return;
    }

    if (showApkButton) {
      setDistributionNote("Google Play en preparación. Mientras tanto puedes usar la descarga Android.", "success");
      return;
    }

    setDistributionNote("Instala la app desde el navegador mientras publicamos en Google Play.");
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("./sw.js?v=20260511q", { updateViaCache: "none" }).then(function(registration) {
      if (registration && typeof registration.update === "function") {
        registration.update().catch(function() {
          // noop
        });
      }
    }).catch(function() {
      // noop
    });
  }

  function bootstrap() {
    syncDailyState();
    wireTabs();
    wireOnboarding();
    wireLevelFilters();
    wireLearningActions();
    wireDictionary();
    wirePremium();
    wireAuth();
    wireAdmin();
    wireProfile();
    wireInstallPrompt();
    wireDistributionActions();
    registerServiceWorker();

    updateOnboardingVisibility();
    updateTopStats();
    updateProfilePanel();
    updatePremiumUI();
    updateAuthUI();
    updateAdminAccessUI();
    renderCourseMap();
    renderLevelProgress();
    renderDictionary();
    renderWordOfDay();
    hydrateLessonUIWithoutSession();

    waitAuthUser(isDashboardPage() ? 2600 : 1200).then(function(user) {
      if (isDashboardPage()) {
        hideAuthTransition();
        if (!user) {
          redirectToAccess();
          return;
        }
        if (state.activeView === "home") {
          setActiveView("explore");
        }
        return;
      }

      if (user) {
        runDashboardTransition("explore");
      }
    }).catch(function() {
      // noop
    });

    setActiveLevelFilter(state.cefrFilter || "all");

    const hashRaw = window.location.hash || "";
    const hashView = resolveView(hashRaw.replace("#", ""));
    const hasAuthenticatedUser = Boolean(getAuthUser());
    const defaultView = isDashboardPage() && hasAuthenticatedUser ? "explore" : "home";
    const initialView = hashRaw ? hashView : defaultView;

    if (initialView === "admin" && !canUseAdminPanel()) {
      setActiveView("home", true);
    } else {
      const normalizedInitialView =
        hasAuthenticatedUser && initialView === "home"
          ? "explore"
          : initialView;
      setActiveView(normalizedInitialView, true);
    }

    saveState();
    syncPremiumFromCloud(false);
    hideSplashScreen();
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
