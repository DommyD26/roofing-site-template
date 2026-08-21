/* Commercial Roofing Exam engine — standalone module.
   Mirrors the main course's interaction patterns (one question per screen,
   Back/Next, auto-save every action, results review, weak-spot drilling)
   but shares NO code, styles, or storage with it. All storage keys are
   namespaced crx- so course progress (rce2 etc.) is never touched. */
(function () {
  "use strict";
  var D = window.CRX_DATA;
  var app = document.getElementById("app");
  var DB_KEY = "crx-db";
  var QUIZ_KEY = "crx-quiz";

  function plainObject(o) { return !!o && typeof o === "object" && !Array.isArray(o); }
  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(DB_KEY));
      if (!plainObject(d)) return { attempts: [], qstats: {} };
      if (!Array.isArray(d.attempts)) d.attempts = [];
      if (!plainObject(d.qstats)) d.qstats = {};
      return d;
    } catch (e) { return { attempts: [], qstats: {} }; }
  }
  var DB = load();
  function save() { try { localStorage.setItem(DB_KEY, JSON.stringify(DB)); } catch (e) {} }
  function quizStore() {
    try { var s = JSON.parse(localStorage.getItem(QUIZ_KEY)); return plainObject(s) ? s : {}; }
    catch (e) { return {}; }
  }
  function saveQuizStore(s) { try { localStorage.setItem(QUIZ_KEY, JSON.stringify(s)); } catch (e) {} }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function fmtDate(ts) { var d = new Date(ts); return isNaN(d) ? "—" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" }); }

  function qByN(n) { return D.questions[n - 1]; }
  function missRate(n) {
    var s = DB.qstats[n];
    if (!s || (s.got + s.miss) === 0) return -1; // never attempted
    return s.miss / (s.got + s.miss);
  }
  function answerHtml(q) {
    return '<div class="answer"><h3>📖 Model answer</h3>' +
      q.a.map(function (line) { return "<p>" + esc(line) + "</p>"; }).join("") + "</div>";
  }

  /* ---------------- modes ---------------- */

  var MODES = {
    full: { label: "Full Exam", desc: "All 73 questions in random order.", build: function () { return shuffle(D.questions.map(function (q) { return q.n; })); } },
    r25: { label: "Random 25", desc: "A 25-question randomized study session.", build: function () { return shuffle(D.questions.map(function (q) { return q.n; })).slice(0, 25); } },
    r10: { label: "Quick 10", desc: "A short 10-question randomized set.", build: function () { return shuffle(D.questions.map(function (q) { return q.n; })).slice(0, 10); } },
    weak: {
      label: "Weak-Spot Drill", desc: "Up to 15 questions you miss most (plus never-tried ones).",
      build: function () {
        var ranked = D.questions.map(function (q) { return q.n; }).sort(function (a, b) {
          var ra = missRate(a), rb = missRate(b);
          // never-attempted (-1) sorts after real misses but before mastered
          var ka = ra < 0 ? 0.5 : ra, kb = rb < 0 ? 0.5 : rb;
          return kb - ka;
        });
        return shuffle(ranked.slice(0, 15));
      }
    },
    mc: { label: "Quick Quiz (multiple choice)", desc: D.mc.length + " short-answer facts, multiple choice.", build: function () { return shuffle(D.mc.map(function (m) { return m.n; })); } }
  };

  /* ---------------- self-graded test view ---------------- */

  function studyTest(modeKey) {
    var wrap = el("div", "");
    var all = quizStore();
    var saved = all[modeKey];
    var state;
    if (saved && Array.isArray(saved.order) && saved.order.length && plainObject(saved.items)) {
      state = saved;
      if (typeof state.pos !== "number" || state.pos < 0 || state.pos >= state.order.length) state.pos = 0;
    } else {
      state = { order: MODES[modeKey].build(), items: {}, pos: 0, ts: Date.now() };
    }
    function persist() { var s = quizStore(); s[modeKey] = state; saveQuizStore(s); }
    function clearSaved() { var s = quizStore(); delete s[modeKey]; saveQuizStore(s); }
    persist();

    var box = el("section", "card");
    wrap.appendChild(el("p", "kicker", esc(MODES[modeKey].label) + " · self-graded"));
    wrap.appendChild(box);

    function gradedCount() {
      return state.order.filter(function (n) { var it = state.items[n]; return it && typeof it.grade === "number"; }).length;
    }

    function render() {
      var n = state.order[state.pos];
      var q = qByN(n);
      var item = state.items[n] = state.items[n] || {};
      var total = state.order.length;
      box.innerHTML = "";

      var head = el("div", "");
      head.innerHTML = '<div class="qhead"><h2>Question ' + (state.pos + 1) + " of " + total + '</h2>' +
        '<button type="button" class="btn" id="quit">Save & exit</button></div>' +
        '<div class="track"><div class="track-fill" style="width:' + Math.round(gradedCount() / total * 100) + '%"></div></div>' +
        '<p class="autosave">' + gradedCount() + " of " + total + " graded · saves automatically</p>";
      box.appendChild(head);
      head.querySelector("#quit").onclick = function () { location.hash = "#/"; };

      box.appendChild(el("p", "qtext", esc(q.q)));

      var ta = el("textarea", "scratch");
      ta.placeholder = "Work out your answer here (optional) — then reveal the model answer.";
      ta.value = item.note || "";
      ta.addEventListener("input", function () { item.note = ta.value; persist(); });
      box.appendChild(ta);

      var zone = el("div", "");
      box.appendChild(zone);

      function showAnswer() {
        item.revealed = true;
        persist();
        zone.innerHTML = answerHtml(q);
        var row = el("div", "grade-row");
        var got = el("button", "btn good" + (item.grade === 1 ? "" : ""), "✅ I got it");
        var miss = el("button", "btn bad", "❌ I missed it");
        [got, miss].forEach(function (b) { b.type = "button"; });
        function grade(g) {
          item.grade = g;
          persist();
          advance();
        }
        got.onclick = function () { grade(1); };
        miss.onclick = function () { grade(0); };
        row.appendChild(got); row.appendChild(miss);
        if (typeof item.grade === "number") {
          row.appendChild(el("span", "chip " + (item.grade ? "green" : "red"), item.grade ? "marked: got it" : "marked: missed"));
        }
        zone.appendChild(row);
      }

      if (item.revealed) showAnswer();
      else {
        var reveal = el("button", "btn primary", "Show answer");
        reveal.type = "button";
        reveal.onclick = showAnswer;
        zone.appendChild(reveal);
      }

      var nav = el("div", "nav-row");
      var back = el("button", "btn", "← Back");
      back.type = "button";
      back.disabled = state.pos === 0;
      back.onclick = function () { if (state.pos > 0) { state.pos--; persist(); render(); } };
      var isLast = state.pos === total - 1;
      var next = el("button", "btn primary", isLast ? "Finish ✓" : "Next →");
      next.type = "button";
      next.onclick = function () { advanceManual(); };
      nav.appendChild(back); nav.appendChild(next);
      box.appendChild(nav);
      window.scrollTo(0, 0);

      function advance() {
        if (state.pos < total - 1) { state.pos++; persist(); render(); }
        else tryFinish();
      }
      function advanceManual() {
        if (!isLast) { state.pos++; persist(); render(); return; }
        tryFinish();
      }
      function tryFinish() {
        var ungraded = state.order.map(function (nn, i) { return typeof (state.items[nn] || {}).grade === "number" ? -1 : i; }).filter(function (i) { return i >= 0; });
        if (ungraded.length) {
          state.pos = ungraded[0];
          persist();
          render();
          var note = el("p", "result fail", ungraded.length + " question" + (ungraded.length > 1 ? "s" : "") + " not graded yet — here's the first one. Reveal the answer, then mark it.");
          box.insertBefore(note, box.children[1]);
          return;
        }
        finish();
      }
    }

    function finish() {
      var total = state.order.length;
      var got = state.order.filter(function (n) { return state.items[n].grade === 1; }).length;
      var score = Math.round(got / total * 100);
      state.order.forEach(function (n) {
        var s = DB.qstats[n] = DB.qstats[n] || { got: 0, miss: 0 };
        if (state.items[n].grade === 1) s.got++; else s.miss++;
      });
      DB.attempts.push({ ts: Date.now(), mode: modeKey, kind: "study", score: score, correct: got, total: total });
      save();
      clearSaved();
      renderResults(box, score, got, total, state.order.filter(function (n) { return state.items[n].grade === 0; }), modeKey);
    }

    render();
    return wrap;
  }

  /* ---------------- multiple-choice quick quiz ---------------- */

  function mcTest() {
    var wrap = el("div", "");
    var all = quizStore();
    var saved = all.mc;
    var state;
    if (saved && Array.isArray(saved.order) && saved.order.length && plainObject(saved.answers) && plainObject(saved.shuf)) {
      state = saved;
      if (typeof state.pos !== "number" || state.pos < 0 || state.pos >= state.order.length) state.pos = 0;
    } else {
      var order = MODES.mc.build();
      var shuf = {};
      order.forEach(function (n) { shuf[n] = shuffle([0, 1, 2, 3]); });
      state = { order: order, shuf: shuf, answers: {}, pos: 0, ts: Date.now() };
    }
    function persist() { var s = quizStore(); s.mc = state; saveQuizStore(s); }
    function clearSaved() { var s = quizStore(); delete s.mc; saveQuizStore(s); }
    persist();

    var box = el("section", "card");
    wrap.appendChild(el("p", "kicker", "Quick Quiz · multiple choice"));
    wrap.appendChild(box);

    function mcByN(n) { for (var i = 0; i < D.mc.length; i++) if (D.mc[i].n === n) return D.mc[i]; return null; }
    function answered() { return Object.keys(state.answers).length; }

    function render() {
      var n = state.order[state.pos];
      var m = mcByN(n), q = qByN(n);
      var total = state.order.length;
      var order = state.shuf[n];
      box.innerHTML = "";
      box.appendChild(el("div", "",
        '<div class="qhead"><h2>Question ' + (state.pos + 1) + " of " + total + '</h2>' +
        '<button type="button" class="btn" id="quit">Save & exit</button></div>' +
        '<div class="track"><div class="track-fill" style="width:' + Math.round(answered() / total * 100) + '%"></div></div>' +
        '<p class="autosave">' + answered() + " of " + total + " answered · saves automatically</p>"));
      box.querySelector("#quit").onclick = function () { location.hash = "#/"; };
      box.appendChild(el("p", "qtext", esc(q.q)));

      var f = el("div", "");
      order.forEach(function (oi) {
        var lab = el("label", "opt");
        lab.innerHTML = '<input type="radio" name="q"' + (state.answers[n] === oi ? " checked" : "") + '> <span>' + esc(m.opts[oi]) + "</span>";
        lab.querySelector("input").addEventListener("change", function () {
          state.answers[n] = oi;
          persist();
          render();
        });
        f.appendChild(lab);
      });
      box.appendChild(f);

      var nav = el("div", "nav-row");
      var back = el("button", "btn", "← Back");
      back.type = "button";
      back.disabled = state.pos === 0;
      back.onclick = function () { if (state.pos > 0) { state.pos--; persist(); render(); } };
      var isLast = state.pos === total - 1;
      var next = el("button", "btn primary", isLast ? "Submit ✓" : "Next →");
      next.type = "button";
      next.onclick = function () {
        if (!isLast) { state.pos++; persist(); render(); return; }
        var missing = state.order.map(function (nn, i) { return typeof state.answers[nn] === "number" ? -1 : i; }).filter(function (i) { return i >= 0; });
        if (missing.length) {
          state.pos = missing[0]; persist(); render();
          box.insertBefore(el("p", "result fail", missing.length + " unanswered — here's the first one."), box.children[1]);
          return;
        }
        finish();
      };
      nav.appendChild(back); nav.appendChild(next);
      box.appendChild(nav);
      window.scrollTo(0, 0);
    }

    function finish() {
      var total = state.order.length, right = 0, missedNs = [];
      state.order.forEach(function (n) {
        var m = mcByN(n);
        var ok = m.opts[state.answers[n]] === m.opts[m.correct];
        if (ok) right++; else missedNs.push(n);
        var s = DB.qstats[n] = DB.qstats[n] || { got: 0, miss: 0 };
        if (ok) s.got++; else s.miss++;
      });
      var score = Math.round(right / total * 100);
      DB.attempts.push({ ts: Date.now(), mode: "mc", kind: "mc", score: score, correct: right, total: total });
      save();
      clearSaved();
      renderResults(box, score, right, total, missedNs, "mc", state);
    }

    render();
    return wrap;
  }

  /* ---------------- shared results / review ---------------- */

  function renderResults(box, score, right, total, missedNs, modeKey, mcState) {
    box.innerHTML = "";
    box.appendChild(el("h2", "", "Results"));
    box.appendChild(el("p", "result " + (score >= 70 ? "pass" : "fail"),
      (score >= 70 ? "✅ " : "❌ ") + score + "% — " + right + "/" + total + (modeKey === "mc" ? " correct." : " marked \"got it\".")));
    if (missedNs.length) {
      box.appendChild(el("h2", "", "Review your misses (" + missedNs.length + ")"));
      missedNs.forEach(function (n) {
        var q = qByN(n);
        var r = el("div", "rev wrong");
        r.appendChild(el("p", "qtext", esc(q.q)));
        if (modeKey === "mc" && mcState) {
          var m = null;
          for (var i = 0; i < D.mc.length; i++) if (D.mc[i].n === n) m = D.mc[i];
          r.appendChild(el("p", "", '<span class="chip red">your answer</span> ' + esc(m.opts[mcState.answers[n]]) +
            '<br><span class="chip green">correct</span> ' + esc(m.opts[m.correct])));
        }
        r.innerHTML += answerHtml(q);
        box.appendChild(r);
      });
    } else {
      box.appendChild(el("p", "muted", "Nothing missed — clean run. 🎉"));
    }
    var nav = el("div", "nav-row");
    var again = el("button", "btn primary", "↻ Take another");
    again.type = "button";
    again.onclick = function () { location.hash = "#/"; };
    var stats = el("button", "btn", "📊 My results");
    stats.type = "button";
    stats.onclick = function () { location.hash = "#/stats"; };
    nav.appendChild(again); nav.appendChild(stats);
    box.appendChild(nav);
    window.scrollTo(0, 0);
  }

  /* ---------------- menu & stats ---------------- */

  function viewMenu() {
    var wrap = el("div", "");
    wrap.appendChild(el("p", "kicker", "Commercial roofing · study module"));
    wrap.appendChild(el("h1", "", "Commercial Roofing Exam"));
    var attempts = DB.attempts.length;
    var best = attempts ? Math.max.apply(null, DB.attempts.map(function (a) { return a.score; })) : null;
    wrap.appendChild(el("p", "lede", "73 study questions with full written model answers. Reveal the answer, grade yourself honestly, and drill what you miss. " +
      (attempts ? "You've taken <strong>" + attempts + "</strong> session" + (attempts > 1 ? "s" : "") + " — best score <strong>" + best + "%</strong>." : "Your sessions save automatically — leave any time and pick up where you stopped.")));

    var grid = el("div", "mode-grid");
    var resume = quizStore();
    ["full", "r25", "r10", "weak", "mc"].forEach(function (key) {
      var m = MODES[key];
      var a = el("a", "mode");
      a.href = "#/test/" + key;
      var resumable = resume[key === "mc" ? "mc" : key];
      a.innerHTML = "<h3>" + esc(m.label) + (resumable ? ' <span class="chip blue">resume</span>' : "") + "</h3><p>" + esc(m.desc) + "</p>";
      grid.appendChild(a);
    });
    wrap.appendChild(grid);

    var s = el("a", "mode");
    s.href = "#/stats";
    s.innerHTML = "<h3>📊 My results & weak spots</h3><p>Every session, plus the questions you miss most.</p>";
    wrap.appendChild(s);
    return wrap;
  }

  function viewStats() {
    var wrap = el("div", "");
    wrap.appendChild(el("p", "backlink", "← Back to menu")).onclick = function () { location.hash = "#/"; };
    wrap.appendChild(el("h1", "", "My Results"));

    var card = el("div", "card");
    if (!DB.attempts.length) card.appendChild(el("p", "muted", "No sessions yet — take one and your history shows up here."));
    else {
      var t = '<div class="table-scroll"><table><tr><th>Date</th><th>Mode</th><th>Score</th><th>Marked right</th></tr>';
      DB.attempts.slice().reverse().slice(0, 30).forEach(function (a) {
        t += "<tr><td>" + fmtDate(a.ts) + "</td><td>" + esc((MODES[a.mode] || { label: a.mode }).label) + "</td><td><strong>" + a.score + "%</strong></td><td>" + a.correct + "/" + a.total + "</td></tr>";
      });
      t += "</table></div>";
      card.innerHTML = "<h2>Sessions</h2>" + t;
    }
    wrap.appendChild(card);

    var weak = el("div", "card");
    var ranked = D.questions.map(function (q) { return { n: q.n, r: missRate(q.n) }; })
      .filter(function (x) { return x.r > 0; })
      .sort(function (a, b) { return b.r - a.r; }).slice(0, 10);
    weak.appendChild(el("h2", "", "Weak spots"));
    if (!ranked.length) weak.appendChild(el("p", "muted", "No misses recorded yet."));
    ranked.forEach(function (x) {
      var q = qByN(x.n);
      var s = DB.qstats[x.n];
      weak.appendChild(el("div", "rev wrong",
        '<p class="qtext">' + esc(q.q) + '</p><p class="muted">missed ' + s.miss + " of " + (s.got + s.miss) + " times</p>"));
    });
    var drill = el("a", "btn primary", "🎯 Drill my weak spots");
    drill.href = "#/test/weak";
    weak.appendChild(drill);
    wrap.appendChild(weak);
    return wrap;
  }

  /* ---------------- router ---------------- */

  function route() {
    var hash = location.hash || "#/";
    var view, m;
    if ((m = hash.match(/^#\/test\/(\w+)$/)) && MODES[m[1]]) {
      view = m[1] === "mc" ? mcTest() : studyTest(m[1]);
      document.title = MODES[m[1]].label + " · Commercial Roofing Exam";
    } else if (hash === "#/stats") {
      view = viewStats();
      document.title = "My Results · Commercial Roofing Exam";
    } else {
      view = viewMenu();
      document.title = "Commercial Roofing Exam · T-Rock Training";
    }
    app.innerHTML = "";
    app.appendChild(view);
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();
