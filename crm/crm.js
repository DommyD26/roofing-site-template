/* T^Rock CRM — local-first job command center.
   No build step, no accounts: everything saves to this device instantly,
   backs up to JSON on demand, and optionally syncs the whole company book
   to your own Google Apps Script backend (see crm/Code.gs + CRM-SETUP.md). */

(function () {
  "use strict";

  /* ======================================================================
     Pipeline definition — the stages ARE the company process. Moving a job
     into a stage auto-creates that stage's playbook as tasks on the job.
     Each playbook item: t = title, d = due N days after entering the stage
     (null = no due date), insOnly = insurance jobs only, retailT = wording
     used instead of t on non-insurance jobs. The Insurance stage itself is
     hidden entirely for non-insurance jobs.
     ====================================================================== */

  var STAGES = [
    { id: "lead", label: "New Lead", playbook: [
      { t: "Call the lead back", d: 1 },
      { t: "Schedule the inspection on the work calendar", d: 2 }
    ]},
    { id: "inspection", label: "Inspection", playbook: [
      { t: "Full inspection — roof, attic & interior", d: 2 },
      { t: "Photos into CompanyCam", d: 2 },
      { t: "Write & send the inspection summary", d: 3 }
    ]},
    { id: "proposal", label: "Proposal", playbook: [
      { t: "Order the Roofr measurement report", d: 1 },
      { t: "Write the scope of work (summary + detailed + Roofr paste block)", d: 2 },
      { t: "Price it — 2.0x markup, $500 minimum", d: 2 },
      { t: "Build the client deck (deductible offset analysis)", d: 3, retailT: "Build the client deck" },
      { t: "Send the proposal", d: 3 },
      { t: "Follow up on the proposal", d: 5 }
    ]},
    { id: "insurance", label: "Insurance", insOnly: true, playbook: [
      { t: "Confirm the claim is filed & get the claim #", d: 2 },
      { t: "Meet the adjuster on site", d: 7 },
      { t: "Review the loss statement — RCV / ACV / deductible", d: 8 },
      { t: "Submit supplements if the scope is short", d: 10 }
    ]},
    { id: "approved", label: "Approved", playbook: [
      { t: "Get the contract signed", d: 2 },
      { t: "Collect the deductible / first payment", d: 3, retailT: "Collect the deposit / first payment" },
      { t: "Order materials", d: 5 },
      { t: "Assign a crew & put the start date on the calendar", d: 5 }
    ]},
    { id: "production", label: "In Production", playbook: [
      { t: "Job-start walkthrough with the crew lead", d: 1 },
      { t: "Daily photos into CompanyCam", d: null },
      { t: "Daily field summary", d: null },
      { t: "Final walkthrough & punch list", d: 7 }
    ]},
    { id: "complete", label: "Job Complete", playbook: [
      { t: "Build the CompanyCam photo report", d: 1 },
      { t: "Send the final invoice", d: 1 },
      { t: "Send the final email — photo report + invoice + Google review ask", d: 2 }
    ]},
    { id: "paid", label: "Paid & Closed", playbook: [
      { t: "Confirm paid in full", d: 1 },
      { t: "Register the warranty", d: 7 },
      { t: "Ask for referrals", d: 7 }
    ]},
    { id: "lost", label: "Lost", playbook: [] }
  ];
  var ACTIVE_STAGES = ["lead", "inspection", "proposal", "insurance", "approved", "production", "complete"];
  var JOB_TYPES = ["Insurance", "Retail", "Repair", "Warranty"];
  var SOURCES = ["Referral", "Door knock", "Google", "Facebook", "Yard sign", "Repeat customer", "Adjuster", "Other"];
  var CONTACT_TYPES = ["Customer", "Adjuster", "Supplier", "Sub / Crew", "Realtor", "Other"];
  var CLAIM_STATUSES = ["Not filed", "Filed", "Adjuster scheduled", "Estimate received", "Approved", "Supplements pending", "Depreciation pending", "Claim closed"];
  var EXPENSE_CATS = ["Materials", "Subcontractor", "Dump / disposal", "Permits", "Equipment rental", "Fuel", "Other"];
  var ONBOARD_DOCS = [
    { k: "w9", label: "W-9 on file" },
    { k: "coi", label: "COI (insurance cert) on file" },
    { k: "agreement", label: "Subcontractor agreement signed" },
    { k: "companycam", label: "Added to CompanyCam" },
    { k: "trained", label: "Completed the training course" }
  ];

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
  function jobExpenses(j) {
    var sum = 0;
    (j.expenses || []).forEach(function (e) { sum += numVal(e.amount); });
    return sum;
  }
  /* True job cost: logged expenses when there are any, else the manual estimate. */
  function jobCost(j) {
    var exp = jobExpenses(j);
    return exp > 0 ? exp : numVal(j.money.cost);
  }
  function suppApproved(ins) {
    if (ins.supplementItems && ins.supplementItems.length) {
      var s = 0;
      ins.supplementItems.forEach(function (it) { s += numVal(it.approved); });
      return s;
    }
    return numVal(ins.supplementsAmount);
  }
  /* What the carrier has actually sent = payments logged as insurance checks. */
  function insReceived(j) {
    var s = 0;
    (j.money.payments || []).forEach(function (p) { if (p.method === "Insurance check") s += numVal(p.amount); });
    return s;
  }
  function subPaid(j) {
    var s = 0;
    (j.expenses || []).forEach(function (e) { if (e.category === "Subcontractor") s += numVal(e.amount); });
    return s;
  }
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
      insurance: { carrier: "", claimNumber: "", adjusterName: "", adjusterPhone: "", rcv: "", deductible: "", acvOffset: "", supplementsAmount: "", supplements: "", claimStatus: "", supplementItems: [] },
      money: { estimate: "", cost: "", contractPrice: "", payments: [] },
      expenses: [],
      production: { workOrder: "", subContract: "" },
      links: { roofr: "", companycam: "", dropbox: "", other: "" },
      notes: []
    };
    state.jobs.unshift(j);
    logActivity(j.id, "Job created — " + j.name + " (" + stageById(j.stage).label + ")");
    addPlaybookTasks(j, j.stage);
    return j;
  }

  function isInsuranceJob(job) { return job.jobType === "Insurance"; }

  /* Stages this job actually passes through (retail/repair skip Insurance). */
  function stagesForJob(job) {
    return STAGES.filter(function (st) { return !st.insOnly || isInsuranceJob(job); });
  }

  function isoPlus(n) {
    var d = new Date(); d.setDate(d.getDate() + n);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function addPlaybookTasks(job, stageId) {
    var st = stageById(stageId);
    st.playbook.forEach(function (item) {
      if (item.insOnly && !isInsuranceJob(job)) return;
      var title = (!isInsuranceJob(job) && item.retailT) ? item.retailT : item.t;
      var exists = state.tasks.some(function (t) {
        return t.jobId === job.id && (t.title === item.t || (item.retailT && t.title === item.retailT));
      });
      if (!exists) state.tasks.push({
        id: uid(), jobId: job.id, title: title,
        due: item.d == null ? "" : isoPlus(item.d),
        done: false, doneAt: 0, createdAt: Date.now()
      });
    });
  }

  function setStage(job, stageId) {
    if (job.stage === stageId) return;
    if (stageId === "insurance" && !isInsuranceJob(job)) {
      toast(job.jobType + " jobs skip the Insurance stage");
      return;
    }
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
    else if (r === "schedule") renderSchedule();
    else if (r === "reports") renderReports();
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
        "</div>" +
        '<button class="t-del" data-deltask="' + esc(t.id) + '" title="Delete task" aria-label="Delete task">✕</button>' +
        "</li>";
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
    rootEl.querySelectorAll("button[data-deltask]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-deltask");
        var t = state.tasks.filter(function (x) { return x.id === id; })[0];
        if (!t) return;
        if (!confirm("Delete task “" + t.title + "”?")) return;
        state.tasks = state.tasks.filter(function (x) { return x.id !== id; });
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

    var installs = state.jobs.filter(function (j) {
      return j.scheduledDate && j.scheduledDate >= isoToday() && j.scheduledDate <= addDays(7) &&
        (j.stage === "approved" || j.stage === "production");
    }).sort(function (a, b) { return a.scheduledDate < b.scheduledDate ? -1 : 1; });

    /* alerts: sub compliance + carrier money still out on finished work */
    var coiProblems = state.crews.filter(function (c) { return coiState(c) === "expired" || coiState(c) === "expiring"; });
    var carrierOut = state.jobs.filter(function (j) {
      if (j.jobType !== "Insurance" || !numVal(j.insurance.rcv)) return false;
      if (j.stage !== "production" && j.stage !== "complete" && j.stage !== "paid") return false;
      var expected = numVal(j.insurance.rcv) + suppApproved(j.insurance) - numVal(j.insurance.deductible);
      return expected - insReceived(j) > 0.5;
    });
    var alertsHtml = "";
    if (coiProblems.length || carrierOut.length) {
      alertsHtml = '<div class="card danger-zone"><h2>🚨 Alerts</h2><ul class="checklist">' +
        coiProblems.map(function (c) {
          var expired = coiState(c) === "expired";
          return "<li><div><span class=\"t-title\"><b>" + esc(c.name) + "</b> — insurance cert " +
            (expired ? '<span class="chip overdue">EXPIRED ' + esc(c.coiExpiry) + "</span>" : '<span class="chip today">expires ' + esc(c.coiExpiry) + "</span>") +
            ' · <a href="#/crews">Team page</a></span></div></li>';
        }).join("") +
        carrierOut.map(function (j) {
          var expected = numVal(j.insurance.rcv) + suppApproved(j.insurance) - numVal(j.insurance.deductible);
          return "<li><div><span class=\"t-title\">Carrier still owes <b>" + money(expected - insReceived(j)) + "</b> on " +
            jobLink(j.id, j.name) + " (" + esc(j.insurance.claimStatus || "check the claim") + ")</span></div></li>";
        }).join("") +
        "</ul></div>";
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
      alertsHtml +
      '<div class="grid2">' +
      '<div>' +
      '<div class="card"><h2>📋 Up next</h2>' + taskListHTML(dueSoon, true) +
      '<div class="form-actions"><a class="btn small" href="#/tasks">All tasks →</a></div></div>' +
      '<div class="card"><h2>🏠 Installs this week</h2>' +
      (installs.length ? '<div class="table-scroll"><table><thead><tr><th>Date</th><th>Customer</th><th>Crew</th><th class="num">Value</th></tr></thead><tbody>' +
        installs.map(function (j) {
          var crew = crewById(j.crewId);
          var d = new Date(j.scheduledDate + "T00:00:00");
          return '<tr class="clickable" data-job="' + esc(j.id) + '"><td><b>' + (isNaN(d) ? esc(j.scheduledDate) : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })) +
            "</b></td><td>" + esc(j.name) + "</td><td>" + (crew ? esc(crew.name) : "—") + '</td><td class="num">' + (jobValue(j) ? money(jobValue(j)) : "—") + "</td></tr>";
        }).join("") + "</tbody></table></div>" : '<p class="empty">No installs on the books for the next 7 days.</p>') +
      '<div class="form-actions"><a class="btn small" href="#/schedule">Full schedule →</a></div></div>' +
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
          '<button class="kmove" data-move="' + esc(j.id) + '" title="Move to another stage">Move ▾</button>' +
          "</span></div>";
      }).join("");
      return '<div class="col" data-stage="' + esc(st.id) + '"><h3><span>' + esc(st.label) +
        ' <span class="count">' + jobs.length + "</span></span>" +
        (v ? '<span class="colsum">' + money(v) + "</span>" : "") + "</h3>" + cards + "</div>";
    }).join("");

    view.innerHTML = '<div class="page-head"><h1>Pipeline</h1><div class="spacer"></div>' +
      '<span class="sub" style="margin:0">Drag a job card to move it — the stage playbook lands on its checklist automatically.</span></div>' +
      '<div class="board">' + cols + "</div>";

    view.querySelectorAll("button[data-move]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        openMoveModal(jobById(b.getAttribute("data-move")));
      });
    });

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

  /* Tap-friendly stage mover — drag-and-drop doesn't exist on touch screens. */
  function openMoveModal(j) {
    if (!j) return;
    var back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = '<div class="modal" style="max-width:420px"><h2>Move ' + esc(j.name) + " to…</h2>" +
      '<div class="stage-list">' +
      stagesForJob(j).map(function (st) {
        return '<button class="btn' + (st.id === j.stage ? " dark" : "") + '" data-st="' + st.id + '"' +
          (st.id === j.stage ? " disabled" : "") + ">" + esc(st.label) + (st.id === j.stage ? " (current)" : "") + "</button>";
      }).join("") +
      '</div><div class="form-actions"><button class="btn" id="mv-cancel">Cancel</button></div></div>';
    document.body.appendChild(back);
    back.addEventListener("click", function (e) { if (e.target === back) back.remove(); });
    back.querySelector("#mv-cancel").addEventListener("click", function () { back.remove(); });
    back.querySelectorAll("button[data-st]").forEach(function (b) {
      b.addEventListener("click", function () {
        var st = b.getAttribute("data-st");
        if (st === "lost" && j.stage !== "lost") {
          var reason = prompt("Marking as lost — why? (optional)");
          if (reason === null) return;
          j.lostReason = reason || "";
        }
        back.remove();
        setStage(j, st);
        render();
      });
    });
  }

  /* ======================================================================
     Schedule — who's roofing where, week by week
     ====================================================================== */

  function renderSchedule() {
    var today = isoToday();

    function weekStartOf(dateStr) {
      var d = new Date(dateStr + "T00:00:00");
      var day = (d.getDay() + 6) % 7; /* Monday = 0 */
      d.setDate(d.getDate() - day);
      return d;
    }
    function isoOf(d) {
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
    function weekLabel(d) {
      var end = new Date(d); end.setDate(end.getDate() + 6);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " – " +
        end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }

    var scheduled = state.jobs.filter(function (j) { return j.scheduledDate && j.stage !== "lost" && j.stage !== "paid"; });
    var thisMonday = weekStartOf(today);

    /* overdue starts: dated in the past but the job never reached production */
    var missed = scheduled.filter(function (j) {
      return j.scheduledDate < today && (j.stage === "approved" || ACTIVE_STAGES.indexOf(j.stage) >= 0 && stageIndex(j.stage) < stageIndex("production"));
    }).sort(function (a, b) { return a.scheduledDate < b.scheduledDate ? -1 : 1; });

    /* jobs sold but never given a date */
    var undated = state.jobs.filter(function (j) {
      return !j.scheduledDate && (j.stage === "approved" || j.stage === "production");
    });

    function jobRow(j) {
      var crew = crewById(j.crewId);
      var d = new Date(j.scheduledDate + "T00:00:00");
      return '<tr class="clickable" data-job="' + esc(j.id) + '">' +
        "<td><b>" + (isNaN(d) ? esc(j.scheduledDate) : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })) + "</b></td>" +
        "<td><b>" + esc(j.name) + "</b></td>" +
        "<td>" + esc(j.city || j.address || "") + "</td>" +
        "<td>" + (crew ? "👷 " + esc(crew.name) : '<span class="chip overdue">no crew</span>') + "</td>" +
        "<td>" + stageChip(j.stage) + "</td>" +
        '<td class="num">' + (jobValue(j) ? money(jobValue(j)) : "—") + "</td></tr>";
    }
    function table(rows) {
      return '<div class="table-scroll"><table><thead><tr><th>Date</th><th>Customer</th><th>Where</th><th>Crew</th><th>Stage</th><th class="num">Value</th></tr></thead><tbody>' +
        rows + "</tbody></table></div>";
    }

    var weeksHtml = "";
    for (var w = 0; w < 6; w++) {
      var start = new Date(thisMonday); start.setDate(start.getDate() + w * 7);
      var end = new Date(start); end.setDate(end.getDate() + 6);
      var s0 = isoOf(start), s1 = isoOf(end);
      var wk = scheduled.filter(function (j) { return j.scheduledDate >= s0 && j.scheduledDate <= s1 && j.scheduledDate >= today; })
        .sort(function (a, b) { return a.scheduledDate < b.scheduledDate ? -1 : 1; });
      var title = w === 0 ? "This week" : (w === 1 ? "Next week" : "Week of " + weekLabel(start));
      weeksHtml += '<div class="card"><h2>🗓 ' + title + ' <span class="sub" style="margin:0;font-weight:400">(' + weekLabel(start) + ")</span></h2>" +
        (wk.length ? table(wk.map(jobRow).join("")) : '<p class="empty">Nothing on the books.</p>') + "</div>";
    }

    var later = scheduled.filter(function (j) {
      var cut = new Date(thisMonday); cut.setDate(cut.getDate() + 42);
      return j.scheduledDate >= isoOf(cut);
    }).sort(function (a, b) { return a.scheduledDate < b.scheduledDate ? -1 : 1; });

    view.innerHTML = '<div class="page-head"><h1>Install schedule</h1><div class="spacer"></div>' +
      '<span class="sub" style="margin:0">Set a job\'s start date and crew from its Edit screen.</span></div>' +
      (missed.length ? '<div class="card danger-zone"><h2>⚠️ Start date passed, job not in production</h2>' + table(missed.map(jobRow).join("")) + "</div>" : "") +
      (undated.length ? '<div class="card"><h2>❓ Sold but no start date</h2>' + table(undated.map(function (j) {
        var crew = crewById(j.crewId);
        return '<tr class="clickable" data-job="' + esc(j.id) + '"><td>—</td><td><b>' + esc(j.name) + "</b></td><td>" + esc(j.city || "") + "</td>" +
          "<td>" + (crew ? "👷 " + esc(crew.name) : "—") + "</td><td>" + stageChip(j.stage) + '</td><td class="num">' + (jobValue(j) ? money(jobValue(j)) : "—") + "</td></tr>";
      }).join("")) + "</div>" : "") +
      weeksHtml +
      (later.length ? '<div class="card"><h2>📆 Further out</h2>' + table(later.map(jobRow).join("")) + "</div>" : "");

    view.querySelectorAll("tr[data-job]").forEach(function (tr) {
      tr.addEventListener("click", function () { location.hash = "#/job/" + tr.getAttribute("data-job"); });
    });
  }

  /* ======================================================================
     Reports — close rate, lead sources, lost reasons, monthly money
     ====================================================================== */

  function renderReports() {
    var WON = { approved: 1, production: 1, complete: 1, paid: 1 };
    var jobs = state.jobs;
    var won = jobs.filter(function (j) { return WON[j.stage]; });
    var lost = jobs.filter(function (j) { return j.stage === "lost"; });
    var working = jobs.filter(function (j) { return !WON[j.stage] && j.stage !== "lost"; });
    var closeRate = (won.length + lost.length) ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;

    var builtJobs = jobs.filter(function (j) { return j.stage === "complete" || j.stage === "paid"; });
    var revenue = 0, profit = 0, profitKnown = 0;
    builtJobs.forEach(function (j) {
      var p = numVal(j.money.contractPrice);
      revenue += p;
      if (p && jobCost(j)) { profit += p - jobCost(j); profitKnown += p; }
    });
    var marginPct = profitKnown ? Math.round((profit / profitKnown) * 100) : 0;
    var avgJob = builtJobs.length ? revenue / builtJobs.length : 0;

    /* lead sources */
    var srcMap = {};
    jobs.forEach(function (j) {
      var s = srcMap[j.source] || (srcMap[j.source] = { n: 0, won: 0, lost: 0, rev: 0 });
      s.n++;
      if (WON[j.stage]) { s.won++; s.rev += jobValue(j); }
      if (j.stage === "lost") s.lost++;
    });
    var srcRows = Object.keys(srcMap).sort(function (a, b) { return srcMap[b].rev - srcMap[a].rev; }).map(function (k) {
      var s = srcMap[k];
      var wr = (s.won + s.lost) ? Math.round((s.won / (s.won + s.lost)) * 100) + "%" : "—";
      return "<tr><td><b>" + esc(k) + '</b></td><td class="num">' + s.n + '</td><td class="num">' + s.won + '</td><td class="num">' + s.lost +
        '</td><td class="num">' + wr + '</td><td class="num">' + money(s.rev) + "</td></tr>";
    }).join("");

    /* job types */
    var typeMap = {};
    jobs.forEach(function (j) {
      var t = typeMap[j.jobType] || (typeMap[j.jobType] = { n: 0, rev: 0 });
      t.n++;
      if (WON[j.stage]) t.rev += jobValue(j);
    });
    var typeRows = Object.keys(typeMap).map(function (k) {
      return "<tr><td><b>" + esc(k) + '</b></td><td class="num">' + typeMap[k].n + '</td><td class="num">' + money(typeMap[k].rev) + "</td></tr>";
    }).join("");

    /* lost reasons */
    var lostMap = {};
    lost.forEach(function (j) {
      var r = (j.lostReason || "No reason recorded").trim() || "No reason recorded";
      lostMap[r] = (lostMap[r] || 0) + 1;
    });
    var lostRows = Object.keys(lostMap).sort(function (a, b) { return lostMap[b] - lostMap[a]; }).map(function (k) {
      return "<tr><td>" + esc(k) + '</td><td class="num">' + lostMap[k] + "</td></tr>";
    }).join("");

    /* monthly: last 12 months of completed work */
    var months = {};
    builtJobs.forEach(function (j) {
      var d = j.completedDate ? new Date(j.completedDate + "T00:00:00") : new Date(j.updatedAt);
      if (isNaN(d)) return;
      var k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      var m = months[k] || (months[k] = { n: 0, rev: 0, profit: 0 });
      m.n++;
      m.rev += numVal(j.money.contractPrice);
      if (numVal(j.money.contractPrice) && jobCost(j)) m.profit += numVal(j.money.contractPrice) - jobCost(j);
    });
    var monthRows = Object.keys(months).sort().reverse().slice(0, 12).map(function (k) {
      var m = months[k];
      var label = new Date(k + "-01T00:00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" });
      return "<tr><td><b>" + esc(label) + '</b></td><td class="num">' + m.n + '</td><td class="num">' + money(m.rev) + '</td><td class="num">' + money(m.profit) + "</td></tr>";
    }).join("");

    /* expenses by category across every job */
    var expMap = {}, expTotal = 0;
    jobs.forEach(function (j) {
      (j.expenses || []).forEach(function (e) {
        var c = expMap[e.category] || (expMap[e.category] = { n: 0, sum: 0 });
        c.n++; c.sum += numVal(e.amount); expTotal += numVal(e.amount);
      });
    });
    var expRows = Object.keys(expMap).sort(function (a, b) { return expMap[b].sum - expMap[a].sum; }).map(function (k) {
      return "<tr><td><b>" + esc(k) + '</b></td><td class="num">' + expMap[k].n + '</td><td class="num">' + money(expMap[k].sum) + "</td></tr>";
    }).join("");

    view.innerHTML = '<div class="page-head"><h1>Reports</h1></div>' +
      '<div class="stat-strip">' +
      '<div class="stat"><strong>' + jobs.length + "</strong><span>Total jobs</span></div>" +
      '<div class="stat"><strong>' + won.length + "</strong><span>Won</span></div>" +
      '<div class="stat"><strong>' + lost.length + "</strong><span>Lost</span></div>" +
      '<div class="stat"><strong>' + working.length + "</strong><span>Still working</span></div>" +
      '<div class="stat hot"><strong>' + closeRate + "%</strong><span>Close rate</span></div>" +
      '<div class="stat"><strong>' + money(revenue) + "</strong><span>Revenue built</span></div>" +
      '<div class="stat"><strong>' + money(profit) + "</strong><span>Profit (" + marginPct + "%)</span></div>" +
      '<div class="stat"><strong>' + money(avgJob) + "</strong><span>Avg job size</span></div>" +
      "</div>" +
      '<div class="grid2">' +
      '<div class="card"><h2>📣 Lead sources</h2>' +
      (srcRows ? '<div class="table-scroll"><table><thead><tr><th>Source</th><th class="num">Jobs</th><th class="num">Won</th><th class="num">Lost</th><th class="num">Win rate</th><th class="num">Revenue won</th></tr></thead><tbody>' + srcRows + "</tbody></table></div>" : '<p class="empty">No jobs yet.</p>') +
      "</div>" +
      '<div class="card"><h2>🧾 Job types</h2>' +
      (typeRows ? '<div class="table-scroll"><table><thead><tr><th>Type</th><th class="num">Jobs</th><th class="num">Revenue won</th></tr></thead><tbody>' + typeRows + "</tbody></table></div>" : '<p class="empty">No jobs yet.</p>') +
      "</div>" +
      '<div class="card"><h2>📉 Why we lose</h2>' +
      (lostRows ? '<div class="table-scroll"><table><thead><tr><th>Reason</th><th class="num">Jobs</th></tr></thead><tbody>' + lostRows + "</tbody></table></div>" : '<p class="empty">No lost jobs — keep it that way. 💪</p>') +
      "</div>" +
      '<div class="card"><h2>📆 Month by month (built work)</h2>' +
      (monthRows ? '<div class="table-scroll"><table><thead><tr><th>Month</th><th class="num">Jobs</th><th class="num">Revenue</th><th class="num">Profit</th></tr></thead><tbody>' + monthRows + "</tbody></table></div>" : '<p class="empty">Nothing completed yet.</p>') +
      '<p class="sub" style="margin:.5rem 0 0">Profit uses logged expenses when a job has them, otherwise the Money card\'s estimated cost.</p>' +
      "</div>" +
      '<div class="card"><h2>🧾 Where the money goes <span class="sub" style="margin:0;font-weight:400">(' + (expTotal ? money(expTotal) + " in expenses" : "no expenses logged") + ")</span></h2>" +
      (expRows ? '<div class="table-scroll"><table><thead><tr><th>Category</th><th class="num">Entries</th><th class="num">Total</th></tr></thead><tbody>' + expRows + "</tbody></table></div>" : '<p class="empty">Log expenses on jobs and the breakdown shows up here.</p>') +
      "</div></div>";
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

    view.innerHTML = '<div class="page-head"><h1>Jobs</h1>' +
      '<button class="btn" id="import-claim">📄 Import claim PDF</button>' +
      '<input type="file" id="claim-file" accept="application/pdf,.pdf" style="display:none">' +
      '<div class="spacer"></div>' +
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

    document.getElementById("import-claim").addEventListener("click", function () {
      document.getElementById("claim-file").click();
    });
    document.getElementById("claim-file").addEventListener("change", function (e) {
      if (e.target.files[0]) importClaimFile(e.target.files[0]);
    });
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
    /* backfill fields for jobs created before the claims/expenses upgrade */
    j.expenses = j.expenses || [];
    j.production = j.production || { workOrder: "", subContract: "" };
    j.insurance.supplementItems = j.insurance.supplementItems || [];
    if (j.insurance.claimStatus === undefined) j.insurance.claimStatus = "";

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
    var actualCost = jobCost(j);
    var hasExpenses = jobExpenses(j) > 0;

    var paid = jobPaid(j), balance = jobBalance(j);
    var crew = crewById(j.crewId);

    var jobStages = stagesForJob(j);
    var curIdx = -1;
    jobStages.forEach(function (st, i) { if (st.id === j.stage) curIdx = i; });
    var stepper = jobStages.map(function (st, i) {
      var cls = st.id === j.stage ? "current" : (curIdx >= 0 && i < curIdx && st.id !== "lost" ? "done" : "");
      return '<button data-stage="' + st.id + '" class="' + cls + '">' + esc(st.label) + "</button>";
    }).join("");
    var nextStage = (curIdx >= 0 && curIdx < jobStages.length - 1 && jobStages[curIdx + 1].id !== "lost")
      ? jobStages[curIdx + 1] : null;

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

      '<div class="stage-stepper" id="stepper">' + stepper +
      (nextStage ? '<button class="advance" id="advance-btn">Advance → ' + esc(nextStage.label) + "</button>" : "") +
      "</div>" +
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

      (j.jobType === "Insurance" ? (function () {
        var suppA = suppApproved(ins);
        var totalClaim = numVal(ins.rcv) + suppA;
        var expectedFromCarrier = Math.max(totalClaim - ded, 0);
        var received = insReceived(j);
        var carrierOwes = Math.max(expectedFromCarrier - received, 0);
        var suppRows = ins.supplementItems.map(function (it, i) {
          return "<tr><td>" + esc(it.item) + '</td><td class="num">' + (numVal(it.submitted) ? money(it.submitted) : "—") +
            '</td><td class="num">' + (numVal(it.approved) ? money(it.approved) : "—") +
            '</td><td><span class="chip ' + (it.status === "Approved" ? "stage-complete" : it.status === "Denied" ? "stage-lost" : "type") + '">' + esc(it.status) + "</span></td>" +
            '<td><button class="btn small danger" data-delsupp="' + i + '">✕</button></td></tr>';
        }).join("");
        return '<div class="card"><h2>🛡️ Claim</h2>' +
          '<div class="form-grid" style="margin-bottom:.7rem"><div><label>Claim status</label><select id="claim-status">' +
          CLAIM_STATUSES.map(function (cs) { return "<option" + (ins.claimStatus === cs ? " selected" : "") + ">" + esc(cs) + "</option>"; }).join("") +
          "</select></div></div>" +
          '<dl class="kv">' +
          "<dt>Carrier</dt><dd>" + esc(ins.carrier || "—") + "</dd>" +
          "<dt>Claim #</dt><dd>" + esc(ins.claimNumber || "—") + "</dd>" +
          "<dt>Adjuster</dt><dd>" + esc(ins.adjusterName || "—") + (ins.adjusterPhone ? ' · <a href="tel:' + esc(ins.adjusterPhone) + '">' + esc(ins.adjusterPhone) + "</a>" : "") + "</dd>" +
          "</dl>" +
          (numVal(ins.rcv) ?
            '<h2 style="margin-top:.9rem">Claim ledger</h2><dl class="kv">' +
            "<dt>RCV</dt><dd>" + money(ins.rcv) + "</dd>" +
            "<dt>Supplements approved</dt><dd>" + (suppA ? "+ " + money(suppA) : "—") + "</dd>" +
            "<dt>Total claim value</dt><dd><b>" + money(totalClaim) + "</b></dd>" +
            "<dt>Deductible (customer)</dt><dd>− " + money(ded) + "</dd>" +
            "<dt>Expected from carrier</dt><dd><b>" + money(expectedFromCarrier) + "</b></dd>" +
            "<dt>Received from carrier</dt><dd>" + money(received) + " <span class=\"sub\" style=\"margin:0\">(payments logged as “Insurance check”)</span></dd>" +
            "<dt>Carrier still owes</dt><dd><b style=\"color:" + (carrierOwes > 0 ? "var(--red-dark)" : "var(--green-text)") + "\">" + money(carrierOwes) + "</b></dd>" +
            "</dl>" : "") +
          '<h2 style="margin-top:.9rem">Supplements</h2>' +
          (suppRows ? '<div class="table-scroll"><table><thead><tr><th>Item</th><th class="num">Submitted</th><th class="num">Approved</th><th>Status</th><th></th></tr></thead><tbody>' + suppRows + "</tbody></table></div>"
            : '<p class="empty">No supplements yet — add anything the carrier\'s estimate missed.</p>') +
          '<form id="supp-form" class="form-grid" style="margin-top:.6rem">' +
          '<div class="wide"><label>Item</label><input id="sp-item" placeholder="e.g. Drip edge, I&W shield, steep charge" required></div>' +
          '<div><label>Submitted $</label><input id="sp-sub" inputmode="decimal"></div>' +
          '<div><label>Approved $</label><input id="sp-app" inputmode="decimal"></div>' +
          '<div><label>Status</label><select id="sp-status"><option>Submitted</option><option>Approved</option><option>Denied</option></select></div>' +
          '<div class="form-actions" style="margin:0;align-self:end"><button class="btn small primary">+ Add</button></div>' +
          "</form>" +
          (ins.supplements ? '<p class="sub" style="margin:.5rem 0 0">Notes: ' + esc(ins.supplements) + "</p>" : "") +
          (ded ? '<div class="calc" style="margin-top:.7rem">💡 <b>Deductible offset:</b> ACV on items not in scope covers <strong class="' + (offsetPct >= 100 ? "good" : "bad") + '">' + money(offsetCovered) + " (" + offsetPct + "%)</strong> of the " + money(ded) + " deductible → customer's true out-of-pocket ≈ <b>" + money(outOfPocket) + "</b>.</div>" : "") +
          "</div>";
      })() : "") +

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
      "<dt>Balance</dt><dd><b" + (balance > 0 && numVal(m.contractPrice) ? ' style="color:var(--red-dark)"' : "") + ">" + (numVal(m.contractPrice) ? money(balance) : "—") + "</b></dd>" +
      (actualCost > 0 && numVal(m.contractPrice) > 0 ?
        "<dt>Profit</dt><dd><b style=\"color:" + (numVal(m.contractPrice) - actualCost > 0 ? "var(--green-text)" : "var(--red-dark)") + "\">" +
        money(numVal(m.contractPrice) - actualCost) + "</b> (" + Math.round(((numVal(m.contractPrice) - actualCost) / numVal(m.contractPrice)) * 100) + "% margin" +
        (hasExpenses ? ", from logged expenses" : ", from estimated cost") + ")</dd>" : "") +
      "</dl>" +
      '<form id="pay-form" class="form-grid" style="margin-top:.6rem">' +
      '<div><label>Date</label><input type="date" id="p-date" value="' + isoToday() + '"></div>' +
      '<div><label>Amount</label><input id="p-amount" inputmode="decimal" placeholder="0" required></div>' +
      '<div><label>Method</label><select id="p-method"><option>Check</option><option>Insurance check</option><option>Cash</option><option>Card</option><option>Financing</option><option>Other</option></select></div>' +
      '<div><label>Note</label><input id="p-note" placeholder="e.g. deductible, final"></div>' +
      '<div class="form-actions" style="margin:0;align-self:end"><button class="btn small primary">+ Log payment</button></div>' +
      "</form></div>" +

      '<div class="card"><h2>🧾 Expenses <span class="sub" style="margin:0;font-weight:400">(' + (hasExpenses ? money(jobExpenses(j)) + " logged" : "none yet") + ")</span></h2>" +
      (j.expenses.length ? '<div class="table-scroll"><table><thead><tr><th>Date</th><th>Category</th><th>Vendor</th><th class="num">Amount</th><th>Note</th><th></th></tr></thead><tbody>' +
        j.expenses.map(function (ex, i) {
          return "<tr><td>" + esc(ex.date || "—") + '</td><td><span class="chip type">' + esc(ex.category) + "</span></td><td>" + esc(ex.vendor || "") +
            '</td><td class="num">' + money(ex.amount) + "</td><td>" + esc(ex.note || "") +
            '</td><td><button class="btn small danger" data-delexp="' + i + '">✕</button></td></tr>';
        }).join("") + "</tbody></table></div>" : '<p class="empty">Log materials, sub pay, dump fees, permits — profit updates automatically.</p>') +
      '<form id="exp-form" class="form-grid" style="margin-top:.6rem">' +
      '<div><label>Date</label><input type="date" id="ex-date" value="' + isoToday() + '"></div>' +
      '<div><label>Category</label><select id="ex-cat">' + EXPENSE_CATS.map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("") + "</select></div>" +
      '<div><label>Vendor</label><input id="ex-vendor" placeholder="e.g. ABC Supply"></div>' +
      '<div><label>Amount</label><input id="ex-amount" inputmode="decimal" required></div>' +
      '<div><label>Note</label><input id="ex-note"></div>' +
      '<div class="form-actions" style="margin:0;align-self:end"><button class="btn small primary">+ Log expense</button></div>' +
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

      (function () {
        var sPaid = subPaid(j);
        var sContract = numVal(j.production.subContract);
        var punchOpen = jobTasks(j).filter(function (t) { return !t.done && t.title.indexOf("Punch:") === 0; }).length;
        return '<div class="card"><h2>👷 Production & subs</h2>' +
          '<div class="form-grid">' +
          '<div class="wide"><label>Work order for the crew / sub</label><textarea id="wo-text" placeholder="Exact scope for the sub: tear-off, layers, materials, colors, extras, what NOT to touch…">' + esc(j.production.workOrder) + "</textarea></div>" +
          '<div><label>Sub contract ($ we pay them)</label><input id="sub-contract" inputmode="decimal" value="' + esc(j.production.subContract) + '"></div>' +
          "</div>" +
          '<div class="form-actions"><button class="btn small" id="prod-save">Save production info</button></div>' +
          '<dl class="kv" style="margin-top:.6rem">' +
          "<dt>Paid to subs so far</dt><dd>" + money(sPaid) + " <span class=\"sub\" style=\"margin:0\">(expenses logged as “Subcontractor”)</span></dd>" +
          (sContract ? "<dt>Still owed to sub</dt><dd><b" + (sContract - sPaid > 0 ? ' style="color:var(--red-dark)"' : "") + ">" + money(Math.max(sContract - sPaid, 0)) + "</b></dd>" : "") +
          (punchOpen ? "<dt>Open punch items</dt><dd><b>" + punchOpen + "</b> (on the checklist)</dd>" : "") +
          "</dl>" +
          '<form id="punch-form" class="form-grid" style="margin-top:.5rem">' +
          '<div class="wide"><label>Add a punch-list item</label><input id="punch-text" placeholder="e.g. Reset satellite dish, touch up drip edge paint" required></div>' +
          '<div class="form-actions" style="margin:0;align-self:end"><button class="btn small primary">+ Punch</button></div>' +
          "</form></div>";
      })() +

      '<div class="card"><h2>📝 Notes & history</h2>' +
      '<form id="note-form"><textarea id="note-text" placeholder="What happened? Call notes, adjuster talk, change orders…"></textarea>' +
      '<div class="form-actions"><button class="btn small primary">+ Add note</button></div></form>' +
      '<div class="timeline" style="margin-top:.6rem">' +
      (timeline.length ? timeline.map(function (t) { return "<div><time>" + fmtDT(t.ts) + "</time>" + t.html + "</div>"; }).join("") : '<p class="empty">No notes yet.</p>') +
      "</div></div>" +
      "</div></div>";

    /* --- wiring --- */
    wireTaskCheckboxes(view);

    var advBtn = document.getElementById("advance-btn");
    if (advBtn) advBtn.addEventListener("click", function () { setStage(j, nextStage.id); render(); });

    document.getElementById("stepper").querySelectorAll("button[data-stage]").forEach(function (b) {
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

    /* --- claim workspace --- */
    var claimSel = document.getElementById("claim-status");
    if (claimSel) claimSel.addEventListener("change", function () {
      ins.claimStatus = claimSel.value;
      j.updatedAt = Date.now();
      logActivity(j.id, "Claim status: " + claimSel.value + " — " + j.name);
      save(); render();
    });
    var suppForm = document.getElementById("supp-form");
    if (suppForm) suppForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var item = document.getElementById("sp-item").value.trim();
      if (!item) return;
      ins.supplementItems.push({
        id: uid(), item: item,
        submitted: document.getElementById("sp-sub").value.trim(),
        approved: document.getElementById("sp-app").value.trim(),
        status: document.getElementById("sp-status").value
      });
      j.updatedAt = Date.now();
      logActivity(j.id, "Supplement added: " + item + " — " + j.name);
      save(); render();
    });
    view.querySelectorAll("button[data-delsupp]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!confirm("Remove this supplement line?")) return;
        ins.supplementItems.splice(Number(b.getAttribute("data-delsupp")), 1);
        j.updatedAt = Date.now();
        save(); render();
      });
    });

    /* --- expenses --- */
    document.getElementById("exp-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var amt = numVal(document.getElementById("ex-amount").value);
      if (!amt) return;
      j.expenses.push({
        id: uid(),
        date: document.getElementById("ex-date").value || isoToday(),
        category: document.getElementById("ex-cat").value,
        vendor: document.getElementById("ex-vendor").value.trim(),
        amount: amt,
        note: document.getElementById("ex-note").value.trim()
      });
      j.updatedAt = Date.now();
      logActivity(j.id, "Expense: " + money(amt) + " " + document.getElementById("ex-cat").value + " — " + j.name);
      save(); render();
    });
    view.querySelectorAll("button[data-delexp]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!confirm("Remove this expense?")) return;
        j.expenses.splice(Number(b.getAttribute("data-delexp")), 1);
        j.updatedAt = Date.now();
        save(); render();
      });
    });

    /* --- production & subs --- */
    document.getElementById("prod-save").addEventListener("click", function () {
      j.production.workOrder = document.getElementById("wo-text").value;
      j.production.subContract = document.getElementById("sub-contract").value.trim();
      j.updatedAt = Date.now();
      save(); render();
      toast("Production info saved");
    });
    document.getElementById("punch-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var txt = document.getElementById("punch-text").value.trim();
      if (!txt) return;
      state.tasks.push({ id: uid(), jobId: j.id, title: "Punch: " + txt, due: isoPlus(2), done: false, doneAt: 0, createdAt: Date.now() });
      j.updatedAt = Date.now();
      save(); render();
    });
  }

  /* ======================================================================
     Job create/edit modal
     ====================================================================== */

  function openJobModal(job, prefill) {
    var isNew = !job;
    var j = job || { name: "", phone: "", email: "", address: "", city: "", jobType: "Insurance", source: "Referral", roofType: "", squares: "",
      insurance: { carrier: "", claimNumber: "", adjusterName: "", adjusterPhone: "", rcv: "", deductible: "", acvOffset: "", supplementsAmount: "", supplements: "", claimStatus: "", supplementItems: [] },
      links: { roofr: "", companycam: "", dropbox: "", other: "" }, scheduledDate: "", crewId: "" };
    if (isNew && prefill) {
      Object.keys(prefill.fields || {}).forEach(function (k) { if (prefill.fields[k]) j[k] = prefill.fields[k]; });
      Object.keys(prefill.ins || {}).forEach(function (k) { if (prefill.ins[k]) j.insurance[k] = prefill.ins[k]; });
    }

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
      f("Supplements approved ($)", "ins.supplementsAmount", j.insurance.supplementsAmount, "text", false, "$ — adds to the claim total") +
      f("Supplement notes", "ins.supplements", j.insurance.supplements, "text", false, "what was submitted / status") +
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
      target.insurance.supplementsAmount = g("ins.supplementsAmount");
      target.insurance.supplements = g("ins.supplements");
      target.links.roofr = g("links.roofr");
      target.links.companycam = g("links.companycam");
      target.links.dropbox = g("links.dropbox");
      target.links.other = g("links.other");
      target.updatedAt = Date.now();
      if (isNew && prefill) {
        if (prefill.note) {
          target.notes = target.notes || [];
          target.notes.unshift({ ts: Date.now(), text: prefill.note });
        }
        if (prefill.adjuster && prefill.adjuster.name) {
          var exists = state.contacts.some(function (c) { return c.name.toLowerCase() === prefill.adjuster.name.toLowerCase(); });
          if (!exists) state.contacts.push({
            id: uid(), name: prefill.adjuster.name, type: "Adjuster",
            company: prefill.adjuster.company || "", phone: prefill.adjuster.phone || "",
            email: prefill.adjuster.email || "", notes: "Auto-created from claim PDF"
          });
        }
        logActivity(target.id, "Job created from claim PDF — " + target.name);
      }
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

  function coiState(c) {
    /* "" = no date on file; "ok" | "expiring" (≤30d) | "expired" */
    if (!c.coiExpiry) return "";
    var today = isoToday();
    if (c.coiExpiry < today) return "expired";
    if (c.coiExpiry <= isoPlus(30)) return "expiring";
    return "ok";
  }
  function onboardDone(c) {
    var ob = c.onboard || {};
    var n = 0;
    ONBOARD_DOCS.forEach(function (d) { if (ob[d.k]) n++; });
    return n;
  }

  function renderCrews() {
    view.innerHTML = '<div class="page-head"><h1>Team & Subs</h1><div class="spacer"></div>' +
      '<button class="btn primary" id="add-crew">+ Add crew / sub</button></div>' +
      '<p class="sub">Onboarding lives here: W-9, insurance cert (with expiry), agreement, CompanyCam, training. Expired COIs get flagged on the dashboard.</p>' +
      '<div class="grid2">' +
      (state.crews.length ? state.crews.map(function (c) {
        var assigned = state.jobs.filter(function (j) { return j.crewId === c.id && ACTIVE_STAGES.indexOf(j.stage) >= 0; });
        var cs = coiState(c);
        var obDone = onboardDone(c);
        var ob = c.onboard || {};
        return '<div class="card"><h2>👷 ' + esc(c.name) +
          (cs === "expired" ? ' <span class="chip overdue">COI EXPIRED</span>' : "") +
          (cs === "expiring" ? ' <span class="chip today">COI expiring</span>' : "") +
          "</h2><dl class=\"kv\">" +
          "<dt>Lead</dt><dd>" + esc(c.lead || "—") + "</dd>" +
          "<dt>Phone</dt><dd>" + (c.phone ? '<a href="tel:' + esc(c.phone) + '">' + esc(c.phone) + "</a>" : "—") + "</dd>" +
          "<dt>Rate</dt><dd>" + esc(c.rate || "—") + "</dd>" +
          "<dt>COI expires</dt><dd>" + esc(c.coiExpiry || "—") + "</dd>" +
          "<dt>Notes</dt><dd>" + esc(c.notes || "—") + "</dd></dl>" +
          "<h2 style=\"margin-top:.8rem\">Onboarding (" + obDone + "/" + ONBOARD_DOCS.length + ")</h2>" +
          '<ul class="checklist">' + ONBOARD_DOCS.map(function (d) {
            return '<li class="' + (ob[d.k] ? "done" : "") + '"><input type="checkbox" data-ob="' + esc(c.id) + ":" + d.k + '"' + (ob[d.k] ? " checked" : "") + '><div><span class="t-title">' + esc(d.label) + "</span></div></li>";
          }).join("") + "</ul>" +
          "<h2 style=\"margin-top:.8rem\">Active jobs (" + assigned.length + ")</h2>" +
          (assigned.length ? "<ul class=\"checklist\">" + assigned.map(function (j) {
            return "<li><div>" + jobLink(j.id, j.name) + " — " + stageChip(j.stage) + (j.scheduledDate ? ' <span class="t-due">starts ' + esc(j.scheduledDate) + "</span>" : "") + "</div></li>";
          }).join("") + "</ul>" : '<p class="empty">Nothing assigned.</p>') +
          '<div class="form-actions"><button class="btn small" data-edit="' + esc(c.id) + '">Edit</button>' +
          '<button class="btn small danger" data-del="' + esc(c.id) + '">Delete</button></div></div>';
      }).join("") : '<div class="card"><p class="empty">No crews or subs yet — add them here to assign jobs, track onboarding docs, and get COI expiry warnings.</p></div>') +
      "</div>";

    view.querySelectorAll("input[data-ob]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var parts = cb.getAttribute("data-ob").split(":");
        var c = crewById(parts[0]);
        if (!c) return;
        c.onboard = c.onboard || {};
        c.onboard[parts[1]] = cb.checked;
        save(); render();
      });
    });

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
    var c = crew || { name: "", lead: "", phone: "", notes: "", rate: "", coiExpiry: "", onboard: {} };
    var back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = '<div class="modal"><h2>' + (isNew ? "New crew / sub" : "Edit crew / sub") + "</h2>" +
      '<form id="crew-form"><div class="form-grid">' +
      '<div><label>Crew / sub name *</label><input name="name" required value="' + esc(c.name) + '"></div>' +
      '<div><label>Crew lead</label><input name="lead" value="' + esc(c.lead) + '"></div>' +
      '<div><label>Phone</label><input name="phone" type="tel" value="' + esc(c.phone) + '"></div>' +
      '<div><label>Rate</label><input name="rate" value="' + esc(c.rate || "") + '" placeholder="e.g. $85/sq tear-off + install"></div>' +
      '<div><label>COI expires</label><input name="coiExpiry" type="date" value="' + esc(c.coiExpiry || "") + '"></div>' +
      '<div class="wide"><label>Notes</label><input name="notes" value="' + esc(c.notes) + '" placeholder="specialties, language, size…"></div>' +
      "</div>" +
      '<div class="form-actions"><button class="btn primary">' + (isNew ? "Add" : "Save") + "</button>" +
      '<button class="btn" type="button" id="crew-cancel">Cancel</button></div></form>' +
      '<p class="sub" style="margin:.6rem 0 0">Onboarding checkboxes (W-9, COI, agreement…) live on the crew\'s card on the Team page.</p></div>';
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
      c.rate = g("rate"); c.coiExpiry = g("coiExpiry");
      c.onboard = c.onboard || {};
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
      '<button class="btn" id="tour-replay">🎓 Replay the app tour</button>' +
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
    document.getElementById("tour-replay").addEventListener("click", function () { window.__startTour(); });

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
     Claim-PDF import — drop in a carrier estimate (Xactimate-style) or a
     settlement letter and it builds the job + adjuster contact. Reads the
     PDF entirely in the browser (vendored pdf.js); nothing is uploaded.
     ====================================================================== */

  var pdfjsPromise = null;
  function loadPdfJs() {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js";
      return Promise.resolve(window.pdfjsLib);
    }
    if (!pdfjsPromise) pdfjsPromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "vendor/pdf.min.js";
      s.onload = function () {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      s.onerror = function () { reject(new Error("couldn't load the PDF reader")); };
      document.head.appendChild(s);
    });
    return pdfjsPromise;
  }

  /* Rebuild reading-order lines from pdf.js positioned text runs. */
  function pageLinesFromContent(tc) {
    var rows = [];
    tc.items.forEach(function (it) {
      if (!it.str || !it.str.trim()) return;
      var y = it.transform[5], x = it.transform[4], row = null;
      for (var i = 0; i < rows.length; i++) if (Math.abs(rows[i].y - y) <= 2.5) { row = rows[i]; break; }
      if (!row) { row = { y: y, items: [] }; rows.push(row); }
      row.items.push({ x: x, str: it.str });
    });
    rows.sort(function (a, b) { return b.y - a.y; });
    return rows.map(function (r) {
      return r.items.sort(function (a, b) { return a.x - b.x; })
        .map(function (i) { return i.str; }).join(" ").replace(/\s+/g, " ").trim();
    });
  }

  function pdfToLines(file) {
    return loadPdfJs().then(function (pdfjsLib) {
      return file.arrayBuffer().then(function (buf) {
        return pdfjsLib.getDocument({ data: buf }).promise;
      });
    }).then(function (doc) {
      var chain = Promise.resolve([]);
      var pn;
      var add = function (n) {
        chain = chain.then(function (lines) {
          return doc.getPage(n).then(function (page) { return page.getTextContent(); })
            .then(function (tc) { return lines.concat(pageLinesFromContent(tc)); });
        });
      };
      for (pn = 1; pn <= doc.numPages; pn++) add(pn);
      return chain;
    });
  }

  function titleCase(s) {
    return String(s || "").toLowerCase().replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }).trim();
  }
  var LABEL_STOP = /\s(?:Home|Business|Cellular|Cell|Phone|Fax|E-?mail|Position|Company|Policy Number|Type of Loss|Claim Number|Property|Insured|Claim Rep\.?|Estimator|Contractor|Date\s+[A-Za-z]+):.*$/;
  function grabAfter(line, labelRe) {
    var m = line.match(new RegExp(labelRe + ":\\s*(.*)$"));
    if (!m) return "";
    return m[1].replace(LABEL_STOP, "").trim();
  }
  function moneyIn(s) { return parseFloat(String(s).replace(/,/g, "")) || 0; }

  function parseClaim(lines) {
    var out = { name: "", phone: "", email: "", address: "", city: "", carrier: "", claimNumber: "",
      policyNumber: "", typeOfLoss: "", dateOfLoss: "", priceList: "",
      adjusterName: "", adjusterPhone: "", adjusterEmail: "",
      rcv: 0, acv: 0, deductible: 0, netClaim: 0, recovDep: 0 };
    var PHONE = /\(\d{3}\)\s*\d{3}-\d{4}/;
    var CITYSTZIP = /([A-Za-z .'-]{2,}),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/;

    for (var i = 0; i < lines.length; i++) {
      var L = lines[i];

      if (!out.name && /Insured:/.test(L)) {
        out.name = grabAfter(L, "Insured");
        var pm = L.match(/(?:Home|Cellular|Cell|Phone):\s*(\(\d{3}\)\s*\d{3}-\d{4})/);
        if (pm) out.phone = pm[1];
        for (var k = i; k <= i + 3 && k < lines.length; k++) {
          if (out.email) break;
          if (/Claim Rep|Estimator|Contractor/.test(lines[k])) break;
          var em = lines[k].match(/E-?mail:\s*(\S+)/i);
          if (em) {
            out.email = em[1];
            /* e-mails wrap mid-address in these layouts — stitch the next line back on */
            if (!/\.[A-Za-z]{2,}$/.test(out.email) && k + 1 < lines.length && /^[A-Za-z0-9._-]{1,20}$/.test(lines[k + 1])) out.email += lines[k + 1];
          }
        }
      }

      if (!out.address && /Property:/.test(L)) {
        out.address = grabAfter(L, "Property");
        for (var k2 = i + 1; k2 <= i + 2 && k2 < lines.length; k2++) {
          var cm = lines[k2].match(CITYSTZIP);
          if (cm) { out.city = titleCase(cm[1]); break; }
        }
        var sameLine = out.address.match(CITYSTZIP);
        if (sameLine) { out.city = out.city || titleCase(sameLine[1]); out.address = out.address.replace(CITYSTZIP, "").trim(); }
      }

      if (!out.adjusterName && /Claim Rep\.?:/.test(L)) {
        out.adjusterName = grabAfter(L, "Claim Rep\\.?");
        for (var k3 = i; k3 <= i + 4 && k3 < lines.length; k3++) {
          if (/Estimator:|Claim Number:/.test(lines[k3]) && k3 > i) break;
          if (!out.adjusterPhone) {
            var apm = lines[k3].match(/(?:Business|Cellular|Cell|Phone):\s*(\(\d{3}\)\s*\d{3}-\d{4})/);
            if (apm) out.adjusterPhone = apm[1];
          }
          if (!out.adjusterEmail) {
            var aem = lines[k3].match(/E-?mail:\s*(\S+@\S+)/i);
            if (aem) out.adjusterEmail = aem[1];
          }
        }
      }

      if (!out.claimNumber) { var cn = L.match(/Claim Number:\s*([A-Za-z0-9-]+)/); if (cn) out.claimNumber = cn[1]; }
      if (!out.policyNumber) { var pn2 = L.match(/Policy Number:\s*([A-Za-z0-9-]+)/); if (pn2) out.policyNumber = pn2[1]; }
      if (!out.typeOfLoss && /Type of Loss:/.test(L)) out.typeOfLoss = titleCase(grabAfter(L, "Type of Loss"));
      if (!out.carrier) { var ic = L.match(/Insurance Company:\s*(.+)$/); if (ic) out.carrier = ic[1].trim(); }
      if (!out.dateOfLoss) { var dl = L.match(/Date of Loss:\s*([0-9/]+)/); if (dl) out.dateOfLoss = dl[1]; }
      if (!out.priceList) { var pl = L.match(/Price List:\s*([A-Z0-9_]+)/); if (pl) out.priceList = pl[1]; }

      /* money summary lines (may repeat once per coverage — sum them) */
      var rcvm = L.match(/^Replacement Cost Value\s+\$([\d,]+\.\d{2})/);
      if (rcvm) out.rcv += moneyIn(rcvm[1]);
      var acvm = L.match(/^Actual Cash Value\s+\$([\d,]+\.\d{2})/);
      if (acvm) out.acv += moneyIn(acvm[1]);
      if (!/^Net Claim if/.test(L)) {
        var ncm = L.match(/^Net Claim\s+\$?\(?\$?([\d,]+\.\d{2})/);
        if (ncm) out.netClaim += moneyIn(ncm[1]);
      }
      var rdm = L.match(/^Total Recoverable Depreciation\s+\$?([\d,]+\.\d{2})/);
      if (rdm) out.recovDep += moneyIn(rdm[1]);
      var dm = L.match(/Less Deductible\s*(?:\[\s*Full Deductible\s*=\s*\$?([\d,]+(?:\.\d{2})?)\s*\])?\s*\(\$?([\d,]+(?:\.\d{2})?)\)/);
      if (dm) out.deductible = Math.max(out.deductible, moneyIn(dm[1] || dm[2]));
    }

    /* settlement-letter fallback: the name / street / city-state-zip block at
       the top of the letter. The right-hand claim column can merge into the
       same lines ("133 Abbeydell Date of Loss: 3/7/2025"), so strip labels. */
    if (!out.address) {
      var STRIP = /\s+(?:Claim Number|Policy Number|Date of Loss|Type of Loss|Phone|Home|Business)\b.*$/i;
      for (var i2 = 1; i2 < Math.min(lines.length, 16); i2++) {
        var cm2 = lines[i2].match(CITYSTZIP);
        if (!cm2) continue;
        if (/P\.?O\.? Box/i.test(lines[i2 - 1])) continue; /* carrier letterhead, not the insured */
        var addr = lines[i2 - 1].replace(STRIP, "").trim();
        if (!addr || addr.length < 4 || /Summary|Coverage|Deductible|Team/i.test(addr)) continue;
        out.address = addr;
        out.city = out.city || titleCase(cm2[1]);
        if (!out.name && i2 >= 2) {
          var nm = lines[i2 - 2].replace(STRIP, "").trim();
          if (/^[A-Z][A-Z .,'&-]+$/.test(nm)) out.name = nm;
        }
        break;
      }
    }

    /* our own contractor estimates list T^Rock staff as "Claim Rep." — that's
       not the carrier's adjuster, so drop it */
    if (/trock/i.test(out.adjusterEmail) || /t[- ]?rock/i.test(out.adjusterName)) {
      out.adjusterName = ""; out.adjusterPhone = ""; out.adjusterEmail = "";
    }
    out.name = titleCase(out.name);
    out.adjusterName = titleCase(out.adjusterName);
    out.rcv = Math.round(out.rcv * 100) / 100;
    out.acv = Math.round(out.acv * 100) / 100;
    out.netClaim = Math.round(out.netClaim * 100) / 100;
    out.recovDep = Math.round(out.recovDep * 100) / 100;
    return out;
  }

  function importClaimFile(file) {
    toast("📄 Reading " + file.name + "…");
    pdfToLines(file).then(function (lines) {
      var p = parseClaim(lines);
      if (!p.name && !p.claimNumber) { toast("Couldn't find claim info in that PDF — is it a carrier estimate?"); return; }

      var bits = [];
      if (p.typeOfLoss) bits.push("Type of loss: " + p.typeOfLoss);
      if (p.dateOfLoss) bits.push("Date of loss: " + p.dateOfLoss);
      if (p.policyNumber) bits.push("Policy #: " + p.policyNumber);
      if (p.priceList) bits.push("Price list: " + p.priceList);
      if (p.rcv) bits.push("RCV: " + money(p.rcv));
      if (p.acv) bits.push("ACV: " + money(p.acv));
      if (p.deductible) bits.push("Deductible: " + money(p.deductible));
      if (p.netClaim) bits.push("Net claim: " + money(p.netClaim));
      if (p.recovDep) bits.push("Recoverable depreciation: " + money(p.recovDep));
      var note = "📄 Imported from " + file.name + " — " + (bits.join(" · ") || "no dollar summary found");

      var existing = p.claimNumber ? state.jobs.filter(function (jx) {
        return (jx.insurance.claimNumber || "").replace(/^0+/, "") === p.claimNumber.replace(/^0+/, "");
      })[0] : null;

      if (existing && confirm("Claim #" + p.claimNumber + " matches " + existing.name + ".\n\nOK = attach this paperwork to that job.\nCancel = create a brand-new job anyway.")) {
        var ins = existing.insurance;
        if (!numVal(ins.rcv) && p.rcv) ins.rcv = String(p.rcv);
        if (!numVal(ins.deductible) && p.deductible) ins.deductible = String(p.deductible);
        if (!ins.carrier && p.carrier) ins.carrier = p.carrier;
        /* fill adjuster name+phone together so numbers never mix across docs */
        if (!ins.adjusterName && p.adjusterName) {
          ins.adjusterName = p.adjusterName;
          if (p.adjusterPhone) ins.adjusterPhone = p.adjusterPhone;
        } else if (!ins.adjusterPhone && p.adjusterPhone && ins.adjusterName &&
          ins.adjusterName.toLowerCase() === (p.adjusterName || "").toLowerCase()) {
          ins.adjusterPhone = p.adjusterPhone;
        }
        existing.notes = existing.notes || [];
        existing.notes.unshift({ ts: Date.now(), text: note });
        existing.updatedAt = Date.now();
        logActivity(existing.id, "Claim PDF attached — " + existing.name);
        save();
        location.hash = "#/job/" + existing.id;
        render();
        toast("Attached to " + existing.name);
        return;
      }

      openJobModal(null, {
        fields: { name: p.name, phone: p.phone, email: p.email, address: p.address, city: p.city, jobType: "Insurance" },
        ins: {
          carrier: p.carrier, claimNumber: p.claimNumber,
          adjusterName: p.adjusterName, adjusterPhone: p.adjusterPhone,
          rcv: p.rcv ? String(p.rcv) : "", deductible: p.deductible ? String(p.deductible) : ""
        },
        note: note,
        adjuster: p.adjusterName ? { name: p.adjusterName, phone: p.adjusterPhone, email: p.adjusterEmail, company: p.carrier } : null
      });
      toast("Check the details, then hit Create ✅");
    }).catch(function (e) {
      toast("Couldn't read that PDF: " + (e && e.message ? e.message : "unknown error"));
    });
  }

  /* ======================================================================
     First-run tour — a gentle walkthrough of every feature. Never blocks:
     decline it, exit any time (✕ or Esc), replay it from Settings.
     ====================================================================== */

  var TOUR_KEY = "trock-crm-tour-v1";
  var TOUR_STEPS = [
    { route: "#/dashboard", target: ".stat-strip", title: "Welcome to your CRM 👋",
      body: "This is the dashboard — jobs in play, money in the pipeline, what's owed, and what's due today, all in one glance." },
    { route: "#/dashboard", target: "#view .card", title: "Up next",
      body: "Every task due soon, across every job, lands here — and you can check things off without leaving the page. Alerts (like an expired sub insurance cert) show up here too." },
    { route: "#/dashboard", target: "#new-job-btn", title: "Add a job from anywhere",
      body: "One tap starts a new job. It begins as a lead with its first to-dos (call back, book the inspection) already on its checklist." },
    { route: "#/jobs", target: "#import-claim", title: "Insurance paperwork does the typing",
      body: "Got a carrier estimate PDF? Import it and the customer, claim number, adjuster, RCV and deductible fill themselves in — you just review and hit Create." },
    { route: "#/board", target: ".board", title: "The pipeline",
      body: "Every job moves left to right: Lead → Inspection → Proposal → Insurance → Approved → Production → Complete → Paid. Drag a card (or tap Move ▾ on your phone) and that stage's playbook drops onto the job's checklist automatically." },
    { route: "#/board", target: null, title: "Inside every job",
      body: "Open any job card and you'll find: the claim ledger (what the carrier owes), supplements, the price check (2× markup / $500 minimum), payments and balance, expenses with live profit, work orders and sub pay, a punch list, and the full history." },
    { route: "#/tasks", target: "#quick-task", title: "Tasks",
      body: "Everything to do across all jobs, sorted into Overdue / Today / Upcoming. Add one-off reminders here — with or without a job attached." },
    { route: "#/schedule", target: "#view .card", title: "Install schedule",
      body: "Week by week: who's roofing where, with crew and job value. It also flags jobs whose start date slipped and sold jobs that never got a date." },
    { route: "#/reports", target: ".stat-strip", title: "Reports",
      body: "Your close rate, which lead sources actually make money, why jobs get lost, and month-by-month revenue and profit. It fills in as you work." },
    { route: "#/contacts", target: "#add-contact", title: "Contacts",
      body: "Adjusters, suppliers, subs, realtors — the people around the jobs. Adjusters from imported claim PDFs land here on their own." },
    { route: "#/crews", target: "#add-crew", title: "Team & subs",
      body: "Add your crews to assign jobs and see who's where. Each one has an onboarding checklist (W-9, insurance cert, agreement…) and you'll get warned before a cert expires." },
    { route: "#/settings", target: "#export-btn", title: "You're all set 🎉",
      body: "Settings holds your pricing rules, backups (export one now and then!), and cloud sync to share one book across devices. You can replay this tour from here anytime. Now go add your first job!" }
  ];
  var tourIdx = -1, tourCard = null, tourBackdrop = null, tourGlowEl = null;

  function tourCleanupStep() {
    if (tourGlowEl) tourGlowEl.classList.remove("tour-glow");
    tourGlowEl = null;
    if (tourBackdrop) tourBackdrop.remove();
    tourBackdrop = null;
  }
  function endTour(finished) {
    tourCleanupStep();
    if (tourCard) tourCard.remove();
    tourCard = null;
    tourIdx = -1;
    try { localStorage.setItem(TOUR_KEY, finished ? "done" : "exited"); } catch (e) {}
    document.removeEventListener("keydown", tourEsc);
    if (finished) toast("Tour complete — go get 'em 💪");
  }
  function tourEsc(e) { if (e.key === "Escape" && tourIdx >= 0) endTour(false); }

  function startTour() {
    var inv = document.getElementById("tour-invite");
    if (inv) inv.remove();
    tourIdx = 0;
    document.addEventListener("keydown", tourEsc);
    showTourStep();
  }

  function showTourStep() {
    tourCleanupStep();
    var st = TOUR_STEPS[tourIdx];
    if (location.hash !== st.route) { location.hash = st.route; }
    setTimeout(function () {
      if (tourIdx < 0) return;
      if (!tourCard) {
        tourCard = document.createElement("div");
        document.body.appendChild(tourCard);
      }
      var n = TOUR_STEPS.length;
      tourCard.innerHTML =
        '<button class="tour-x" id="tour-exit" aria-label="Exit tour">✕</button>' +
        "<h3>" + esc(st.title) + "</h3>" +
        "<p>" + esc(st.body) + "</p>" +
        '<div class="tour-btns">' +
        (tourIdx > 0 ? '<button class="btn small" id="tour-back">← Back</button>' : "") +
        '<button class="btn small primary" id="tour-next">' + (tourIdx === n - 1 ? "Finish" : "Next →") + "</button></div>" +
        '<div class="tour-track"><i style="width:' + Math.round(((tourIdx + 1) / n) * 100) + '%"></i></div>' +
        '<span class="tour-count">Step ' + (tourIdx + 1) + " of " + n + "</span>";

      var target = st.target ? document.querySelector(st.target) : null;
      if (target) {
        target.classList.add("tour-glow");
        tourGlowEl = target;
        try { target.scrollIntoView({ block: "center", behavior: "auto" }); } catch (e) { target.scrollIntoView(); }
      } else {
        tourBackdrop = document.createElement("div");
        tourBackdrop.className = "tour-backdrop";
        document.body.appendChild(tourBackdrop);
      }

      /* place the card: bottom sheet on phones, next to the target on desktop */
      tourCard.style.top = ""; tourCard.style.left = "";
      if (window.innerWidth <= 720) {
        tourCard.className = "tour-card";
      } else if (target) {
        tourCard.className = "tour-card";
        var r = target.getBoundingClientRect();
        var ch = tourCard.offsetHeight || 240;
        var top = r.bottom + 14;
        if (top + ch > window.innerHeight - 12) top = Math.max(r.top - ch - 14, 12);
        var left = Math.min(Math.max(r.left, 12), window.innerWidth - 350);
        tourCard.style.top = top + "px";
        tourCard.style.left = left + "px";
      } else {
        tourCard.className = "tour-card center";
      }

      tourCard.querySelector("#tour-exit").addEventListener("click", function () { endTour(false); });
      tourCard.querySelector("#tour-next").addEventListener("click", function () {
        if (tourIdx >= TOUR_STEPS.length - 1) { endTour(true); return; }
        tourIdx++;
        showTourStep();
      });
      var backBtn = tourCard.querySelector("#tour-back");
      if (backBtn) backBtn.addEventListener("click", function () { tourIdx = Math.max(tourIdx - 1, 0); showTourStep(); });
    }, 140);
  }

  function maybeInviteTour() {
    var seen = "";
    try { seen = localStorage.getItem(TOUR_KEY) || ""; } catch (e) {}
    if (seen) return;
    setTimeout(function () {
      if (document.getElementById("tour-invite") || tourIdx >= 0) return;
      var inv = document.createElement("div");
      inv.className = "tour-invite";
      inv.id = "tour-invite";
      inv.innerHTML = "<b>👋 First time here?</b>" +
        "<p>Take a quick tour — we'll walk through everything the CRM can do, one step at a time.</p>" +
        '<div class="row"><button class="btn small primary" id="tour-start">Show me around</button>' +
        '<button class="btn small" id="tour-no">No thanks</button></div>';
      document.body.appendChild(inv);
      inv.querySelector("#tour-start").addEventListener("click", startTour);
      inv.querySelector("#tour-no").addEventListener("click", function () {
        try { localStorage.setItem(TOUR_KEY, "declined"); } catch (e) {}
        inv.remove();
      });
    }, 900);
  }

  window.__startTour = startTour; /* used by the Settings replay button */

  /* ======================================================================
     Boot
     ====================================================================== */

  render();
  maybeInviteTour();
})();
