/* Roofing Construction & Estimating — E-Course app
   Hash routing: #/home, #/module/<id>, #/exam
   Progress stored in localStorage under "rce-progress". */

(function () {
  "use strict";

  var C = window.COURSE;
  var STORE_KEY = "rce-progress";

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveProgress(p) {
    localStorage.setItem(STORE_KEY, JSON.stringify(p));
  }

  var progress = loadProgress(); // { moduleId: {score, passed}, __exam: {...} }

  function completedCount() {
    return C.modules.filter(function (m) {
      return progress[m.id] && progress[m.id].passed;
    }).length;
  }
  function examPassed() {
    return progress.__exam && progress.__exam.passed;
  }
  function overallPct() {
    var units = C.modules.length + 1; // modules + final exam
    var done = completedCount() + (examPassed() ? 1 : 0);
    return Math.round((done / units) * 100);
  }

  /* ---------- rendering helpers ---------- */

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

  var app = document.getElementById("app");

  function setActiveNav(hash) {
    document.querySelectorAll(".sidebar a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === hash);
    });
  }

  function renderSidebar() {
    var side = document.getElementById("sidebar");
    side.innerHTML = "";

    var pct = overallPct();
    var prog = el("div", "side-progress",
      '<div class="side-progress-label"><span>Course progress</span><strong>' + pct + "%</strong></div>" +
      '<div class="track"><div class="track-fill" style="width:' + pct + '%"></div></div>');
    side.appendChild(prog);

    var nav = el("nav", "side-nav");
    nav.appendChild(navLink("#/home", "Course Home", null));
    C.modules.forEach(function (m, i) {
      var done = progress[m.id] && progress[m.id].passed;
      nav.appendChild(navLink("#/module/" + m.id, (i + 1) + ". " + m.title, done));
    });
    nav.appendChild(navLink("#/exam", "Final Exam", examPassed()));
    side.appendChild(nav);

    var reset = el("button", "reset-btn", "Reset progress");
    reset.onclick = function () {
      if (confirm("Clear all quiz scores and progress?")) {
        progress = {};
        saveProgress(progress);
        route();
      }
    };
    side.appendChild(reset);
  }

  function navLink(href, label, done) {
    var a = el("a", done ? "done" : "");
    a.href = href;
    a.innerHTML = '<span class="check">' + (done ? "✓" : "") + "</span>" + esc(label);
    return a;
  }

  /* ---------- views ---------- */

  function viewHome() {
    var wrap = el("div", "view");

    var done = completedCount();
    var total = C.modules.length;
    var hero = el("section", "hero",
      '<p class="kicker">Companion e-course</p>' +
      "<h1>" + esc(C.title) + "</h1>" +
      "<p class=\"lede\">" + esc(C.subtitle) + " — based on the book by Daniel Atcheson. " +
      total + " modules take you from measuring your first roof to pricing profitable bids. " +
      "Each module ends with a quiz; pass all modules and the final exam to complete the course.</p>" +
      '<div class="hero-actions">' +
      '<a class="btn primary" href="' + nextTarget() + '">' + (done ? "Continue course" : "Start the course") + "</a>" +
      '<a class="btn" href="' + esc(C.bookUrl) + '" target="_blank" rel="noopener">Open the book (PDF)</a>' +
      "</div>");
    wrap.appendChild(hero);

    var grid = el("section", "module-grid");
    C.modules.forEach(function (m, i) {
      var st = progress[m.id];
      var badge = st && st.passed
        ? '<span class="badge pass">Completed · ' + st.score + "%</span>"
        : (st ? '<span class="badge retry">Best: ' + st.score + "% · retake</span>" : '<span class="badge">Not started</span>');
      var card = el("a", "card");
      card.href = "#/module/" + m.id;
      card.innerHTML =
        '<span class="card-num">' + String(i + 1).padStart(2, "0") + "</span>" +
        "<h3>" + esc(m.title) + "</h3>" +
        "<p>" + esc(m.intro) + "</p>" +
        '<div class="card-meta">' + badge + "<span>~" + m.minutes + " min</span></div>";
      grid.appendChild(card);
    });

    var examCard = el("a", "card exam-card");
    examCard.href = "#/exam";
    examCard.innerHTML =
      '<span class="card-num">★</span>' +
      "<h3>" + esc(C.finalExam.title) + "</h3>" +
      "<p>" + esc(C.finalExam.intro) + "</p>" +
      '<div class="card-meta">' + (examPassed()
        ? '<span class="badge pass">Passed · ' + progress.__exam.score + "%</span>"
        : '<span class="badge">' + done + "/" + total + " modules done</span>") + "</div>";
    grid.appendChild(examCard);

    wrap.appendChild(grid);
    return wrap;
  }

  function nextTarget() {
    for (var i = 0; i < C.modules.length; i++) {
      var m = C.modules[i];
      if (!(progress[m.id] && progress[m.id].passed)) return "#/module/" + m.id;
    }
    return "#/exam";
  }

  function viewModule(id) {
    var idx = C.modules.findIndex(function (m) { return m.id === id; });
    if (idx === -1) return viewHome();
    var m = C.modules[idx];

    var wrap = el("div", "view");
    var head = el("header", "lesson-head",
      '<p class="kicker">Module ' + (idx + 1) + " of " + C.modules.length + " · ~" + m.minutes + " min</p>" +
      "<h1>" + esc(m.title) + "</h1>" +
      '<p class="lede">' + esc(m.intro) + "</p>");
    wrap.appendChild(head);

    m.sections.forEach(function (s) {
      var sec = el("section", "lesson-section", "<h2>" + esc(s.h) + "</h2>" + s.body);
      wrap.appendChild(sec);
    });

    wrap.appendChild(el("aside", "book-note",
      '📖 <strong>Go deeper:</strong> this lesson is a summary. Read the matching chapter in ' +
      '<a href="' + esc(C.bookUrl) + '" target="_blank" rel="noopener"><em>Roofing Construction &amp; Estimating</em></a> ' +
      "for the full tables, illustrations and worked examples."));

    wrap.appendChild(quizBlock(m.quiz, m.id, "Module quiz",
      "Pass with " + C.passScore + "% or better to mark this module complete."));

    wrap.appendChild(pager(idx));
    return wrap;
  }

  function pager(idx) {
    var p = el("div", "pager");
    if (idx > 0) {
      var prev = C.modules[idx - 1];
      p.appendChild(linkBtn("#/module/" + prev.id, "← " + prev.title, ""));
    } else {
      p.appendChild(linkBtn("#/home", "← Course Home", ""));
    }
    if (idx < C.modules.length - 1) {
      var next = C.modules[idx + 1];
      p.appendChild(linkBtn("#/module/" + next.id, next.title + " →", "primary"));
    } else {
      p.appendChild(linkBtn("#/exam", "Final Exam →", "primary"));
    }
    return p;
  }

  function linkBtn(href, label, extra) {
    var a = el("a", "btn " + extra, esc(label));
    a.href = href;
    return a;
  }

  function viewExam() {
    var wrap = el("div", "view");
    var done = completedCount();
    wrap.appendChild(el("header", "lesson-head",
      '<p class="kicker">Capstone</p><h1>' + esc(C.finalExam.title) + "</h1>" +
      '<p class="lede">' + esc(C.finalExam.intro) + "</p>"));

    if (done < C.modules.length) {
      wrap.appendChild(el("aside", "book-note warn",
        "⚠️ You've completed <strong>" + done + " of " + C.modules.length +
        "</strong> module quizzes. You can take the exam now, but finishing every module first is recommended."));
    }

    wrap.appendChild(quizBlock(C.finalExam.quiz, "__exam", "Final exam",
      "Score " + C.passScore + "% or better to finish the course."));

    if (examPassed()) {
      wrap.appendChild(el("section", "certificate",
        "<h2>🏆 Course complete</h2><p>You passed the final exam with <strong>" +
        progress.__exam.score + "%</strong>. Well done — now go put it on a roof.</p>"));
    }
    return wrap;
  }

  /* ---------- quiz engine ---------- */

  function quizBlock(questions, storeId, title, hint) {
    var box = el("section", "quiz");
    var st = progress[storeId];
    box.appendChild(el("div", "quiz-head",
      "<h2>" + esc(title) + "</h2><p>" + esc(hint) +
      (st ? ' <span class="badge ' + (st.passed ? "pass" : "retry") + '">Best score: ' + st.score + "%</span>" : "") +
      "</p>"));

    var form = el("form", "quiz-form");
    questions.forEach(function (item, qi) {
      var f = el("fieldset", "q");
      f.appendChild(el("legend", "", (qi + 1) + ". " + esc(item.q)));
      item.a.forEach(function (opt, oi) {
        var lab = el("label", "opt");
        lab.innerHTML = '<input type="radio" name="q' + qi + '" value="' + oi + '"> <span>' + esc(opt) + "</span>";
        f.appendChild(lab);
      });
      form.appendChild(f);
    });

    var actions = el("div", "quiz-actions");
    var submit = el("button", "btn primary", "Grade my answers");
    submit.type = "submit";
    actions.appendChild(submit);
    var result = el("p", "quiz-result", "");
    actions.appendChild(result);
    form.appendChild(actions);

    form.onsubmit = function (ev) {
      ev.preventDefault();
      var right = 0, answered = 0;
      questions.forEach(function (item, qi) {
        var picked = form.querySelector('input[name="q' + qi + '"]:checked');
        var fs = form.querySelectorAll("fieldset.q")[qi];
        fs.classList.remove("correct", "wrong");
        if (!picked) return;
        answered++;
        var ok = Number(picked.value) === item.correct;
        if (ok) right++;
        fs.classList.add(ok ? "correct" : "wrong");
        var opts = fs.querySelectorAll("label.opt");
        opts.forEach(function (o, oi) {
          o.classList.toggle("is-answer", oi === item.correct);
        });
      });
      if (answered < questions.length) {
        result.textContent = "Answer all " + questions.length + " questions (" + (questions.length - answered) + " left).";
        result.className = "quiz-result warn";
        return;
      }
      var score = Math.round((right / questions.length) * 100);
      var passed = score >= C.passScore;
      var prevBest = progress[storeId] ? progress[storeId].score : -1;
      progress[storeId] = {
        score: Math.max(score, prevBest),
        passed: passed || (progress[storeId] && progress[storeId].passed) || false
      };
      saveProgress(progress);
      result.innerHTML = passed
        ? "✅ " + score + "% — passed! " + (right) + "/" + questions.length + " correct."
        : "❌ " + score + "% — you need " + C.passScore + "%. Review the lesson and try again.";
      result.className = "quiz-result " + (passed ? "pass" : "fail");
      renderSidebar();
      setActiveNav(location.hash || "#/home");
    };

    box.appendChild(form);
    return box;
  }

  /* ---------- router ---------- */

  function route() {
    var hash = location.hash || "#/home";
    var view;
    var mMatch = hash.match(/^#\/module\/(.+)$/);
    if (mMatch) view = viewModule(mMatch[1]);
    else if (hash === "#/exam") view = viewExam();
    else view = viewHome();

    app.innerHTML = "";
    app.appendChild(view);
    renderSidebar();
    setActiveNav(hash);
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", route);
  document.getElementById("year").textContent = new Date().getFullYear();
  route();
})();
