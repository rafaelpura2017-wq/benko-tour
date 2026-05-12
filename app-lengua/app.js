(function() {
  "use strict";

  const STORAGE_KEY = "palenque-lengua-v2";
  const PREMIUM_MEMBERSHIP_COLLECTION = "membresias_lengua";
  const PREMIUM_REQUEST_COLLECTION = "solicitudes_membresia_lengua";
  const MAX_HEARTS = 5;
  const PASS_THRESHOLD = 0.67;
  const XP_PER_CORRECT = 4;
  const GAME_XP_PER_CORRECT = 3;
  const ALLOWED_VIEWS = ["home", "explore", "learn", "dictionary", "premium", "profile", "admin"];
  const ALLOWED_LEVELS = ["A1", "A2", "B1"];
  const ALLOWED_DAILY_GOALS = [5, 10, 20];
  const ACCESS_PAGE_FILE = "index.html";
  const DASHBOARD_PAGE_FILE = "dashboard.html";

  const data = window.BENKO_LENGUA_APP_DATA || { units: [] };
  const dictionaryPayload = window.benkoPalenqueraDictionary || {};
  const dictionaryEntries = Array.isArray(dictionaryPayload.entries) ? dictionaryPayload.entries : [];
  const GAME_MODES = ["hidden-word", "trivia", "listening", "meaning"];

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
    homeFocusRank: document.getElementById("home-focus-rank"),
    homeFocusTitle: document.getElementById("home-focus-title"),
    homeFocusMeta: document.getElementById("home-focus-meta"),
    homeMissionLesson: document.getElementById("home-mission-lesson"),
    homeMissionGame: document.getElementById("home-mission-game"),
    homeMissionGoal: document.getElementById("home-mission-goal"),
    homeFocusPrimaryButton: document.getElementById("home-focus-primary-btn"),
    homeFocusSecondaryButton: document.getElementById("home-focus-secondary-btn"),
    wordDayTerm: document.getElementById("word-of-day-term"),
    wordDayTranslation: document.getElementById("word-of-day-translation"),
    wordDayDescription: document.getElementById("word-of-day-description"),
    wordDayTheme: document.getElementById("word-of-day-theme"),

    courseMap: document.getElementById("course-map"),
    continueLastButton: document.getElementById("continue-last-btn"),

    lessonTitle: document.getElementById("lesson-title"),
    lessonSubtitle: document.getElementById("lesson-subtitle"),
    lessonProgressChip: document.getElementById("lesson-progress-chip"),
    learnKpiProgress: document.getElementById("learn-kpi-progress"),
    learnKpiGoal: document.getElementById("learn-kpi-goal"),
    learnKpiHearts: document.getElementById("learn-kpi-hearts"),
    learnOverviewNote: document.getElementById("learn-overview-note"),
    learnContinueButton: document.getElementById("learn-continue-btn"),
    learnResetFiltersButton: document.getElementById("learn-reset-filters-btn"),
    learnPendingOnly: document.getElementById("learn-pending-only"),
    learnSearchInput: document.getElementById("learn-search-input"),
    learnSortSelect: document.getElementById("learn-sort-select"),
    learnListNote: document.getElementById("learn-list-note"),
    learnLessonList: document.getElementById("learn-lesson-list"),
    questionPrompt: document.getElementById("question-prompt"),
    questionOptions: document.getElementById("question-options"),
    questionFeedback: document.getElementById("question-feedback"),
    nextQuestionButton: document.getElementById("next-question-btn"),
    finishLessonButton: document.getElementById("finish-lesson-btn"),
    playPronunciationButton: document.getElementById("play-pronunciation-btn"),

    quickGamesGrid: document.getElementById("quick-games-grid"),
    gameBestPill: document.getElementById("game-best-pill"),
    gameCurrentTitle: document.getElementById("game-current-title"),
    gameCurrentCopy: document.getElementById("game-current-copy"),
    gameScoreChip: document.getElementById("game-score-chip"),
    gameStreakChip: document.getElementById("game-streak-chip"),
    gameModeChip: document.getElementById("game-mode-chip"),
    gameRoundChip: document.getElementById("game-round-chip"),
    gameAccuracyChip: document.getElementById("game-accuracy-chip"),
    gameXpChip: document.getElementById("game-xp-chip"),
    gameAccuracyBar: document.getElementById("game-accuracy-bar"),
    gameQuestion: document.getElementById("game-question"),
    gameOptions: document.getElementById("game-options"),
    gameNextButton: document.getElementById("game-next-btn"),
    gameListenButton: document.getElementById("game-listen-btn"),
    gameRestartButton: document.getElementById("game-restart-btn"),
    gameStatusNote: document.getElementById("game-status-note"),

    dictionarySearch: document.getElementById("dictionary-search"),
    dictionaryFavoritesOnly: document.getElementById("dictionary-favorites-only"),
    dictionaryThemeFilters: document.getElementById("dictionary-theme-filters"),
    dictionaryResultsNote: document.getElementById("dictionary-results-note"),
    dictionaryList: document.getElementById("dictionary-list"),
    dictionaryDetailTerm: document.getElementById("dictionary-detail-term"),
    dictionaryDetailTranslation: document.getElementById("dictionary-detail-translation"),
    dictionaryDetailDescription: document.getElementById("dictionary-detail-description"),
    dictionaryDetailTheme: document.getElementById("dictionary-detail-theme"),
    dictionaryDetailTags: document.getElementById("dictionary-detail-tags"),
    dictionaryDetailSources: document.getElementById("dictionary-detail-sources"),
    dictionarySpeakButton: document.getElementById("dictionary-speak-btn"),
    dictionaryCopyButton: document.getElementById("dictionary-copy-btn"),
    dictionaryFavoriteButton: document.getElementById("dictionary-favorite-btn"),
    translatorSourceLabel: document.getElementById("translator-source-label"),
    translatorTargetLabel: document.getElementById("translator-target-label"),
    translatorDirectionLabel: document.getElementById("translator-direction-label"),
    translatorInput: document.getElementById("translator-input-es"),
    translatorOutput: document.getElementById("translator-output-pal"),
    translatorSwapButton: document.getElementById("translator-swap-btn"),
    translatorRunButton: document.getElementById("translator-run-btn"),
    translatorClearButton: document.getElementById("translator-clear-btn"),
    translatorCopyButton: document.getElementById("translator-copy-btn"),
    translatorSpeakButton: document.getElementById("translator-speak-btn"),
    translatorQuickChips: document.getElementById("translator-quick-chips"),
    translatorRecentList: document.getElementById("translator-recent-list"),
    translatorNote: document.getElementById("translator-note"),

    premiumStateTitle: document.getElementById("premium-state-title"),
    premiumStateCopy: document.getElementById("premium-state-copy"),
    premiumReference: document.getElementById("premium-reference"),
    premiumPayWompiButton: document.getElementById("premium-pay-wompi-btn"),
    premiumPayMpButton: document.getElementById("premium-pay-mp-btn"),
    premiumRequestButton: document.getElementById("premium-request-btn"),
    premiumSyncButton: document.getElementById("premium-sync-btn"),
    premiumCycleMonthlyButton: document.getElementById("premium-cycle-monthly"),
    premiumCycleAnnualButton: document.getElementById("premium-cycle-annual"),
    premiumPlanPrice: document.getElementById("premium-plan-price"),
    premiumNote: document.getElementById("premium-note"),
    communityPostType: document.getElementById("community-post-type"),
    communitySortSelect: document.getElementById("community-sort"),
    communityPostInput: document.getElementById("community-post-input"),
    communityPostCounter: document.getElementById("community-post-counter"),
    communityPostButton: document.getElementById("community-post-btn"),
    communityNote: document.getElementById("community-note"),
    communityKpiPosts: document.getElementById("community-kpi-posts"),
    communityKpiChallenges: document.getElementById("community-kpi-challenges"),
    communityKpiEvents: document.getElementById("community-kpi-events"),
    communityKpiEngagement: document.getElementById("community-kpi-engagement"),
    communityHighlightsList: document.getElementById("community-highlights-list"),
    communityRefreshButton: document.getElementById("community-refresh-btn"),
    communityQuickActions: document.getElementById("community-quick-actions"),
    communityFeedList: document.getElementById("community-feed-list"),
    communityGroupsList: document.getElementById("community-groups-list"),
    communityEventsList: document.getElementById("community-events-list"),
    communityGroupsJoinedCount: document.getElementById("community-groups-joined-count"),
    communityEventsJoinedCount: document.getElementById("community-events-joined-count"),

    profileNameKpi: document.getElementById("profile-name-kpi"),
    profileGoalKpi: document.getElementById("profile-goal-kpi"),
    profileCompletedKpi: document.getElementById("profile-completed-kpi"),
    profilePremiumKpi: document.getElementById("profile-premium-kpi"),
    profileEmailKpi: document.getElementById("profile-email-kpi"),
    profileSessionKpi: document.getElementById("profile-session-kpi"),
    profileCityKpi: document.getElementById("profile-city-kpi"),
    profilePhoneKpi: document.getElementById("profile-phone-kpi"),
    profileEditNameInput: document.getElementById("profile-edit-name"),
    profileEditGoalSelect: document.getElementById("profile-edit-goal"),
    profileEditCityInput: document.getElementById("profile-edit-city"),
    profileEditPhoneInput: document.getElementById("profile-edit-phone"),
    profileSaveButton: document.getElementById("profile-save-btn"),
    profileResetPasswordButton: document.getElementById("profile-reset-password-btn"),
    profileLogoutButton: document.getElementById("profile-logout-btn"),
    profileNote: document.getElementById("profile-note"),
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
  const communityFilterButtons = Array.from(document.querySelectorAll("[data-community-filter]"));
  const communityTemplateButtons = Array.from(document.querySelectorAll("[data-community-template]"));

  let deferredInstallPrompt = null;
  let lessonSession = null;
  let gameSession = null;
  let questionAudioElement = null;
  let authWatchAttached = false;
  let lastPhoneLoginRequest = null;
  let lastKnownAuthUid = "";
  let authMode = "login";
  let authTransitionLayer = null;
  let authTransitionTimer = null;
  let authTransitionFallbackTimer = null;
  let dictionaryThemesCache = null;
  let translatorLexiconCache = null;

  const state = Object.assign(
    {
      onboardingDone: false,
      profileName: "Visitante",
      dailyGoal: 10,
      city: "",
      phone: "",
      xp: 0,
      xpToday: 0,
      lastXpDate: "",
      hearts: MAX_HEARTS,
      streakDays: 1,
      lastActiveDate: "",
      learnSearch: "",
      learnSort: "recommended",
      learnPendingOnly: false,
      completedLessons: {},
      lastLessonId: "",
      activeView: "home",
      cefrFilter: "all",
      community: {
        filter: "all",
        feed: [],
        composerType: "post",
        sort: "recent",
        likedPostIds: [],
        groups: [],
        events: [],
        joinedGroupIds: [],
        attendingEventIds: []
      },
      dictionary: {
        search: "",
        theme: "all",
        show: "all",
        selectedKey: "",
        favorites: []
      },
      translator: {
        direction: "es-pal",
        input: "",
        output: "",
        history: []
      },
      game: {
        mode: "hidden-word",
        score: 0,
        streak: 0,
        bestStreak: 0,
        roundsPlayed: 0,
        correctAnswers: 0
      },
      premium: {
        active: false,
        status: "pendiente",
        source: "none",
        requestId: "",
        cycle: "annual"
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

  function normalizeDailyGoal(value) {
    const numericGoal = Number(value || 10);
    return ALLOWED_DAILY_GOALS.includes(numericGoal) ? numericGoal : 10;
  }

  function normalizeLearnSort(value) {
    const allowed = ["recommended", "levelAsc", "levelDesc", "xpDesc", "xpAsc"];
    const normalized = sanitizeText(value, "recommended");
    return allowed.includes(normalized) ? normalized : "recommended";
  }

  function ensureLearnState() {
    state.learnSearch = sanitizeText(state.learnSearch, "");
    state.learnSort = normalizeLearnSort(state.learnSort);
    state.learnPendingOnly = Boolean(state.learnPendingOnly);
  }

  function normalizeProfilePhone(value) {
    const raw = sanitizeText(value, "");
    if (!raw) {
      return "";
    }

    const startsWithPlus = raw.startsWith("+");
    const digits = raw.replace(/\D/g, "").slice(0, 15);
    if (!digits) {
      return "";
    }

    return (startsWithPlus ? "+" : "") + digits;
  }

  function normalizeCommunityFilter(value) {
    const allowed = ["all", "post", "challenge", "event"];
    const normalized = sanitizeText(value, "all").toLowerCase();
    return allowed.includes(normalized) ? normalized : "all";
  }

  function normalizeCommunityPostType(value) {
    const allowed = ["post", "challenge", "event"];
    const normalized = sanitizeText(value, "post").toLowerCase();
    return allowed.includes(normalized) ? normalized : "post";
  }

  function normalizeCommunitySort(value) {
    const allowed = ["recent", "popular"];
    const normalized = sanitizeText(value, "recent").toLowerCase();
    return allowed.includes(normalized) ? normalized : "recent";
  }

  function normalizePremiumCycle(value) {
    const allowed = ["monthly", "annual"];
    const normalized = sanitizeText(value, "annual").toLowerCase();
    return allowed.includes(normalized) ? normalized : "annual";
  }

  function getPremiumPlans() {
    const fallbackAnnual = Math.max(9900, Number(premiumConfig.priceCop || 189000));
    const fallbackMonthly = Math.max(4900, Math.round(fallbackAnnual / 12));
    const monthly = Math.max(4900, Number(premiumConfig.monthlyCop || fallbackMonthly));
    const annual = Math.max(monthly, Number(premiumConfig.annualCop || fallbackAnnual));
    return {
      monthly: monthly,
      annual: annual
    };
  }

  function normalizeDictionaryShow(value) {
    const allowed = ["all", "favorites"];
    const normalized = sanitizeText(value, "all").toLowerCase();
    return allowed.includes(normalized) ? normalized : "all";
  }

  function normalizeDictionaryTheme(value) {
    const normalized = sanitizeText(value, "all").toLowerCase();
    if (normalized === "all") {
      return "all";
    }
    const exists = dictionaryEntries.some(function(entry) {
      return sanitizeText(entry.theme, "").toLowerCase() === normalized;
    });
    return exists ? normalized : "all";
  }

  function normalizeGameMode(value) {
    const normalized = sanitizeText(value, "hidden-word").toLowerCase();
    return GAME_MODES.includes(normalized) ? normalized : "hidden-word";
  }

  function normalizeTranslatorDirection(value) {
    const normalized = sanitizeText(value, "es-pal").toLowerCase();
    return normalized === "pal-es" ? "pal-es" : "es-pal";
  }

  function stripDiacritics(value) {
    const raw = sanitizeText(value, "");
    if (!raw) {
      return "";
    }
    try {
      return raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    } catch (_) {
      return raw;
    }
  }

  function normalizeLookupText(value) {
    const cleaned = stripDiacritics(value).toLowerCase();
    return cleaned
      .replace(/[¿?¡!.,;:()"'`´]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getLookupCandidates(value) {
    const raw = sanitizeText(value, "");
    if (!raw) {
      return [];
    }
    const candidates = [raw.toLowerCase(), stripDiacritics(raw).toLowerCase(), normalizeLookupText(raw)];
    return Array.from(new Set(candidates.filter(Boolean)));
  }

  function getDictionaryThemes() {
    if (Array.isArray(dictionaryThemesCache) && dictionaryThemesCache.length) {
      return dictionaryThemesCache;
    }

    const counts = new Map();
    dictionaryEntries.forEach(function(entry) {
      const themeKey = sanitizeText(entry.theme, "").toLowerCase();
      const themeLabel = sanitizeText(entry.themeLabel || entry.theme, "General");
      if (!themeKey) {
        return;
      }
      const existing = counts.get(themeKey) || { key: themeKey, label: themeLabel, count: 0 };
      existing.count += 1;
      counts.set(themeKey, existing);
    });

    dictionaryThemesCache = Array.from(counts.values()).sort(function(a, b) {
      return a.label.localeCompare(b.label, "es");
    });

    return dictionaryThemesCache;
  }

  function createCommunitySeedFeed() {
    const now = Date.now();
    return [
      {
        id: "seed-post-1",
        type: "post",
        author: "María José",
        text: "¡Senda bien! Hoy practicamos saludos en familia.",
        createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
        likes: 24,
        comments: 6,
        shares: 2
      },
      {
        id: "seed-challenge-1",
        type: "challenge",
        author: "Reto semanal",
        text: "Graba un audio de 15 segundos diciendo 3 frases de presentación.",
        createdAt: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
        likes: 42,
        comments: 11,
        shares: 4
      },
      {
        id: "seed-event-1",
        type: "event",
        author: "Equipo Kumaina",
        text: "Evento en vivo: Conversación cultural este sábado 7:00 p.m.",
        createdAt: new Date(now - 1000 * 60 * 60 * 22).toISOString(),
        likes: 33,
        comments: 8,
        shares: 5
      }
    ];
  }

  function createCommunitySeedGroups() {
    return [
      {
        id: "group-saludos",
        name: "Saludos en Palenquero",
        focus: "Práctica de frases cotidianas",
        members: 128,
        activity: "Activo hoy"
      },
      {
        id: "group-musica",
        name: "Ritmo y memoria",
        focus: "Letras, cantos y tradición oral",
        members: 86,
        activity: "Nuevo reto semanal"
      },
      {
        id: "group-jovenes",
        name: "Jóvenes Kumaina",
        focus: "Retos rápidos y juegos colaborativos",
        members: 204,
        activity: "12 publicaciones esta semana"
      }
    ];
  }

  function createCommunitySeedEvents() {
    return [
      {
        id: "event-voz-viva",
        title: "Círculo de voz viva",
        schedule: "Sábado · 7:00 p.m.",
        location: "En vivo · Audio sala",
        attendees: 54
      },
      {
        id: "event-historias",
        title: "Historias ancestrales",
        schedule: "Domingo · 5:30 p.m.",
        location: "Comunidad Kumaina",
        attendees: 39
      },
      {
        id: "event-traductor",
        title: "Laboratorio de traductor",
        schedule: "Miércoles · 8:00 p.m.",
        location: "Sesión guiada",
        attendees: 27
      }
    ];
  }

  function ensureCommunityState() {
    if (!state.community || typeof state.community !== "object") {
      state.community = {
        filter: "all",
        feed: createCommunitySeedFeed(),
        composerType: "post",
        sort: "recent",
        likedPostIds: [],
        groups: createCommunitySeedGroups(),
        events: createCommunitySeedEvents(),
        joinedGroupIds: [],
        attendingEventIds: []
      };
      saveState();
      return;
    }

    state.community.filter = normalizeCommunityFilter(state.community.filter);
    state.community.composerType = normalizeCommunityPostType(state.community.composerType);
    state.community.sort = normalizeCommunitySort(state.community.sort);
    if (!Array.isArray(state.community.likedPostIds)) {
      state.community.likedPostIds = [];
    } else {
      state.community.likedPostIds = state.community.likedPostIds.map(function(id) {
        return sanitizeText(id, "");
      }).filter(Boolean);
    }
    if (!Array.isArray(state.community.joinedGroupIds)) {
      state.community.joinedGroupIds = [];
    } else {
      state.community.joinedGroupIds = state.community.joinedGroupIds.map(function(id) {
        return sanitizeText(id, "");
      }).filter(Boolean);
    }
    if (!Array.isArray(state.community.attendingEventIds)) {
      state.community.attendingEventIds = [];
    } else {
      state.community.attendingEventIds = state.community.attendingEventIds.map(function(id) {
        return sanitizeText(id, "");
      }).filter(Boolean);
    }
    if (!Array.isArray(state.community.feed)) {
      state.community.feed = [];
    }
    if (!Array.isArray(state.community.groups)) {
      state.community.groups = [];
    }
    if (!Array.isArray(state.community.events)) {
      state.community.events = [];
    }

    if (!state.community.feed.length) {
      state.community.feed = createCommunitySeedFeed();
    }
    if (!state.community.groups.length) {
      state.community.groups = createCommunitySeedGroups();
    }
    if (!state.community.events.length) {
      state.community.events = createCommunitySeedEvents();
    }

    state.community.feed = state.community.feed.map(function(item, index) {
      const id = sanitizeText(item && item.id, "post-" + index);
      const type = normalizeCommunityPostType(item && item.type);
      const author = sanitizeText(item && item.author, "Comunidad Kumaina");
      const text = sanitizeText(item && item.text, "");
      const createdAt = sanitizeText(item && item.createdAt, new Date().toISOString());
      const likes = Math.max(0, Number(item && item.likes || 0));
      const comments = Math.max(0, Number(item && item.comments || 0));
      const shares = Math.max(0, Number(item && item.shares || 0));
      const recentReply = sanitizeText(item && item.recentReply, "");
      return {
        id: id,
        type: type,
        author: author,
        text: text,
        createdAt: createdAt,
        likes: likes,
        comments: comments,
        shares: shares,
        recentReply: recentReply
      };
    }).slice(0, 120);

    state.community.groups = state.community.groups.map(function(item, index) {
      return {
        id: sanitizeText(item && item.id, "group-" + index),
        name: sanitizeText(item && item.name, "Grupo Kumaina"),
        focus: sanitizeText(item && item.focus, "Práctica colaborativa"),
        members: Math.max(0, Number(item && item.members || 0)),
        activity: sanitizeText(item && item.activity, "Actividad reciente")
      };
    }).slice(0, 18);

    state.community.events = state.community.events.map(function(item, index) {
      return {
        id: sanitizeText(item && item.id, "event-" + index),
        title: sanitizeText(item && item.title, "Evento comunitario"),
        schedule: sanitizeText(item && item.schedule, "Próximamente"),
        location: sanitizeText(item && item.location, "Comunidad Kumaina"),
        attendees: Math.max(0, Number(item && item.attendees || 0))
      };
    }).slice(0, 18);
  }

  function ensureDictionaryState() {
    if (!state.dictionary || typeof state.dictionary !== "object") {
      state.dictionary = {
        search: "",
        theme: "all",
        show: "all",
        selectedKey: "",
        favorites: []
      };
      saveState();
      return;
    }

    state.dictionary.search = sanitizeText(state.dictionary.search, "");
    state.dictionary.theme = normalizeDictionaryTheme(state.dictionary.theme);
    state.dictionary.show = normalizeDictionaryShow(state.dictionary.show);
    state.dictionary.selectedKey = sanitizeText(state.dictionary.selectedKey, "");
    if (!Array.isArray(state.dictionary.favorites)) {
      state.dictionary.favorites = [];
    } else {
      state.dictionary.favorites = state.dictionary.favorites.map(function(key) {
        return sanitizeText(key, "").toLowerCase();
      }).filter(Boolean);
    }
  }

  function ensureTranslatorState() {
    if (!state.translator || typeof state.translator !== "object") {
      state.translator = {
        direction: "es-pal",
        input: "",
        output: "",
        history: []
      };
      saveState();
      return;
    }

    state.translator.direction = normalizeTranslatorDirection(state.translator.direction);
    state.translator.input = sanitizeText(state.translator.input, "");
    state.translator.output = sanitizeText(state.translator.output, "");
    if (!Array.isArray(state.translator.history)) {
      state.translator.history = [];
    } else {
      state.translator.history = state.translator.history.map(function(item) {
        return {
          direction: normalizeTranslatorDirection(item && item.direction),
          input: sanitizeText(item && item.input, ""),
          output: sanitizeText(item && item.output, ""),
          createdAt: sanitizeText(item && item.createdAt, new Date().toISOString())
        };
      }).filter(function(item) {
        return item.input && item.output;
      }).slice(0, 12);
    }
  }

  function ensureGameState() {
    if (!state.game || typeof state.game !== "object") {
      state.game = {
        mode: "hidden-word",
        score: 0,
        streak: 0,
        bestStreak: 0,
        roundsPlayed: 0,
        correctAnswers: 0
      };
      saveState();
      return;
    }

    state.game.mode = normalizeGameMode(state.game.mode);
    state.game.score = Math.max(0, Number(state.game.score || 0));
    state.game.streak = Math.max(0, Number(state.game.streak || 0));
    state.game.bestStreak = Math.max(0, Number(state.game.bestStreak || 0));
    state.game.roundsPlayed = Math.max(0, Number(state.game.roundsPlayed || 0));
    state.game.correctAnswers = Math.max(0, Number(state.game.correctAnswers || 0));
    if (state.game.correctAnswers > state.game.roundsPlayed) {
      state.game.correctAnswers = state.game.roundsPlayed;
    }
  }

  function ensurePremiumState() {
    if (!state.premium || typeof state.premium !== "object") {
      state.premium = {
        active: false,
        status: "pendiente",
        source: "none",
        requestId: "",
        cycle: "annual"
      };
      saveState();
      return;
    }
    state.premium.active = Boolean(state.premium.active);
    state.premium.status = sanitizeText(state.premium.status, "pendiente");
    state.premium.source = sanitizeText(state.premium.source, "none");
    state.premium.requestId = sanitizeText(state.premium.requestId, "");
    state.premium.cycle = normalizePremiumCycle(state.premium.cycle);
  }

  function formatCommunityAge(isoDate) {
    const timestamp = new Date(isoDate || "").getTime();
    if (!Number.isFinite(timestamp) || timestamp <= 0) {
      return "ahora";
    }

    const diff = Math.max(0, Date.now() - timestamp);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) {
      return "ahora";
    }
    if (minutes < 60) {
      return "hace " + minutes + " min";
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return "hace " + hours + " h";
    }
    const days = Math.floor(hours / 24);
    return "hace " + days + (days === 1 ? " día" : " días");
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
    if (nextView === "learn") {
      renderLearnNavigator();
    }
    if (nextView === "dictionary") {
      renderDictionary();
      renderTranslator();
      renderGamePanel();
    }
    if (nextView === "premium") {
      renderCommunityFeed();
      updatePremiumPlanUI();
    }

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
    updateLearnOverview();
  }

  function updateProfilePanel() {
    elements.profileNameKpi.textContent = sanitizeText(state.profileName, "Visitante");
    elements.profileGoalKpi.textContent = Number(state.dailyGoal || 10) + " XP";
    elements.profileCompletedKpi.textContent = String(getCompletedCount()) + " / " + String(getTotalLessonsCount());
    elements.profilePremiumKpi.textContent = state.premium.active ? "Activa" : "Pendiente";
    if (elements.profileCityKpi) {
      elements.profileCityKpi.textContent = sanitizeText(state.city, "Sin ciudad");
    }
    if (elements.profilePhoneKpi) {
      elements.profilePhoneKpi.textContent = sanitizeText(state.phone, "Sin teléfono");
    }
    updateProfileEditorUI();
  }

  function updateProfileEditorUI() {
    const user = getAuthUser();
    const profileName = sanitizeText(state.profileName, "Visitante");
    const dailyGoal = normalizeDailyGoal(state.dailyGoal);
    const city = sanitizeText(state.city, "");
    const phone = sanitizeText(state.phone, "");

    if (elements.profileEditNameInput && document.activeElement !== elements.profileEditNameInput) {
      elements.profileEditNameInput.value = profileName;
    }

    if (elements.profileEditGoalSelect) {
      elements.profileEditGoalSelect.value = String(dailyGoal);
    }

    if (elements.profileEditCityInput && document.activeElement !== elements.profileEditCityInput) {
      elements.profileEditCityInput.value = city;
    }

    if (elements.profileEditPhoneInput && document.activeElement !== elements.profileEditPhoneInput) {
      elements.profileEditPhoneInput.value = phone;
    }

    if (elements.profileEmailKpi) {
      elements.profileEmailKpi.textContent = sanitizeText(user && user.email, "Sin correo");
    }

    if (elements.profileSessionKpi) {
      elements.profileSessionKpi.textContent = user ? "Activa" : "Invitado";
    }

    if (elements.profileLogoutButton) {
      elements.profileLogoutButton.disabled = !user;
    }

    if (elements.profileResetPasswordButton) {
      const canReset = Boolean(sanitizeText(user && user.email));
      elements.profileResetPasswordButton.disabled = !canReset;
    }
  }

  function getLearningSummary() {
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

    const suggestion = findLessonById(state.lastLessonId) ||
      getFirstIncompleteLesson({ respectLevelFilter: false, includeLocked: false }) ||
      flattenLessons({ respectLevelFilter: false, includeLocked: true })[0] ||
      null;

    return {
      completed: completed,
      total: total,
      percent: percent,
      rankLabel: rankLabel,
      rankLevel: rankLevel,
      suggestion: suggestion
    };
  }

  function setFocusMissionState(item, isDone) {
    if (!item) {
      return;
    }
    item.classList.toggle("is-done", Boolean(isDone));
    item.setAttribute("aria-checked", isDone ? "true" : "false");
  }

  function setFocusButtonAction(button, viewName, label) {
    if (!button) {
      return;
    }
    button.dataset.goView = sanitizeText(viewName, "learn");
    button.textContent = sanitizeText(label, button.textContent);
  }

  function updateExploreFocusPanel(summary) {
    if (
      !elements.homeFocusRank &&
      !elements.homeFocusTitle &&
      !elements.homeFocusMeta &&
      !elements.homeMissionLesson &&
      !elements.homeMissionGame &&
      !elements.homeMissionGoal
    ) {
      return;
    }

    const learning = summary || getLearningSummary();
    const goalProgress = getCurrentGoalProgress();
    const hasSuggestedLesson = Boolean(learning.suggestion);
    const hasCompletedAnyLesson = learning.completed > 0;
    const lessonDone = Boolean(hasSuggestedLesson && state.completedLessons[learning.suggestion.id]) || (!hasSuggestedLesson && hasCompletedAnyLesson);
    const gameDone = Math.max(0, Number(state.game && state.game.score || 0)) > 0 || Math.max(0, Number(state.game && state.game.bestStreak || 0)) > 0;
    const goalDone = goalProgress.ratio >= 1;

    if (elements.homeFocusRank) {
      elements.homeFocusRank.textContent = "Nivel " + learning.rankLevel + " · " + learning.rankLabel;
    }

    let title = "Siguiente paso recomendado";
    let meta = "Completa una lección para fortalecer tu ruta diaria.";
    let primaryView = "learn";
    let primaryLabel = "Abrir lección";
    let secondaryView = "dictionary";
    let secondaryLabel = "Practicar en juegos";

    if (!lessonDone && learning.suggestion) {
      title = "Tu siguiente paso: " + sanitizeText(learning.suggestion.title, "Lección recomendada");
      meta =
        sanitizeText(learning.suggestion.unitName, "Ruta de aprendizaje") +
        " · " +
        learning.suggestion.normalizedLevel +
        " · +" +
        Number(learning.suggestion.xp || 0) +
        " XP";
      primaryView = "learn";
      primaryLabel = "Continuar lección";
      secondaryView = "dictionary";
      secondaryLabel = "Calentar con juego";
    } else if (!gameDone) {
      title = "Refuerza con un juego rápido";
      meta = "Haz una ronda en Palabra Oculta, Trivia o Escucha y Responde.";
      primaryView = "dictionary";
      primaryLabel = "Abrir juegos";
      secondaryView = "learn";
      secondaryLabel = "Ver lecciones";
    } else if (!goalDone) {
      title = "Cierra tu meta diaria";
      meta = "Llevas " + goalProgress.xp + " de " + goalProgress.goal + " XP. Te faltan " + Math.max(0, goalProgress.goal - goalProgress.xp) + " XP.";
      primaryView = "learn";
      primaryLabel = "Seguir aprendiendo";
      secondaryView = "premium";
      secondaryLabel = "Ir a comunidad";
    } else {
      title = "Meta cumplida. Excelente trabajo";
      meta = "Tu progreso de hoy está completo. Puedes subir nivel o participar en comunidad.";
      primaryView = "premium";
      primaryLabel = "Ver comunidad";
      secondaryView = "learn";
      secondaryLabel = "Subir de nivel";
    }

    if (elements.homeFocusTitle) {
      elements.homeFocusTitle.textContent = title;
    }
    if (elements.homeFocusMeta) {
      elements.homeFocusMeta.textContent = meta;
    }

    setFocusMissionState(elements.homeMissionLesson, lessonDone);
    setFocusMissionState(elements.homeMissionGame, gameDone);
    setFocusMissionState(elements.homeMissionGoal, goalDone);
    setFocusButtonAction(elements.homeFocusPrimaryButton, primaryView, primaryLabel);
    setFocusButtonAction(elements.homeFocusSecondaryButton, secondaryView, secondaryLabel);
  }

  function updateHeroHighlights() {
    if (
      !elements.heroLevelValue &&
      !elements.heroProgressBar &&
      !elements.heroProgressValue &&
      !elements.heroNextLesson &&
      !elements.heroNextMeta &&
      !elements.homeFocusTitle
    ) {
      return;
    }

    const learning = getLearningSummary();

    if (elements.heroLevelValue) {
      elements.heroLevelValue.textContent = "Nivel " + learning.rankLevel + " · " + learning.rankLabel;
    }

    if (elements.heroProgressBar) {
      const safeProgress = Math.max(learning.percent, learning.total ? 8 : 0);
      elements.heroProgressBar.style.width = safeProgress + "%";
    }

    if (elements.heroProgressValue) {
      elements.heroProgressValue.textContent = learning.percent + "%";
    }

    if (elements.heroNextLesson) {
      elements.heroNextLesson.textContent = learning.suggestion
        ? sanitizeText(learning.suggestion.title, "Siguiente lección")
        : "Siguiente lección";
    }

    if (elements.heroNextMeta) {
      if (learning.suggestion) {
        elements.heroNextMeta.textContent = sanitizeText(learning.suggestion.unitName, "Ruta diaria") + " · " + learning.suggestion.normalizedLevel;
      } else {
        elements.heroNextMeta.textContent = "Activa nuevas lecciones para continuar.";
      }
    }

    updateExploreFocusPanel(learning);
  }

  function updateLearnOverview(visibleLessons) {
    if (
      !elements.learnKpiProgress &&
      !elements.learnKpiGoal &&
      !elements.learnKpiHearts &&
      !elements.learnOverviewNote
    ) {
      return;
    }

    const learning = getLearningSummary();
    const goalProgress = getCurrentGoalProgress();
    const hearts = Math.max(0, Number(state.hearts || 0));
    const pendingOnly = Boolean(state.learnPendingOnly);
    const visibleCount = Array.isArray(visibleLessons) ? visibleLessons.length : null;

    if (elements.learnKpiProgress) {
      elements.learnKpiProgress.textContent = learning.completed + "/" + learning.total + " completadas";
    }
    if (elements.learnKpiGoal) {
      elements.learnKpiGoal.textContent = "Meta " + goalProgress.xp + "/" + goalProgress.goal + " XP";
    }
    if (elements.learnKpiHearts) {
      elements.learnKpiHearts.textContent = "❤ " + hearts;
    }

    if (elements.learnPendingOnly) {
      elements.learnPendingOnly.checked = pendingOnly;
    }

    if (elements.learnContinueButton) {
      elements.learnContinueButton.disabled = !learning.suggestion;
    }

    if (!elements.learnOverviewNote) {
      return;
    }

    if (!learning.suggestion) {
      elements.learnOverviewNote.textContent = "No hay lecciones disponibles por ahora. Prueba con otro filtro.";
      return;
    }

    let note = "Siguiente recomendada: " +
      sanitizeText(learning.suggestion.title, "Lección") +
      " · " +
      learning.suggestion.normalizedLevel +
      " · +" +
      Number(learning.suggestion.xp || 0) +
      " XP.";

    if (pendingOnly) {
      note += " Modo pendientes activo.";
    }

    if (Number.isFinite(visibleCount)) {
      note += " Visibles: " + visibleCount + ".";
    }

    elements.learnOverviewNote.textContent = note;
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

  function setCommunityNote(message, type) {
    if (!elements.communityNote) {
      return;
    }
    elements.communityNote.textContent = sanitizeText(message, "Comparte avances y aprende en comunidad.");
    elements.communityNote.classList.remove("is-success", "is-error");
    if (type === "success") {
      elements.communityNote.classList.add("is-success");
    }
    if (type === "error") {
      elements.communityNote.classList.add("is-error");
    }
  }

  function updateCommunityComposerUI() {
    ensureCommunityState();
    const currentType = normalizeCommunityPostType(state.community.composerType);
    const currentSort = normalizeCommunitySort(state.community.sort);
    const postText = sanitizeText(elements.communityPostInput && elements.communityPostInput.value, "");

    if (elements.communityPostType && document.activeElement !== elements.communityPostType) {
      elements.communityPostType.value = currentType;
    }
    if (elements.communitySortSelect && document.activeElement !== elements.communitySortSelect) {
      elements.communitySortSelect.value = currentSort;
    }
    if (elements.communityPostCounter) {
      const max = 220;
      const value = Math.min(max, postText.length);
      elements.communityPostCounter.textContent = value + " / " + max;
      elements.communityPostCounter.classList.toggle("is-over", postText.length > max);
    }
    if (elements.communityPostButton) {
      elements.communityPostButton.disabled = postText.length > 220 || postText.length === 0;
    }
  }

  function getCommunityEngagementScore(item) {
    const likes = Math.max(0, Number(item && item.likes || 0));
    const comments = Math.max(0, Number(item && item.comments || 0));
    const shares = Math.max(0, Number(item && item.shares || 0));
    return likes + comments * 1.3 + shares * 1.6;
  }

  function renderCommunityOverview(sourceFeed) {
    ensureCommunityState();
    const feed = Array.isArray(sourceFeed) ? sourceFeed : [];
    const groups = Array.isArray(state.community.groups) ? state.community.groups : [];
    const eventsCatalog = Array.isArray(state.community.events) ? state.community.events : [];
    const joinedGroups = Array.isArray(state.community.joinedGroupIds) ? state.community.joinedGroupIds : [];
    const attendingEvents = Array.isArray(state.community.attendingEventIds) ? state.community.attendingEventIds : [];
    const posts = feed.filter(function(item) {
      return normalizeCommunityPostType(item && item.type) === "post";
    }).length;
    const challenges = feed.filter(function(item) {
      return normalizeCommunityPostType(item && item.type) === "challenge";
    }).length;
    const events = Math.max(
      feed.filter(function(item) {
        return normalizeCommunityPostType(item && item.type) === "event";
      }).length,
      eventsCatalog.length
    );
    const engagement = feed.reduce(function(total, item) {
      return total +
        Math.max(0, Number(item && item.likes || 0)) +
        Math.max(0, Number(item && item.comments || 0)) +
        Math.max(0, Number(item && item.shares || 0));
    }, 0);

    if (elements.communityKpiPosts) {
      elements.communityKpiPosts.textContent = String(posts);
    }
    if (elements.communityKpiChallenges) {
      elements.communityKpiChallenges.textContent = String(challenges);
    }
    if (elements.communityKpiEvents) {
      elements.communityKpiEvents.textContent = String(events);
    }
    if (elements.communityKpiEngagement) {
      elements.communityKpiEngagement.textContent = String(engagement);
    }
    if (elements.communityGroupsJoinedCount) {
      const groupsLabel = joinedGroups.length + " / " + groups.length + " unidos";
      elements.communityGroupsJoinedCount.textContent = groupsLabel;
    }
    if (elements.communityEventsJoinedCount) {
      const eventsLabel = attendingEvents.length + " / " + eventsCatalog.length + " asistirán";
      elements.communityEventsJoinedCount.textContent = eventsLabel;
    }

    if (!elements.communityHighlightsList) {
      return;
    }

    const labelByType = {
      post: "Publicación",
      challenge: "Reto",
      event: "Evento"
    };

    const highlights = feed.slice().sort(function(a, b) {
      return getCommunityEngagementScore(b) - getCommunityEngagementScore(a);
    }).slice(0, 3);

    if (!highlights.length) {
      elements.communityHighlightsList.innerHTML =
        "<article class=\"pv-community-highlight-item\"><small>Aún no hay actividad destacada.</small></article>";
      return;
    }

    const fragment = document.createDocumentFragment();
    highlights.forEach(function(item) {
      const type = normalizeCommunityPostType(item && item.type);

      const card = document.createElement("article");
      card.className = "pv-community-highlight-item";

      const head = document.createElement("div");
      head.className = "pv-community-highlight-head";

      const badge = document.createElement("span");
      badge.className = "pv-community-type";
      badge.textContent = sanitizeText(labelByType[type], "Publicación");
      head.appendChild(badge);

      const score = document.createElement("small");
      score.textContent = "Impacto " + Math.round(getCommunityEngagementScore(item));
      head.appendChild(score);

      const text = document.createElement("p");
      text.className = "pv-community-highlight-text";
      text.textContent = sanitizeText(item.text, "Sin contenido.");

      const footer = document.createElement("div");
      footer.className = "pv-community-highlight-foot";

      const author = document.createElement("small");
      author.textContent = sanitizeText(item.author, "Comunidad Kumaina") + " · " + formatCommunityAge(item.createdAt);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "pv-community-action";
      button.dataset.communityFilterTarget = type;
      button.textContent = type === "event" ? "Ver eventos" : type === "challenge" ? "Ver retos" : "Ver publicaciones";

      footer.appendChild(author);
      footer.appendChild(button);

      card.appendChild(head);
      card.appendChild(text);
      card.appendChild(footer);
      fragment.appendChild(card);
    });

    elements.communityHighlightsList.replaceChildren(fragment);
  }

  function renderCommunityGroups() {
    if (!elements.communityGroupsList) {
      return;
    }
    ensureCommunityState();

    const groups = Array.isArray(state.community.groups) ? state.community.groups : [];
    const joinedSet = new Set((state.community.joinedGroupIds || []).map(function(id) {
      return sanitizeText(id, "");
    }));

    if (!groups.length) {
      elements.communityGroupsList.innerHTML = "<article class=\"pv-community-mini-item\"><small>No hay grupos disponibles por ahora.</small></article>";
      return;
    }

    const fragment = document.createDocumentFragment();
    groups.forEach(function(group) {
      const groupId = sanitizeText(group.id, "");
      const joined = joinedSet.has(groupId);

      const card = document.createElement("article");
      card.className = "pv-community-mini-item";

      const title = document.createElement("b");
      title.textContent = sanitizeText(group.name, "Grupo Kumaina");

      const meta = document.createElement("small");
      meta.textContent = sanitizeText(group.focus, "Práctica colaborativa");

      const foot = document.createElement("div");
      foot.className = "pv-community-mini-foot";

      const counters = document.createElement("span");
      counters.textContent = String(Math.max(0, Number(group.members || 0))) + " miembros · " + sanitizeText(group.activity, "Actividad reciente");

      const button = document.createElement("button");
      button.type = "button";
      button.className = "pv-community-action" + (joined ? " is-active" : "");
      button.dataset.communityGroupAction = "toggle";
      button.dataset.communityGroupId = groupId;
      button.textContent = joined ? "Unido" : "Unirme";

      foot.appendChild(counters);
      foot.appendChild(button);
      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(foot);
      fragment.appendChild(card);
    });

    elements.communityGroupsList.replaceChildren(fragment);
  }

  function renderCommunityEvents() {
    if (!elements.communityEventsList) {
      return;
    }
    ensureCommunityState();

    const events = Array.isArray(state.community.events) ? state.community.events : [];
    const attendingSet = new Set((state.community.attendingEventIds || []).map(function(id) {
      return sanitizeText(id, "");
    }));

    if (!events.length) {
      elements.communityEventsList.innerHTML = "<article class=\"pv-community-mini-item\"><small>No hay eventos publicados por ahora.</small></article>";
      return;
    }

    const fragment = document.createDocumentFragment();
    events.forEach(function(eventItem) {
      const eventId = sanitizeText(eventItem.id, "");
      const attending = attendingSet.has(eventId);

      const card = document.createElement("article");
      card.className = "pv-community-mini-item";

      const title = document.createElement("b");
      title.textContent = sanitizeText(eventItem.title, "Evento comunitario");

      const meta = document.createElement("small");
      meta.textContent = sanitizeText(eventItem.schedule, "Próximamente") + " · " + sanitizeText(eventItem.location, "Comunidad Kumaina");

      const foot = document.createElement("div");
      foot.className = "pv-community-mini-foot";

      const counters = document.createElement("span");
      counters.textContent = String(Math.max(0, Number(eventItem.attendees || 0))) + " asistentes";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "pv-community-action" + (attending ? " is-active" : "");
      button.dataset.communityEventAction = "toggle";
      button.dataset.communityEventId = eventId;
      button.textContent = attending ? "Asistiré" : "Confirmar";

      foot.appendChild(counters);
      foot.appendChild(button);
      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(foot);
      fragment.appendChild(card);
    });

    elements.communityEventsList.replaceChildren(fragment);
  }

  function toggleCommunityGroup(groupId) {
    ensureCommunityState();
    const targetId = sanitizeText(groupId, "");
    if (!targetId) {
      return;
    }

    const groups = Array.isArray(state.community.groups) ? state.community.groups : [];
    const targetIndex = groups.findIndex(function(item) {
      return sanitizeText(item.id, "") === targetId;
    });
    if (targetIndex < 0) {
      return;
    }

    const joinedSet = new Set((state.community.joinedGroupIds || []).map(function(id) {
      return sanitizeText(id, "");
    }));
    const item = Object.assign({}, groups[targetIndex]);
    const wasJoined = joinedSet.has(targetId);

    if (wasJoined) {
      joinedSet.delete(targetId);
      item.members = Math.max(0, Number(item.members || 0) - 1);
      setCommunityNote("Saliste del grupo cultural.", "success");
    } else {
      joinedSet.add(targetId);
      item.members = Math.max(0, Number(item.members || 0) + 1);
      applyXP(2);
      setCommunityNote("Te uniste al grupo. +2 XP por participar.", "success");
    }

    groups[targetIndex] = item;
    state.community.groups = groups;
    state.community.joinedGroupIds = Array.from(joinedSet);
    saveState();
    renderCommunityFeed();
  }

  function toggleCommunityEvent(eventId) {
    ensureCommunityState();
    const targetId = sanitizeText(eventId, "");
    if (!targetId) {
      return;
    }

    const events = Array.isArray(state.community.events) ? state.community.events : [];
    const targetIndex = events.findIndex(function(item) {
      return sanitizeText(item.id, "") === targetId;
    });
    if (targetIndex < 0) {
      return;
    }

    const attendingSet = new Set((state.community.attendingEventIds || []).map(function(id) {
      return sanitizeText(id, "");
    }));
    const item = Object.assign({}, events[targetIndex]);
    const wasAttending = attendingSet.has(targetId);

    if (wasAttending) {
      attendingSet.delete(targetId);
      item.attendees = Math.max(0, Number(item.attendees || 0) - 1);
      setCommunityNote("Quitaste tu confirmación de asistencia.", "success");
    } else {
      attendingSet.add(targetId);
      item.attendees = Math.max(0, Number(item.attendees || 0) + 1);
      applyXP(2);
      setCommunityNote("Asistencia confirmada. +2 XP por integrarte.", "success");
    }

    events[targetIndex] = item;
    state.community.events = events;
    state.community.attendingEventIds = Array.from(attendingSet);
    saveState();
    renderCommunityFeed();
  }

  function applyCommunityTemplate(templateKey) {
    ensureCommunityState();
    const templates = {
      phrase: {
        type: "post",
        message: "Hoy practiqué la frase: “Senda bien. ¿Y bo?” ¿Cuál frase estás usando tú hoy?"
      },
      progress: {
        type: "post",
        message: "Avance del día: completé una lección y reforcé con un juego. ¡Seguimos fortaleciendo nuestras raíces!"
      },
      challenge: {
        type: "challenge",
        message: "Reto para la comunidad: comparte un audio corto presentándote en palenquero."
      },
      event: {
        type: "event",
        message: "Invitación abierta: práctica comunitaria este fin de semana. ¿Quién se apunta?"
      }
    };

    const selected = templates[sanitizeText(templateKey, "phrase").toLowerCase()] || templates.phrase;
    state.community.composerType = normalizeCommunityPostType(selected.type);
    saveState();

    if (elements.communityPostType) {
      elements.communityPostType.value = state.community.composerType;
    }
    if (elements.communityPostInput) {
      elements.communityPostInput.value = selected.message;
      elements.communityPostInput.focus();
      elements.communityPostInput.setSelectionRange(
        elements.communityPostInput.value.length,
        elements.communityPostInput.value.length
      );
    }

    updateCommunityComposerUI();
    setCommunityNote("Plantilla cargada. Personaliza el texto y publica cuando quieras.", "success");
  }

  function updatePremiumPlanUI() {
    ensurePremiumState();
    const plans = getPremiumPlans();
    const cycle = normalizePremiumCycle(state.premium.cycle);
    const activePrice = cycle === "monthly" ? plans.monthly : plans.annual;

    if (elements.premiumCycleMonthlyButton) {
      elements.premiumCycleMonthlyButton.classList.toggle("is-active", cycle === "monthly");
    }
    if (elements.premiumCycleAnnualButton) {
      elements.premiumCycleAnnualButton.classList.toggle("is-active", cycle === "annual");
    }
    if (elements.premiumPlanPrice) {
      const label = cycle === "monthly" ? "/mes" : "/año";
      elements.premiumPlanPrice.textContent = formatCOP(activePrice) + " " + label;
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

  function setProfileNote(message, type) {
    if (!elements.profileNote) {
      return;
    }
    elements.profileNote.textContent = sanitizeText(message, "Perfil actualizado.");
    elements.profileNote.classList.remove("is-success", "is-error");
    if (type === "success") {
      elements.profileNote.classList.add("is-success");
    }
    if (type === "error") {
      elements.profileNote.classList.add("is-error");
    }
  }

  function updatePremiumUI() {
    ensurePremiumState();
    updatePremiumPlanUI();

    if (state.premium.active) {
      elements.premiumStateTitle.textContent = "Estado: premium activo";
      elements.premiumStateCopy.textContent = "Tu acceso premium está verificado y habilitado en esta cuenta.";
      setPremiumNote("Membresía activa. Ya puedes usar rutas avanzadas y próximos módulos de certificación.", "success");
      return;
    }

    const cycle = normalizePremiumCycle(state.premium.cycle);
    const plans = getPremiumPlans();
    const planAmount = cycle === "monthly" ? plans.monthly : plans.annual;
    elements.premiumStateTitle.textContent = "Estado: " + (state.premium.status || "pendiente");
    elements.premiumStateCopy.textContent = getAuthUser()
      ? "Plan " + (cycle === "monthly" ? "mensual" : "anual") + " seleccionado (" + formatCOP(planAmount) + "). Si ya pagaste, reporta referencia y pulsa Verificar acceso."
      : "Inicia sesión para vincular premium a tu cuenta.";
  }

  function updateAuthUI() {
    const user = getAuthUser();
    const displayName = sanitizeText(user && user.displayName, "");
    const email = sanitizeText(user && user.email, "");
    const resolvedName = sanitizeText(displayName, sanitizeText(state.profileName, "Cuenta conectada"));

    if (user) {
      setAuthCodeVisible(false);
      if (elements.authCodeInput) {
        elements.authCodeInput.value = "";
      }
      lastPhoneLoginRequest = null;
      if (elements.authUserName) {
        elements.authUserName.textContent = resolvedName || "Cuenta conectada";
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

    updateProfileEditorUI();
    refreshAuthSubmitState();
  }

  async function syncProfileFromCloud(showFeedback) {
    const user = await waitAuthUser(2200);
    if (!user || !window.authFirebase || typeof window.authFirebase.obtenerDatos !== "function") {
      return;
    }

    let cloudData = null;
    try {
      cloudData = await window.authFirebase.obtenerDatos(user);
    } catch (_) {
      cloudData = null;
    }

    if (!cloudData) {
      return;
    }

    const cloudName = sanitizeText(cloudData.nombre, "");
    const cloudCity = sanitizeText(cloudData.ciudad, "");
    const cloudPhone = normalizeProfilePhone(cloudData.telefono);

    let changed = false;
    if (cloudName && cloudName !== state.profileName) {
      state.profileName = cloudName;
      changed = true;
    }
    if (cloudCity && cloudCity !== state.city) {
      state.city = cloudCity;
      changed = true;
    }
    if (cloudPhone && cloudPhone !== state.phone) {
      state.phone = cloudPhone;
      changed = true;
    }

    if (!changed) {
      return;
    }

    saveState();
    updateProfilePanel();
    updateAuthUI();
    if (showFeedback) {
      setProfileNote("Perfil sincronizado desde la nube.", "success");
    }
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

    const authPhone = normalizeProfilePhone(user.phoneNumber);
    if (!sanitizeText(state.phone) && authPhone) {
      state.phone = authPhone;
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
    syncProfileFromCloud(false).catch(function() {
      // noop
    });

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
    renderLearnNavigator();
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

  function renderLearnNavigator() {
    if (!elements.learnLessonList) {
      return;
    }

    const search = sanitizeText(state.learnSearch, "").toLowerCase();
    const sortMode = normalizeLearnSort(state.learnSort);
    const currentLessonId = sanitizeText(lessonSession && lessonSession.lesson && lessonSession.lesson.id, "");
    const targetLevel = state.cefrFilter === "all" ? "all" : normalizeLevel(state.cefrFilter, "A1");
    const pendingOnly = Boolean(state.learnPendingOnly);

    const levelWeight = { A1: 1, A2: 2, B1: 3 };
    let lessons = flattenLessons({ respectLevelFilter: true, includeLocked: true }).filter(function(lesson) {
      if (targetLevel !== "all" && lesson.normalizedLevel !== targetLevel) {
        return false;
      }
      if (pendingOnly && Boolean(state.completedLessons[lesson.id])) {
        return false;
      }
      if (!search) {
        return true;
      }
      const stack = [
        lesson.title,
        lesson.unitName,
        lesson.description,
        lesson.normalizedLevel
      ].join(" ").toLowerCase();
      return stack.includes(search);
    });

    lessons = lessons.slice().sort(function(a, b) {
      if (sortMode === "xpDesc") {
        return Number(b.xp || 0) - Number(a.xp || 0);
      }
      if (sortMode === "xpAsc") {
        return Number(a.xp || 0) - Number(b.xp || 0);
      }
      if (sortMode === "levelAsc") {
        const levelDelta = (levelWeight[a.normalizedLevel] || 99) - (levelWeight[b.normalizedLevel] || 99);
        if (levelDelta !== 0) {
          return levelDelta;
        }
        return sanitizeText(a.title).localeCompare(sanitizeText(b.title), "es");
      }
      if (sortMode === "levelDesc") {
        const levelDelta = (levelWeight[b.normalizedLevel] || 0) - (levelWeight[a.normalizedLevel] || 0);
        if (levelDelta !== 0) {
          return levelDelta;
        }
        return sanitizeText(a.title).localeCompare(sanitizeText(b.title), "es");
      }

      const aDone = Boolean(state.completedLessons[a.id]);
      const bDone = Boolean(state.completedLessons[b.id]);
      if (aDone !== bDone) {
        return aDone ? 1 : -1;
      }
      const aLocked = isLessonPremiumLocked(a, { cefrLevel: a.unitLevel });
      const bLocked = isLessonPremiumLocked(b, { cefrLevel: b.unitLevel });
      if (aLocked !== bLocked) {
        return aLocked ? 1 : -1;
      }
      return sanitizeText(a.title).localeCompare(sanitizeText(b.title), "es");
    });

    const completedVisible = lessons.filter(function(lesson) {
      return Boolean(state.completedLessons[lesson.id]);
    }).length;
    if (elements.learnListNote) {
      if (!lessons.length) {
        elements.learnListNote.textContent = pendingOnly
          ? "No hay pendientes con ese filtro. Puedes desactivar 'Solo pendientes' para ver todo."
          : "No hay lecciones para ese filtro o búsqueda. Prueba con otro término.";
      } else {
        elements.learnListNote.textContent =
          "Visibles: " + lessons.length +
          " · Completadas: " + completedVisible +
          " · Filtro: " + (state.cefrFilter === "all" ? "Todos" : state.cefrFilter) +
          (pendingOnly ? " · Solo pendientes" : "");
      }
    }

    if (!lessons.length) {
      elements.learnLessonList.innerHTML = pendingOnly
        ? "<div class=\"pv-note\">No hay lecciones pendientes con este filtro.</div>"
        : "<div class=\"pv-note\">No encontramos lecciones con ese criterio.</div>";
      updateLearnOverview([]);
      return;
    }

    const fragment = document.createDocumentFragment();
    lessons.forEach(function(lesson, lessonIndex) {
      const done = Boolean(state.completedLessons[lesson.id]);
      const locked = isLessonPremiumLocked(lesson, { cefrLevel: lesson.unitLevel });
      const isCurrent = currentLessonId === lesson.id;

      const card = document.createElement("article");
      card.className =
        "pv-lesson pv-learn-lesson" +
        (done ? " is-done" : "") +
        (locked ? " is-locked" : "") +
        (isCurrent ? " is-current" : "");
      card.dataset.level = lesson.normalizedLevel;

      card.innerHTML =
        "<div class=\"pv-lesson-left\">" +
        "<span class=\"pv-lesson-index\">" + (lessonIndex + 1) + "</span>" +
        "<div class=\"pv-lesson-copy\"><strong>" + sanitizeText(lesson.title, "Lección") + "</strong><span>" +
        sanitizeText(lesson.unitName, "Ruta") + " · " + lesson.normalizedLevel + " · +" + Number(lesson.xp || 0) + " XP" +
        (locked ? " · Requiere Premium" : "") +
        (done ? " · Completada" : "") +
        (isCurrent ? " · En curso" : "") +
        "</span></div></div>" +
        "<div class=\"pv-lesson-art\" data-tone=\"" + (lessonIndex % 4) + "\"></div>";

      const actions = document.createElement("div");
      actions.className = "pv-lesson-actions";

      const action = document.createElement("button");
      action.type = "button";
      action.className = "pv-lesson-go" + (locked ? " is-locked-btn" : "");
      action.textContent = locked ? "★" : (isCurrent ? "▶" : "→");
      action.setAttribute("aria-label", locked ? "Desbloquear premium" : "Abrir lección");
      action.addEventListener("click", function() {
        if (locked) {
          setPremiumNote("Las lecciones B1 se habilitan cuando premium esté activo.", "error");
          setActiveView("premium");
          return;
        }
        startLesson(lesson.id);
        setActiveView("learn");
      });

      actions.appendChild(action);
      card.appendChild(actions);
      fragment.appendChild(card);
    });

    elements.learnLessonList.replaceChildren(fragment);

    if (elements.learnSortSelect && document.activeElement !== elements.learnSortSelect) {
      elements.learnSortSelect.value = sortMode;
    }
    if (elements.learnSearchInput && document.activeElement !== elements.learnSearchInput) {
      elements.learnSearchInput.value = sanitizeText(state.learnSearch, "");
    }
    updateLearnOverview(lessons);
  }

  function getDictionaryEntryKey(entry, fallbackIndex) {
    const key = sanitizeText(entry && entry.key, "").toLowerCase();
    if (key) {
      return key;
    }
    return sanitizeText(entry && entry.term, "entry-" + String(fallbackIndex || 0)).toLowerCase();
  }

  function isDictionaryFavorite(entryKey) {
    ensureDictionaryState();
    return state.dictionary.favorites.includes(entryKey);
  }

  function toggleDictionaryFavorite(entryKey) {
    ensureDictionaryState();
    const normalized = sanitizeText(entryKey, "").toLowerCase();
    if (!normalized) {
      return false;
    }
    const current = Array.isArray(state.dictionary.favorites) ? state.dictionary.favorites.slice() : [];
    if (current.includes(normalized)) {
      state.dictionary.favorites = current.filter(function(key) {
        return key !== normalized;
      });
      saveState();
      return false;
    }
    current.push(normalized);
    state.dictionary.favorites = Array.from(new Set(current));
    saveState();
    return true;
  }

  function speakText(text) {
    const message = sanitizeText(text, "");
    if (!message) {
      return false;
    }
    if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance !== "function") {
      return false;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(message);
      utterance.lang = "es-CO";
      utterance.rate = 0.92;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (_) {
      return false;
    }
  }

  function setDictionaryNote(copy, tone) {
    if (!elements.dictionaryResultsNote) {
      return;
    }
    elements.dictionaryResultsNote.textContent = sanitizeText(copy, "Explora términos, traducciones y contexto cultural.");
    elements.dictionaryResultsNote.classList.remove("is-ok", "is-bad");
    if (tone === "success") {
      elements.dictionaryResultsNote.classList.add("is-ok");
      return;
    }
    if (tone === "error") {
      elements.dictionaryResultsNote.classList.add("is-bad");
    }
  }

  function setTranslatorNote(copy, tone) {
    if (!elements.translatorNote) {
      return;
    }
    elements.translatorNote.textContent = sanitizeText(copy, "Traduce frases entre español y palenquero con apoyo del diccionario.");
    elements.translatorNote.classList.remove("is-ok", "is-bad");
    if (tone === "success") {
      elements.translatorNote.classList.add("is-ok");
      return;
    }
    if (tone === "error") {
      elements.translatorNote.classList.add("is-bad");
    }
  }

  function pickPreferredTranslationText(value) {
    const raw = sanitizeText(value, "");
    if (!raw) {
      return "";
    }
    const primary = raw.split(/[|/;]/)[0];
    return sanitizeText(primary, raw);
  }

  function registerLookup(map, sourceText, targetText) {
    const source = sanitizeText(sourceText, "");
    const target = sanitizeText(targetText, "");
    if (!source || !target) {
      return;
    }
    const candidates = getLookupCandidates(source);
    candidates.forEach(function(candidate) {
      if (!candidate) {
        return;
      }
      if (!map.has(candidate)) {
        map.set(candidate, target);
      }
    });
  }

  function buildTranslatorLexicon() {
    if (translatorLexiconCache) {
      return translatorLexiconCache;
    }

    const esToPal = new Map();
    const palToEs = new Map();

    dictionaryEntries.forEach(function(entry) {
      const term = sanitizeText(entry && entry.term, "");
      const mainTranslation = pickPreferredTranslationText(entry && entry.translation);
      if (!term || !mainTranslation) {
        return;
      }

      registerLookup(palToEs, term, mainTranslation);
      registerLookup(palToEs, entry && entry.key, mainTranslation);
      registerLookup(esToPal, mainTranslation, term);

      const alternatives = Array.isArray(entry && entry.translations) ? entry.translations : [];
      alternatives.slice(0, 10).forEach(function(item) {
        const alt = pickPreferredTranslationText(item);
        if (alt) {
          registerLookup(esToPal, alt, term);
        }
      });
    });

    translatorLexiconCache = {
      esToPal: esToPal,
      palToEs: palToEs
    };

    return translatorLexiconCache;
  }

  function findExactTranslation(text, direction) {
    const input = sanitizeText(text, "");
    if (!input) {
      return "";
    }
    const lexicon = buildTranslatorLexicon();
    const map = normalizeTranslatorDirection(direction) === "pal-es" ? lexicon.palToEs : lexicon.esToPal;
    const candidates = getLookupCandidates(input);

    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      if (map.has(candidate)) {
        return sanitizeText(map.get(candidate), "");
      }
    }

    return "";
  }

  function translateByWords(text, direction) {
    const input = sanitizeText(text, "");
    if (!input) {
      return {
        output: "",
        matched: 0,
        total: 0
      };
    }

    const lexicon = buildTranslatorLexicon();
    const map = normalizeTranslatorDirection(direction) === "pal-es" ? lexicon.palToEs : lexicon.esToPal;
    let totalWords = 0;
    let matchedWords = 0;

    const output = input.replace(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]+/g, function(token) {
      totalWords += 1;
      const candidates = getLookupCandidates(token);
      for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index];
        const found = sanitizeText(map.get(candidate), "");
        if (found) {
          matchedWords += 1;
          return found;
        }
      }
      return token;
    });

    return {
      output: output,
      matched: matchedWords,
      total: totalWords
    };
  }

  function pushTranslatorHistory(direction, input, output) {
    ensureTranslatorState();
    const normalizedDirection = normalizeTranslatorDirection(direction);
    const source = sanitizeText(input, "");
    const target = sanitizeText(output, "");
    if (!source || !target) {
      return;
    }

    const existing = state.translator.history.filter(function(item) {
      return !(
        normalizeTranslatorDirection(item && item.direction) === normalizedDirection &&
        sanitizeText(item && item.input, "") === source &&
        sanitizeText(item && item.output, "") === target
      );
    });

    existing.unshift({
      direction: normalizedDirection,
      input: source,
      output: target,
      createdAt: new Date().toISOString()
    });

    state.translator.history = existing.slice(0, 8);
  }

  function getTranslatorQuickPhrases(direction) {
    if (normalizeTranslatorDirection(direction) === "pal-es") {
      return [
        "Kumó bo tan?",
        "Senda bien",
        "Jende pa' bo",
        "Bo ta sabé kumina?"
      ];
    }

    return [
      "¿Cómo estás?",
      "Buenos días",
      "Gracias por venir",
      "Mi nombre es Rafael"
    ];
  }

  function getTranslatorDirectionMeta(direction) {
    if (normalizeTranslatorDirection(direction) === "pal-es") {
      return {
        sourceLabel: "Palenquero",
        targetLabel: "Español",
        sourcePlaceholder: "Ejemplo: Kumó bo tan?",
        targetPlaceholder: "Aquí verás la traducción en español",
        directionLabel: "Palenquero → Español"
      };
    }

    return {
      sourceLabel: "Español",
      targetLabel: "Palenquero",
      sourcePlaceholder: "Ejemplo: ¿Cómo estás?",
      targetPlaceholder: "Aquí verás la traducción en palenquero",
      directionLabel: "Español → Palenquero"
    };
  }

  function renderTranslatorQuickChips(direction) {
    if (!elements.translatorQuickChips) {
      return;
    }
    const phrases = getTranslatorQuickPhrases(direction);
    const fragment = document.createDocumentFragment();
    phrases.forEach(function(phrase) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pv-community-chip";
      button.dataset.translatorPhrase = phrase;
      button.textContent = phrase;
      fragment.appendChild(button);
    });
    elements.translatorQuickChips.replaceChildren(fragment);
  }

  function renderTranslatorHistory() {
    if (!elements.translatorRecentList) {
      return;
    }
    ensureTranslatorState();
    const history = Array.isArray(state.translator.history) ? state.translator.history : [];

    if (!history.length) {
      elements.translatorRecentList.innerHTML = "<div class=\"pv-note\">Tus traducciones recientes aparecerán aquí.</div>";
      return;
    }

    const fragment = document.createDocumentFragment();
    history.forEach(function(item) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pv-translator-history-item";
      button.dataset.translatorHistoryDirection = normalizeTranslatorDirection(item.direction);
      button.dataset.translatorHistoryInput = sanitizeText(item.input, "");
      button.dataset.translatorHistoryOutput = sanitizeText(item.output, "");
      const source = document.createElement("strong");
      source.textContent = sanitizeText(item.input, "");
      button.appendChild(source);
      const target = document.createElement("small");
      target.textContent = sanitizeText(item.output, "");
      button.appendChild(target);
      fragment.appendChild(button);
    });

    elements.translatorRecentList.replaceChildren(fragment);
  }

  function renderTranslator() {
    if (!elements.translatorInput || !elements.translatorOutput) {
      return;
    }

    ensureTranslatorState();
    const direction = normalizeTranslatorDirection(state.translator.direction);
    const meta = getTranslatorDirectionMeta(direction);

    if (elements.translatorSourceLabel) {
      elements.translatorSourceLabel.textContent = meta.sourceLabel;
    }
    if (elements.translatorTargetLabel) {
      elements.translatorTargetLabel.textContent = meta.targetLabel;
    }
    if (elements.translatorDirectionLabel) {
      elements.translatorDirectionLabel.textContent = meta.directionLabel;
    }

    elements.translatorInput.placeholder = meta.sourcePlaceholder;
    elements.translatorOutput.placeholder = meta.targetPlaceholder;

    if (document.activeElement !== elements.translatorInput) {
      elements.translatorInput.value = sanitizeText(state.translator.input, "");
    }
    if (document.activeElement !== elements.translatorOutput) {
      elements.translatorOutput.value = sanitizeText(state.translator.output, "");
    }

    renderTranslatorQuickChips(direction);
    renderTranslatorHistory();
  }

  function runTranslator() {
    if (!elements.translatorInput || !elements.translatorOutput) {
      return;
    }

    ensureTranslatorState();
    const direction = normalizeTranslatorDirection(state.translator.direction);
    const input = sanitizeText(elements.translatorInput.value, "");
    if (!input) {
      elements.translatorOutput.value = "";
      state.translator.input = "";
      state.translator.output = "";
      setTranslatorNote("Escribe una palabra o frase para traducir.", "error");
      saveState();
      return;
    }

    const exact = findExactTranslation(input, direction);
    let output = sanitizeText(exact, "");
    let quality = "exacta";

    if (!output) {
      const byWords = translateByWords(input, direction);
      output = sanitizeText(byWords.output, "");
      if (!output || byWords.matched <= 0) {
        output = "";
      } else if (byWords.matched < byWords.total) {
        quality = "parcial";
      } else {
        quality = "palabra a palabra";
      }
    }

    if (!output) {
      elements.translatorOutput.value = "";
      state.translator.input = input;
      state.translator.output = "";
      setTranslatorNote("No encontramos una traducción clara todavía. Prueba una frase más corta.", "error");
      saveState();
      return;
    }

    elements.translatorOutput.value = output;
    state.translator.input = input;
    state.translator.output = output;
    pushTranslatorHistory(direction, input, output);
    setTranslatorNote("Traducción " + quality + " lista.", "success");
    renderTranslatorHistory();
    saveState();
  }

  function clearTranslator() {
    if (!elements.translatorInput || !elements.translatorOutput) {
      return;
    }
    ensureTranslatorState();
    state.translator.input = "";
    state.translator.output = "";
    elements.translatorInput.value = "";
    elements.translatorOutput.value = "";
    setTranslatorNote("Campos limpiados. Puedes escribir una nueva frase.");
    saveState();
  }

  function swapTranslatorDirection() {
    if (!elements.translatorInput || !elements.translatorOutput) {
      return;
    }
    ensureTranslatorState();
    const nextDirection = state.translator.direction === "es-pal" ? "pal-es" : "es-pal";
    const currentInput = sanitizeText(elements.translatorInput.value, state.translator.input);
    const currentOutput = sanitizeText(elements.translatorOutput.value, state.translator.output);

    state.translator.direction = nextDirection;
    state.translator.input = currentOutput || "";
    state.translator.output = currentInput || "";
    renderTranslator();
    setTranslatorNote("Dirección cambiada. Revisa y vuelve a traducir.");
    saveState();
  }

  function renderDictionaryThemeFilters() {
    if (!elements.dictionaryThemeFilters) {
      return;
    }
    ensureDictionaryState();
    const themes = getDictionaryThemes();
    const activeTheme = normalizeDictionaryTheme(state.dictionary.theme);
    const fragment = document.createDocumentFragment();

    const allButton = document.createElement("button");
    allButton.type = "button";
    allButton.className = "pv-community-chip" + (activeTheme === "all" ? " is-active" : "");
    allButton.dataset.dictionaryTheme = "all";
    allButton.textContent = "Todos";
    fragment.appendChild(allButton);

    themes.forEach(function(theme) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pv-community-chip" + (activeTheme === theme.key ? " is-active" : "");
      button.dataset.dictionaryTheme = theme.key;
      button.textContent = theme.label + " (" + String(theme.count) + ")";
      fragment.appendChild(button);
    });

    elements.dictionaryThemeFilters.replaceChildren(fragment);
  }

  function renderDictionaryDetail(entry) {
    if (!elements.dictionaryDetailTerm) {
      return;
    }

    if (!entry) {
      elements.dictionaryDetailTerm.textContent = "Selecciona una palabra";
      elements.dictionaryDetailTranslation.textContent = "Traducción y contexto";
      elements.dictionaryDetailDescription.textContent = "Aquí verás significado, uso y categoría cultural de la palabra seleccionada.";
      elements.dictionaryDetailTheme.textContent = "Tema";
      elements.dictionaryDetailSources.textContent = "Fuente";
      if (elements.dictionaryDetailTags) {
        elements.dictionaryDetailTags.replaceChildren();
      }
      if (elements.dictionaryFavoriteButton) {
        elements.dictionaryFavoriteButton.textContent = "☆";
      }
      return;
    }

    const entryKey = getDictionaryEntryKey(entry, 0);
    const favorite = isDictionaryFavorite(entryKey);
    elements.dictionaryDetailTerm.textContent = sanitizeText(entry.term, "Sin término");
    elements.dictionaryDetailTranslation.textContent = sanitizeText(entry.translation, "Sin traducción");
    elements.dictionaryDetailDescription.textContent = sanitizeText(
      entry.description || (Array.isArray(entry.meanings) ? entry.meanings[0] : ""),
      "Sin descripción disponible."
    );
    elements.dictionaryDetailTheme.textContent = sanitizeText(entry.themeLabel || entry.theme, "Tema general");
    elements.dictionaryDetailSources.textContent = sanitizeText((entry.sources || []).slice(0, 2).join(" · "), "Fuente local");

    if (elements.dictionaryFavoriteButton) {
      elements.dictionaryFavoriteButton.textContent = favorite ? "★" : "☆";
      elements.dictionaryFavoriteButton.dataset.entryKey = entryKey;
      elements.dictionaryFavoriteButton.setAttribute("aria-label", favorite ? "Quitar de guardadas" : "Guardar palabra");
      elements.dictionaryFavoriteButton.title = favorite ? "Quitar de guardadas" : "Guardar palabra";
    }
    if (elements.dictionarySpeakButton) {
      elements.dictionarySpeakButton.dataset.term = sanitizeText(entry.term, "");
    }
    if (elements.dictionaryCopyButton) {
      elements.dictionaryCopyButton.dataset.term = sanitizeText(entry.term, "");
    }

    if (elements.dictionaryDetailTags) {
      const tags = Array.isArray(entry.tags) ? entry.tags.slice(0, 6) : [];
      const fragment = document.createDocumentFragment();
      tags.forEach(function(tag) {
        const chip = document.createElement("span");
        chip.className = "pv-rank-chip";
        chip.textContent = sanitizeText(tag, "");
        fragment.appendChild(chip);
      });
      elements.dictionaryDetailTags.replaceChildren(fragment);
    }
  }

  function renderDictionary() {
    ensureDictionaryState();

    if (!elements.dictionaryList || !elements.dictionarySearch) {
      return;
    }

    if (document.activeElement !== elements.dictionarySearch) {
      elements.dictionarySearch.value = sanitizeText(state.dictionary.search, "");
    }
    if (elements.dictionaryFavoritesOnly && document.activeElement !== elements.dictionaryFavoritesOnly) {
      elements.dictionaryFavoritesOnly.value = normalizeDictionaryShow(state.dictionary.show);
    }

    state.dictionary.search = sanitizeText(elements.dictionarySearch.value, "");
    state.dictionary.show = normalizeDictionaryShow(elements.dictionaryFavoritesOnly ? elements.dictionaryFavoritesOnly.value : state.dictionary.show);
    state.dictionary.theme = normalizeDictionaryTheme(state.dictionary.theme);

    const search = state.dictionary.search.toLowerCase();
    const onlyFavorites = state.dictionary.show === "favorites";
    const activeTheme = state.dictionary.theme;
    const favoriteSet = new Set((state.dictionary.favorites || []).map(function(key) {
      return sanitizeText(key, "").toLowerCase();
    }));

    renderDictionaryThemeFilters();

    const filtered = dictionaryEntries.filter(function(entry, index) {
      const entryKey = getDictionaryEntryKey(entry, index);
      if (onlyFavorites && !favoriteSet.has(entryKey)) {
        return false;
      }
      const entryTheme = sanitizeText(entry.theme, "").toLowerCase();
      if (activeTheme !== "all" && entryTheme !== activeTheme) {
        return false;
      }
      if (!search) {
        return true;
      }
      const stack = sanitizeText(
        entry.search ||
          [
            entry.term,
            entry.translation,
            entry.description,
            entry.themeLabel,
            entry.theme,
            (entry.tags || []).join(" "),
            (entry.categories || []).join(" ")
          ].join(" "),
        ""
      ).toLowerCase();
      return stack.includes(search);
    }).sort(function(a, b) {
      return sanitizeText(a.term, "").localeCompare(sanitizeText(b.term, ""), "es");
    }).slice(0, 180);

    if (!filtered.length) {
      elements.dictionaryList.innerHTML = "<div class=\"pv-note\">No encontramos resultados con ese criterio.</div>";
      renderDictionaryDetail(null);
      setDictionaryNote("No encontramos resultados. Prueba otra palabra, tema o quita el filtro de guardadas.", "error");
      saveState();
      return;
    }

    const filteredMap = new Map();
    filtered.forEach(function(entry, index) {
      filteredMap.set(getDictionaryEntryKey(entry, index), entry);
    });

    let selectedKey = sanitizeText(state.dictionary.selectedKey, "").toLowerCase();
    if (!selectedKey || !filteredMap.has(selectedKey)) {
      selectedKey = getDictionaryEntryKey(filtered[0], 0);
      state.dictionary.selectedKey = selectedKey;
    }

    const fragment = document.createDocumentFragment();
    filtered.forEach(function(entry, index) {
      const entryKey = getDictionaryEntryKey(entry, index);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "pv-dictionary-item" + (entryKey === selectedKey ? " is-active" : "");
      card.dataset.entryKey = entryKey;

      const title = document.createElement("strong");
      title.textContent = sanitizeText(entry.term, "Sin término") + " · " + sanitizeText(entry.translation, "Sin traducción");
      card.appendChild(title);

      const description = document.createElement("p");
      description.textContent = sanitizeText(entry.description, "Sin descripción disponible.");
      card.appendChild(description);

      const meta = document.createElement("small");
      meta.textContent = sanitizeText(entry.themeLabel || entry.theme, "Tema general");
      card.appendChild(meta);

      fragment.appendChild(card);
    });

    elements.dictionaryList.replaceChildren(fragment);
    renderDictionaryDetail(filteredMap.get(selectedKey) || filtered[0]);

    const totalCopy = filtered.length + " resultado" + (filtered.length === 1 ? "" : "s");
    const favoriteCopy = onlyFavorites
      ? " · guardadas: " + String(favoriteSet.size)
      : " · favoritas: " + String(favoriteSet.size);
    setDictionaryNote(totalCopy + favoriteCopy);

    saveState();
  }

  function shuffleArray(source) {
    const list = source.slice();
    for (let index = list.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      const temp = list[index];
      list[index] = list[randomIndex];
      list[randomIndex] = temp;
    }
    return list;
  }

  function pickRandomItem(source) {
    if (!Array.isArray(source) || !source.length) {
      return null;
    }
    return source[Math.floor(Math.random() * source.length)] || null;
  }

  function buildGameQuestion(mode) {
    const normalizedMode = normalizeGameMode(mode);
    const modeLabels = {
      "hidden-word": {
        title: "Palabra oculta",
        copy: "Completa la palabra y fortalece vocabulario."
      },
      trivia: {
        title: "Trivia palenquera",
        copy: "Elige la traducción correcta."
      },
      listening: {
        title: "Escucha y responde",
        copy: "Escucha la palabra y selecciona su significado."
      },
      meaning: {
        title: "Ordena la frase",
        copy: "Relaciona la palabra con su descripción."
      }
    };

    const termPool = dictionaryEntries.filter(function(entry) {
      return sanitizeText(entry.term, "").replace(/\s+/g, "").length >= 4;
    });

    const translationPool = dictionaryEntries.filter(function(entry) {
      return Boolean(sanitizeText(entry.translation, ""));
    });

    const descriptionPool = dictionaryEntries.filter(function(entry) {
      return Boolean(sanitizeText(entry.description, ""));
    });

    const baseLabel = modeLabels[normalizedMode] || modeLabels["hidden-word"];
    let prompt = "Selecciona la respuesta correcta.";
    let options = [];
    let correctIndex = -1;
    let termToSpeak = "";

    if (normalizedMode === "hidden-word") {
      const entry = pickRandomItem(termPool) || pickRandomItem(dictionaryEntries);
      if (!entry) {
        return null;
      }
      const correctTerm = sanitizeText(entry.term, "");
      const letters = correctTerm.split("");
      const masked = letters.map(function(char, index) {
        if (char === " " || index === 0 || index === letters.length - 1) {
          return char;
        }
        return Math.random() < 0.7 ? "•" : char;
      }).join("");

      const distractorSet = new Set();
      let attempts = 0;
      while (distractorSet.size < 3 && attempts < 300) {
        const candidate = pickRandomItem(termPool) || pickRandomItem(dictionaryEntries);
        const candidateTerm = sanitizeText(candidate && candidate.term, "");
        if (candidateTerm && candidateTerm.toLowerCase() !== correctTerm.toLowerCase()) {
          distractorSet.add(candidateTerm);
        }
        attempts += 1;
      }
      options = shuffleArray([correctTerm].concat(Array.from(distractorSet).slice(0, 3)));
      correctIndex = options.findIndex(function(option) {
        return option.toLowerCase() === correctTerm.toLowerCase();
      });
      prompt = "Descubre la palabra: " + masked;
      termToSpeak = correctTerm;
    } else if (normalizedMode === "meaning") {
      const entry = pickRandomItem(descriptionPool) || pickRandomItem(dictionaryEntries);
      if (!entry) {
        return null;
      }
      const correctDescription = sanitizeText(entry.description, "Sin descripción.");
      const correctTerm = sanitizeText(entry.term, "Palabra");
      const distractorSet = new Set();
      let attempts = 0;
      while (distractorSet.size < 3 && attempts < 300) {
        const candidate = pickRandomItem(descriptionPool);
        const candidateDescription = sanitizeText(candidate && candidate.description, "");
        if (candidateDescription && candidateDescription !== correctDescription) {
          distractorSet.add(candidateDescription);
        }
        attempts += 1;
      }
      options = shuffleArray([correctDescription].concat(Array.from(distractorSet).slice(0, 3)));
      correctIndex = options.indexOf(correctDescription);
      prompt = "Selecciona el significado correcto de \"" + correctTerm + "\".";
      termToSpeak = correctTerm;
    } else {
      const entry = pickRandomItem(translationPool) || pickRandomItem(dictionaryEntries);
      if (!entry) {
        return null;
      }
      const correctTranslation = sanitizeText(entry.translation, "Sin traducción");
      const correctTerm = sanitizeText(entry.term, "Palabra");
      const distractorSet = new Set();
      let attempts = 0;
      while (distractorSet.size < 3 && attempts < 300) {
        const candidate = pickRandomItem(translationPool);
        const candidateTranslation = sanitizeText(candidate && candidate.translation, "");
        if (candidateTranslation && candidateTranslation !== correctTranslation) {
          distractorSet.add(candidateTranslation);
        }
        attempts += 1;
      }
      options = shuffleArray([correctTranslation].concat(Array.from(distractorSet).slice(0, 3)));
      correctIndex = options.indexOf(correctTranslation);
      prompt = normalizedMode === "listening"
        ? "Escucha y elige el significado de \"" + correctTerm + "\"."
        : "¿Qué significa \"" + correctTerm + "\"?";
      termToSpeak = correctTerm;
    }

    if (correctIndex < 0 || !options.length) {
      return null;
    }

    return {
      mode: normalizedMode,
      title: baseLabel.title,
      copy: baseLabel.copy,
      prompt: prompt,
      options: options,
      correctIndex: correctIndex,
      termToSpeak: termToSpeak
    };
  }

  function renderGameModeButtons() {
    if (!elements.quickGamesGrid) {
      return;
    }
    ensureGameState();
    const activeMode = normalizeGameMode(state.game.mode);
    const buttons = Array.from(elements.quickGamesGrid.querySelectorAll("[data-game-mode]"));
    buttons.forEach(function(button) {
      const mode = normalizeGameMode(button.dataset.gameMode);
      button.classList.toggle("is-active", mode === activeMode);
      button.setAttribute("aria-pressed", String(mode === activeMode));
    });
  }

  function setGameStatus(copy, tone) {
    if (!elements.gameStatusNote) {
      return;
    }
    elements.gameStatusNote.textContent = sanitizeText(copy, "Cada acierto suma XP para tu meta diaria.");
    elements.gameStatusNote.classList.remove("is-ok", "is-bad");
    if (tone === "success") {
      elements.gameStatusNote.classList.add("is-ok");
      return;
    }
    if (tone === "error") {
      elements.gameStatusNote.classList.add("is-bad");
    }
  }

  function getGameAccuracyPercent() {
    ensureGameState();
    const rounds = Math.max(0, Number(state.game.roundsPlayed || 0));
    const correct = Math.max(0, Number(state.game.correctAnswers || 0));
    if (rounds <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round((correct / rounds) * 100)));
  }

  function updateGameListenButtonState() {
    if (!elements.gameListenButton) {
      return;
    }
    const hasAudioHint = Boolean(gameSession && sanitizeText(gameSession.termToSpeak, ""));
    const isListeningMode = Boolean(gameSession && normalizeGameMode(gameSession.mode) === "listening");

    elements.gameListenButton.disabled = !hasAudioHint;
    elements.gameListenButton.textContent = isListeningMode ? "Repetir audio" : "Escuchar pista";
  }

  function renderGamePanel() {
    if (!elements.gameQuestion || !elements.gameOptions) {
      return;
    }
    ensureGameState();
    renderGameModeButtons();

    const roundsPlayed = Math.max(0, Number(state.game.roundsPlayed || 0));
    const correctAnswers = Math.max(0, Number(state.game.correctAnswers || 0));
    const accuracy = getGameAccuracyPercent();
    const gameXpEarned = correctAnswers * GAME_XP_PER_CORRECT;

    if (elements.gameScoreChip) {
      elements.gameScoreChip.textContent = "Puntos: " + String(Math.max(0, Number(state.game.score || 0)));
    }
    if (elements.gameStreakChip) {
      elements.gameStreakChip.textContent = "Racha: " + String(Math.max(0, Number(state.game.streak || 0)));
    }
    if (elements.gameModeChip) {
      elements.gameModeChip.textContent = "Modo: " + sanitizeText(gameSession && gameSession.title, "Palabra oculta");
    }
    if (elements.gameRoundChip) {
      elements.gameRoundChip.textContent = "Retos: " + String(roundsPlayed);
    }
    if (elements.gameAccuracyChip) {
      elements.gameAccuracyChip.textContent = "Precisión: " + String(accuracy) + "%";
    }
    if (elements.gameXpChip) {
      elements.gameXpChip.textContent = "XP juegos: " + String(gameXpEarned);
    }
    if (elements.gameAccuracyBar) {
      elements.gameAccuracyBar.style.width = String(accuracy) + "%";
    }
    if (elements.gameBestPill) {
      elements.gameBestPill.textContent = "Mejor racha: " + String(Math.max(0, Number(state.game.bestStreak || 0)));
    }

    if (!gameSession || !Array.isArray(gameSession.options)) {
      elements.gameQuestion.textContent = "Pulsa un modo para empezar el reto.";
      elements.gameOptions.replaceChildren();
      if (elements.gameNextButton) {
        elements.gameNextButton.disabled = false;
      }
      if (elements.gameCurrentTitle) {
        elements.gameCurrentTitle.textContent = "Palabra oculta";
      }
      if (elements.gameCurrentCopy) {
        elements.gameCurrentCopy.textContent = "Descubre la palabra correcta y refuerza vocabulario.";
      }
      if (elements.gameModeChip) {
        elements.gameModeChip.textContent = "Modo: Palabra oculta";
      }
      updateGameListenButtonState();
      return;
    }

    if (elements.gameCurrentTitle) {
      elements.gameCurrentTitle.textContent = gameSession.title;
    }
    if (elements.gameCurrentCopy) {
      elements.gameCurrentCopy.textContent = gameSession.copy;
    }
    elements.gameQuestion.textContent = gameSession.prompt;

    const fragment = document.createDocumentFragment();
    gameSession.options.forEach(function(option, optionIndex) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pv-btn-ghost pv-game-option";
      button.dataset.optionIndex = String(optionIndex);
      button.textContent = sanitizeText(option, "Opción");
      if (gameSession.answered) {
        button.disabled = true;
        if (optionIndex === gameSession.correctIndex) {
          button.classList.add("is-correct");
        }
        if (optionIndex === gameSession.selectedIndex && optionIndex !== gameSession.correctIndex) {
          button.classList.add("is-wrong");
        }
      }
      fragment.appendChild(button);
    });
    elements.gameOptions.replaceChildren(fragment);

    if (elements.gameNextButton) {
      elements.gameNextButton.disabled = !gameSession.answered;
    }
    updateGameListenButtonState();
  }

  function startGameRound(forceMode) {
    ensureGameState();
    const nextMode = normalizeGameMode(forceMode || state.game.mode);
    state.game.mode = nextMode;

    const question = buildGameQuestion(nextMode);
    if (!question) {
      setGameStatus("No hay suficientes entradas para construir este reto.", "error");
      renderGamePanel();
      saveState();
      return;
    }

    gameSession = Object.assign({}, question, {
      answered: false,
      selectedIndex: -1
    });

    if (nextMode === "listening") {
      const spoken = speakText(gameSession.termToSpeak);
      if (!spoken) {
        setGameStatus("Tu navegador no permite audio en este momento. Puedes jugar igual.", "error");
      } else {
        setGameStatus("Escucha activa habilitada. Elige la respuesta correcta.", "success");
      }
    } else {
      setGameStatus("Responde el reto para sumar XP y mejorar tu precisión.", "success");
    }

    renderGamePanel();
    saveState();
  }

  function setGameMode(nextMode) {
    const mode = normalizeGameMode(nextMode);
    state.game.mode = mode;
    gameSession = null;
    startGameRound(mode);
  }

  function handleGameAnswer(optionIndex) {
    if (!gameSession || gameSession.answered) {
      return;
    }

    const selected = Number(optionIndex);
    if (!Number.isFinite(selected)) {
      return;
    }

    gameSession.answered = true;
    gameSession.selectedIndex = selected;
    const correct = selected === gameSession.correctIndex;
    state.game.roundsPlayed = Math.max(0, Number(state.game.roundsPlayed || 0) + 1);

    if (correct) {
      state.game.score = Math.max(0, Number(state.game.score || 0) + 1);
      state.game.streak = Math.max(0, Number(state.game.streak || 0) + 1);
      state.game.correctAnswers = Math.max(0, Number(state.game.correctAnswers || 0) + 1);
      if (state.game.streak > state.game.bestStreak) {
        state.game.bestStreak = state.game.streak;
      }
      applyXP(GAME_XP_PER_CORRECT);
      setGameStatus(
        "¡Bien! Sumaste +" + GAME_XP_PER_CORRECT + " XP. Precisión actual: " + getGameAccuracyPercent() + "%.",
        "success"
      );
    } else {
      state.game.streak = 0;
      const correctValue = sanitizeText(gameSession.options[gameSession.correctIndex], "respuesta correcta");
      setGameStatus(
        "Casi. La respuesta correcta era: " + correctValue + ". Precisión actual: " + getGameAccuracyPercent() + "%.",
        "error"
      );
    }

    renderGamePanel();
    saveState();
  }

  function resetGameSession() {
    ensureGameState();
    state.game.score = 0;
    state.game.streak = 0;
    state.game.roundsPlayed = 0;
    state.game.correctAnswers = 0;
    gameSession = null;
    startGameRound(state.game.mode);
  }

  function renderCommunityFeed() {
    ensureCommunityState();
    updateCommunityComposerUI();

    if (!elements.communityFeedList) {
      return;
    }

    const activeFilter = normalizeCommunityFilter(state.community.filter);
    const activeSort = normalizeCommunitySort(state.community.sort);
    state.community.filter = activeFilter;
    state.community.sort = activeSort;

    communityFilterButtons.forEach(function(button) {
      const filter = normalizeCommunityFilter(button.dataset.communityFilter);
      button.classList.toggle("is-active", filter === activeFilter);
    });

    const sourceFeed = Array.isArray(state.community.feed) ? state.community.feed.slice() : [];
    renderCommunityOverview(sourceFeed);
    renderCommunityGroups();
    renderCommunityEvents();
    const filteredFeed = sourceFeed
      .filter(function(item) {
        if (activeFilter === "all") {
          return true;
        }
        return normalizeCommunityFilter(item.type) === activeFilter;
      })
      .sort(function(a, b) {
        if (activeSort === "popular") {
          const scoreA = Number(a.likes || 0) + Number(a.comments || 0) * 1.25 + Number(a.shares || 0) * 1.4;
          const scoreB = Number(b.likes || 0) + Number(b.comments || 0) * 1.25 + Number(b.shares || 0) * 1.4;
          if (scoreB !== scoreA) {
            return scoreB - scoreA;
          }
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

    if (!filteredFeed.length) {
      elements.communityFeedList.innerHTML =
        "<article class=\"pv-community-item\"><b>Sin publicaciones</b><small>No hay contenido para este filtro todavía.</small></article>";
      setCommunityNote("Aún no hay publicaciones para este filtro.", "error");
      return;
    }

    const labelByType = {
      post: "Publicación",
      challenge: "Reto",
      event: "Evento"
    };

    const likedSet = new Set((state.community.likedPostIds || []).map(function(id) {
      return sanitizeText(id, "");
    }));

    const fragment = document.createDocumentFragment();
    filteredFeed.forEach(function(item) {
      const postType = normalizeCommunityFilter(item.type);
      const card = document.createElement("article");
      card.className = "pv-community-item";
      card.dataset.type = postType;

      const head = document.createElement("div");
      head.className = "pv-community-head";
      head.innerHTML =
        "<b>" + sanitizeText(item.author, "Comunidad Kumaina") + "</b>" +
        "<span class=\"pv-community-type\">" + sanitizeText(labelByType[postType], "Publicación") + "</span>";

      const body = document.createElement("p");
      body.className = "pv-community-text";
      body.textContent = sanitizeText(item.text, "Sin contenido.");

      const meta = document.createElement("small");
      meta.className = "pv-community-meta";
      const likes = Math.max(0, Number(item.likes || 0));
      const comments = Math.max(0, Number(item.comments || 0));
      const shares = Math.max(0, Number(item.shares || 0));
      meta.textContent =
        formatCommunityAge(item.createdAt) +
        " · " +
        likes +
        " me gusta · " +
        comments +
        " comentarios · " +
        shares +
        " compartidos";

      const actions = document.createElement("div");
      actions.className = "pv-community-actions";

      const likeBtn = document.createElement("button");
      likeBtn.type = "button";
      likeBtn.className = "pv-community-action" + (likedSet.has(item.id) ? " is-active" : "");
      likeBtn.dataset.communityAction = "like";
      likeBtn.dataset.postId = sanitizeText(item.id, "");
      likeBtn.textContent = "❤ Me gusta";

      const commentBtn = document.createElement("button");
      commentBtn.type = "button";
      commentBtn.className = "pv-community-action";
      commentBtn.dataset.communityAction = "comment";
      commentBtn.dataset.postId = sanitizeText(item.id, "");
      commentBtn.textContent = "💬 Comentar";

      const shareBtn = document.createElement("button");
      shareBtn.type = "button";
      shareBtn.className = "pv-community-action";
      shareBtn.dataset.communityAction = "share";
      shareBtn.dataset.postId = sanitizeText(item.id, "");
      shareBtn.textContent = "↗ Compartir";

      actions.appendChild(likeBtn);
      actions.appendChild(commentBtn);
      actions.appendChild(shareBtn);

      card.appendChild(head);
      card.appendChild(body);
      if (sanitizeText(item.recentReply, "")) {
        const reply = document.createElement("p");
        reply.className = "pv-community-reply";
        reply.textContent = "Último comentario: " + sanitizeText(item.recentReply, "");
        card.appendChild(reply);
      }
      card.appendChild(meta);
      card.appendChild(actions);
      fragment.appendChild(card);
    });

    elements.communityFeedList.replaceChildren(fragment);
  }

  function setCommunityFilter(nextFilter) {
    ensureCommunityState();
    state.community.filter = normalizeCommunityFilter(nextFilter);
    saveState();
    renderCommunityFeed();
  }

  function setCommunitySort(nextSort) {
    ensureCommunityState();
    state.community.sort = normalizeCommunitySort(nextSort);
    saveState();
    renderCommunityFeed();
    setCommunityNote(
      state.community.sort === "popular"
        ? "Feed ordenado por popularidad."
        : "Feed ordenado por publicaciones recientes.",
      "success"
    );
  }

  function handleCommunityAction(postId, action) {
    ensureCommunityState();
    const normalizedId = sanitizeText(postId, "");
    const normalizedAction = sanitizeText(action, "").toLowerCase();
    const feed = Array.isArray(state.community.feed) ? state.community.feed : [];
    const index = feed.findIndex(function(item) {
      return sanitizeText(item.id, "") === normalizedId;
    });

    if (index < 0) {
      return;
    }

    const item = Object.assign({}, feed[index]);
    const likedIds = new Set((state.community.likedPostIds || []).map(function(id) {
      return sanitizeText(id, "");
    }));

    if (normalizedAction === "like") {
      if (likedIds.has(normalizedId)) {
        likedIds.delete(normalizedId);
        item.likes = Math.max(0, Number(item.likes || 0) - 1);
        setCommunityNote("Quitaste tu me gusta.", "success");
      } else {
        likedIds.add(normalizedId);
        item.likes = Math.max(0, Number(item.likes || 0) + 1);
        applyXP(1);
        setCommunityNote("¡Gracias por interactuar! Sumaste +1 XP.", "success");
      }
      state.community.likedPostIds = Array.from(likedIds);
    } else if (normalizedAction === "comment") {
      const reply = sanitizeText(window.prompt("Escribe un comentario breve para la comunidad:", ""));
      if (!reply) {
        setCommunityNote("Comentario cancelado.", "error");
        return;
      }
      item.comments = Math.max(0, Number(item.comments || 0) + 1);
      item.recentReply = reply.slice(0, 120);
      applyXP(1);
      setCommunityNote("Comentario enviado. +1 XP por participar.", "success");
    } else if (normalizedAction === "share") {
      item.shares = Math.max(0, Number(item.shares || 0) + 1);
      const shareText = sanitizeText(item.text, "").slice(0, 180);
      const sharePayload = "Kumaina · " + shareText;
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(sharePayload).then(function() {
          setCommunityNote("Texto copiado para compartir.", "success");
        }).catch(function() {
          setCommunityNote("Compartido registrado en tu perfil.", "success");
        });
      } else {
        setCommunityNote("Compartido registrado en tu perfil.", "success");
      }
    }

    state.community.feed[index] = item;
    saveState();
    renderCommunityFeed();
  }

  function publishCommunityPost() {
    ensureCommunityState();
    const text = sanitizeText(elements.communityPostInput && elements.communityPostInput.value, "");
    const postType = normalizeCommunityPostType(elements.communityPostType && elements.communityPostType.value);
    const maxChars = 220;

    if (text.length < 6) {
      setCommunityNote("Escribe al menos 6 caracteres para publicar.", "error");
      return;
    }

    if (text.length > maxChars) {
      setCommunityNote("Tu publicación supera el máximo de " + maxChars + " caracteres.", "error");
      return;
    }

    const author = sanitizeText(state.profileName, "Visitante");
    const newPost = {
      id: "post-" + Date.now().toString(36),
      type: postType,
      author: author,
      text: text,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
      recentReply: ""
    };

    state.community.feed.unshift(newPost);
    state.community.feed = state.community.feed.slice(0, 120);
    state.community.composerType = postType;
    saveState();

    if (elements.communityPostInput) {
      elements.communityPostInput.value = "";
    }

    setCommunityFilter(postType);
    setCommunityNote("Contenido publicado correctamente. Tu comunidad ya puede interactuar.", "success");
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
    elements.dailyGoalSelect.value = String(normalizeDailyGoal(state.dailyGoal));
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
    renderLearnNavigator();
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
    renderLearnNavigator();
    updateProfilePanel();
    updateTopStats();
    stopPronunciation();

    window.setTimeout(function() {
      hydrateLessonUIWithoutSession();
    }, 1800);
  }

  function buildPremiumPayload(providerLabel) {
    const authUser = getAuthUser();
    ensurePremiumState();
    const plans = getPremiumPlans();
    const cycle = normalizePremiumCycle(state.premium.cycle);
    const amount = cycle === "monthly" ? plans.monthly : plans.annual;
    const planCode = premiumConfig.productId + "-" + cycle;
    const reference = createReference("LNGPAY");

    return {
      reference: reference,
      type: "lengua-premium",
      packageCode: planCode,
      packageName: premiumConfig.productName + " (" + (cycle === "monthly" ? "Mensual" : "Anual") + ")",
      description: "Acceso premium app Palenque Lengua Viva · plan " + (cycle === "monthly" ? "mensual" : "anual"),
      total: amount,
      currency: "COP",
      name: sanitizeText(state.profileName, "Cliente Benko"),
      phone: "",
      email: sanitizeText(authUser && authUser.email, appConfig.channels && appConfig.channels.reservationEmail),
      city: "Cartagena",
      provider: String(providerLabel || "").toLowerCase(),
      cycle: cycle,
      items: [
        {
          id: planCode,
          sku: planCode,
          name: premiumConfig.productName + " (" + (cycle === "monthly" ? "Mensual" : "Anual") + ")",
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
      plan: sanitizeText(payload.packageCode || "lengua-premium"),
      producto: sanitizeText(payload.packageName || premiumConfig.productName),
      precio: Number(payload.total || premiumConfig.priceCop || 189000),
      ciclo: sanitizeText(payload.cycle || state.premium.cycle || "annual"),
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
    ensurePremiumState();
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
      const cloudCycle = payload.ciclo || payload.planCycle || payload.plan_ciclo || state.premium.cycle;

      state.premium.active = isPremiumActiveByStatus(status);
      state.premium.status = String(status || "pendiente");
      state.premium.source = snapshot.exists ? "cloud" : "none";
      state.premium.cycle = normalizePremiumCycle(cloudCycle);
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
        if (next === "profile") {
          updateProfileEditorUI();
        }
        if (next === "premium") {
          renderCommunityFeed();
        }
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
      const goal = normalizeDailyGoal(elements.dailyGoalSelect.value || 10);
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
    function resolveNextLesson() {
      if (Boolean(state.learnPendingOnly)) {
        const pendingVisible = flattenLessons({
          respectLevelFilter: true,
          includeLocked: false
        }).find(function(lesson) {
          return !state.completedLessons[lesson.id];
        });
        if (pendingVisible) {
          return pendingVisible;
        }
      }

      return findLessonById(state.lastLessonId) || getFirstIncompleteLesson({
        respectLevelFilter: true,
        includeLocked: false
      }) || getFirstIncompleteLesson({
        respectLevelFilter: false,
        includeLocked: false
      });
    }

    elements.continueLastButton.addEventListener("click", function() {
      const lesson = resolveNextLesson();
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

    if (elements.learnContinueButton) {
      elements.learnContinueButton.addEventListener("click", function() {
        const lesson = resolveNextLesson();
        if (!lesson) {
          return;
        }
        startLesson(lesson.id);
        setActiveView("learn");
      });
    }

    if (elements.learnResetFiltersButton) {
      elements.learnResetFiltersButton.addEventListener("click", function() {
        state.learnSearch = "";
        state.learnSort = "recommended";
        state.learnPendingOnly = false;
        saveState();
        setActiveLevelFilter("all");
      });
    }

    if (elements.learnSearchInput) {
      elements.learnSearchInput.addEventListener("input", function() {
        state.learnSearch = sanitizeText(elements.learnSearchInput.value, "");
        saveState();
        renderLearnNavigator();
      });
    }

    if (elements.learnSortSelect) {
      elements.learnSortSelect.addEventListener("change", function() {
        state.learnSort = normalizeLearnSort(elements.learnSortSelect.value);
        saveState();
        renderLearnNavigator();
      });
    }

    if (elements.learnPendingOnly) {
      elements.learnPendingOnly.addEventListener("change", function() {
        state.learnPendingOnly = Boolean(elements.learnPendingOnly.checked);
        saveState();
        renderLearnNavigator();
      });
    }

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
    ensureDictionaryState();
    ensureTranslatorState();
    ensureGameState();

    if (elements.translatorRunButton) {
      elements.translatorRunButton.addEventListener("click", function() {
        runTranslator();
      });
    }

    if (elements.translatorInput) {
      elements.translatorInput.addEventListener("input", function() {
        state.translator.input = sanitizeText(elements.translatorInput.value, "");
      });
      elements.translatorInput.addEventListener("keydown", function(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          runTranslator();
        }
      });
    }

    if (elements.translatorSwapButton) {
      elements.translatorSwapButton.addEventListener("click", function() {
        swapTranslatorDirection();
      });
    }

    if (elements.translatorClearButton) {
      elements.translatorClearButton.addEventListener("click", function() {
        clearTranslator();
      });
    }

    if (elements.translatorCopyButton) {
      elements.translatorCopyButton.addEventListener("click", async function() {
        const translated = sanitizeText(elements.translatorOutput && elements.translatorOutput.value, "");
        if (!translated) {
          setTranslatorNote("Todavía no hay traducción para copiar.", "error");
          return;
        }
        try {
          if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            await navigator.clipboard.writeText(translated);
            setTranslatorNote("Traducción copiada al portapapeles.", "success");
            return;
          }
        } catch (_) {
          // noop
        }
        setTranslatorNote("No pudimos copiar automáticamente en este navegador.", "error");
      });
    }

    if (elements.translatorSpeakButton) {
      elements.translatorSpeakButton.addEventListener("click", function() {
        const translated = sanitizeText(elements.translatorOutput && elements.translatorOutput.value, "");
        if (!translated) {
          setTranslatorNote("Primero traduce una frase para poder escucharla.", "error");
          return;
        }
        const spoken = speakText(translated);
        setTranslatorNote(spoken ? "Reproduciendo audio de la traducción." : "Tu navegador no permitió reproducir audio.", spoken ? "success" : "error");
      });
    }

    if (elements.translatorQuickChips) {
      elements.translatorQuickChips.addEventListener("click", function(event) {
        const button = event.target.closest("[data-translator-phrase]");
        if (!button || !elements.translatorInput) {
          return;
        }
        const phrase = sanitizeText(button.dataset.translatorPhrase, "");
        elements.translatorInput.value = phrase;
        state.translator.input = phrase;
        runTranslator();
      });
    }

    if (elements.translatorRecentList) {
      elements.translatorRecentList.addEventListener("click", function(event) {
        const button = event.target.closest("[data-translator-history-input]");
        if (!button || !elements.translatorInput || !elements.translatorOutput) {
          return;
        }
        const direction = normalizeTranslatorDirection(button.dataset.translatorHistoryDirection);
        const input = sanitizeText(button.dataset.translatorHistoryInput, "");
        const output = sanitizeText(button.dataset.translatorHistoryOutput, "");

        state.translator.direction = direction;
        state.translator.input = input;
        state.translator.output = output;
        elements.translatorInput.value = input;
        elements.translatorOutput.value = output;
        renderTranslator();
        setTranslatorNote("Recuperamos esta traducción de tu historial.", "success");
        saveState();
      });
    }

    if (elements.dictionarySearch) {
      elements.dictionarySearch.addEventListener("input", function() {
        state.dictionary.search = sanitizeText(elements.dictionarySearch.value, "");
        renderDictionary();
      });
    }

    if (elements.dictionaryFavoritesOnly) {
      elements.dictionaryFavoritesOnly.addEventListener("change", function() {
        state.dictionary.show = normalizeDictionaryShow(elements.dictionaryFavoritesOnly.value);
        renderDictionary();
      });
    }

    if (elements.dictionaryThemeFilters) {
      elements.dictionaryThemeFilters.addEventListener("click", function(event) {
        const button = event.target.closest("[data-dictionary-theme]");
        if (!button) {
          return;
        }
        state.dictionary.theme = normalizeDictionaryTheme(button.dataset.dictionaryTheme);
        renderDictionary();
      });
    }

    if (elements.dictionaryList) {
      elements.dictionaryList.addEventListener("click", function(event) {
        const card = event.target.closest("[data-entry-key]");
        if (!card) {
          return;
        }
        state.dictionary.selectedKey = sanitizeText(card.dataset.entryKey, "").toLowerCase();
        renderDictionary();
      });
    }

    if (elements.dictionaryFavoriteButton) {
      elements.dictionaryFavoriteButton.addEventListener("click", function() {
        const entryKey = sanitizeText(elements.dictionaryFavoriteButton.dataset.entryKey, "").toLowerCase();
        if (!entryKey) {
          return;
        }
        const saved = toggleDictionaryFavorite(entryKey);
        setDictionaryNote(saved ? "Palabra guardada en tus favoritas." : "Palabra removida de favoritas.", saved ? "success" : "error");
        renderDictionary();
      });
    }

    if (elements.dictionarySpeakButton) {
      elements.dictionarySpeakButton.addEventListener("click", function() {
        const term = sanitizeText(elements.dictionarySpeakButton.dataset.term, "");
        const spoken = speakText(term);
        setDictionaryNote(
          spoken ? "Reproduciendo pronunciación de \"" + term + "\"." : "Tu navegador no permite reproducir audio aquí.",
          spoken ? "success" : "error"
        );
      });
    }

    if (elements.dictionaryCopyButton) {
      elements.dictionaryCopyButton.addEventListener("click", async function() {
        const term = sanitizeText(elements.dictionaryCopyButton.dataset.term, "");
        if (!term) {
          return;
        }
        try {
          if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            await navigator.clipboard.writeText(term);
            setDictionaryNote("Copiado: \"" + term + "\".", "success");
            return;
          }
        } catch (_) {
          // noop
        }
        setDictionaryNote("No pudimos copiar automáticamente en este navegador.", "error");
      });
    }

    if (elements.quickGamesGrid) {
      elements.quickGamesGrid.addEventListener("click", function(event) {
        const button = event.target.closest("[data-game-mode]");
        if (!button) {
          return;
        }
        setGameMode(button.dataset.gameMode);
      });
    }

    if (elements.gameOptions) {
      elements.gameOptions.addEventListener("click", function(event) {
        const option = event.target.closest("[data-option-index]");
        if (!option) {
          return;
        }
        handleGameAnswer(option.dataset.optionIndex);
      });
    }

    if (elements.gameNextButton) {
      elements.gameNextButton.addEventListener("click", function() {
        startGameRound(state.game.mode);
      });
    }

    if (elements.gameListenButton) {
      elements.gameListenButton.addEventListener("click", function() {
        const term = sanitizeText(gameSession && gameSession.termToSpeak, "");
        if (!term) {
          setGameStatus("Este reto no tiene audio disponible todavía.", "error");
          return;
        }
        const spoken = speakText(term);
        setGameStatus(
          spoken ? "Reproduciendo audio de apoyo para \"" + term + "\"." : "Tu navegador bloqueó la reproducción de audio.",
          spoken ? "success" : "error"
        );
      });
    }

    if (elements.gameRestartButton) {
      elements.gameRestartButton.addEventListener("click", function() {
        resetGameSession();
      });
    }
  }

  function wireCommunity() {
    ensureCommunityState();

    communityFilterButtons.forEach(function(button) {
      button.addEventListener("click", function() {
        setCommunityFilter(button.dataset.communityFilter);
      });
    });

    communityTemplateButtons.forEach(function(button) {
      button.addEventListener("click", function() {
        applyCommunityTemplate(button.dataset.communityTemplate);
      });
    });

    if (elements.communitySortSelect) {
      elements.communitySortSelect.addEventListener("change", function() {
        setCommunitySort(elements.communitySortSelect.value);
      });
    }

    if (elements.communityPostType) {
      elements.communityPostType.addEventListener("change", function() {
        state.community.composerType = normalizeCommunityPostType(elements.communityPostType.value);
        saveState();
        updateCommunityComposerUI();
      });
    }

    if (elements.communityPostButton) {
      elements.communityPostButton.addEventListener("click", function() {
        publishCommunityPost();
      });
    }

    if (elements.communityPostInput) {
      elements.communityPostInput.addEventListener("input", function() {
        updateCommunityComposerUI();
      });
      elements.communityPostInput.addEventListener("keydown", function(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          publishCommunityPost();
        }
      });
    }

    if (elements.communityFeedList) {
      elements.communityFeedList.addEventListener("click", function(event) {
        const actionButton = event.target.closest("[data-community-action]");
        if (!actionButton) {
          return;
        }
        handleCommunityAction(actionButton.dataset.postId, actionButton.dataset.communityAction);
      });
    }

    if (elements.communityHighlightsList) {
      elements.communityHighlightsList.addEventListener("click", function(event) {
        const button = event.target.closest("[data-community-filter-target]");
        if (!button) {
          return;
        }
        setCommunityFilter(button.dataset.communityFilterTarget);
      });
    }

    if (elements.communityRefreshButton) {
      elements.communityRefreshButton.addEventListener("click", function() {
        renderCommunityFeed();
        setCommunityNote("Comunidad actualizada. Sigue compartiendo tu proceso.", "success");
      });
    }

    if (elements.communityGroupsList) {
      elements.communityGroupsList.addEventListener("click", function(event) {
        const button = event.target.closest("[data-community-group-action]");
        if (!button) {
          return;
        }
        toggleCommunityGroup(button.dataset.communityGroupId);
      });
    }

    if (elements.communityEventsList) {
      elements.communityEventsList.addEventListener("click", function(event) {
        const button = event.target.closest("[data-community-event-action]");
        if (!button) {
          return;
        }
        toggleCommunityEvent(button.dataset.communityEventId);
      });
    }

    renderCommunityFeed();
  }

  function wirePremium() {
    ensurePremiumState();
    updatePremiumPlanUI();

    if (elements.premiumCycleMonthlyButton) {
      elements.premiumCycleMonthlyButton.addEventListener("click", function() {
        state.premium.cycle = "monthly";
        saveState();
        updatePremiumPlanUI();
        setPremiumNote("Plan mensual seleccionado.", "success");
      });
    }

    if (elements.premiumCycleAnnualButton) {
      elements.premiumCycleAnnualButton.addEventListener("click", function() {
        state.premium.cycle = "annual";
        saveState();
        updatePremiumPlanUI();
        setPremiumNote("Plan anual seleccionado.", "success");
      });
    }

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

      let profileStateChanged = false;
      if (sanitizeText(state.profileName, "Visitante") === "Visitante" || !sanitizeText(state.profileName)) {
        state.profileName = fullName;
        profileStateChanged = true;
      }
      if (!sanitizeText(state.phone)) {
        state.phone = normalizeProfilePhone(phone);
        profileStateChanged = true;
      }
      if (profileStateChanged) {
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
        syncProfileFromCloud(false).catch(function() {
          // noop
        });
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
    async function saveProfileSettings() {
      const nextName = sanitizeText(
        elements.profileEditNameInput && elements.profileEditNameInput.value,
        "Visitante"
      );
      const nextGoal = normalizeDailyGoal(elements.profileEditGoalSelect && elements.profileEditGoalSelect.value);
      const nextCity = sanitizeText(elements.profileEditCityInput && elements.profileEditCityInput.value, "");
      const nextPhone = normalizeProfilePhone(elements.profileEditPhoneInput && elements.profileEditPhoneInput.value);

      if (nextName.length < 3) {
        setProfileNote("El nombre debe tener al menos 3 caracteres.", "error");
        return;
      }

      if (nextCity && nextCity.length < 2) {
        setProfileNote("Escribe una ciudad válida o deja el campo vacío.", "error");
        return;
      }

      if (nextPhone) {
        const phoneDigits = nextPhone.replace(/\D/g, "");
        if (phoneDigits.length < 10) {
          setProfileNote("El teléfono debe tener al menos 10 dígitos.", "error");
          return;
        }
      }

      state.profileName = nextName;
      state.dailyGoal = nextGoal;
      state.city = nextCity;
      state.phone = nextPhone;
      state.onboardingDone = true;
      saveState();
      updateTopStats();
      updateProfilePanel();
      updateOnboardingVisibility();
      updateAuthUI();

      const authUser = getAuthUser();
      if (authUser && typeof authUser.updateProfile === "function") {
        try {
          await authUser.updateProfile({ displayName: nextName });
        } catch (_) {
          // noop
        }
      }

      if (authUser && window.authFirebase && typeof window.authFirebase.actualizarDatos === "function") {
        const cloudPayload = { nombre: nextName };
        if (nextCity) {
          cloudPayload.ciudad = nextCity;
        }
        if (nextPhone) {
          cloudPayload.telefono = nextPhone;
        }
        const result = await window.authFirebase.actualizarDatos(cloudPayload);
        if (!result || !result.success) {
          setProfileNote("Cambios locales guardados. No pudimos sincronizar todos los datos en la nube ahora.", "error");
          return;
        }
      }

      setProfileNote("Perfil actualizado correctamente.", "success");
      setAuthNote("Tus datos de perfil se guardaron.", "success");
    }

    async function sendProfileResetPassword() {
      const authUser = getAuthUser();
      const email = sanitizeText(authUser && authUser.email).toLowerCase();
      if (!email) {
        setProfileNote("Esta cuenta no tiene correo para recuperar contraseña.", "error");
        return;
      }

      if (!window.authFirebase || typeof window.authFirebase.resetPassword !== "function") {
        setProfileNote("No encontramos el módulo de recuperación de contraseña.", "error");
        return;
      }

      const result = await window.authFirebase.resetPassword(email);
      if (!result || !result.success) {
        setProfileNote(
          enrichAuthErrorMessage(
            (result && result.error) || "No pudimos enviar el correo de recuperación.",
            result && result.errorCode
          ),
          "error"
        );
        return;
      }

      setProfileNote("Te enviamos un enlace de recuperación a " + email + ".", "success");
    }

    if (elements.profileSaveButton) {
      elements.profileSaveButton.addEventListener("click", function() {
        saveProfileSettings().catch(function() {
          setProfileNote("No pudimos guardar los cambios de perfil ahora.", "error");
        });
      });
    }

    if (elements.profileEditNameInput) {
      elements.profileEditNameInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
          event.preventDefault();
          if (elements.profileSaveButton) {
            elements.profileSaveButton.click();
          }
        }
      });
    }

    if (elements.profileResetPasswordButton) {
      elements.profileResetPasswordButton.addEventListener("click", function() {
        sendProfileResetPassword().catch(function() {
          setProfileNote("No pudimos iniciar recuperación de contraseña.", "error");
        });
      });
    }

    if (elements.profileLogoutButton) {
      elements.profileLogoutButton.addEventListener("click", function() {
        logoutUser();
      });
    }

    if (elements.resetProgressButton) {
      elements.resetProgressButton.addEventListener("click", function() {
        const confirmed = window.confirm("¿Seguro que quieres reiniciar tu progreso local? Esta acción no se puede deshacer.");
        if (!confirmed) {
          return;
        }
        state.xp = 0;
        state.xpToday = 0;
        state.hearts = MAX_HEARTS;
        state.completedLessons = {};
        state.lastLessonId = "";
        saveState();
        renderCourseMap();
        renderLevelProgress();
        renderLearnNavigator();
        updateTopStats();
        updateProfilePanel();
        hydrateLessonUIWithoutSession();
        stopPronunciation();
        setProfileNote("Progreso local reiniciado correctamente.", "success");
      });
    }

    updateProfileEditorUI();
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
    ensureCommunityState();
    ensurePremiumState();
    ensureDictionaryState();
    ensureTranslatorState();
    ensureGameState();
    ensureLearnState();
    syncDailyState();
    wireTabs();
    wireOnboarding();
    wireLevelFilters();
    wireLearningActions();
    wireDictionary();
    wireCommunity();
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
    renderLearnNavigator();
    renderDictionary();
    renderTranslator();
    startGameRound(state.game && state.game.mode ? state.game.mode : "hidden-word");
    renderGamePanel();
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
    syncProfileFromCloud(false).catch(function() {
      // noop
    });
    hideSplashScreen();
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
