/* T^Rock CRM — local-first job command center.
   No build step, no accounts: everything saves to this device instantly,
   backs up to JSON on demand, and optionally syncs the whole company book
   to your own Google Apps Script backend (see crm/Code.gs + CRM-SETUP.md). */

(function () {
  "use strict";

  /* ======================================================================
     Pipeline definition — the stages ARE the company process. Moving a job
     into a stage auto-creates that stage's playbook as tasks on the job.
     ====================================================================== */

  var STAGES = [
    { id: "lead", label: "New Lead", playbook: [
      "Call the lead back",
      "Schedule the inspection on the work calendar"
    ]},
    { id: "inspection", label: "Inspection", playbook: [
      "Full inspection — roof, attic & interior",
      "Photos into CompanyCam",
      "Write & send the inspection summary"
    ]},
    { id: "proposal", label: "Proposal", playbook: [
      "Order the Roofr measurement report",
      "Write the scope of work (summary + detailed + Roofr paste block)",
      "Price it — 2.0x markup, $500 minimum",
      "Build the client deck (deductible offset analysis)",
      "Send the proposal & follow up in 2 days"
    ]},
    { id: "insurance", label: "Insurance", playbook: [
      "Confirm the claim is filed & get the claim #",
      "Meet the adjuster on site",
      "Review the loss statement — RCV / ACV / deductible",
      "Submit supplements if the scope is short"
    ]},
    { id: "approved", label: "Approved", playbook: [
      "Get the contract signed",
      "Collect the deductible / first payment",
      "Order materials",
      "Assign a crew & put the start date on the calendar"
    ]},
    { id: "production", label: "In Production", playbook: [
      "Job-start walkthrough with the crew lead",
      "Daily photos into CompanyCam",
      "Daily field summary",
      "Final walkthrough & punch list"
    ]},
    { id: "complete", label: "Job Complete", playbook: [
      "Build the CompanyCam photo report",
      "Send the final invoice",
      "Send the final email — photo report + invoice + Google review ask"
    ]},
    { id: "paid", label: "Paid & Closed", playbook: [
      "Confirm paid in full",
      "Register the warranty",
      "Ask for referrals"
    ]},
    { id: "lost", label: "Lost", playbook: [] }
  ];
  var ACTIVE_STAGES = ["lead", "inspection", "proposal", "insurance", "approved", "production", "complete"];
  var JOB_TYPES = ["Insurance", "Retail", "Repair", "Warranty"];
  var SOURCES = ["Referral", "Door knock", "Google", "Facebook", "Yard sign", "Repeat customer", "Adjuster", "Other"];
  var CONTACT_TYPES = ["Customer", "Adjuster", "Supplier", "Sub / Crew", "Realtor", "Other"];

  function stageById(id) {
    for (var i = 0; i < STAGES.length; i++) if (STAGES[i].id === id) return STAGES[i];
    return STAGES[0];
  }
  function stageIndex(id) {
    for (var i = 0; i < STAGES.length; i++) if (STAGES[i].id === id) return i;
    return 0;
  }

  /* ======================================================================
     State & persistence
     ====================================================================== */

  var DB_KEY = "trock-crm-v1";

  function freshState() {
    return {
      version: 1,
      settings: {
        companyName: "T^Rock Contracting",
        markup: 2.0,
        minSale: 500,
        calendarEmail: "dkiani@trockcontracting.com",
        reviewLink: "",
        syncUrl: "",
        syncKey: "",
        lastSync: 0
      },
      jobs: [],
      contacts: [],
      crews: [],
      tasks: [],
      activity: []
    };
  }

  var state = loadState();

  function loadState() {
    try {
      var raw = localStorage.getItem(DB_KEY);
      if (!raw) return freshState();
      var s = JSON.parse(raw);
      /* Merge over a fresh skeleton so new fields appear after updates. */
      var base = freshState();
      for (var k in base.settings) if (s.settings && s.settings[k] !== undefined) base.settings[k] = s.settings[k];
      base.jobs = s.jobs || []; base.contacts = s.contacts || []; base.crews = s.crews || [];
      base.tasks = s.tasks || []; base.activity = s.activity || [];
      return base;
    } catch (e) { return freshState(); }
  }

  var syncTimer = null;
  function save() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(state)); } catch (e) { toast("⚠️ Couldn't save — storage full?"); }
    if (state.settings.syncUrl && state.settings.syncKey) {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(function () { pushCloud(true); }, 4000);
    }
  }

  /* ======================================================================
     Helpers
     ====================================================================== */

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) {
    n = Number(n) || 0;
    return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  function numVal(v) {
    var n = parseFloat(String(v == null ? "" : v).replace(/[$,\s]/g, ""));
    return isNaN(n) ? 0 : n;
  }
  function fmtDate(ts) {
    if (!ts) return "—";
    var d = new Date(ts);
    return isNaN(d) ? "—" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  function fmtDT(ts) {
    var d = new Date(ts);
    return isNaN(d) ? "—" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " +
      d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  function isoToday() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function dueBucket(due) {
    /* due is YYYY-MM-DD */
    if (!due) return "someday";
    var today = isoToday();
    if (due < today) return "overdue";
    if (due === today) return "today";
    return "upcoming";
  }
  function daysAgo(ts) { return ts ? Math.floor((Date.now() - ts) / 86400000) : 9999; }

  function toast(msg) {
    var box = document.getElementById("toasts");
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  function jobById(id) { for (var i = 0; i < state.jobs.length; i++) if (state.jobs[i].id === id) return state.jobs[i]; return null; }
  function crewById(id) { for (var i = 0; i < state.crews.length; i++) if (state.crews[i].id === id) return state.crews[i]; return null; }
  function contactById(id) { for (var i = 0; i < state.contacts.length; i++) if (state.contacts[i].id === id) return state.contacts[i]; return null; }

  function jobValue(j) { return numVal(j.money.contractPrice) || numVal(j.money.estimate) || 0; }
  function jobPaid(j) {
    var sum = 0;
    (j.money.payments || []).forEach(function (p) { sum += numVal(p.amount); });
    return sum;
  }
  function jobBalance(j) { return numVal(j.money.contractPrice) - jobPaid(j); }
  function jobTasks(j) { return state.tasks.filter(function (t) { return t.jobId === j.id; }); }
  function jobOverdue(j) {
    return jobTasks(j).some(function (t) { return !t.done && dueBucket(t.due) === "overdue"; });
  }

  function logActivity(jobId, text) {
    state.activity.unshift({ ts: Date.now(), jobId: jobId || "", text: text });
    if (state.activity.length > 500) state.activity.length = 500;
  }

  function newJob(fields) {
    var j = {
      id: uid(),
      name: fields.name || "New customer",
      phone: fields.phone || "",
      email: fields.email || "",
      address: fields.address || "",
      city: fields.city || "",
      jobType: fields.jobType || "Insurance",
      source: fields.source || "Referral",
      roofType: fields.roofType || "",
      squares: fields.squares || "",
      stage: fields.stage || "lead",
      stageAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      scheduledDate: "",
      completedDate: "",
      crewId: "",
      lostReason: "",
      insurance: { carrier: "", claimNumber: "", adjusterName: "", adjusterPhone: "", rcv: "", deductible: "", acvOffset: "", supplements: "" },
      money: { estimate: "", cost: "", contractPrice: "", payments: [] },
      links: { roofr: "", companycam: "", dropbox: "", other: "" },
      notes: []
    };
    state.jobs.unshift(j);
    logActivity(j.id, "Job created — " + j.name + " (" + stageById(j.stage).label + ")");
    addPlaybookTasks(j, j.stage);
    return j;
  }

  function addPlaybookTasks(job, stageId) {
    var st = stageById(stageId);
    st.playbook.forEach(function (title) {
      var exists = state.tasks.some(function (t) { return t.jobId === job.id && t.title === title; });
      if (!exists) state.tasks.push({ id: uid(), jobId: job.id, title: title, due: "", done: false, doneAt: 0, createdAt: Date.now() });
    });
  }

  function setStage(job, stageId) {
    if (job.stage === stageId) return;
    var from = stageById(job.stage).label, to = stageById(stageId).label;
    job.stage = stageId;
    job.stageAt = Date.now();
    job.updatedAt = Date.now();
    if (stageId === "complete" && !job.completedDate) job.completedDate = isoToday();
    addPlaybookTasks(job, stageId);
    logActivity(job.id, "Moved " + job.name + ": " + from + " → " + to);
    save();
    toast(job.name + " → " + to);
  }

  /* ======================================================================
     Cloud sync (optional — Google Apps Script backend, see CRM-SETUP.md)
     ====================================================================== */

  function pushCloud(quiet) {
    var s = state.settings;
    if (!s.syncUrl || !s.syncKey) { if (!quiet) toast("Set the sync URL + key in Settings first."); return; }
    fetch(s.syncUrl, {
      method: "POST",
      /* text/plain avoids a CORS preflight, which Apps Script can't answer */
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ op: "save", key: s.syncKey, state: state })
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.ok) {
        state.settings.lastSync = Date.now();
        try { localStorage.setItem(DB_KEY, JSON.stringify(state)); } catch (e) {}
        if (!quiet) toast("☁️ Pushed to cloud");
        if (route() === "settings") render();
      } else if (!quiet) toast("Cloud push failed — check the key.");
    }).catch(function () { if (!quiet) toast("Cloud push failed — check the URL / connection."); });
  }

  function pullCloud() {
    var s = state.settings;
    if (!s.syncUrl || !s.syncKey) { toast("Set the sync URL + key in Settings first."); return; }
    fetch(s.syncUrl + (s.syncUrl.indexOf("?") >= 0 ? "&" : "?") + "key=" + encodeURIComponent(s.syncKey) + "&t=" + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) { toast("Cloud pull failed — check the key."); return; }
        if (!j.state) { toast("Nothing in the cloud yet — push first."); return; }
        if (!confirm("Replace everything on this device with the cloud copy?")) return;
        var keep = { syncUrl: s.syncUrl, syncKey: s.syncKey };
        state = j.state;
        var base = freshState();
        state.settings = state.settings || base.settings;
        state.settings.syncUrl = keep.syncUrl;
        state.settings.syncKey = keep.syncKey;
        state.settings.lastSync = Date.now();
        save();
        toast("☁️ Pulled from cloud");
        render();
      })
      .catch(function () { toast("Cloud pull failed — check the URL / connection."); });
  }

  /* ======================================================================
     Router
     ====================================================================== */

  var view = document.getElementById("view");

  function route() {
    var h = (location.hash || "#/dashboard").replace(/^#\//, "");
    return h.split("/")[0] || "dashboard";
  }
  function routeArg() {
    var parts = (location.hash || "").replace(/^#\//, "").split("/");
    return parts[1] || "";
  }

  function render() {
    var r = route();
    document.querySelectorAll("#tabs a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-tab") === r || (r === "job" && a.getAttribute("data-tab") === "jobs"));
    });
    if (r === "dashboard") renderDashboard();
    else if (r === "board") renderBoard();
    else if (r === "jobs") renderJobs();
    else if (r === "job") renderJob(routeArg());
    else if (r === "tasks") renderTasks();
    else if (r === "contacts") renderContacts();
    else if (r === "crews") renderCrews();
    else if (r === "settings") renderSettings();
    else { location.hash = "#/dashboard"; }
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", render);

  /* ======================================================================
     Shared snippets
     ====================================================================== */

  function stageChip(id) {
    return '<span class="chip stage-' + esc(id) + '">' + esc(stageById(id).label) + "</span>";
  }
  function jobLink(id, text) {
    return '<a href="#/job/' + esc(id) + '">' + esc(text) + "</a>";
  }
  function mapsUrl(job) {
    var q = (job.address + " " + job.city).trim();
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
  }
  function taskListHTML(tasks, showJob) {
    if (!tasks.length) return '<p class="empty">Nothing here. 🎉</p>';
    var out = '<ul class="checklist">';
    tasks.forEach(function (t) {
      var j = t.jobId ? jobById(t.jobId) : null;
      var bucket = dueBucket(t.due);
      out += '<li class="' + (t.done ? "done" : "") + '">' +
        '<input type="checkbox" data-task="' + esc(t.id) + '"' + (t.done ? " checked" : "") + ">" +
        "<div><span class=\"t-title\">" + esc(t.title) + "</span>" +
        (t.due ? '<span class="t-due">Due ' + esc(t.due) +
          (!t.done && bucket === "overdue" ? ' <span class="chip overdue">overdue</span>' : "") +
          (!t.done && bucket === "today" ? ' <span class="chip today">today</span>' : "") + "</span>" : "") +
        (showJob && j ? '<a class="t-job" href="#/job/' + esc(j.id) + '">' + esc(j.name) + "</a>" : "") +
        "</div></li>";
    });
    return out + "</ul>";
  }
  function wireTaskCheckboxes(rootEl) {
    rootEl.querySelectorAll("input[data-task]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var t = state.tasks.filter(function (x) { return x.id === cb.getAttribute("data-task"); })[0];
        if (!t) return;
        t.done = cb.checked;
        t.doneAt = cb.checked ? Date.now() : 0;
        if (t.jobId) {
          var j = jobById(t.jobId);
          if (j) { j.updatedAt = Date.now(); if (cb.checked) logActivity(j.id, "✔ " + t.title + " — " + j.name); }
        }
        save();
        render();
      });
    });
  }

  /* ======================================================================
     Dashboard
     ====================================================================== */

  function renderDashboard() {
    var active = state.jobs.filter(function (j) { return ACTIVE_STAGES.indexOf(j.stage) >= 0; });
    var pipelineValue = 0, owed = 0;
    active.forEach(function (j) { pipelineValue += jobValue(j); });
    state.jobs.forEach(function (j) {
      if (j.stage === "complete" || j.stage === "production" || j.stage === "approved") {
        var b = jobBalance(j);
        if (b > 0) owed += b;
      }
    });
    var open = state.tasks.filter(function (t) { return !t.done; });
    var overdue = open.filter(function (t) { return dueBucket(t.due) === "overdue"; });
    var today = open.filter(function (t) { return dueBucket(t.due) === "today"; });

    var wonThisYear = 0;
    var yr = new Date().getFullYear();
    state.jobs.forEach(function (j) {
      if (j.stage === "paid" || j.stage === "complete") {
        var d = j.completedDate ? new Date(j.completedDate) : new Date(j.updatedAt);
        if (d.getFullYear() === yr) wonThisYear += numVal(j.money.contractPrice);
      }
    });

    /* stage summary */
    var stageRows = "";
    STAGES.forEach(function (st) {
      if (st.id === "lost" || st.id === "paid") return;
      var inStage = state.jobs.filter(function (j) { return j.stage === st.id; });
      if (!inStage.length) return;
      var v = 0; inStage.forEach(function (j) { v += jobValue(j); });
      stageRows += "<tr class=\"clickable\" data-goboard=\"1\"><td>" + stageChip(st.id) + "</td><td class=\"num\">" + inStage.length + "</td><td class=\"num\">" + money(v) + "</td></tr>";
    });

    /* needs attention: active jobs untouched 7+ days */
    var stale = active.filter(function (j) { return daysAgo(j.updatedAt) >= 7; })
      .sort(function (a, b) { return a.updatedAt - b.updatedAt; }).slice(0, 8);

    var dated = open.filter(function (t) { return t.due && t.due <= addDays(7); })
      .sort(function (a, b) { return a.due < b.due ? -1 : 1; });
    var undated = open.filter(function (t) { return !t.due; })
      .sort(function (a, b) { return b.createdAt - a.createdAt; });
    var dueSoon = dated.concat(undated).slice(0, 12);

    function addDays(n) {
      var d = new Date(); d.setDate(d.getDate() + n);
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }

    var feed = state.activity.slice(0, 25).map(function (a) {
      var j = a.jobId ? jobById(a.jobId) : null;
      return "<div><time>" + fmtDT(a.ts) + "</time>" + esc(a.text) + (j ? " · " + jobLink(j.id, "open") : "") + "</div>";
    }).join("") || '<p class="empty">No activity yet — add your first job.</p>';

    view.innerHTML =
      '<div class="page-head"><h1>Dashboard</h1><div class="spacer"></div>' +
      '<span class="sub" style="margin:0">' + esc(state.settings.companyName) + " · " + new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) + "</span></div>" +
      '<div class="stat-strip">' +
      '<div class="stat"><strong>' + active.length + "</strong><span>Active jobs</span></div>" +
      '<div class="stat hot"><strong>' + money(pipelineValue) + "</strong><span>Pipeline value</span></div>" +
      '<div class="stat"><strong>' + money(owed) + "</strong><span>Outstanding balances</span></div>" +
      '<div class="stat"><strong>' + money(wonThisYear) + "</strong><span>Sold & built " + yr + "</span></div>" +
      '<div class="stat' + (overdue.length ? " hot" : "") + '"><strong>' + overdue.length + "</strong><span>Overdue tasks</span></div>" +
      '<div class="stat"><strong>' + today.length + "</strong><span>Due today</span></div>" +
      "</div>" +
      '<div class="grid2">' +
      '<div>' +
      '<div class="card"><h2>📋 Up next</h2>' + taskListHTML(dueSoon, true) +
      '<div class="form-actions"><a class="btn small" href="#/tasks">All tasks →</a></div></div>' +
      '<div class="card"><h2>🔥 Needs attention <span class="sub" style="margin:0;font-weight:400">(active, quiet 7+ days)</span></h2>' +
      (stale.length ? '<div class="table-scroll"><table><thead><tr><th>Customer</th><th>Stage</th><th class="num">Quiet</th></tr></thead><tbody>' +
        stale.map(function (j) {
          return '<tr class="clickable" data-job="' + esc(j.id) + '"><td>' + esc(j.name) + "</td><td>" + stageChip(j.stage) + '</td><td class="num">' + daysAgo(j.updatedAt) + "d</td></tr>";
        }).join("") + "</tbody></table></div>" : '<p class="empty">Everything active has been touched this week. 💪</p>') +
      "</div></div>" +
      "<div>" +
      '<div class="card"><h2>📊 Pipeline</h2>' +
      (stageRows ? '<div class="table-scroll"><table><thead><tr><th>Stage</th><th class="num">Jobs</th><th class="num">Value</th></tr></thead><tbody>' + stageRows + "</tbody></table></div>"
        : '<p class="empty">No active jobs — hit <b>+ New Job</b> to start.</p>') +
      '<div class="form-actions"><a class="btn small" href="#/board">Open the board →</a></div></div>' +
      '<div class="card"><h2>🕒 Recent activity</h2><div class="timeline">' + feed + "</div></div>" +
      "</div></div>";

    wireTaskCheckboxes(view);
    view.querySelectorAll("tr[data-job]").forEach(function (tr) {
      tr.addEventListener("click", function () { location.hash = "#/job/" + tr.getAttribute("data-job"); });
    });
    view.querySelectorAll("tr[data-goboard]").forEach(function (tr) {
      tr.addEventListener("click", function () { location.hash = "#/board"; });
    });
  }

  /* ======================================================================
     Pipeline board (kanban)
     ====================================================================== */

  function renderBoard() {
    var cols = STAGES.map(function (st) {
      var jobs = state.jobs.filter(function (j) { return j.stage === st.id; })
        .sort(function (a, b) { return b.updatedAt - a.updatedAt; });
      var v = 0; jobs.forEach(function (j) { v += jobValue(j); });
      var cards = jobs.map(function (j) {
        return '<div class="kcard" draggable="true" data-job="' + esc(j.id) + '">' +
          "<strong>" + esc(j.name) + "</strong>" +
          '<span class="kmeta">' + esc(j.city || j.address || "") + "</span>" +
          (jobValue(j) ? '<span class="kmoney">' + money(jobValue(j)) + "</span>" : "") +
          '<span class="kflags"><span class="chip type">' + esc(j.jobType) + "</span>" +
          (jobOverdue(j) ? '<span class="chip overdue">task overdue</span>' : "") +
          (daysAgo(j.stageAt) >= 14 && ACTIVE_STAGES.indexOf(st.id) >= 0 ? '<span class="chip today">' + daysAgo(j.stageAt) + "d in stage</span>" : "") +
          "</span></div>";
      }).join("");
      return '<div class="col" data-stage="' + esc(st.id) + '"><h3><span>' + esc(st.label) +
        ' <span class="count">' + jobs.length + "</span></span>" +
        (v ? '<span class="colsum">' + money(v) + "</span>" : "") + "</h3>" + cards + "</div>";
    }).join("");

    view.innerHTML = '<div class="page-head"><h1>Pipeline</h1><div class="spacer"></div>' +
      '<span class="sub" style="margin:0">Drag a job card to move it — the stage playbook lands on its checklist automatically.</span></div>' +
      '<div class="board">' + cols + "</div>";

    var dragId = null;
    view.querySelectorAll(".kcard").forEach(function (card) {
      card.addEventListener("click", function () { location.hash = "#/job/" + card.getAttribute("data-job"); });
      card.addEventListener("dragstart", function (e) {
        dragId = card.getAttribute("data-job");
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", dragId); } catch (err) {}
      });
      card.addEventListener("dragend", function () { card.classList.remove("dragging"); dragId = null; });
    });
    view.querySelectorAll(".col").forEach(function (col) {
      col.addEventListener("dragover", function (e) { e.preventDefault(); col.classList.add("drop-hover"); });
      col.addEventListener("dragleave", function () { col.classList.remove("drop-hover"); });
      col.addEventListener("drop", function (e) {
        e.preventDefault();
        col.classList.remove("drop-hover");
        var id = dragId || (function () { try { return e.dataTransfer.getData("text/plain"); } catch (err) { return ""; } })();
        var j = id && jobById(id);
        if (j) { setStage(j, col.getAttribute("data-stage")); render(); }
      });
    });
  }

  /* ======================================================================
     Jobs list
     ====================================================================== */

  var jobFilters = { q: "", stage: "", type: "" };

  function renderJobs() {
    var q = jobFilters.q.toLowerCase();
    var rows = state.jobs.filter(function (j) {
      if (jobFilters.stage && j.stage !== jobFilters.stage) return false;
      if (jobFilters.type && j.jobType !== jobFilters.type) return false;
      if (q) {
        var hay = (j.name + " " + j.address + " " + j.city + " " + j.phone + " " + j.email + " " + (j.insurance.claimNumber || "")).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    }).sort(function (a, b) { return b.updatedAt - a.updatedAt; });

    view.innerHTML = '<div class="page-head"><h1>Jobs</h1><div class="spacer"></div>' +
      '<span class="sub" style="margin:0">' + rows.length + " of " + state.jobs.length + "</span></div>" +
      '<div class="search-row">' +
      '<input type="search" id="jf-q" placeholder="Search name, address, phone, claim #…" value="' + esc(jobFilters.q) + '">' +
      '<select id="jf-stage"><option value="">All stages</option>' + STAGES.map(function (s) {
        return '<option value="' + s.id + '"' + (jobFilters.stage === s.id ? " selected" : "") + ">" + esc(s.label) + "</option>";
      }).join("") + "</select>" +
      '<select id="jf-type"><option value="">All types</option>' + JOB_TYPES.map(function (t) {
        return '<option' + (jobFilters.type === t ? " selected" : "") + ">" + esc(t) + "</option>";
      }).join("") + "</select></div>" +
      (rows.length ?
        '<div class="table-scroll"><table><thead><tr><th>Customer</th><th>Address</th><th>Stage</th><th>Type</th><th class="num">Value</th><th class="num">Balance</th><th>Updated</th></tr></thead><tbody>' +
        rows.map(function (j) {
          var bal = jobBalance(j);
          return '<tr class="clickable" data-job="' + esc(j.id) + '"><td><b>' + esc(j.name) + "</b></td>" +
            "<td>" + esc([j.address, j.city].filter(Boolean).join(", ")) + "</td>" +
            "<td>" + stageChip(j.stage) + "</td>" +
            '<td><span class="chip type">' + esc(j.jobType) + "</span></td>" +
            '<td class="num">' + (jobValue(j) ? money(jobValue(j)) : "—") + "</td>" +
            '<td class="num">' + (numVal(j.money.contractPrice) ? money(bal) : "—") + "</td>" +
            "<td>" + fmtDate(j.updatedAt) + "</td></tr>";
        }).join("") + "</tbody></table></div>"
        : '<div class="card"><p class="empty">No jobs match. Hit <b>+ New Job</b> up top to add one.</p></div>');

    document.getElementById("jf-q").addEventListener("input", function (e) { jobFilters.q = e.target.value; renderJobs(); });
    document.getElementById("jf-stage").addEventListener("change", function (e) { jobFilters.stage = e.target.value; renderJobs(); });
    document.getElementById("jf-type").addEventListener("change", function (e) { jobFilters.type = e.target.value; renderJobs(); });
    var qEl = document.getElementById("jf-q");
    qEl.focus(); qEl.setSelectionRange(qEl.value.length, qEl.value.length);
    view.querySelectorAll("tr[data-job]").forEach(function (tr) {
      tr.addEventListener("click", function () { location.hash = "#/job/" + tr.getAttribute("data-job"); });
    });
  }

  /* ======================================================================
     Job detail
     ====================================================================== */

  function renderJob(id) {
    var j = jobById(id);
    if (!j) {
      view.innerHTML = '<div class="card"><p class="empty">Job not found. <a href="#/jobs">Back to jobs</a></p></div>';
      return;
    }
    var ins = j.insurance, m = j.money, links = j.links, s = state.settings;

    /* deductible offset math (same idea as the client-deck analysis):
       ACV the carrier pays on items NOT being built offsets the deductible. */
    var ded = numVal(ins.deductible), acv = numVal(ins.acvOffset);
    var offsetCovered = Math.min(acv, ded);
    var offsetPct = ded > 0 ? Math.round((offsetCovered / ded) * 100) : 0;
    var outOfPocket = Math.max(ded - acv, 0);

    /* pricing helper: 2.0x markup on cost, floored at the minimum sale */
    var cost = numVal(m.cost);
    var suggested = cost > 0 ? Math.max(cost * (Number(s.markup) || 2), Number(s.minSale) || 500) : 0;

    var paid = jobPaid(j), balance = jobBalance(j);
    var crew = crewById(j.crewId);

    var stepper = STAGES.map(function (st) {
      var cls = st.id === j.stage ? "current" : (stageIndex(st.id) < stageIndex(j.stage) && st.id !== "lost" ? "done" : "");
      return '<button data-stage="' + st.id + '" class="' + cls + '">' + esc(st.label) + "</button>";
    }).join("");

    var openTasks = jobTasks(j).filter(function (t) { return !t.done; });
    var doneTasks = jobTasks(j).filter(function (t) { return t.done; }).sort(function (a, b) { return b.doneAt - a.doneAt; });

    var timeline = [];
    (j.notes || []).forEach(function (n) { timeline.push({ ts: n.ts, html: '<span class="note-body">📝 ' + esc(n.text) + "</span>" }); });
    state.activity.forEach(function (a) { if (a.jobId === j.id) timeline.push({ ts: a.ts, html: esc(a.text) }); });
    timeline.sort(function (a, b) { return b.ts - a.ts; });

    var payRows = (m.payments || []).map(function (p, i) {
      return "<tr><td>" + esc(p.date || "—") + "</td><td>" + esc(p.method || "") + '</td><td class="num">' + money(p.amount) + "</td><td>" + esc(p.note || "") +
        '</td><td><button class="btn small danger" data-delpay="' + i + '">✕</button></td></tr>';
    }).join("");

    view.innerHTML =
      '<p><a href="#/jobs">← Jobs</a></p>' +
      '<div class="job-head"><div>' +
      "<h1>" + esc(j.name) + "</h1>" +
      '<div class="meta">' + esc([j.address, j.city].filter(Boolean).join(", ")) +
      (j.phone ? ' · <a href="tel:' + esc(j.phone) + '">' + esc(j.phone) + "</a>" : "") +
      (j.email ? ' · <a href="mailto:' + esc(j.email) + '">' + esc(j.email) + "</a>" : "") + "</div>" +
      '<div style="margin-top:.35rem">' + stageChip(j.stage) + ' <span class="chip type">' + esc(j.jobType) + '</span> <span class="chip type">' + esc(j.source) + "</span>" +
      (jobValue(j) ? ' <b style="margin-left:.4rem">' + money(jobValue(j)) + "</b>" : "") + "</div>" +
      "</div><div class=\"spacer\"></div>" +
      '<div class="form-actions" style="margin:0">' +
      '<button class="btn" id="edit-job">✏️ Edit</button>' +
      '<button class="btn danger" id="del-job">Delete</button></div></div>' +

      '<div class="stage-stepper" id="stepper">' + stepper + "</div>" +
      (j.stage === "lost" && j.lostReason ? '<p class="sub">Lost — ' + esc(j.lostReason) + "</p>" : "") +

      '<div class="grid2">' +
      "<div>" +

      '<div class="card"><h2>📇 Details</h2><dl class="kv">' +
      "<dt>Roof type</dt><dd>" + esc(j.roofType || "—") + "</dd>" +
      "<dt>Squares</dt><dd>" + esc(j.squares || "—") + "</dd>" +
      "<dt>Crew</dt><dd>" + (crew ? esc(crew.name) : "—") + "</dd>" +
      "<dt>Start date</dt><dd>" + esc(j.scheduledDate || "—") + "</dd>" +
      "<dt>Completed</dt><dd>" + esc(j.completedDate || "—") + "</dd>" +
      "<dt>Created</dt><dd>" + fmtDate(j.createdAt) + "</dd>" +
      "</dl>" +
      '<div class="linkrow" style="margin-top:.7rem">' +
      (j.address ? '<a target="_blank" rel="noopener" href="' + esc(mapsUrl(j)) + '">📍 Map</a>' : "") +
      (links.roofr ? '<a target="_blank" rel="noopener" href="' + esc(links.roofr) + '">📐 Roofr</a>' : "") +
      (links.companycam ? '<a target="_blank" rel="noopener" href="' + esc(links.companycam) + '">📷 CompanyCam</a>' : "") +
      (links.dropbox ? '<a target="_blank" rel="noopener" href="' + esc(links.dropbox) + '">📦 Dropbox</a>' : "") +
      (links.other ? '<a target="_blank" rel="noopener" href="' + esc(links.other) + '">🔗 Link</a>' : "") +
      "</div></div>" +

      (j.jobType === "Insurance" ?
        '<div class="card"><h2>🛡️ Insurance</h2><dl class="kv">' +
        "<dt>Carrier</dt><dd>" + esc(ins.carrier || "—") + "</dd>" +
        "<dt>Claim #</dt><dd>" + esc(ins.claimNumber || "—") + "</dd>" +
        "<dt>Adjuster</dt><dd>" + esc(ins.adjusterName || "—") + (ins.adjusterPhone ? ' · <a href="tel:' + esc(ins.adjusterPhone) + '">' + esc(ins.adjusterPhone) + "</a>" : "") + "</dd>" +
        "<dt>RCV</dt><dd>" + (numVal(ins.rcv) ? money(ins.rcv) : "—") + "</dd>" +
        "<dt>Deductible</dt><dd>" + (ded ? money(ded) : "—") + "</dd>" +
        "<dt>ACV not in scope</dt><dd>" + (acv ? money(acv) : "—") + "</dd>" +
        "<dt>Supplements</dt><dd>" + esc(ins.supplements || "—") + "</dd>" +
        "</dl>" +
        (ded ? '<div class="calc">💡 <b>Deductible offset:</b> ACV on items not in scope covers <strong class="' + (offsetPct >= 100 ? "good" : "bad") + '">' + money(offsetCovered) + " (" + offsetPct + "%)</strong> of the " + money(ded) + " deductible → customer's true out-of-pocket ≈ <b>" + money(outOfPocket) + "</b>.</div>" : "") +
        "</div>" : "") +

      '<div class="card"><h2>💰 Money</h2>' +
      '<div class="form-grid">' +
      '<div><label>Our cost (materials + labor)</label><input id="m-cost" inputmode="decimal" value="' + esc(m.cost) + '"></div>' +
      '<div><label>Estimate (quoted)</label><input id="m-estimate" inputmode="decimal" value="' + esc(m.estimate) + '"></div>' +
      '<div><label>Contract price</label><input id="m-price" inputmode="decimal" value="' + esc(m.contractPrice) + '"></div>' +
      "</div>" +
      (cost > 0 ? '<div class="calc">🧮 <b>Sale price check:</b> ' + money(cost) + " cost × " + (Number(s.markup) || 2) + "x = <b>" + money(cost * (Number(s.markup) || 2)) + "</b>" +
        (suggested > cost * (Number(s.markup) || 2) ? " → floored at the " + money(s.minSale) + " minimum" : "") +
        " → charge at least <strong class=\"good\">" + money(suggested) + "</strong>." +
        (numVal(m.contractPrice) && numVal(m.contractPrice) < suggested ? ' <strong class="bad">Contract is below the rule!</strong>' : "") + "</div>" : "") +
      '<div class="form-actions"><button class="btn small" id="save-money">Save numbers</button></div>' +
      "<h2 style=\"margin-top:1rem\">Payments</h2>" +
      (payRows ? '<div class="table-scroll"><table><thead><tr><th>Date</th><th>Method</th><th class="num">Amount</th><th>Note</th><th></th></tr></thead><tbody>' + payRows + "</tbody></table></div>" : '<p class="empty">No payments logged.</p>') +
      '<dl class="kv" style="margin-top:.6rem"><dt>Collected</dt><dd><b>' + money(paid) + "</b></dd>" +
      "<dt>Balance</dt><dd><b" + (balance > 0 && numVal(m.contractPrice) ? ' style="color:var(--red-dark)"' : "") + ">" + (numVal(m.contractPrice) ? money(balance) : "—") + "</b></dd></dl>" +
      '<form id="pay-form" class="form-grid" style="margin-top:.6rem">' +
      '<div><label>Date</label><input type="date" id="p-date" value="' + isoToday() + '"></div>' +
      '<div><label>Amount</label><input id="p-amount" inputmode="decimal" placeholder="0" required></div>' +
      '<div><label>Method</label><select id="p-method"><option>Check</option><option>Insurance check</option><option>Cash</option><option>Card</option><option>Financing</option><option>Other</option></select></div>' +
      '<div><label>Note</label><input id="p-note" placeholder="e.g. deductible, final"></div>' +
      '<div class="form-actions" style="margin:0;align-self:end"><button class="btn small primary">+ Log payment</button></div>' +
      "</form></div>" +
      "</div>" +

      "<div>" +
      '<div class="card"><h2>✅ Checklist <span class="sub" style="margin:0;font-weight:400">(' + openTasks.length + " open)</span></h2>" +
      taskListHTML(openTasks, false) +
      '<form id="task-form" class="form-grid" style="margin-top:.7rem">' +
      '<div class="wide"><label>Add a task</label><input id="t-title" placeholder="e.g. Drop off shingle samples" required></div>' +
      '<div><label>Due</label><input type="date" id="t-due"></div>' +
      '<div class="form-actions" style="margin:0;align-self:end"><button class="btn small primary">+ Add</button></div>' +
      "</form>" +
      (doneTasks.length ? "<details style=\"margin-top:.6rem\"><summary class=\"sub\" style=\"cursor:pointer;margin:0\">Done (" + doneTasks.length + ")</summary>" + taskListHTML(doneTasks, false) + "</details>" : "") +
      "</div>" +
      '<div class="card"><h2>📝 Notes & history</h2>' +
      '<form id="note-form"><textarea id="note-text" placeholder="What happened? Call notes, adjuster talk, change orders…"></textarea>' +
      '<div class="form-actions"><button class="btn small primary">+ Add note</button></div></form>' +
      '<div class="timeline" style="margin-top:.6rem">' +
      (timeline.length ? timeline.map(function (t) { return "<div><time>" + fmtDT(t.ts) + "</time>" + t.html + "</div>"; }).join("") : '<p class="empty">No notes yet.</p>') +
      "</div></div>" +
      "</div></div>";

    /* --- wiring --- */
    wireTaskCheckboxes(view);

    document.getElementById("stepper").querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        var st = b.getAttribute("data-stage");
        if (st === "lost" && j.stage !== "lost") {
          var reason = prompt("Marking as lost — why? (optional)");
          if (reason === null) return;
          j.lostReason = reason || "";
        }
        setStage(j, st);
        render();
      });
    });

    document.getElementById("edit-job").addEventListener("click", function () { openJobModal(j); });
    document.getElementById("del-job").addEventListener("click", function () {
      if (!confirm("Delete " + j.name + " and all their tasks/notes? This can't be undone.")) return;
      state.jobs = state.jobs.filter(function (x) { return x.id !== j.id; });
      state.tasks = state.tasks.filter(function (t) { return t.jobId !== j.id; });
      logActivity("", "Deleted job — " + j.name);
      save();
      location.hash = "#/jobs";
    });

    document.getElementById("save-money").addEventListener("click", function () {
      m.cost = document.getElementById("m-cost").value.trim();
      m.estimate = document.getElementById("m-estimate").value.trim();
      var newPrice = document.getElementById("m-price").value.trim();
      if (newPrice !== m.contractPrice && numVal(newPrice)) logActivity(j.id, "Contract price set to " + money(newPrice) + " — " + j.name);
      m.contractPrice = newPrice;
      j.updatedAt = Date.now();
      save(); render();
      toast("Numbers saved");
    });

    document.getElementById("pay-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var amt = numVal(document.getElementById("p-amount").value);
      if (!amt) return;
      m.payments = m.payments || [];
      m.payments.push({
        date: document.getElementById("p-date").value || isoToday(),
        amount: amt,
        method: document.getElementById("p-method").value,
        note: document.getElementById("p-note").value.trim()
      });
      j.updatedAt = Date.now();
      logActivity(j.id, "Payment logged: " + money(amt) + " — " + j.name);
      save(); render();
    });
    view.querySelectorAll("button[data-delpay]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = Number(b.getAttribute("data-delpay"));
        if (!confirm("Remove this payment?")) return;
        m.payments.splice(i, 1);
        j.updatedAt = Date.now();
        save(); render();
      });
    });

    document.getElementById("task-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var title = document.getElementById("t-title").value.trim();
      if (!title) return;
      state.tasks.push({ id: uid(), jobId: j.id, title: title, due: document.getElementById("t-due").value, done: false, doneAt: 0, createdAt: Date.now() });
      j.updatedAt = Date.now();
      save(); render();
    });

    document.getElementById("note-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var text = document.getElementById("note-text").value.trim();
      if (!text) return;
      j.notes = j.notes || [];
      j.notes.unshift({ ts: Date.now(), text: text });
      j.updatedAt = Date.now();
      save(); render();
    });
  }

  /* ======================================================================
     Job create/edit modal
     ====================================================================== */

  function openJobModal(job) {
    var isNew = !job;
    var j = job || { name: "", phone: "", email: "", address: "", city: "", jobType: "Insurance", source: "Referral", roofType: "", squares: "",
      insurance: { carrier: "", claimNumber: "", adjusterName: "", adjusterPhone: "", rcv: "", deductible: "", acvOffset: "", supplements: "" },
      links: { roofr: "", companycam: "", dropbox: "", other: "" }, scheduledDate: "", crewId: "" };

    var back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = '<div class="modal"><h2>' + (isNew ? "New job" : "Edit job") + "</h2>" +
      '<form id="job-form"><div class="form-grid">' +
      f("Customer name *", "name", j.name, "text", true) +
      f("Phone", "phone", j.phone, "tel") +
      f("Email", "email", j.email, "email") +
      f("Address", "address", j.address) +
      f("City", "city", j.city) +
      sel("Job type", "jobType", JOB_TYPES, j.jobType) +
      sel("Lead source", "source", SOURCES, j.source) +
      f("Roof type", "roofType", j.roofType, "text", false, "e.g. Asphalt shingle") +
      f("Squares", "squares", j.squares, "text", false, "e.g. 28") +
      f("Start date", "scheduledDate", j.scheduledDate, "date") +
      '<div><label>Crew</label><select name="crewId"><option value="">—</option>' + state.crews.map(function (c) {
        return '<option value="' + esc(c.id) + '"' + (j.crewId === c.id ? " selected" : "") + ">" + esc(c.name) + "</option>";
      }).join("") + "</select></div>" +
      '</div><h2 style="margin-top:1rem">Insurance</h2><div class="form-grid">' +
      f("Carrier", "ins.carrier", j.insurance.carrier) +
      f("Claim #", "ins.claimNumber", j.insurance.claimNumber) +
      f("Adjuster name", "ins.adjusterName", j.insurance.adjusterName) +
      f("Adjuster phone", "ins.adjusterPhone", j.insurance.adjusterPhone, "tel") +
      f("RCV total", "ins.rcv", j.insurance.rcv, "text", false, "$") +
      f("Deductible", "ins.deductible", j.insurance.deductible, "text", false, "$") +
      f("ACV not in scope", "ins.acvOffset", j.insurance.acvOffset, "text", false, "$ — offsets the deductible") +
      f("Supplements", "ins.supplements", j.insurance.supplements, "text", false, "status / amounts") +
      '</div><h2 style="margin-top:1rem">Links</h2><div class="form-grid">' +
      f("Roofr proposal / report", "links.roofr", j.links.roofr, "url") +
      f("CompanyCam project", "links.companycam", j.links.companycam, "url") +
      f("Dropbox folder", "links.dropbox", j.links.dropbox, "url") +
      f("Other link", "links.other", j.links.other, "url") +
      "</div>" +
      '<div class="form-actions"><button class="btn primary" type="submit">' + (isNew ? "Create job" : "Save changes") + "</button>" +
      '<button class="btn" type="button" id="job-cancel">Cancel</button></div></form></div>';

    function f(label, name, val, type, req, ph) {
      return "<div><label>" + esc(label) + '</label><input name="' + esc(name) + '" type="' + (type || "text") + '" value="' + esc(val || "") + '"' +
        (req ? " required" : "") + (ph ? ' placeholder="' + esc(ph) + '"' : "") + "></div>";
    }
    function sel(label, name, opts, val) {
      return "<div><label>" + esc(label) + '</label><select name="' + esc(name) + '">' + opts.map(function (o) {
        return "<option" + (o === val ? " selected" : "") + ">" + esc(o) + "</option>";
      }).join("") + "</select></div>";
    }

    document.body.appendChild(back);
    back.addEventListener("click", function (e) { if (e.target === back) back.remove(); });
    back.querySelector("#job-cancel").addEventListener("click", function () { back.remove(); });
    back.querySelector("input[name=name]").focus();

    back.querySelector("#job-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      function g(n) { return String(fd.get(n) || "").trim(); }
      var fields = {
        name: g("name"), phone: g("phone"), email: g("email"), address: g("address"), city: g("city"),
        jobType: g("jobType"), source: g("source"), roofType: g("roofType"), squares: g("squares")
      };
      var target = isNew ? newJob(fields) : job;
      if (!isNew) for (var k in fields) target[k] = fields[k];
      target.scheduledDate = g("scheduledDate");
      target.crewId = g("crewId");
      target.insurance.carrier = g("ins.carrier");
      target.insurance.claimNumber = g("ins.claimNumber");
      target.insurance.adjusterName = g("ins.adjusterName");
      target.insurance.adjusterPhone = g("ins.adjusterPhone");
      target.insurance.rcv = g("ins.rcv");
      target.insurance.deductible = g("ins.deductible");
      target.insurance.acvOffset = g("ins.acvOffset");
      target.insurance.supplements = g("ins.supplements");
      target.links.roofr = g("links.roofr");
      target.links.companycam = g("links.companycam");
      target.links.dropbox = g("links.dropbox");
      target.links.other = g("links.other");
      target.updatedAt = Date.now();
      save();
      back.remove();
      toast(isNew ? "Job created — playbook tasks added ✅" : "Saved");
      location.hash = "#/job/" + target.id;
      render();
    });
  }

  document.getElementById("new-job-btn").addEventListener("click", function () { openJobModal(null); });

  /* ======================================================================
     Tasks
     ====================================================================== */

  function renderTasks() {
    var open = state.tasks.filter(function (t) { return !t.done; });
    var groups = { overdue: [], today: [], upcoming: [], someday: [] };
    open.forEach(function (t) { groups[dueBucket(t.due)].push(t); });
    groups.overdue.sort(byDue); groups.today.sort(byDue); groups.upcoming.sort(byDue);
    function byDue(a, b) { return (a.due || "9999") < (b.due || "9999") ? -1 : 1; }
    var doneRecent = state.tasks.filter(function (t) { return t.done; })
      .sort(function (a, b) { return b.doneAt - a.doneAt; }).slice(0, 20);

    function section(title, arr) {
      return '<div class="card"><h2>' + title + " (" + arr.length + ")</h2>" + taskListHTML(arr, true) + "</div>";
    }

    view.innerHTML = '<div class="page-head"><h1>Tasks</h1></div>' +
      '<div class="card"><form id="quick-task" class="form-grid">' +
      '<div class="wide"><label>New task</label><input id="qt-title" placeholder="e.g. Call the supplier about the Smith order" required></div>' +
      '<div><label>Due</label><input type="date" id="qt-due"></div>' +
      '<div><label>Job (optional)</label><select id="qt-job"><option value="">— none —</option>' +
      state.jobs.slice().sort(function (a, b) { return a.name < b.name ? -1 : 1; }).map(function (jx) {
        return '<option value="' + esc(jx.id) + '">' + esc(jx.name) + "</option>";
      }).join("") + "</select></div>" +
      '<div class="form-actions" style="margin:0;align-self:end"><button class="btn primary small">+ Add task</button></div>' +
      "</form></div>" +
      '<div class="grid2"><div>' +
      section("🔴 Overdue", groups.overdue) +
      section("🟡 Today", groups.today) +
      "</div><div>" +
      section("📅 Upcoming", groups.upcoming) +
      section("🗒️ No due date", groups.someday) +
      "</div></div>" +
      (doneRecent.length ? '<div class="card"><h2>✔ Recently done</h2>' + taskListHTML(doneRecent, true) + "</div>" : "");

    wireTaskCheckboxes(view);
    document.getElementById("quick-task").addEventListener("submit", function (e) {
      e.preventDefault();
      var title = document.getElementById("qt-title").value.trim();
      if (!title) return;
      state.tasks.push({
        id: uid(), jobId: document.getElementById("qt-job").value, title: title,
        due: document.getElementById("qt-due").value, done: false, doneAt: 0, createdAt: Date.now()
      });
      save(); render();
    });
  }

  /* ======================================================================
     Contacts
     ====================================================================== */

  var contactQ = "";

  function renderContacts() {
    var q = contactQ.toLowerCase();
    var rows = state.contacts.filter(function (c) {
      if (!q) return true;
      return (c.name + " " + c.company + " " + c.phone + " " + c.email + " " + c.type).toLowerCase().indexOf(q) >= 0;
    }).sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });

    view.innerHTML = '<div class="page-head"><h1>Contacts</h1><div class="spacer"></div>' +
      '<button class="btn primary" id="add-contact">+ Add contact</button></div>' +
      '<p class="sub">Adjusters, suppliers, subs, realtors — the people around the jobs. Customers live on their job.</p>' +
      '<div class="search-row"><input type="search" id="c-q" placeholder="Search contacts…" value="' + esc(contactQ) + '"></div>' +
      (rows.length ?
        '<div class="table-scroll"><table><thead><tr><th>Name</th><th>Type</th><th>Company</th><th>Phone</th><th>Email</th><th>Notes</th><th></th></tr></thead><tbody>' +
        rows.map(function (c) {
          return "<tr><td><b>" + esc(c.name) + '</b></td><td><span class="chip type">' + esc(c.type) + "</span></td><td>" + esc(c.company || "") + "</td>" +
            "<td>" + (c.phone ? '<a href="tel:' + esc(c.phone) + '">' + esc(c.phone) + "</a>" : "") + "</td>" +
            "<td>" + (c.email ? '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a>" : "") + "</td>" +
            "<td>" + esc(c.notes || "") + "</td>" +
            '<td style="white-space:nowrap"><button class="btn small" data-edit="' + esc(c.id) + '">Edit</button> ' +
            '<button class="btn small danger" data-del="' + esc(c.id) + '">✕</button></td></tr>';
        }).join("") + "</tbody></table></div>"
        : '<div class="card"><p class="empty">No contacts yet.</p></div>');

    document.getElementById("c-q").addEventListener("input", function (e) { contactQ = e.target.value; renderContacts(); });
    document.getElementById("add-contact").addEventListener("click", function () { openContactModal(null); });
    view.querySelectorAll("button[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { openContactModal(contactById(b.getAttribute("data-edit"))); });
    });
    view.querySelectorAll("button[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        var c = contactById(b.getAttribute("data-del"));
        if (c && confirm("Delete " + c.name + "?")) {
          state.contacts = state.contacts.filter(function (x) { return x.id !== c.id; });
          save(); render();
        }
      });
    });
  }

  function openContactModal(contact) {
    var isNew = !contact;
    var c = contact || { name: "", type: "Adjuster", company: "", phone: "", email: "", notes: "" };
    var back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = '<div class="modal"><h2>' + (isNew ? "New contact" : "Edit contact") + "</h2>" +
      '<form id="c-form"><div class="form-grid">' +
      '<div><label>Name *</label><input name="name" required value="' + esc(c.name) + '"></div>' +
      '<div><label>Type</label><select name="type">' + CONTACT_TYPES.map(function (t) {
        return "<option" + (t === c.type ? " selected" : "") + ">" + esc(t) + "</option>";
      }).join("") + "</select></div>" +
      '<div><label>Company</label><input name="company" value="' + esc(c.company) + '"></div>' +
      '<div><label>Phone</label><input name="phone" type="tel" value="' + esc(c.phone) + '"></div>' +
      '<div><label>Email</label><input name="email" type="email" value="' + esc(c.email) + '"></div>' +
      '<div class="wide"><label>Notes</label><input name="notes" value="' + esc(c.notes) + '"></div>' +
      '</div><div class="form-actions"><button class="btn primary">' + (isNew ? "Add" : "Save") + "</button>" +
      '<button class="btn" type="button" id="c-cancel">Cancel</button></div></form></div>';
    document.body.appendChild(back);
    back.addEventListener("click", function (e) { if (e.target === back) back.remove(); });
    back.querySelector("#c-cancel").addEventListener("click", function () { back.remove(); });
    back.querySelector("input[name=name]").focus();
    back.querySelector("#c-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      function g(n) { return String(fd.get(n) || "").trim(); }
      if (isNew) { c.id = uid(); state.contacts.push(c); }
      c.name = g("name"); c.type = g("type"); c.company = g("company");
      c.phone = g("phone"); c.email = g("email"); c.notes = g("notes");
      save(); back.remove(); render();
    });
  }

  /* ======================================================================
     Crews
     ====================================================================== */

  function renderCrews() {
    view.innerHTML = '<div class="page-head"><h1>Crews</h1><div class="spacer"></div>' +
      '<button class="btn primary" id="add-crew">+ Add crew</button></div>' +
      '<div class="grid2">' +
      (state.crews.length ? state.crews.map(function (c) {
        var assigned = state.jobs.filter(function (j) { return j.crewId === c.id && ACTIVE_STAGES.indexOf(j.stage) >= 0; });
        return '<div class="card"><h2>👷 ' + esc(c.name) + "</h2><dl class=\"kv\">" +
          "<dt>Lead</dt><dd>" + esc(c.lead || "—") + "</dd>" +
          "<dt>Phone</dt><dd>" + (c.phone ? '<a href="tel:' + esc(c.phone) + '">' + esc(c.phone) + "</a>" : "—") + "</dd>" +
          "<dt>Notes</dt><dd>" + esc(c.notes || "—") + "</dd></dl>" +
          "<h2 style=\"margin-top:.8rem\">Active jobs (" + assigned.length + ")</h2>" +
          (assigned.length ? "<ul class=\"checklist\">" + assigned.map(function (j) {
            return "<li><div>" + jobLink(j.id, j.name) + " — " + stageChip(j.stage) + (j.scheduledDate ? ' <span class="t-due">starts ' + esc(j.scheduledDate) + "</span>" : "") + "</div></li>";
          }).join("") + "</ul>" : '<p class="empty">Nothing assigned.</p>') +
          '<div class="form-actions"><button class="btn small" data-edit="' + esc(c.id) + '">Edit</button>' +
          '<button class="btn small danger" data-del="' + esc(c.id) + '">Delete</button></div></div>';
      }).join("") : '<div class="card"><p class="empty">No crews yet — add your install crews so you can assign jobs and see who\'s where.</p></div>') +
      "</div>";

    document.getElementById("add-crew").addEventListener("click", function () { openCrewModal(null); });
    view.querySelectorAll("button[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { openCrewModal(crewById(b.getAttribute("data-edit"))); });
    });
    view.querySelectorAll("button[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        var c = crewById(b.getAttribute("data-del"));
        if (c && confirm("Delete crew " + c.name + "? Jobs assigned to it will show no crew.")) {
          state.crews = state.crews.filter(function (x) { return x.id !== c.id; });
          state.jobs.forEach(function (j) { if (j.crewId === c.id) j.crewId = ""; });
          save(); render();
        }
      });
    });
  }

  function openCrewModal(crew) {
    var isNew = !crew;
    var c = crew || { name: "", lead: "", phone: "", notes: "" };
    var back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = '<div class="modal"><h2>' + (isNew ? "New crew" : "Edit crew") + "</h2>" +
      '<form id="crew-form"><div class="form-grid">' +
      '<div><label>Crew name *</label><input name="name" required value="' + esc(c.name) + '"></div>' +
      '<div><label>Crew lead</label><input name="lead" value="' + esc(c.lead) + '"></div>' +
      '<div><label>Phone</label><input name="phone" type="tel" value="' + esc(c.phone) + '"></div>' +
      '<div class="wide"><label>Notes</label><input name="notes" value="' + esc(c.notes) + '" placeholder="specialties, rates, language…"></div>' +
      '</div><div class="form-actions"><button class="btn primary">' + (isNew ? "Add" : "Save") + "</button>" +
      '<button class="btn" type="button" id="crew-cancel">Cancel</button></div></form></div>';
    document.body.appendChild(back);
    back.addEventListener("click", function (e) { if (e.target === back) back.remove(); });
    back.querySelector("#crew-cancel").addEventListener("click", function () { back.remove(); });
    back.querySelector("input[name=name]").focus();
    back.querySelector("#crew-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      function g(n) { return String(fd.get(n) || "").trim(); }
      if (isNew) { c.id = uid(); state.crews.push(c); }
      c.name = g("name"); c.lead = g("lead"); c.phone = g("phone"); c.notes = g("notes");
      save(); back.remove(); render();
    });
  }

  /* ======================================================================
     Settings
     ====================================================================== */

  function renderSettings() {
    var s = state.settings;
    view.innerHTML = '<div class="page-head"><h1>Settings</h1></div>' +
      '<div class="grid2"><div>' +

      '<div class="card"><h2>🏢 Company defaults</h2>' +
      '<form id="s-form"><div class="form-grid">' +
      '<div><label>Company name</label><input name="companyName" value="' + esc(s.companyName) + '"></div>' +
      '<div><label>Sales markup (×)</label><input name="markup" inputmode="decimal" value="' + esc(s.markup) + '"></div>' +
      '<div><label>Minimum sale ($)</label><input name="minSale" inputmode="decimal" value="' + esc(s.minSale) + '"></div>' +
      '<div><label>Work calendar email</label><input name="calendarEmail" value="' + esc(s.calendarEmail) + '"></div>' +
      '<div class="wide"><label>Google review link</label><input name="reviewLink" type="url" value="' + esc(s.reviewLink) + '" placeholder="https://g.page/r/…"></div>' +
      '</div><div class="form-actions"><button class="btn primary">Save</button></div></form>' +
      '<p class="sub" style="margin:.6rem 0 0">The markup and minimum drive the sale-price check on every job\'s Money card.</p></div>' +

      '<div class="card"><h2>💾 Backup</h2>' +
      "<p class=\"sub\" style=\"margin:0 0 .6rem\">Everything lives on this device. Export a JSON backup regularly, or turn on cloud sync →</p>" +
      '<div class="form-actions">' +
      '<button class="btn" id="export-btn">⬇ Export backup (.json)</button>' +
      '<label class="btn" style="display:inline-block">⬆ Import backup<input type="file" id="import-file" accept=".json,application/json" style="display:none"></label>' +
      "</div></div>" +

      '<div class="card danger-zone"><h2>⚠️ Danger zone</h2>' +
      '<div class="form-actions"><button class="btn danger" id="wipe-btn">Erase everything on this device</button></div></div>' +

      "</div><div>" +

      '<div class="card"><h2>☁️ Cloud sync <span class="sub" style="margin:0;font-weight:400">(optional)</span></h2>' +
      "<p class=\"sub\" style=\"margin:0 0 .6rem\">Point every device at the same free Google Apps Script backend and the whole company shares one book. Setup guide: <b>CRM-SETUP.md</b> in the repo.</p>" +
      '<form id="sync-form"><div class="form-grid">' +
      '<div class="wide"><label>Apps Script web app URL</label><input name="syncUrl" type="url" value="' + esc(s.syncUrl) + '" placeholder="https://script.google.com/macros/s/…/exec"></div>' +
      '<div class="wide"><label>Sync key</label><input name="syncKey" type="password" value="' + esc(s.syncKey) + '" placeholder="the SECRET you set in Code.gs"></div>' +
      '</div><div class="form-actions"><button class="btn primary">Save sync settings</button></div></form>' +
      '<div class="form-actions" style="margin-top:.6rem">' +
      '<button class="btn" id="push-btn">☁️ Push to cloud now</button>' +
      '<button class="btn" id="pull-btn">⬇ Pull from cloud</button></div>' +
      '<p class="sub" style="margin:.6rem 0 0">Last push: ' + (s.lastSync ? fmtDT(s.lastSync) : "never") + ". When sync is on, changes auto-push a few seconds after you make them.</p></div>" +

      '<div class="card"><h2>📈 Book at a glance</h2><dl class="kv">' +
      "<dt>Jobs</dt><dd>" + state.jobs.length + "</dd>" +
      "<dt>Contacts</dt><dd>" + state.contacts.length + "</dd>" +
      "<dt>Crews</dt><dd>" + state.crews.length + "</dd>" +
      "<dt>Tasks</dt><dd>" + state.tasks.length + "</dd>" +
      "<dt>Activity entries</dt><dd>" + state.activity.length + "</dd></dl></div>" +

      "</div></div>";

    document.getElementById("s-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      s.companyName = String(fd.get("companyName") || "").trim() || "T^Rock Contracting";
      s.markup = numVal(fd.get("markup")) || 2;
      s.minSale = numVal(fd.get("minSale")) || 500;
      s.calendarEmail = String(fd.get("calendarEmail") || "").trim();
      s.reviewLink = String(fd.get("reviewLink") || "").trim();
      save(); toast("Saved"); render();
    });

    document.getElementById("sync-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      s.syncUrl = String(fd.get("syncUrl") || "").trim();
      s.syncKey = String(fd.get("syncKey") || "").trim();
      save(); toast("Sync settings saved"); render();
    });

    document.getElementById("push-btn").addEventListener("click", function () { pushCloud(false); });
    document.getElementById("pull-btn").addEventListener("click", pullCloud);

    document.getElementById("export-btn").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "trock-crm-backup-" + isoToday() + ".json";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });

    document.getElementById("import-file").addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var s2 = JSON.parse(reader.result);
          if (!s2 || !Array.isArray(s2.jobs)) throw new Error("bad file");
          if (!confirm("Replace everything on this device with this backup (" + s2.jobs.length + " jobs)?")) return;
          state = s2;
          var base = freshState();
          state.settings = state.settings || base.settings;
          save(); toast("Backup imported"); render();
        } catch (err) { toast("That file doesn't look like a CRM backup."); }
      };
      reader.readAsText(file);
    });

    document.getElementById("wipe-btn").addEventListener("click", function () {
      if (!confirm("Erase ALL CRM data on this device? Export a backup first if you're not sure.")) return;
      if (!confirm("Last chance — this deletes every job, task, contact and note stored here.")) return;
      state = freshState();
      try { localStorage.removeItem(DB_KEY); } catch (e) {}
      save(); render();
      toast("Wiped clean");
    });
  }

  /* ======================================================================
     Boot
     ====================================================================== */

  render();
})();
