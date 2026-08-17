/* Roofing Construction & Estimating — Certification E-Course app
   Routes: #/home, #/chapter/<id>, #/chapter/<id>/lesson/<n>,
           #/test/<id>, #/practice, #/final, #/stats, #/badges, #/certificate
   All progress in localStorage under "rce2":
   { name, attempts: [{ts, kind, chapter, score, correct, total, cats:{"ch|cat":{c,t}}}],
     badges: {id: ts}, read: {"ch|idx": true} } */

(function () {
  "use strict";

  var C = window.COURSE;
  var KEY = "rce2";

  /* ---------------- storage ---------------- */

  function plainObject(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }
  function load() {
    var fallback = { attempts: [], badges: {}, read: {}, name: "", firstName: "", lastName: "", playerId: "", syncCode: "" };
    try {
      var d = JSON.parse(localStorage.getItem(KEY));
      if (!plainObject(d)) return fallback;
      d.attempts = Array.isArray(d.attempts)
        ? d.attempts.filter(function (a) {
            return plainObject(a) && typeof a.score === "number" && typeof a.total === "number" &&
              typeof a.kind === "string" && plainObject(a.cats || {});
          })
        : [];
      if (!plainObject(d.badges)) d.badges = {};
      if (!plainObject(d.read)) d.read = {};
      if (typeof d.name !== "string") d.name = "";
      if (typeof d.firstName !== "string") d.firstName = "";
      if (typeof d.lastName !== "string") d.lastName = "";
      if (typeof d.playerId !== "string") d.playerId = "";
      if (typeof d.syncCode !== "string") d.syncCode = "";
      return d;
    } catch (e) { return fallback; }
  }
  var skipNextCloud = false;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(DB)); }
    catch (e) { /* storage full/blocked: keep running in-memory */ }
    if (skipNextCloud) { skipNextCloud = false; return; }
    cloudSaveSoon();
  }
  var DB = load();

  /* ---------------- helpers ---------------- */

  var R = {
    int: function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
    pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  };
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtDate(ts) {
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  function chapterById(id) {
    for (var i = 0; i < C.chapters.length; i++) if (C.chapters[i].id === id) return C.chapters[i];
    return null;
  }
  function chapterIndex(id) {
    for (var i = 0; i < C.chapters.length; i++) if (C.chapters[i].id === id) return i;
    return -1;
  }
  function chapterMinutes(ch) {
    return ch.lessons.reduce(function (s, l) { return s + l.min; }, 0);
  }

  /* ---------------- scoring & mastery ---------------- */

  function chapterAttempts(id) {
    return DB.attempts.filter(function (a) { return a.kind === "chapter" && a.chapter === id; });
  }
  function chapterAvg(id) {
    var at = chapterAttempts(id);
    if (!at.length) return null;
    return Math.round(at.reduce(function (s, a) { return s + a.score; }, 0) / at.length);
  }
  function chapterBest(id) {
    var at = chapterAttempts(id);
    return at.length ? Math.max.apply(null, at.map(function (a) { return a.score; })) : null;
  }
  function chapterPassed(id) {
    return chapterAttempts(id).some(function (a) { return a.score >= C.passScore; });
  }
  function finalPassed() {
    return DB.attempts.some(function (a) { return a.kind === "final" && a.score >= C.finalPassScore; });
  }
  function attemptPassed(a) {
    return a.score >= (a.kind === "final" ? C.finalPassScore : C.passScore);
  }

  /* Aggregate per-category mastery for a chapter across ALL attempts
     (chapter tests, practice tests, final exams all contribute). */
  function catMastery(chId) {
    var ch = chapterById(chId);
    return ch.cats.map(function (cat) {
      var key = chId + "|" + cat, c = 0, t = 0;
      DB.attempts.forEach(function (a) {
        if (a.cats && a.cats[key]) { c += a.cats[key].c; t += a.cats[key].t; }
      });
      return { cat: cat, pct: t ? Math.round(c / t * 100) : null, seen: t };
    }).sort(function (x, y) {
      if (x.pct === null && y.pct === null) return 0;
      if (x.pct === null) return 1;
      if (y.pct === null) return -1;
      return y.pct - x.pct;
    });
  }
  function masteryLevel(pct) {
    if (pct === null) return { label: "Not tested yet", icon: "—", cls: "m-none" };
    for (var i = 0; i < C.masteryLevels.length; i++) {
      if (pct >= C.masteryLevels[i].min) return C.masteryLevels[i];
    }
    return C.masteryLevels[C.masteryLevels.length - 1];
  }

  function overallPct() {
    var done = C.chapters.filter(function (ch) { return chapterPassed(ch.id); }).length;
    if (finalPassed()) done++;
    return Math.round(done / (C.chapters.length + 1) * 100);
  }

  /* ---------------- badges ---------------- */

  function computeEarned() {
    var earned = {};
    var A = DB.attempts;
    if (A.length >= 1) earned["first-nail"] = true;
    if (A.some(function (a) { return a.score === 100; })) earned["perfect-square"] = true;
    if (A.length >= 10) earned["iron-roofer"] = true;
    if (A.some(function (a) { return a.kind === "practice" && a.score >= C.passScore; })) earned["practice-pro"] = true;
    if (finalPassed()) earned["certified"] = true;
    if (A.some(function (a) { return a.kind === "chapter" && a.chapter === "estimating" && a.score >= 90; })) earned["master-estimator"] = true;
    if (C.chapters.every(function (ch) { return chapterPassed(ch.id); })) earned["chapter-boss"] = true;
    // hot streak: 3 consecutive passes anywhere in history
    var run = 0;
    A.forEach(function (a) {
      run = attemptPassed(a) ? run + 1 : 0;
      if (run >= 3) earned["hot-streak"] = true;
    });
    // comeback: pass a chapter test after failing that same chapter earlier
    var failed = {};
    A.forEach(function (a) {
      if (a.kind !== "chapter") return;
      if (a.score < C.passScore) failed[a.chapter] = true;
      else if (failed[a.chapter]) earned["comeback-kid"] = true;
    });
    // dialed in: any chapter with 2+ attempts averaging 90+
    C.chapters.forEach(function (ch) {
      var at = chapterAttempts(ch.id);
      if (at.length >= 2 && chapterAvg(ch.id) >= 90) earned["dialed-in"] = true;
    });
    return earned;
  }

  function awardNewBadges() {
    var earned = computeEarned();
    var fresh = [];
    C.badges.forEach(function (b) {
      if (earned[b.id] && !DB.badges[b.id]) {
        DB.badges[b.id] = Date.now();
        fresh.push(b);
      }
    });
    if (fresh.length) save();
    fresh.forEach(function (b, i) {
      setTimeout(function () { toast(b.icon + " Badge earned: <strong>" + esc(b.name) + "</strong> — " + esc(b.desc)); }, i * 900);
    });
  }

  /* ---------------- cloud progress sync ---------------- */

  /* Unique ID: first 3 letters of the first name + random digits, always
     6 characters total (shorter names get extra digits). Legacy 8-char
     codes from earlier versions stay valid and are never regenerated. */
  function makeUniqueId() {
    var letters = (DB.firstName || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
    var id = letters;
    while (id.length < 6) id += Math.floor(Math.random() * 10);
    return id;
  }
  function ensureSyncCode() {
    if (DB.syncCode) return DB.syncCode;
    DB.syncCode = makeUniqueId();
    return DB.syncCode;
  }
  /* Allocate a Unique ID, re-rolling the digits if the backend already has
     a backup under that ID (prevents two same-named players colliding).
     Backend unreachable or unconfigured -> accept the candidate. */
  function allocateUniqueId(done) {
    if (DB.syncCode) { done(DB.syncCode); return; }
    if (!C.leaderboardUrl || typeof fetch !== "function") { done(ensureSyncCode()); return; }
    var tries = 0;
    function attempt() {
      var candidate = makeUniqueId();
      tries++;
      var sep = C.leaderboardUrl.indexOf("?") === -1 ? "?" : "&";
      fetch(C.leaderboardUrl + sep + "code=" + encodeURIComponent(candidate) + "&t=" + Date.now())
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j && j.ok && tries < 6) { attempt(); return; } // taken — re-roll digits
          DB.syncCode = candidate; save(); done(candidate);
        })
        .catch(function () { DB.syncCode = candidate; save(); done(candidate); });
    }
    attempt();
  }
  function prettyCode(c) {
    if (!c) return "";
    return c.length === 8 ? c.slice(0, 4) + "-" + c.slice(4) : c;
  }

  /* ---------------- Unique ID modal ---------------- */

  function showIdModal(id) {
    var old = document.getElementById("id-modal");
    if (old) old.remove();
    var overlay = el("div", "modal-overlay");
    overlay.id = "id-modal";
    overlay.innerHTML =
      '<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="id-modal-title">' +
      '<h2 id="id-modal-title">🪪 Your Unique ID</h2>' +
      '<p class="modal-id">' + esc(prettyCode(id)) + "</p>" +
      "<p>This ID is how your scores are tracked and how you get your progress back on any device. " +
      "<strong>Write it down or screenshot this</strong> — you can always find it later in My Stats.</p>" +
      '<div class="modal-actions">' +
      '<button class="btn" id="id-copy" type="button">Copy ID</button>' +
      '<button class="btn primary" id="id-close" type="button">Got it</button>' +
      "</div></div>";
    document.body.appendChild(overlay);
    overlay.querySelector("#id-copy").onclick = function () {
      var btn = this;
      function okMark() { btn.textContent = "Copied ✓"; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(id).then(okMark).catch(okMark);
      } else { okMark(); }
    };
    overlay.querySelector("#id-close").onclick = function () { overlay.remove(); };
    overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector("#id-close").focus();
  }

  /* ---------------- add-to-home-screen prompt ---------------- */

  function isStandalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true;
  }
  function installDismissed() {
    try {
      var ts = Number(localStorage.getItem("rce-a2hs-dismissed") || 0);
      return ts && (Date.now() - ts) < 30 * 24 * 3600 * 1000;
    } catch (e) { return false; }
  }
  function browserInstallInfo() {
    var ua = navigator.userAgent;
    var iOS = /iPhone|iPad|iPod/.test(ua) || (/(Macintosh)/.test(ua) && navigator.maxTouchPoints > 1);
    if (iOS && /CriOS/.test(ua)) return { name: "Chrome", steps: "Tap the <strong>Share</strong> icon (□ with ↑, top right) → scroll down → <strong>Add to Home Screen</strong> → Add." };
    if (iOS) return { name: "Safari", steps: "Tap the <strong>Share</strong> button (□ with ↑) → scroll down → <strong>Add to Home Screen</strong> → Add." };
    if (/Android/.test(ua) && /Chrome/.test(ua) && !/EdgA|OPR|SamsungBrowser/.test(ua)) return { name: "Chrome", steps: "Tap the <strong>⋮ menu</strong> (top right) → <strong>Add to Home screen</strong> (or <strong>Install app</strong>) → Install." };
    if (/Chrome/.test(ua) && !/Edg|OPR/.test(ua)) return { name: "Chrome", steps: "Click the <strong>install icon</strong> at the right end of the address bar (or ⋮ menu → Cast, save and share → Install page as app)." };
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) return { name: "Safari", steps: "In the menu bar choose <strong>File → Add to Dock</strong>." };
    return { name: "your browser", steps: "Open your browser menu and choose <strong>Add to Home screen</strong> or <strong>Install app</strong>." };
  }
  function installBanner() {
    if (isStandalone() || installDismissed()) return null;
    var info = browserInstallInfo();
    var box = el("div", "install-banner");
    var canNative = !!window.__deferredInstall;
    box.innerHTML =
      "<strong>📲 Put this course on your home screen</strong> — it opens like an app, works offline when remote, and keeps your place." +
      '<div class="install-steps">' +
      (canNative ? '<button class="btn primary" id="a2hs-go" type="button">Install now</button>'
                 : "<span>In " + info.name + ": " + info.steps + "</span>") +
      '<button class="install-dismiss" id="a2hs-later" type="button" aria-label="Dismiss">Maybe later</button>' +
      "</div>";
    var go = box.querySelector("#a2hs-go");
    if (go) go.onclick = function () {
      var p = window.__deferredInstall;
      window.__deferredInstall = null;
      if (p) { p.prompt(); }
      box.remove();
    };
    box.querySelector("#a2hs-later").onclick = function () {
      try { localStorage.setItem("rce-a2hs-dismissed", String(Date.now())); } catch (e) {}
      box.remove();
    };
    return box;
  }

  /* Backend capability check: v2 backends answer ?ping=1 with {progress:true};
     v1 backends answer with the scores array. Cached per session so an old
     deployment never receives progress posts it doesn't understand. */
  var backendCaps = null;
  function checkBackend(cb) {
    if (!C.leaderboardUrl) { cb(false); return; }
    if (backendCaps !== null) { cb(backendCaps); return; }
    var sep = C.leaderboardUrl.indexOf("?") === -1 ? "?" : "&";
    fetch(C.leaderboardUrl + sep + "ping=1")
      .then(function (r) { return r.json(); })
      .then(function (j) { backendCaps = !!(j && !Array.isArray(j) && j.progress); cb(backendCaps); })
      .catch(function () { cb(false); /* transient: leave caps unknown for retry */ });
  }

  var cloudTimer = null;
  function cloudSaveSoon() {
    if (!C.leaderboardUrl || !DB.playerId || typeof fetch !== "function") return;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(cloudSaveNow, 2500);
  }
  function cloudSaveNow() {
    checkBackend(function (ok) {
      if (!ok) return;
      try {
        fetch(C.leaderboardUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            type: "progress",
            code: ensureSyncCode(),
            name: (DB.firstName + " " + DB.lastName).trim(),
            data: JSON.stringify(DB)
          })
        }).catch(function () { /* offline — next save retries */ });
      } catch (e) { /* never let backup break the app */ }
    });
  }

  function restoreFromCode(rawCode, statusEl) {
    var code = String(rawCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length < 6) { statusEl.textContent = "Enter the full Unique ID (like DOM492)."; return; }
    statusEl.textContent = "Looking up your backup…";
    var sep = C.leaderboardUrl.indexOf("?") === -1 ? "?" : "&";
    fetch(C.leaderboardUrl + sep + "code=" + encodeURIComponent(code) + "&t=" + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok || !j.data) { statusEl.textContent = "No backup found for that Unique ID — double-check it."; return; }
        var parsed;
        try { parsed = JSON.parse(j.data); } catch (e) { parsed = null; }
        if (!parsed || typeof parsed !== "object") { statusEl.textContent = "That backup looks damaged — take a new test to refresh it, then retry."; return; }
        var who = j.name || "this player";
        var when = j.when ? new Date(j.when).toLocaleDateString() : "recently";
        if (!confirm("Restore " + who + "'s progress (backed up " + when + ")? This replaces everything currently on THIS device.")) {
          statusEl.textContent = "";
          return;
        }
        try { localStorage.setItem(KEY, j.data); } catch (e) {}
        location.reload();
      })
      .catch(function () { statusEl.textContent = "Couldn't reach the backup service — check your connection and try again."; });
  }

  /* ---------------- leaderboard backend ---------------- */

  function saveName(first, last) {
    DB.firstName = first.trim().slice(0, 40);
    DB.lastName = last.trim().slice(0, 40);
    if (!DB.playerId) DB.playerId = "p" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    var full = (DB.firstName + " " + DB.lastName).trim();
    if (full) DB.name = full; // prefills the certificate
    save();
  }

  /* Fire-and-forget score submission to the Google Apps Script endpoint.
     text/plain avoids a CORS preflight; failures never disturb the app. */
  function submitScore(attempt) {
    if (!C.leaderboardUrl || !DB.firstName || typeof fetch !== "function") return;
    try {
      fetch(C.leaderboardUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          playerId: DB.playerId, first: DB.firstName, last: DB.lastName,
          kind: attempt.kind, chapter: attempt.chapter || "",
          score: attempt.score, correct: attempt.correct, total: attempt.total, ts: attempt.ts
        })
      }).catch(function () { /* offline or endpoint down — local history still has it */ });
    } catch (e) { /* never let telemetry break the app */ }
  }

  function nameBanner() {
    if (DB.firstName) return null;
    var box = el("div", "name-banner",
      "<strong>👷 Who's training?</strong> Enter your name so your scores show up on the team leaderboard." +
      '<span class="name-fields">' +
      '<input id="nb-first" maxlength="40" placeholder="First name" autocomplete="given-name">' +
      '<input id="nb-last" maxlength="40" placeholder="Last name" autocomplete="family-name">' +
      '<button class="btn primary" id="nb-save" type="button">Save</button></span>' +
      (C.leaderboardUrl ?
        '<div class="restore-row">Already started on another device? ' +
        '<input id="nb-code" maxlength="12" placeholder="Unique ID (DOM492)" autocapitalize="characters">' +
        '<button class="btn" id="nb-restore" type="button">Restore my progress</button>' +
        '<span class="restore-status" id="nb-status"></span></div>' : ""));
    box.querySelector("#nb-save").onclick = function () {
      var f = box.querySelector("#nb-first").value.trim();
      var l = box.querySelector("#nb-last").value.trim();
      if (!f) { box.querySelector("#nb-first").focus(); return; }
      var isNew = !DB.syncCode;
      saveName(f, l);
      toast("👋 Welcome, <strong>" + esc(DB.firstName) + "</strong> — your scores now count on the leaderboard, and your progress backs up automatically.");
      if (isNew) {
        allocateUniqueId(function (id) { showIdModal(id); });
      }
      route();
    };
    var rBtn = box.querySelector("#nb-restore");
    if (rBtn) rBtn.onclick = function () {
      restoreFromCode(box.querySelector("#nb-code").value, box.querySelector("#nb-status"));
    };
    return box;
  }

  function feedbackHref() {
    var body = "What I was doing:\n\n\nWhat happened / my suggestion:\n\n\n---\nPage: " + (location.hash || "#/home") +
      "\nDevice: " + navigator.userAgent;
    return "mailto:" + C.feedbackEmail +
      "?subject=" + encodeURIComponent("Roofing Course feedback") +
      "&body=" + encodeURIComponent(body);
  }

  function toast(html) {
    var zone = document.getElementById("toasts");
    var t = el("div", "toast", html);
    zone.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("show"); });
    setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () { t.remove(); }, 400);
    }, 5200);
  }

  /* ---------------- test building ---------------- */

  function materialize(entry, ch) {
    var q;
    if (entry.gen) {
      q = entry.gen(R);
      q.cat = entry.cat;
    } else {
      q = { q: entry.q, a: entry.a.slice(), correct: entry.correct, cat: entry.cat };
    }
    q.chapter = ch.id;
    // shuffle answers, track new correct index
    var order = shuffle(q.a.map(function (_, i) { return i; }));
    q.a = order.map(function (i) { return q.a[i]; });
    q.correct = order.indexOf(q.correct);
    return q;
  }

  function buildChapterTest(ch) {
    var qs = shuffle(ch.bank).slice(0, 8).map(function (e) { return materialize(e, ch); });
    ch.gens.forEach(function (g) { qs.push(materialize(g, ch)); });
    return shuffle(qs);
  }

  /* Practice test: exactly 2 questions from every chapter (~half the time
     one of the pair is a fresh-numbers generated problem). */
  function buildPractice() {
    var pool = [];
    C.chapters.forEach(function (ch) {
      var picks = shuffle(ch.bank).slice(0, 2);
      if (ch.gens.length && Math.random() < 0.5) picks[0] = R.pick(ch.gens);
      picks.forEach(function (e) { pool.push(materialize(e, ch)); });
    });
    return shuffle(pool);
  }

  /* Certification exam: exactly 4 questions from every chapter —
     3 from the bank plus 1 generated problem with fresh numbers. */
  function buildFinal() {
    var pool = [];
    C.chapters.forEach(function (ch) {
      var statics = shuffle(ch.bank).slice(0, ch.gens.length ? 3 : 4);
      statics.forEach(function (e) { pool.push(materialize(e, ch)); });
      if (ch.gens.length) pool.push(materialize(R.pick(ch.gens), ch));
    });
    return shuffle(pool);
  }

  /* ---------------- quiz rendering & grading ---------------- */

  /* ---------------- paginated test engine ----------------
     One question per screen, Back on the left / Next on the right.
     Every answer auto-saves to localStorage (separate from progress,
     never synced to the cloud), so an interrupted test resumes exactly
     where it left off — same questions, same answers, same position. */

  var QUIZ_KEY = "rce-quiz";
  function quizStore() {
    try { var s = JSON.parse(localStorage.getItem(QUIZ_KEY)); return plainObject(s) ? s : {}; }
    catch (e) { return {}; }
  }
  function saveQuizStore(s) {
    try { localStorage.setItem(QUIZ_KEY, JSON.stringify(s)); } catch (e) {}
  }

  function testView(opts) {
    // opts: {kind: 'chapter'|'practice'|'final', chapter?, kicker, title, subtitle, pass, rebuild()}
    var storeId = opts.kind === "chapter" ? "chapter|" + opts.chapter : opts.kind;
    var wrap = el("div", "view");
    wrap.appendChild(el("header", "lesson-head",
      '<p class="kicker">' + esc(opts.kicker) + "</p><h1>" + esc(opts.title) + "</h1>" +
      '<p class="lede">' + opts.subtitle + "</p>"));

    var banner = nameBanner();
    if (banner) wrap.appendChild(banner);

    var all = quizStore();
    var saved = all[storeId];
    var state, resumed = false;
    if (saved && Array.isArray(saved.questions) && saved.questions.length && plainObject(saved.answers)) {
      state = saved;
      resumed = true;
      if (typeof state.pos !== "number" || state.pos < 0 || state.pos >= state.questions.length) state.pos = 0;
    } else {
      state = { questions: opts.rebuild(), answers: {}, pos: 0, ts: Date.now() };
    }
    window.__lastTest = state.questions; // QA hook

    function persist() { var s = quizStore(); s[storeId] = state; saveQuizStore(s); }
    function clearSaved() { var s = quizStore(); delete s[storeId]; saveQuizStore(s); }
    if (!resumed) persist();

    var box = el("section", "quiz");
    var report = el("div", "");
    wrap.appendChild(box);
    wrap.appendChild(report);

    function answeredCount() { return Object.keys(state.answers).length; }
    function srcLabel(q) {
      if (opts.kind === "chapter") return "";
      var ch = chapterById(q.chapter);
      return ch ? ' <span class="q-src">' + esc(ch.title) + "</span>" : "";
    }

    function renderQuestion(note) {
      var q = state.questions[state.pos];
      var n = state.questions.length;
      box.innerHTML = "";

      var head = el("div", "quiz-head");
      head.innerHTML =
        '<div class="quiz-progress-row"><h2>Question ' + (state.pos + 1) + " of " + n + "</h2>" +
        '<button type="button" class="quiz-restart" id="q-restart">↻ New questions</button></div>' +
        '<div class="track"><div class="track-fill" style="width:' + Math.round(answeredCount() / n * 100) + '%"></div></div>' +
        '<p class="quiz-autosave">' + answeredCount() + " of " + n + " answered · saves automatically</p>" +
        (note ? '<p class="quiz-result warn">' + note + "</p>" : "");
      box.appendChild(head);
      head.querySelector("#q-restart").onclick = function () {
        if (!confirm("Start over with a fresh set of questions? Your saved answers on this test will be discarded.")) return;
        clearSaved();
        state = { questions: opts.rebuild(), answers: {}, pos: 0, ts: Date.now() };
        window.__lastTest = state.questions;
        persist();
        renderQuestion();
      };

      var f = el("fieldset", "q");
      f.appendChild(el("legend", "", esc(q.q) + srcLabel(q)));
      q.a.forEach(function (optTxt, oi) {
        var lab = el("label", "opt");
        lab.innerHTML = '<input type="radio" name="q" value="' + oi + '"' +
          (state.answers[state.pos] === oi ? " checked" : "") + '> <span>' + esc(optTxt) + "</span>";
        lab.querySelector("input").addEventListener("change", function () {
          state.answers[state.pos] = oi;
          persist(); // auto-save on every answer
          var fill = head.querySelector(".track-fill");
          if (fill) fill.style.width = Math.round(answeredCount() / n * 100) + "%";
          var as = head.querySelector(".quiz-autosave");
          if (as) as.textContent = answeredCount() + " of " + n + " answered · saved ✓";
        });
        f.appendChild(lab);
      });
      box.appendChild(f);

      var nav = el("div", "quiz-nav");
      var back = el("button", "btn quiz-back", "← Back");
      back.type = "button";
      back.disabled = state.pos === 0;
      back.onclick = function () {
        if (state.pos > 0) { state.pos--; persist(); renderQuestion(); }
      };
      var isLast = state.pos === n - 1;
      var next = el("button", "btn primary quiz-next", isLast ? "Submit test ✓" : "Next →");
      next.type = "button";
      next.onclick = function () {
        if (!isLast) { state.pos++; persist(); renderQuestion(); return; }
        var missing = [];
        for (var i = 0; i < n; i++) if (typeof state.answers[i] !== "number") missing.push(i);
        if (missing.length) {
          state.pos = missing[0];
          persist();
          renderQuestion(missing.length + " question" + (missing.length > 1 ? "s" : "") + " still unanswered — here's the first one.");
          return;
        }
        grade();
      };
      nav.appendChild(back);
      nav.appendChild(next);
      box.appendChild(nav);
      window.scrollTo(0, 0);
    }

    function grade() {
      var qns = state.questions;
      var right = 0, cats = {};
      qns.forEach(function (item, qi) {
        var ok = state.answers[qi] === item.correct;
        if (ok) right++;
        var key = item.chapter + "|" + item.cat;
        cats[key] = cats[key] || { c: 0, t: 0 };
        cats[key].t++;
        if (ok) cats[key].c++;
      });
      var score = Math.round(right / qns.length * 100);
      var passed = score >= opts.pass;
      var attempt = {
        ts: Date.now(), kind: opts.kind, chapter: opts.chapter || null,
        score: score, correct: right, total: qns.length, cats: cats
      };
      DB.attempts.push(attempt);
      save();
      submitScore(attempt);
      clearSaved();

      box.innerHTML = "";
      box.appendChild(el("div", "quiz-head",
        "<h2>Results</h2>" +
        '<p class="quiz-result ' + (passed ? "pass" : "fail") + '">' +
        (passed ? "✅ " : "❌ ") + score + "% — " + right + "/" + qns.length + " correct. " +
        (passed ? "Passed!" : "You need " + opts.pass + "%. Review below and retake — the numbers will be new.") + "</p>"));
      qns.forEach(function (item, qi) {
        var ok = state.answers[qi] === item.correct;
        var f = el("fieldset", "q " + (ok ? "correct" : "wrong"));
        f.appendChild(el("legend", "", (qi + 1) + ". " + esc(item.q) + srcLabel(item)));
        item.a.forEach(function (optTxt, oi) {
          var lab = el("label", "opt" + (oi === item.correct ? " is-answer" : ""));
          lab.innerHTML = '<input type="radio" disabled' + (state.answers[qi] === oi ? " checked" : "") + '> <span>' + esc(optTxt) + "</span>";
          f.appendChild(lab);
        });
        box.appendChild(f);
      });

      report.innerHTML = "";
      report.appendChild(attemptReport(cats, opts));
      var again = el("button", "btn", "↻ Retake with fresh questions & new numbers");
      again.onclick = function () {
        state = { questions: opts.rebuild(), answers: {}, pos: 0, ts: Date.now() };
        window.__lastTest = state.questions;
        persist();
        report.innerHTML = "";
        renderQuestion();
      };
      var actions = el("div", "pager");
      actions.appendChild(again);
      if (opts.kind === "chapter") actions.appendChild(linkBtn("#/chapter/" + opts.chapter, "Back to chapter", ""));
      else actions.appendChild(linkBtn("#/stats", "See my stats →", ""));
      report.appendChild(actions);

      awardNewBadges();
      renderSidebar();
      window.scrollTo(0, 0);
    }

    renderQuestion(resumed && answeredCount() > 0
      ? "▶ Picked up where you left off — " + answeredCount() + " answer" + (answeredCount() > 1 ? "s" : "") + " already saved."
      : null);
    return wrap;
  }

  /* Per-chapter / per-category breakdown of one attempt + running averages */
  function attemptReport(cats, opts) {
    var sec = el("section", "report");
    sec.appendChild(el("h2", "", "How this test breaks down"));
    var byChapter = {};
    Object.keys(cats).forEach(function (key) {
      var chId = key.split("|")[0];
      byChapter[chId] = byChapter[chId] || [];
      byChapter[chId].push({ key: key, cat: key.split("|")[1], c: cats[key].c, t: cats[key].t });
    });
    Object.keys(byChapter).forEach(function (chId) {
      var ch = chapterById(chId);
      if (!ch) return;
      var block = el("div", "report-ch");
      var avg = chapterAvg(chId);
      block.appendChild(el("h3", "",
        esc(ch.title) +
        (avg !== null ? ' <span class="badge">Chapter average: ' + avg + "%</span>" : "")));
      byChapter[chId].forEach(function (r) {
        var pct = Math.round(r.c / r.t * 100);
        var lv = masteryLevel(pct);
        block.appendChild(el("div", "cat-row",
          '<span class="cat-name">' + esc(r.cat) + "</span>" +
          '<span class="cat-score">' + r.c + "/" + r.t + "</span>" +
          '<span class="m-tag ' + lv.cls + '">' + lv.icon + " " + esc(lv.label) + "</span>"));
      });
      sec.appendChild(block);
    });
    return sec;
  }

  /* ---------------- sidebar & shell ---------------- */

  var app = document.getElementById("app");

  function navLink(href, label, done) {
    var a = el("a", done ? "done" : "");
    a.href = href;
    a.innerHTML = '<span class="check">' + (done ? "✓" : "") + "</span>" + esc(label);
    return a;
  }
  function linkBtn(href, label, extra) {
    var a = el("a", "btn " + extra, esc(label));
    a.href = href;
    return a;
  }

  function renderSidebar() {
    var side = document.getElementById("sidebar");
    side.innerHTML = "";
    var pct = overallPct();
    side.appendChild(el("div", "side-progress",
      '<div class="side-progress-label"><span>Certification progress</span><strong>' + pct + "%</strong></div>" +
      '<div class="track"><div class="track-fill" style="width:' + pct + '%"></div></div>'));

    var nav = el("nav", "side-nav");
    nav.appendChild(navLink("#/home", "Course Home", null));
    C.chapters.forEach(function (ch, i) {
      nav.appendChild(navLink("#/chapter/" + ch.id, (i + 1) + ". " + ch.title, chapterPassed(ch.id)));
    });
    nav.appendChild(el("div", "side-sep"));
    nav.appendChild(navLink("#/practice", "🎯 Practice Test (" + C.practiceSize + " Q)", null));
    nav.appendChild(navLink("#/final", "🏆 Certification Exam", finalPassed()));
    nav.appendChild(navLink("#/leaderboard", "🏁 Leaderboard", null));
    nav.appendChild(navLink("#/stats", "📊 My Stats", null));
    var bCount = Object.keys(DB.badges).length;
    nav.appendChild(navLink("#/badges", "🎖️ Badges (" + bCount + "/" + C.badges.length + ")", null));
    if (finalPassed()) nav.appendChild(navLink("#/certificate", "📜 My Certificate", null));
    nav.appendChild(el("div", "side-sep"));
    nav.appendChild(navLink("#/gear", "🧰 Tools & Equipment", null));
    var bookA = el("a", "");
    bookA.href = C.bookUrl;
    bookA.target = "_blank";
    bookA.rel = "noopener";
    bookA.innerHTML = '<span class="check"></span>📖 Open the Book';
    nav.appendChild(bookA);
    var fb = el("a", "feedback-link");
    fb.href = feedbackHref();
    fb.innerHTML = '<span class="check"></span>💬 Send feedback';
    nav.appendChild(fb);
    side.appendChild(nav);

    document.querySelectorAll(".sidebar a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === (location.hash || "#/home"));
    });
  }

  /* ---------------- views ---------------- */

  function viewHome() {
    var wrap = el("div", "view");
    var passedCount = C.chapters.filter(function (ch) { return chapterPassed(ch.id); }).length;
    var totalMin = C.chapters.reduce(function (s, ch) { return s + chapterMinutes(ch); }, 0);
    var a2hs = installBanner();
    if (a2hs) wrap.appendChild(a2hs);
    var banner = nameBanner();
    if (banner) wrap.appendChild(banner);

    wrap.appendChild(el("section", "hero",
      '<p class="kicker">Certification e-course</p>' +
      "<h1>" + esc(C.title) + "</h1>" +
      '<p class="lede">' + C.chapters.length + " chapters · " + Math.round(totalMin / 60 * 10) / 10 +
      " hours of lessons · graded tests with fresh numbers every attempt · skill rankings, badges, and a certification exam. Based on the book by Daniel Atcheson.</p>" +
      '<div class="hero-actions">' +
      '<a class="btn primary" href="' + nextTarget() + '">' + (DB.attempts.length ? "Continue training" : "Start Chapter 1") + "</a>" +
      '<a class="btn" href="#/practice">Take a practice test</a>' +
      '<a class="btn ghost" href="' + esc(C.bookUrl) + '" target="_blank" rel="noopener">📖 The book</a>' +
      "</div>"));

    var stats = el("section", "stat-strip");
    [["Tests taken", DB.attempts.length],
     ["Chapters passed", passedCount + "/" + C.chapters.length],
     ["Badges", Object.keys(DB.badges).length + "/" + C.badges.length],
     ["Certified", finalPassed() ? "YES 🏆" : "Not yet"]].forEach(function (s) {
      stats.appendChild(el("div", "stat", "<strong>" + s[1] + "</strong><span>" + s[0] + "</span>"));
    });
    wrap.appendChild(stats);

    var grid = el("section", "module-grid");
    C.chapters.forEach(function (ch, i) {
      var avg = chapterAvg(ch.id);
      var badge = avg === null ? '<span class="badge">Not tested</span>' :
        '<span class="badge ' + (chapterPassed(ch.id) ? "pass" : "retry") + '">Chapter score: ' + avg + "%</span>";
      var card = el("a", "card");
      card.href = "#/chapter/" + ch.id;
      card.innerHTML =
        '<span class="card-num">' + String(i + 1).padStart(2, "0") + "</span>" +
        "<h3>" + esc(ch.title) + "</h3>" +
        "<p>" + esc(ch.tagline) + "</p>" +
        '<div class="card-meta">' + badge + "<span>~" + chapterMinutes(ch) + " min</span></div>";
      grid.appendChild(card);
    });

    var exam = el("a", "card exam-card");
    exam.href = "#/final";
    exam.innerHTML = '<span class="card-num">★</span><h3>Certification Exam</h3>' +
      "<p>" + C.finalSize + " questions across every chapter. Pass at " + C.finalPassScore + "% to earn your certificate.</p>" +
      '<div class="card-meta">' + (finalPassed() ? '<span class="badge pass">PASSED</span>' :
        '<span class="badge">' + passedCount + "/" + C.chapters.length + " chapters ready</span>") + "</div>";
    grid.appendChild(exam);
    wrap.appendChild(grid);
    return wrap;
  }

  function nextTarget() {
    for (var i = 0; i < C.chapters.length; i++) {
      if (!chapterPassed(C.chapters[i].id)) return "#/chapter/" + C.chapters[i].id;
    }
    return "#/final";
  }

  function viewChapter(id) {
    var ch = chapterById(id);
    if (!ch) return viewHome();
    var idx = chapterIndex(id);
    var wrap = el("div", "view");

    wrap.appendChild(el("header", "lesson-head",
      '<p class="kicker">Chapter ' + (idx + 1) + " of " + C.chapters.length + " · ~" + chapterMinutes(ch) + " min total</p>" +
      "<h1>" + esc(ch.title) + "</h1>" +
      '<p class="lede">' + esc(ch.tagline) + "</p>"));

    // score panel
    var avg = chapterAvg(id), at = chapterAttempts(id);
    var panel = el("section", "score-panel");
    panel.appendChild(el("div", "stat",
      "<strong>" + (avg === null ? "—" : avg + "%") + "</strong><span>Chapter score<br>(avg of " + at.length + " test" + (at.length === 1 ? "" : "s") + ")</span>"));
    panel.appendChild(el("div", "stat",
      "<strong>" + (chapterBest(id) === null ? "—" : chapterBest(id) + "%") + "</strong><span>Best test</span>"));
    panel.appendChild(el("div", "stat",
      "<strong>" + (at.length ? at[at.length - 1].score + "%" : "—") + "</strong><span>Last test</span>"));
    var cta = el("div", "stat stat-cta");
    cta.appendChild(linkBtn("#/test/" + id, at.length ? "Retake chapter test" : "Take chapter test", "primary"));
    panel.appendChild(cta);
    wrap.appendChild(panel);

    // reading assignment
    var rb = readingBox(id);
    if (rb) wrap.appendChild(rb);

    // lessons
    var lsec = el("section", "");
    lsec.appendChild(el("h2", "section-title", "Lessons"));
    ch.lessons.forEach(function (l, li) {
      var read = DB.read[id + "|" + li];
      var a = el("a", "lesson-row" + (read ? " read" : ""));
      a.href = "#/chapter/" + id + "/lesson/" + li;
      a.innerHTML = '<span class="check">' + (read ? "✓" : (li + 1)) + "</span>" +
        "<span class='lesson-t'>" + esc(l.t) + "</span><span class='lesson-min'>~" + l.min + " min</span>";
      lsec.appendChild(a);
    });
    wrap.appendChild(lsec);

    // skill rankings
    var mast = catMastery(id);
    var msec = el("section", "");
    msec.appendChild(el("h2", "section-title", "Skill rank — strongest first"));
    var mbox = el("div", "mastery-box");
    mast.forEach(function (m, mi) {
      var lv = masteryLevel(m.pct);
      mbox.appendChild(el("div", "cat-row",
        '<span class="cat-rank">#' + (mi + 1) + "</span>" +
        '<span class="cat-name">' + esc(m.cat) + "</span>" +
        '<span class="cat-bar"><span class="cat-bar-fill ' + lv.cls + '" style="width:' + (m.pct || 0) + '%"></span></span>' +
        '<span class="cat-score">' + (m.pct === null ? "—" : m.pct + "%") + "</span>" +
        '<span class="m-tag ' + lv.cls + '">' + lv.icon + " " + esc(lv.label) + "</span>"));
    });
    msec.appendChild(mbox);
    if (mast.every(function (m) { return m.pct === null; })) {
      msec.appendChild(el("p", "muted", "Take the chapter test to unlock your skill rankings."));
    }
    wrap.appendChild(msec);

    // test history
    if (at.length) {
      var hsec = el("section", "");
      hsec.appendChild(el("h2", "section-title", "Test history — every attempt counts toward your chapter score"));
      var table = el("table", "history");
      table.innerHTML = "<tr><th>Date</th><th>Score</th><th>Result</th></tr>" +
        at.slice().reverse().map(function (a) {
          return "<tr><td>" + fmtDate(a.ts) + "</td><td>" + a.score + "% (" + a.correct + "/" + a.total + ")</td><td>" +
            (a.score >= C.passScore ? '<span class="badge pass">Pass</span>' : '<span class="badge retry">Retake</span>') + "</td></tr>";
        }).join("");
      hsec.appendChild(el("div", "table-scroll")).appendChild(table);
      wrap.appendChild(hsec);
    }

    wrap.appendChild(el("aside", "book-note",
      '📖 <strong>Go deeper:</strong> read the matching chapters in <a href="' + esc(C.bookUrl) +
      '" target="_blank" rel="noopener"><em>Roofing Construction &amp; Estimating</em></a> for complete tables, illustrations and worked examples.'));

    var pager = el("div", "pager");
    pager.appendChild(idx > 0 ? linkBtn("#/chapter/" + C.chapters[idx - 1].id, "← " + C.chapters[idx - 1].title, "")
                              : linkBtn("#/home", "← Course Home", ""));
    pager.appendChild(idx < C.chapters.length - 1
      ? linkBtn("#/chapter/" + C.chapters[idx + 1].id, C.chapters[idx + 1].title + " →", "primary")
      : linkBtn("#/final", "Certification Exam →", "primary"));
    wrap.appendChild(pager);
    return wrap;
  }

  function readingBox(chId) {
    var r = window.COURSE_READING && window.COURSE_READING[chId];
    if (!r) return null;
    return el("aside", "book-note reading-note",
      '📖 <strong>Step 1 — Read the book first:</strong> ' + esc(r.ref) +
      '. <a href="' + esc(C.bookUrl) + '" target="_blank" rel="noopener">Open the book</a>, read the assigned pages in the author\'s own words, then come back here for the lesson recap and test.');
  }

  function recapBlock(chId, li) {
    var r = window.COURSE_RECAPS && window.COURSE_RECAPS[chId + "|" + li];
    if (!r) return null;
    function ul(items, icon) {
      return "<ul>" + items.map(function (x) { return "<li>" + icon + " " + esc(x) + "</li>"; }).join("") + "</ul>";
    }
    return el("section", "recap",
      "<h2>📌 Lesson recap</h2>" +
      '<div class="recap-grid">' +
      '<div class="recap-cell"><h3>Summary</h3><p>' + esc(r.sum) + "</p></div>" +
      '<div class="recap-cell"><h3>Key points</h3>' + ul(r.points, "▸") + "</div>" +
      '<div class="recap-cell"><h3>Things to remember</h3>' + ul(r.remember, "🧠") + "</div>" +
      '<div class="recap-cell"><h3>Tips &amp; tricks</h3>' + ul(r.tips, "💡") + "</div>" +
      "</div>");
  }

  function viewLesson(chId, li) {
    var ch = chapterById(chId);
    if (!ch || !ch.lessons[li]) return viewHome();
    var l = ch.lessons[li];
    DB.read[chId + "|" + li] = true;
    save();

    var wrap = el("div", "view");
    wrap.appendChild(el("header", "lesson-head",
      '<p class="kicker">' + esc(ch.title) + " · Lesson " + (li + 1) + " of " + ch.lessons.length + " · ~" + l.min + " min read</p>" +
      "<h1>" + esc(l.t) + "</h1>"));
    var rb = readingBox(chId);
    if (rb) wrap.appendChild(rb);
    wrap.appendChild(el("section", "lesson-section lesson-body", l.html));
    var rc = recapBlock(chId, li);
    if (rc) wrap.appendChild(rc);

    var pager = el("div", "pager");
    pager.appendChild(li > 0
      ? linkBtn("#/chapter/" + chId + "/lesson/" + (li - 1), "← " + ch.lessons[li - 1].t, "")
      : linkBtn("#/chapter/" + chId, "← Chapter overview", ""));
    pager.appendChild(li < ch.lessons.length - 1
      ? linkBtn("#/chapter/" + chId + "/lesson/" + (li + 1), ch.lessons[li + 1].t + " →", "primary")
      : linkBtn("#/test/" + chId, "Take the chapter test →", "primary"));
    wrap.appendChild(pager);
    return wrap;
  }

  function viewChapterTest(id) {
    var ch = chapterById(id);
    if (!ch) return viewHome();
    return testView({
      kind: "chapter", chapter: id, pass: C.passScore,
      kicker: "Chapter test · pass at " + C.passScore + "%",
      title: ch.title + " — Test",
      subtitle: "~10 questions. Every attempt is saved and averaged into your chapter score, and math problems get <strong>new numbers each time</strong>.",
      rebuild: function () { return buildChapterTest(ch); }
    });
  }

  function viewPractice() {
    return testView({
      kind: "practice", pass: C.passScore,
      kicker: "Practice test · " + C.practiceSize + " questions",
      title: "Practice Test",
      subtitle: C.practiceSize + " questions — two from every chapter, with different questions and fresh numbers every time. Results feed your per-chapter skill rankings.",
      rebuild: buildPractice
    });
  }

  function viewFinal() {
    var ready = C.chapters.filter(function (ch) { return chapterPassed(ch.id); }).length;
    var sub = C.finalSize + " questions across all " + C.chapters.length + " chapters. Pass at <strong>" + C.finalPassScore +
      "%</strong> to earn your certificate." +
      (ready < C.chapters.length ? " <em>(You've passed " + ready + "/" + C.chapters.length +
        " chapter tests — finishing them first is strongly recommended.)</em>" : "");
    var v = testView({
      kind: "final", pass: C.finalPassScore,
      kicker: "Certification exam · pass at " + C.finalPassScore + "%",
      title: "Certification Exam",
      subtitle: sub,
      rebuild: buildFinal
    });
    if (finalPassed()) {
      var note = el("aside", "book-note");
      note.innerHTML = "🏆 You're already certified — <a href='#/certificate'>view your certificate</a>. Retakes can only raise your record.";
      v.insertBefore(note, v.children[1]);
    }
    return v;
  }

  function viewStats() {
    var wrap = el("div", "view");
    wrap.appendChild(el("header", "lesson-head",
      '<p class="kicker">Your record</p><h1>My Stats</h1>' +
      '<p class="lede">Every test you take is saved. Chapter scores are the average of every test you\'ve ever taken for that chapter.</p>'));

    var who = el("section", "who-box");
    who.innerHTML = "<strong>Training as:</strong> " +
      (DB.firstName ? esc((DB.firstName + " " + DB.lastName).trim()) : "<em>no name set — scores aren't reaching the leaderboard</em>") +
      ' <span class="name-fields"><input id="st-first" maxlength="40" placeholder="First name" value="' + esc(DB.firstName) + '">' +
      '<input id="st-last" maxlength="40" placeholder="Last name" value="' + esc(DB.lastName) + '">' +
      '<button class="btn" id="st-save" type="button">Update name</button></span>';
    who.querySelector("#st-save").onclick = function () {
      var f = who.querySelector("#st-first").value.trim();
      if (!f) { who.querySelector("#st-first").focus(); return; }
      saveName(f, who.querySelector("#st-last").value);
      toast("✏️ Name updated: <strong>" + esc((DB.firstName + " " + DB.lastName).trim()) + "</strong>");
      route();
    };
    wrap.appendChild(who);

    if (C.leaderboardUrl && DB.playerId) {
      ensureSyncCode();
      save();
      var sync = el("section", "who-box sync-box");
      sync.innerHTML = "<strong>🪪 Your Unique ID:</strong> " +
        '<span class="sync-code">' + esc(prettyCode(DB.syncCode)) + "</span> " +
        '<button class="btn" id="st-show-id" type="button">Show full screen</button>' +
        "<br><span class='muted'>Your progress backs up automatically after every action. To pick up on another device, open the course there and enter this ID.</span>" +
        '<div class="restore-row">Restore a backup onto THIS device: ' +
        '<input id="st-code" maxlength="12" placeholder="Unique ID" autocapitalize="characters">' +
        '<button class="btn" id="st-restore" type="button">Restore</button>' +
        '<span class="restore-status" id="st-status"></span></div>';
      sync.querySelector("#st-show-id").onclick = function () { showIdModal(DB.syncCode); };
      sync.querySelector("#st-restore").onclick = function () {
        restoreFromCode(sync.querySelector("#st-code").value, sync.querySelector("#st-status"));
      };
      wrap.appendChild(sync);
    }

    var overallAvg = DB.attempts.length
      ? Math.round(DB.attempts.reduce(function (s, a) { return s + a.score; }, 0) / DB.attempts.length) : null;
    var strip = el("section", "stat-strip");
    [["Tests taken", DB.attempts.length],
     ["All-time average", overallAvg === null ? "—" : overallAvg + "%"],
     ["Badges", Object.keys(DB.badges).length + "/" + C.badges.length],
     ["Certified", finalPassed() ? "YES 🏆" : "Not yet"]].forEach(function (s) {
      strip.appendChild(el("div", "stat", "<strong>" + s[1] + "</strong><span>" + s[0] + "</span>"));
    });
    wrap.appendChild(strip);

    // per-chapter table
    var csec = el("section", "");
    csec.appendChild(el("h2", "section-title", "Chapter scorecard"));
    var table = el("table", "history");
    table.innerHTML = "<tr><th>Chapter</th><th>Chapter score</th><th>Tests</th><th>Best</th><th>Strongest skill</th><th>Needs reps</th></tr>" +
      C.chapters.map(function (ch, i) {
        var avg = chapterAvg(ch.id);
        var m = catMastery(ch.id).filter(function (x) { return x.pct !== null; });
        var hi = m.length ? m[0].cat : "—";
        var lo = m.length > 1 ? m[m.length - 1].cat : "—";
        return "<tr><td><a href='#/chapter/" + ch.id + "'>" + (i + 1) + ". " + esc(ch.title) + "</a></td>" +
          "<td>" + (avg === null ? "—" : "<strong>" + avg + "%</strong>") + "</td>" +
          "<td>" + chapterAttempts(ch.id).length + "</td>" +
          "<td>" + (chapterBest(ch.id) === null ? "—" : chapterBest(ch.id) + "%") + "</td>" +
          "<td>" + esc(hi) + "</td><td>" + esc(lo) + "</td></tr>";
      }).join("");
    csec.appendChild(el("div", "table-scroll")).appendChild(table);
    wrap.appendChild(csec);

    // full history
    if (DB.attempts.length) {
      var hsec = el("section", "");
      hsec.appendChild(el("h2", "section-title", "Full test history"));
      var ht = el("table", "history");
      ht.innerHTML = "<tr><th>Date</th><th>Test</th><th>Score</th><th>Result</th></tr>" +
        DB.attempts.slice().reverse().map(function (a) {
          var ch = a.kind === "chapter" ? chapterById(a.chapter) : null;
          var name = a.kind === "chapter" ? (ch ? ch.title : "Retired chapter") + " test"
            : a.kind === "practice" ? "Practice test" : "Certification exam";
          return "<tr><td>" + fmtDate(a.ts) + "</td><td>" + esc(name) + "</td><td>" + a.score +
            "% (" + a.correct + "/" + a.total + ")</td><td>" +
            (attemptPassed(a) ? '<span class="badge pass">Pass</span>' : '<span class="badge retry">Retake</span>') + "</td></tr>";
        }).join("");
      hsec.appendChild(el("div", "table-scroll")).appendChild(ht);
      wrap.appendChild(hsec);
    }

    var danger = el("section", "danger-zone");
    var reset = el("button", "btn danger", "Reset ALL progress, history and badges");
    reset.onclick = function () {
      if (confirm("This clears every test score, badge and lesson-read mark on THIS device. Your last cloud backup stays untouched until your next test, so it can still be restored with your Unique ID. Continue?")) {
        DB = { attempts: [], badges: {}, read: {}, name: DB.name, firstName: DB.firstName, lastName: DB.lastName, playerId: DB.playerId, syncCode: DB.syncCode };
        skipNextCloud = true; // keep the cloud copy as a recovery point
        try { localStorage.removeItem(QUIZ_KEY); } catch (e) {}
        save();
        route();
      }
    };
    danger.appendChild(reset);
    wrap.appendChild(danger);
    return wrap;
  }

  function viewLeaderboard() {
    var wrap = el("div", "view");
    wrap.appendChild(el("header", "lesson-head",
      '<p class="kicker">Team standings</p><h1>Leaderboard</h1>' +
      '<p class="lede">Every graded test submits automatically (once you\'ve entered your name). Rankings: certified first, then chapters passed, then average score.</p>'));

    var banner = nameBanner();
    if (banner) wrap.appendChild(banner);

    if (!C.leaderboardUrl) {
      wrap.appendChild(el("aside", "book-note warn",
        "🛠️ <strong>Leaderboard backend not connected yet.</strong> The course owner needs to complete the one-time Google Sheets setup in " +
        "<code>LEADERBOARD-SETUP.md</code> (3 minutes), then paste the Web App URL into <code>assets/course-data.js</code>. " +
        "Until then, scores are saved on each device only."));
      return wrap;
    }

    var status = el("p", "muted", "Loading team scores…");
    wrap.appendChild(status);
    var holder = el("div", "");
    wrap.appendChild(holder);

    fetch(C.leaderboardUrl + (C.leaderboardUrl.indexOf("?") === -1 ? "?" : "&") + "t=" + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        status.remove();
        if (!Array.isArray(rows) || !rows.length) {
          holder.appendChild(el("p", "muted", "No scores submitted yet — be the first: take any chapter test."));
          return;
        }
        // aggregate per player
        var players = {};
        rows.forEach(function (r) {
          if (!r || typeof r.score !== "number" && isNaN(Number(r.score))) return;
          var key = r.playerId || ((r.first || "") + "|" + (r.last || ""));
          var p = players[key] = players[key] || { first: r.first || "?", last: r.last || "", tests: 0, sum: 0, chapters: {}, certified: false };
          var score = Number(r.score) || 0;
          p.tests++; p.sum += score;
          if (r.kind === "chapter" && r.chapter) p.chapters[r.chapter] = Math.max(p.chapters[r.chapter] || 0, score);
          if (r.kind === "final" && score >= C.finalPassScore) p.certified = true;
        });
        var list = Object.keys(players).map(function (k) {
          var p = players[k];
          p.passed = Object.keys(p.chapters).filter(function (ch) { return p.chapters[ch] >= C.passScore; }).length;
          p.avg = Math.round(p.sum / p.tests);
          return p;
        }).sort(function (a, b) {
          if (a.certified !== b.certified) return a.certified ? -1 : 1;
          if (a.passed !== b.passed) return b.passed - a.passed;
          return b.avg - a.avg;
        });
        var medals = ["🥇", "🥈", "🥉"];
        var table = el("table", "history");
        table.innerHTML = "<tr><th>Rank</th><th>Name</th><th>Tests</th><th>Avg</th><th>Chapters passed</th><th>Certified</th></tr>" +
          list.map(function (p, i) {
            return "<tr" + (p.first === DB.firstName && p.last === DB.lastName ? ' class="me-row"' : "") + "><td>" + (medals[i] || "#" + (i + 1)) + "</td>" +
              "<td>" + esc((p.first + " " + p.last).trim()) + "</td>" +
              "<td>" + p.tests + "</td><td>" + p.avg + "%</td>" +
              "<td>" + p.passed + "/" + C.chapters.length + "</td>" +
              "<td>" + (p.certified ? "🏆" : "—") + "</td></tr>";
          }).join("");
        holder.appendChild(el("div", "table-scroll")).appendChild(table);
        var refresh = el("button", "btn", "↻ Refresh standings");
        refresh.onclick = function () { route(); };
        var actions = el("div", "pager");
        actions.appendChild(refresh);
        holder.appendChild(actions);
      })
      .catch(function () {
        status.textContent = "Couldn't reach the leaderboard right now — check your connection and refresh. Your scores are still saved and will show up once submitted attempts land.";
        status.className = "muted";
      });
    return wrap;
  }

  function viewGear() {
    var wrap = el("div", "view");
    wrap.appendChild(el("header", "lesson-head",
      '<p class="kicker">Get equipped</p><h1>Tools &amp; Equipment</h1>' +
      '<p class="lede">Everything you physically need — for this course and for the work itself. Print it, screenshot it, or hand it to a new hire on day one.</p>'));
    var grid = el("section", "gear-grid");
    (C.gear || []).forEach(function (g) {
      var card = el("div", "gear-card");
      card.innerHTML = "<h2>" + g.icon + " " + esc(g.cat) + "</h2><ul>" +
        g.items.map(function (it) {
          return "<li><strong>" + esc(it.name) + "</strong>" +
            (it.note ? '<span class="gear-note">' + esc(it.note) + "</span>" : "") + "</li>";
        }).join("") + "</ul>";
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    wrap.appendChild(el("aside", "book-note",
      "🦺 <strong>Safety first, always:</strong> fall protection isn't optional gear — it's the difference between a career and a headline. If a roof feels beyond your setup, it is."));
    return wrap;
  }

  function viewBadges() {
    var wrap = el("div", "view");
    wrap.appendChild(el("header", "lesson-head",
      '<p class="kicker">Trophy shelf</p><h1>Badges</h1>' +
      '<p class="lede">Earn them all. Badges are awarded automatically the moment you qualify.</p>'));
    var grid = el("section", "badge-grid");
    C.badges.forEach(function (b) {
      var ts = DB.badges[b.id];
      grid.appendChild(el("div", "badge-card" + (ts ? " earned" : " locked"),
        '<span class="badge-icon">' + b.icon + "</span><h3>" + esc(b.name) + "</h3><p>" + esc(b.desc) + "</p>" +
        (ts ? '<span class="badge pass">Earned ' + fmtDate(ts) + "</span>" : '<span class="badge">Locked</span>')));
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function viewCertificate() {
    var wrap = el("div", "view");
    if (!finalPassed()) {
      wrap.appendChild(el("header", "lesson-head",
        "<h1>Certificate</h1><p class='lede'>Pass the certification exam at " + C.finalPassScore + "% to unlock your certificate.</p>"));
      wrap.appendChild(linkBtn("#/final", "Go to the Certification Exam →", "primary"));
      return wrap;
    }
    var finals = DB.attempts.filter(function (a) { return a.kind === "final"; });
    var best = Math.max.apply(null, finals.map(function (a) { return a.score; }));
    var earnedTs = finals.filter(function (a) { return a.score >= C.finalPassScore; })[0].ts;

    var bar = el("div", "cert-controls no-print");
    var input = el("input", "cert-name-input");
    input.placeholder = "Type your full name for the certificate";
    input.value = DB.name;
    input.oninput = function () {
      DB.name = input.value;
      save();
      document.getElementById("cert-name").textContent = DB.name || "Your Name Here";
    };
    var print = el("button", "btn primary", "🖨️ Print / Save as PDF");
    print.onclick = function () { window.print(); };
    bar.appendChild(input);
    bar.appendChild(print);
    wrap.appendChild(bar);

    wrap.appendChild(el("section", "certificate-doc",
      '<div class="cert-border">' +
      '<p class="cert-brand">ROOFING CONSTRUCTION &amp; ESTIMATING</p>' +
      '<p class="cert-sub">Certification E-Course · companion to the book by Daniel Atcheson</p>' +
      '<h2>Certificate of Completion</h2>' +
      '<p class="cert-awarded">This certifies that</p>' +
      '<p class="cert-name" id="cert-name">' + esc(DB.name || "Your Name Here") + "</p>" +
      '<p class="cert-awarded">has completed all ' + C.chapters.length + ' chapters of study and passed the certification examination<br>with a best score of <strong>' + best + "%</strong></p>" +
      '<div class="cert-foot"><span>Earned ' + fmtDate(earnedTs) + "</span><span>🏆</span><span>Pass standard: " + C.finalPassScore + "%</span></div>" +
      "</div>"));
    return wrap;
  }

  /* ---------------- router ---------------- */

  function route() {
    var hash = location.hash || "#/home";
    var view, title = "Course Home";
    var m, ch;
    if ((m = hash.match(/^#\/chapter\/([\w-]+)\/lesson\/(\d+)$/))) {
      view = viewLesson(m[1], Number(m[2]));
      ch = chapterById(m[1]);
      title = ch && ch.lessons[Number(m[2])] ? ch.lessons[Number(m[2])].t : title;
    } else if ((m = hash.match(/^#\/chapter\/([\w-]+)$/))) {
      view = viewChapter(m[1]);
      ch = chapterById(m[1]);
      title = ch ? ch.title : title;
    } else if ((m = hash.match(/^#\/test\/([\w-]+)$/))) {
      view = viewChapterTest(m[1]);
      ch = chapterById(m[1]);
      title = ch ? ch.title + " — Test" : title;
    }
    else if (hash === "#/practice") { view = viewPractice(); title = "Practice Test"; }
    else if (hash === "#/leaderboard") { view = viewLeaderboard(); title = "Leaderboard"; }
    else if (hash === "#/gear") { view = viewGear(); title = "Tools & Equipment"; }
    else if (hash === "#/final") { view = viewFinal(); title = "Certification Exam"; }
    else if (hash === "#/stats") { view = viewStats(); title = "My Stats"; }
    else if (hash === "#/badges") { view = viewBadges(); title = "Badges"; }
    else if (hash === "#/certificate") { view = viewCertificate(); title = "Certificate"; }
    else view = viewHome();

    document.title = title + " · Roofing Construction & Estimating E-Course";
    app.innerHTML = "";
    app.appendChild(view);
    renderSidebar();
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", route);
  document.getElementById("year").textContent = new Date().getFullYear();
  awardNewBadges();
  route();
})();
