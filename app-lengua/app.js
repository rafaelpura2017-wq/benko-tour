(function() {
  "use strict";

  const STORAGE_KEY = "palenque-lengua-v1";
  const PREMIUM_MEMBERSHIP_COLLECTION = "membresias_lengua";
  const PREMIUM_REQUEST_COLLECTION = "solicitudes_membresia_lengua";
  const MAX_HEARTS = 5;
  const PASS_THRESHOLD = 0.67;
  const XP_PER_CORRECT = 4;

  const data = window.BENKO_LENGUA_APP_DATA || { units: [] };
  const dictionaryPayload = window.benkoPalenqueraDictionary || {};
  const dictionaryEntries = Array.isArray(dictionaryPayload.entries) ? dictionaryPayload.entries : [];

  const appConfig = window.BENKO_CONFIG || {};
  const paymentConfig = appConfig.payments || {};
  const premiumConfig = Object.assign(
    {
      productId: "lengua-premium",
      productName: "Membresía premium lengua palenquera",
      priceCop: 189000
    },
    (appConfig.languageApp && appConfig.languageApp.premium) || {}
  );

  const elements = {
    onboardingCard: document.getElementById("onboarding-card"),
    profileNameInput: document.getElementById("profile-name"),
    dailyGoalSelect: document.getElementById("daily-goal"),
    startLearningButton: document.getElementById("start-learning-btn"),
    skipOnboardingButton: document.getElementById("skip-onboarding-btn"),
    installButton: document.getElementById("install-app-btn"),

    xpValue: document.getElementById("xp-value"),
    streakValue: document.getElementById("streak-value"),
    heartsValue: document.getElementById("hearts-value"),
    dailyStatusNote: document.getElementById("daily-status-note"),
    goalProgressCopy: document.getElementById("goal-progress-copy"),
    goalProgressBar: document.getElementById("goal-progress-bar"),

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
    resetProgressButton: document.getElementById("reset-progress-btn")
  };

  const views = Array.from(document.querySelectorAll("[data-view]"));
  const tabs = Array.from(document.querySelectorAll("[data-tab]"));
  const quickViewButtons = Array.from(document.querySelectorAll("[data-go-view]"));
  const ALLOWED_VIEWS = ["home", "learn", "dictionary", "premium", "profile"];

  let deferredInstallPrompt = null;
  let lessonSession = null;

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

  function sanitizeText(value, fallback) {
    const normalized = String(value || "").trim();
    return normalized || (fallback || "");
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

  function setActiveView(viewName, syncHash) {
    const nextView = resolveView(viewName);
    state.activeView = nextView;

    views.forEach(function(view) {
      view.classList.toggle("is-active", view.dataset.view === nextView);
    });

    tabs.forEach(function(tab) {
      tab.classList.toggle("is-active", tab.dataset.tab === nextView);
    });

    if (syncHash !== false) {
      const nextHash = "#" + nextView;
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, "", nextHash);
      }
    }

    saveState();
  }

  function getCompletedCount() {
    return Object.values(state.completedLessons).filter(Boolean).length;
  }

  function getTotalLessonsCount() {
    return data.units.reduce(function(total, unit) {
      return total + unit.lessons.length;
    }, 0);
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
  }

  function updateProfilePanel() {
    elements.profileNameKpi.textContent = sanitizeText(state.profileName, "Visitante");
    elements.profileGoalKpi.textContent = Number(state.dailyGoal || 10) + " XP";
    elements.profileCompletedKpi.textContent = String(getCompletedCount()) + " / " + String(getTotalLessonsCount());
    elements.profilePremiumKpi.textContent = state.premium.active ? "Activa" : "Pendiente";
  }

  function updatePremiumUI() {
    if (state.premium.active) {
      elements.premiumStateTitle.textContent = "Estado: premium activo";
      elements.premiumStateCopy.textContent = "Tu acceso premium está verificado y habilitado en esta cuenta.";
      setPremiumNote("Membresía activa. Ya puedes usar rutas avanzadas y próximos módulos de certificación.", "success");
    } else {
      elements.premiumStateTitle.textContent = "Estado: " + (state.premium.status || "pendiente");
      elements.premiumStateCopy.textContent = getAuthUser()
        ? "Si ya pagaste, reporta la referencia y pulsa Verificar acceso."
        : "Inicia sesión para vincular premium a tu cuenta.";
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

  function flattenLessons() {
    return data.units.flatMap(function(unit) {
      return unit.lessons.map(function(lesson) {
        return Object.assign({}, lesson, {
          unitId: unit.id,
          unitName: unit.name
        });
      });
    });
  }

  function findLessonById(lessonId) {
    return flattenLessons().find(function(lesson) { return lesson.id === lessonId; }) || null;
  }

  function getFirstIncompleteLesson() {
    return flattenLessons().find(function(lesson) {
      return !state.completedLessons[lesson.id];
    }) || flattenLessons()[0] || null;
  }

  function renderCourseMap() {
    const host = elements.courseMap;
    if (!host) {
      return;
    }

    const fragment = document.createDocumentFragment();

    data.units.forEach(function(unit) {
      const unitCard = document.createElement("article");
      unitCard.className = "pv-unit";

      const doneCount = unit.lessons.filter(function(lesson) {
        return Boolean(state.completedLessons[lesson.id]);
      }).length;
      const ratio = unit.lessons.length ? doneCount / unit.lessons.length : 0;

      const header = document.createElement("div");
      header.className = "pv-unit-head";
      header.innerHTML =
        "<div><h3>" + unit.name + "</h3><p>" + unit.description + "</p></div>" +
        "<div class=\"pv-progress\"><div class=\"pv-progress-bar\"><span style=\"width:" + Math.round(ratio * 100) + "%\"></span></div><span>" + doneCount + "/" + unit.lessons.length + "</span></div>";

      unitCard.appendChild(header);

      const list = document.createElement("div");
      list.className = "pv-lesson-list";

      unit.lessons.forEach(function(lesson) {
        const lessonRow = document.createElement("div");
        const done = Boolean(state.completedLessons[lesson.id]);
        lessonRow.className = "pv-lesson" + (done ? " is-done" : "");
        lessonRow.innerHTML =
          "<div><strong>" + lesson.title + "</strong><span>" + lesson.level + " · +" + lesson.xp + " XP</span></div>";

        const actions = document.createElement("div");
        actions.className = "pv-actions";

        const startButton = document.createElement("button");
        startButton.type = "button";
        startButton.className = done ? "pv-btn-ghost" : "pv-btn";
        startButton.textContent = done ? "Repetir" : "Empezar";
        startButton.addEventListener("click", function() {
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

    host.replaceChildren(fragment);
  }

  function renderDictionary() {
    const search = sanitizeText(elements.dictionarySearch.value).toLowerCase();
    const source = dictionaryEntries.length ? dictionaryEntries : [];
    const filtered = source.filter(function(entry) {
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
    if (state.onboardingDone) {
      elements.onboardingCard.style.display = "none";
      return;
    }

    elements.onboardingCard.style.display = "grid";
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
    elements.lessonSubtitle.textContent = lesson.unitName + " · " + lesson.level + " · +" + lesson.xp + " XP al completar";
    elements.lessonProgressChip.textContent = (index + 1) + "/" + total;
    elements.questionPrompt.textContent = question.prompt;

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

    if (!state.premium.active && lesson.unitId === "u4") {
      setPremiumNote("La unidad 4 se desbloquea con premium activo.", "error");
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
    updateProfilePanel();
    updateTopStats();

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

  async function postJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const contentType = response.headers.get("content-type") || "";
    const responseData = contentType.includes("application/json")
      ? await response.json()
      : { message: await response.text() };

    if (!response.ok) {
      throw new Error(responseData.message || "No pudimos procesar el pago.");
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
    setPremiumNote(
      "Wompi abierto. Solicitud " + requestId + " registrada. Al pagar, pulsa Verificar acceso.",
      "success"
    );
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
    setPremiumNote(
      "Mercado Pago abierto. Solicitud " + requestId + " registrada. Al pagar, pulsa Verificar acceso.",
      "success"
    );
  }

  function wireTabs() {
    tabs.forEach(function(tab) {
      tab.addEventListener("click", function() {
        setActiveView(tab.dataset.tab);
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
      setActiveView("home");
    });

    elements.skipOnboardingButton.addEventListener("click", function() {
      state.onboardingDone = true;
      saveState();
      updateOnboardingVisibility();
      setActiveView("home");
    });
  }

  function wireLearningActions() {
    elements.continueLastButton.addEventListener("click", function() {
      const lesson = findLessonById(state.lastLessonId) || getFirstIncompleteLesson();
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

  function wireProfile() {
    elements.resetProgressButton.addEventListener("click", function() {
      state.xp = 0;
      state.xpToday = 0;
      state.hearts = MAX_HEARTS;
      state.completedLessons = {};
      state.lastLessonId = "";
      saveState();
      renderCourseMap();
      updateTopStats();
      updateProfilePanel();
      hydrateLessonUIWithoutSession();
    });
  }

  function wireInstallPrompt() {
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

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("./sw.js").catch(function() {
      // noop
    });
  }

  function bootstrap() {
    syncDailyState();
    wireTabs();
    wireOnboarding();
    wireLearningActions();
    wireDictionary();
    wirePremium();
    wireProfile();
    wireInstallPrompt();
    registerServiceWorker();

    updateOnboardingVisibility();
    updateTopStats();
    updateProfilePanel();
    updatePremiumUI();
    renderCourseMap();
    renderDictionary();
    hydrateLessonUIWithoutSession();

    const hashView = resolveView((window.location.hash || "").replace("#", ""));
    const initialView = hashView !== "home" || window.location.hash === "#home"
      ? hashView
      : resolveView(state.activeView || "home");

    setActiveView(initialView, true);
    saveState();
    syncPremiumFromCloud(false);
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
