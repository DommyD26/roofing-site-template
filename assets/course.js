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
    var fallback = { attempts: [], badges: {}, read: {}, name: "" };
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
      return d;
    } catch (e) { return fallback; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(DB)); }
    catch (e) { /* storage full/blocked: keep running in-memory */ }
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

  function buildPractice() {
    var pool = [];
    C.chapters.forEach(function (ch) {
      var picks = shuffle(ch.bank).slice(0, 2);
      // ~half the time swap one static for a fresh-numbers generated problem
      if (ch.gens.length && Math.random() < 0.5) picks[0] = R.pick(ch.gens);
      picks.forEach(function (e) { pool.push(materialize(e, ch)); });
    });
    return shuffle(pool).slice(0, C.practiceSize);
  }

  function buildFinal() {
    var pool = [];
    C.chapters.forEach(function (ch) {
      var statics = shuffle(ch.bank).slice(0, ch.gens.length ? 2 : 3);
      statics.forEach(function (e) { pool.push(materialize(e, ch)); });
      if (ch.gens.length) pool.push(materialize(R.pick(ch.gens), ch));
    });
    return shuffle(pool).slice(0, C.finalSize);
  }

  /* ---------------- quiz rendering & grading ---------------- */

  function testView(opts) {
    // opts: {kind: 'chapter'|'practice'|'final', chapter?, title, subtitle, pass, rebuild()}
    var wrap = el("div", "view");
    wrap.appendChild(el("header", "lesson-head",
      '<p class="kicker">' + esc(opts.kicker) + "</p><h1>" + esc(opts.title) + "</h1>" +
      '<p class="lede">' + opts.subtitle + "</p>"));

    var questions = opts.rebuild();
    window.__lastTest = questions; // test/QA hook: lets automated checks verify grading
    var box = el("section", "quiz");
    var form = el("form", "quiz-form");

    function renderQuestions() {
      form.innerHTML = "";
      questions.forEach(function (item, qi) {
        var f = el("fieldset", "q");
        var chTitle = opts.kind === "chapter" ? "" :
          ' <span class="q-src">' + esc(chapterById(item.chapter).title) + "</span>";
        f.appendChild(el("legend", "", (qi + 1) + ". " + esc(item.q) + chTitle));
        item.a.forEach(function (optTxt, oi) {
          var lab = el("label", "opt");
          lab.innerHTML = '<input type="radio" name="q' + qi + '" value="' + oi + '"> <span>' + esc(optTxt) + "</span>";
          f.appendChild(lab);
        });
        form.appendChild(f);
      });
      var actions = el("div", "quiz-actions");
      var submit = el("button", "btn primary", "Grade my test");
      submit.type = "submit";
      actions.appendChild(submit);
      actions.appendChild(el("p", "quiz-result", ""));
      form.appendChild(actions);
    }
    renderQuestions();

    var report = el("div", "");

    form.onsubmit = function (ev) {
      ev.preventDefault();
      var result = form.querySelector(".quiz-result");
      var right = 0, answered = 0;
      var cats = {};
      questions.forEach(function (item, qi) {
        var picked = form.querySelector('input[name="q' + qi + '"]:checked');
        if (picked) answered++;
      });
      if (answered < questions.length) {
        result.textContent = "Answer all " + questions.length + " questions (" + (questions.length - answered) + " left).";
        result.className = "quiz-result warn";
        return;
      }
      questions.forEach(function (item, qi) {
        var picked = form.querySelector('input[name="q' + qi + '"]:checked');
        var ok = Number(picked.value) === item.correct;
        if (ok) right++;
        var key = item.chapter + "|" + item.cat;
        cats[key] = cats[key] || { c: 0, t: 0 };
        cats[key].t++;
        if (ok) cats[key].c++;
        var fs = form.querySelectorAll("fieldset.q")[qi];
        fs.classList.add(ok ? "correct" : "wrong");
        fs.querySelectorAll("label.opt").forEach(function (o, oi) {
          o.classList.toggle("is-answer", oi === item.correct);
          o.querySelector("input").disabled = true;
        });
      });

      var score = Math.round(right / questions.length * 100);
      var passed = score >= opts.pass;
      DB.attempts.push({
        ts: Date.now(), kind: opts.kind, chapter: opts.chapter || null,
        score: score, correct: right, total: questions.length, cats: cats
      });
      save();

      result.innerHTML = (passed ? "✅ " : "❌ ") + score + "% — " + right + "/" + questions.length +
        " correct. " + (passed ? "Passed!" : "You need " + opts.pass + "%. Review and retake — the numbers will be new.");
      result.className = "quiz-result " + (passed ? "pass" : "fail");
      form.querySelector("button").style.display = "none";

      report.innerHTML = "";
      report.appendChild(attemptReport(cats, opts));
      var again = el("button", "btn", "↻ Retake with fresh questions & new numbers");
      again.onclick = function () {
        questions = opts.rebuild();
        window.__lastTest = questions;
        report.innerHTML = "";
        renderQuestions();
        window.scrollTo(0, 0);
      };
      var actions = el("div", "pager");
      actions.appendChild(again);
      if (opts.kind === "chapter") {
        actions.appendChild(linkBtn("#/chapter/" + opts.chapter, "Back to chapter", ""));
      } else {
        actions.appendChild(linkBtn("#/stats", "See my stats →", ""));
      }
      report.appendChild(actions);

      awardNewBadges();
      renderSidebar();
    };

    box.appendChild(form);
    wrap.appendChild(box);
    wrap.appendChild(report);
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
    nav.appendChild(navLink("#/stats", "📊 My Stats", null));
    var bCount = Object.keys(DB.badges).length;
    nav.appendChild(navLink("#/badges", "🎖️ Badges (" + bCount + "/" + C.badges.length + ")", null));
    if (finalPassed()) nav.appendChild(navLink("#/certificate", "📜 My Certificate", null));
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
    wrap.appendChild(el("section", "lesson-section lesson-body", l.html));

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
      subtitle: "Twenty questions drawn from every chapter — different questions and fresh numbers every time. Results feed your per-chapter skill rankings.",
      rebuild: buildPractice
    });
  }

  function viewFinal() {
    var ready = C.chapters.filter(function (ch) { return chapterPassed(ch.id); }).length;
    var sub = C.finalSize + " questions across all 12 chapters. Pass at <strong>" + C.finalPassScore +
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
          var name = a.kind === "chapter" ? chapterById(a.chapter).title + " test"
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
      if (confirm("This permanently clears every test score, badge and lesson-read mark on this device. Continue?")) {
        DB = { attempts: [], badges: {}, read: {}, name: DB.name };
        save();
        route();
      }
    };
    danger.appendChild(reset);
    wrap.appendChild(danger);
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
      '<p class="cert-awarded">has completed all twelve chapters of study and passed the certification examination<br>with a best score of <strong>' + best + "%</strong></p>" +
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
