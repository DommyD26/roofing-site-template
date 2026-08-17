/* Agent CRM — Business Development HQ.
   Local-first (localStorage). Optional shared team backend + email sending
   via a Google Apps Script web app (see crm/Code.gs and CRM-SETUP.md). */
(function () {
  "use strict";

  var LS_DATA = "bdcrm-data-v1";
  var LS_CFG = "bdcrm-cfg-v1";

  var STATUSES = ["Lead", "Contacted", "Inspected", "Quoted", "Sold", "In Progress", "Completed", "Lost"];
  var WON = { "Sold": 1, "In Progress": 1, "Completed": 1 };
  var CLOSED = { "Completed": 1, "Lost": 1 };
  var JOB_TYPES = ["Roof Replacement", "Roof Repair", "Inspection", "Gutters", "Siding", "Storm / Insurance", "Other"];
  var TIERS = ["A", "B", "C"];
  var TOUCH_KINDS = [
    { k: "call", label: "📞 Call" },
    { k: "text", label: "💬 Text" },
    { k: "email", label: "✉️ Email" },
    { k: "visit", label: "🚪 Pop-by" },
    { k: "lunch", label: "🍽️ Lunch/Coffee" },
    { k: "gift", label: "🎁 Gift" },
    { k: "event", label: "🎪 Event" },
    { k: "note", label: "📝 Note" }
  ];
  var TOUCH_LABEL = {};
  TOUCH_KINDS.forEach(function (t) { TOUCH_LABEL[t.k] = t.label; });

  /* ---------------- storage ---------------- */

  function blankDb() { return { agents: [], jobs: [], touches: [], templates: [], tombstones: {} }; }

  function load(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function store(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

  var DB = load(LS_DATA, null) || blankDb();
  ["agents", "jobs", "touches", "templates"].forEach(function (k) { if (!Array.isArray(DB[k])) DB[k] = []; });
  if (!DB.tombstones || typeof DB.tombstones !== "object") DB.tombstones = {};

  var CFG = load(LS_CFG, null) || { api: "", teamKey: "", rep: "", coldDays: 30, autoSync: true };

  function persist() { store(LS_DATA, DB); }
  function persistCfg() { store(LS_CFG, CFG); }

  /* Seed starter message templates on first run. */
  if (!DB.templates.length && !DB.agents.length) {
    DB.templates = [
      { id: uid(), updated: nowIso(), name: "Check-in text", channel: "sms", subject: "",
        body: "Hey {{first}}, it's {{rep}} with T-Rock Roofing. Just checking in — if any of your listings or buyers need a roof looked at, we'll get out there fast and keep you in the loop the whole way. Hope business is booming!" },
      { id: uid(), updated: nowIso(), name: "Re-engagement email", channel: "email", subject: "Free roof inspections for your listings, {{first}}",
        body: "Hi {{first}},\n\nIt's been a little while! We're still offering free roof inspections and same-week reports for any listing you're repping — great for pre-listing prep or inspection-response negotiations.\n\nSend an address any time and we'll take care of your client like they're ours.\n\nThanks,\n{{rep}}\nT-Rock Roofing" },
      { id: uid(), updated: nowIso(), name: "Referral thank-you email", channel: "email", subject: "Thank you for the referral, {{first}}!",
        body: "Hi {{first}},\n\nThank you for trusting us with your client — referrals from you mean a lot. We'll keep you posted at every step so you always know where things stand.\n\nTalk soon,\n{{rep}}\nT-Rock Roofing" }
    ];
    persist();
  }

  /* ---------------- small helpers ---------------- */

  function uid() {
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }
  function nowIso() { return new Date().toISOString(); }
  function todayIso() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function escAttr(s) { return esc(s); }
  function parseMoney(v) {
    var n = parseFloat(String(v == null ? "" : v).replace(/[$,\s]/g, ""));
    return isNaN(n) ? 0 : Math.round(n * 100) / 100;
  }
  function fmtMoney(n) {
    n = Number(n) || 0;
    var sign = n < 0 ? "-" : "";
    return sign + "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
  }
  function fmtDate(x) {
    if (!x) return "—";
    var d = new Date(String(x).length === 10 ? x + "T12:00:00" : x);
    return isNaN(d) ? "—" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  function daysSince(x) {
    if (!x) return null;
    var d = new Date(String(x).length === 10 ? x + "T12:00:00" : x);
    if (isNaN(d)) return null;
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
  }
  function daysLabel(n) {
    if (n === null) return "never";
    if (n === 0) return "today";
    if (n === 1) return "1 day";
    return n + " days";
  }
  function digits(p) { return String(p || "").replace(/[^\d+]/g, ""); }

  function toast(msg, bad) {
    var box = document.getElementById("toasts");
    var el = document.createElement("div");
    el.className = "toast" + (bad ? " bad" : "");
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () { el.remove(); }, 4200);
  }

  /* ---------------- domain lookups & stats ---------------- */

  function activeAgents() { return DB.agents.filter(function (a) { return !a.archived; }); }
  function getAgent(id) {
    for (var i = 0; i < DB.agents.length; i++) if (DB.agents[i].id === id) return DB.agents[i];
    return null;
  }
  function getJob(id) {
    for (var i = 0; i < DB.jobs.length; i++) if (DB.jobs[i].id === id) return DB.jobs[i];
    return null;
  }
  function getTemplate(id) {
    for (var i = 0; i < DB.templates.length; i++) if (DB.templates[i].id === id) return DB.templates[i];
    return null;
  }
  function agentName(a) { return a ? ((a.first || "") + " " + (a.last || "")).trim() || "(unnamed)" : "(deleted agent)"; }

  function agentJobs(id) { return DB.jobs.filter(function (j) { return j.agentId === id; }); }
  function agentTouches(id) { return DB.touches.filter(function (t) { return t.agentId === id; }); }

  function agentStats(a) {
    var jobs = agentJobs(a.id);
    var s = { jobs: jobs.length, open: 0, won: 0, lost: 0, revenue: 0, cost: 0, profit: 0, pipeline: 0,
              lastReferral: null, lastTouch: null, lastWorked: null, conv: null };
    jobs.forEach(function (j) {
      if (WON[j.status]) { s.won++; s.revenue += Number(j.revenue) || 0; s.cost += Number(j.cost) || 0; }
      else if (j.status === "Lost") s.lost++;
      if (!CLOSED[j.status]) { s.open++; s.pipeline += Number(j.revenue) || 0; }
      if (j.referred && (!s.lastReferral || j.referred > s.lastReferral)) s.lastReferral = j.referred;
      var latest = j.closed || j.referred;
      if (latest && (!s.lastWorked || latest > s.lastWorked)) s.lastWorked = latest;
    });
    s.profit = s.revenue - s.cost;
    agentTouches(a.id).forEach(function (t) {
      if (t.when && (!s.lastTouch || t.when > s.lastTouch)) s.lastTouch = t.when;
    });
    if (s.lastTouch && (!s.lastWorked || s.lastTouch > s.lastWorked)) s.lastWorked = s.lastTouch;
    var decided = s.won + s.lost;
    if (decided > 0) s.conv = Math.round((s.won / decided) * 100);
    s.daysTouch = daysSince(s.lastTouch);
    s.daysReferral = daysSince(s.lastReferral);
    s.daysWorked = daysSince(s.lastWorked);
    return s;
  }

  function healthChip(daysWorked) {
    var cold = Number(CFG.coldDays) || 30;
    if (daysWorked === null) return '<span class="chip c-gray">no contact yet</span>';
    if (daysWorked <= 14) return '<span class="chip c-green">hot · ' + daysLabel(daysWorked) + '</span>';
    if (daysWorked <= cold) return '<span class="chip c-amber">warm · ' + daysLabel(daysWorked) + '</span>';
    return '<span class="chip c-red">cold · ' + daysLabel(daysWorked) + '</span>';
  }

  function statusChip(st) {
    var cls = st === "Completed" ? "c-green" : st === "Lost" ? "c-red" : (st === "Sold" || st === "In Progress") ? "c-blue" : "c-amber";
    return '<span class="chip ' + cls + '">' + esc(st) + "</span>";
  }

  /* ---------------- mutations ---------------- */

  function touchStamp(rec) { rec.updated = nowIso(); }

  function upsertAgent(a) {
    touchStamp(a);
    var cur = getAgent(a.id);
    if (cur) Object.assign(cur, a); else DB.agents.push(a);
    persist(); markDirty();
  }
  function upsertJob(j) {
    touchStamp(j);
    var cur = getJob(j.id);
    if (cur) Object.assign(cur, j); else DB.jobs.push(j);
    persist(); markDirty();
  }
  function upsertTemplate(t) {
    touchStamp(t);
    var cur = getTemplate(t.id);
    if (cur) Object.assign(cur, t); else DB.templates.push(t);
    persist(); markDirty();
  }
  function logTouch(agentId, kind, note) {
    DB.touches.push({ id: uid(), agentId: agentId, kind: kind, note: note || "", rep: CFG.rep || "", when: nowIso(), updated: nowIso() });
    persist(); markDirty();
  }
  function removeRecord(coll, id) {
    DB[coll] = DB[coll].filter(function (r) { return r.id !== id; });
    DB.tombstones[id] = nowIso();
    if (coll === "agents") {
      DB.jobs = DB.jobs.filter(function (j) { if (j.agentId === id) { DB.tombstones[j.id] = nowIso(); return false; } return true; });
      DB.touches = DB.touches.filter(function (t) { if (t.agentId === id) { DB.tombstones[t.id] = nowIso(); return false; } return true; });
    }
    persist(); markDirty();
  }

  /* ---------------- sync (optional team backend) ---------------- */

  var syncTimer = null, syncing = false;

  function setSyncUi(state, label) {
    var dot = document.getElementById("sync-dot"), lab = document.getElementById("sync-label");
    dot.className = state || "";
    lab.textContent = label;
  }
  function refreshSyncUi() {
    if (!CFG.api || !CFG.teamKey) setSyncUi("", "local only");
    else setSyncUi("ok", "team sync on");
  }

  function markDirty() {
    if (!CFG.api || !CFG.teamKey || !CFG.autoSync) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function () { syncNow(true); }, 2500);
  }

  function mergeColl(local, remote, tombstones) {
    var byId = {};
    local.concat(remote || []).forEach(function (r) {
      if (!r || !r.id) return;
      var t = tombstones[r.id];
      if (t && (!r.updated || t >= r.updated)) return;
      var cur = byId[r.id];
      if (!cur || String(r.updated || "") > String(cur.updated || "")) byId[r.id] = r;
    });
    return Object.keys(byId).map(function (k) { return byId[k]; });
  }

  function applyMerge(remote) {
    if (!remote || typeof remote !== "object") return;
    var tombs = Object.assign({}, remote.tombstones || {}, DB.tombstones);
    ["agents", "jobs", "touches", "templates"].forEach(function (k) {
      DB[k] = mergeColl(DB[k], remote[k], tombs);
    });
    DB.tombstones = tombs;
    persist();
  }

  function syncNow(quiet) {
    if (!CFG.api || !CFG.teamKey) { if (!quiet) toast("Set the backend URL and team key in Settings first.", true); return Promise.resolve(false); }
    if (syncing) return Promise.resolve(false);
    syncing = true;
    setSyncUi("busy", "syncing…");
    return fetch(CFG.api, {
      method: "POST",
      body: JSON.stringify({ type: "sync", key: CFG.teamKey, data: JSON.stringify({
        agents: DB.agents, jobs: DB.jobs, touches: DB.touches, templates: DB.templates, tombstones: DB.tombstones
      }) })
    }).then(function (r) { return r.json(); }).then(function (res) {
      syncing = false;
      if (!res || !res.ok) throw new Error((res && res.error) || "sync failed");
      var remote = null;
      try { remote = JSON.parse(res.data); } catch (e) {}
      if (remote) applyMerge(remote);
      setSyncUi("ok", "synced " + new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }));
      if (!quiet) toast("Synced with the team.");
      render();
      return true;
    }).catch(function (err) {
      syncing = false;
      setSyncUi("err", "sync error");
      if (!quiet) toast("Sync failed: " + err.message, true);
      return false;
    });
  }

  /* ---------------- modal ---------------- */

  var modalWrap = document.getElementById("modal-wrap");
  var modalEl = document.getElementById("modal");
  function openModal(html) {
    modalEl.innerHTML = html;
    modalWrap.classList.add("open");
    var first = modalEl.querySelector("input,select,textarea");
    if (first) first.focus();
  }
  function closeModal() { modalWrap.classList.remove("open"); modalEl.innerHTML = ""; }
  modalWrap.addEventListener("click", function (e) { if (e.target === modalWrap) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

  /* ---------------- merge fields ---------------- */

  function renderMerge(str, agent) {
    return String(str || "")
      .replace(/{{\s*first\s*}}/gi, (agent && agent.first) || "there")
      .replace(/{{\s*last\s*}}/gi, (agent && agent.last) || "")
      .replace(/{{\s*brokerage\s*}}/gi, (agent && agent.brokerage) || "your office")
      .replace(/{{\s*rep\s*}}/gi, CFG.rep || "the T-Rock team");
  }

  /* ---------------- CSV / files ---------------- */

  function csvCell(v) {
    var s = String(v == null ? "" : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(rows) { return rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n"); }
  function downloadFile(name, text, mime) {
    var blob = new Blob([text], { type: mime || "text/plain" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  }
  function parseCsv(text) {
    var rows = [], row = [], cur = "", inQ = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
        else cur += c;
      } else if (c === '"') inQ = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cur); cur = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else cur += c;
    }
    row.push(cur);
    if (row.length > 1 || row[0] !== "") rows.push(row);
    return rows;
  }

  /* ---------------- router ---------------- */

  var app = document.getElementById("app");

  function route() {
    var h = location.hash || "#/dash";
    var parts = h.replace(/^#\//, "").split("/");
    return { view: parts[0] || "dash", arg: parts[1] ? decodeURIComponent(parts[1]) : null };
  }

  function setActiveTab(view) {
    var links = document.querySelectorAll("#tabs a");
    for (var i = 0; i < links.length; i++) {
      var tab = links[i].getAttribute("data-tab");
      links[i].classList.toggle("active", tab === view || (view === "agent" && tab === "agents"));
    }
  }

  function render() {
    var r = route();
    setActiveTab(r.view);
    if (r.view === "agents") vAgents();
    else if (r.view === "agent" && r.arg) vAgentDetail(r.arg);
    else if (r.view === "jobs") vJobs();
    else if (r.view === "marketing") vMarketing();
    else if (r.view === "settings") vSettings();
    else vDash();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", render);

  /* ---------------- dashboard ---------------- */

  function vDash() {
    var agents = activeAgents();
    var year = new Date().getFullYear();
    var tot = { open: 0, won: 0, completed: 0, revenue: 0, profit: 0, pipeline: 0, revYtd: 0, profYtd: 0, wonJobs: 0, lost: 0 };
    DB.jobs.forEach(function (j) {
      var rev = Number(j.revenue) || 0, cost = Number(j.cost) || 0;
      if (!CLOSED[j.status]) { tot.open++; tot.pipeline += rev; }
      if (WON[j.status]) {
        tot.wonJobs++; tot.revenue += rev; tot.profit += rev - cost;
        var when = j.closed || j.referred;
        if (when && String(when).slice(0, 4) === String(year)) { tot.revYtd += rev; tot.profYtd += rev - cost; }
      }
      if (j.status === "Completed") tot.completed++;
      if (j.status === "Lost") tot.lost++;
    });
    var decided = tot.wonJobs + tot.lost;
    var conv = decided ? Math.round((tot.wonJobs / decided) * 100) + "%" : "—";

    var statRows = agents.map(function (a) { return { a: a, s: agentStats(a) }; });

    /* follow-up queue: coldest first; never-contacted at top */
    var cold = Number(CFG.coldDays) || 30;
    var queue = statRows.filter(function (r) { return r.s.daysWorked === null || r.s.daysWorked > cold; })
      .sort(function (x, y) {
        var dx = x.s.daysWorked === null ? 1e9 : x.s.daysWorked;
        var dy = y.s.daysWorked === null ? 1e9 : y.s.daysWorked;
        return dy - dx;
      }).slice(0, 12);

    var top = statRows.filter(function (r) { return r.s.won > 0; })
      .sort(function (x, y) { return y.s.profit - x.s.profit; }).slice(0, 8);

    var pipeCounts = {};
    STATUSES.forEach(function (st) { pipeCounts[st] = { n: 0, v: 0 }; });
    DB.jobs.forEach(function (j) {
      if (!pipeCounts[j.status]) pipeCounts[j.status] = { n: 0, v: 0 };
      pipeCounts[j.status].n++; pipeCounts[j.status].v += Number(j.revenue) || 0;
    });

    var feed = DB.touches.slice().sort(function (a, b) { return String(b.when).localeCompare(String(a.when)); }).slice(0, 25);

    var html =
      '<div class="stat-strip">' +
        stat(agents.length, "Agents") +
        stat(tot.open, "Open referrals") +
        stat(fmtMoney(tot.pipeline), "Pipeline value") +
        stat(fmtMoney(tot.revYtd), "Revenue " + year) +
        stat(fmtMoney(tot.profYtd), "Profit " + year, tot.profYtd < 0) +
        stat(conv, "Close rate") +
      "</div>" +

      '<div class="card"><div class="row spread"><h2>🥶 Follow-up queue</h2><span class="tiny">agents with no activity in ' + cold + '+ days (set in Settings)</span></div>' +
      (queue.length ? '<div class="table-scroll"><table><thead><tr><th>Agent</th><th>Brokerage</th><th>Last activity</th><th>Referrals</th><th>Quick log</th></tr></thead><tbody>' +
        queue.map(function (r) {
          return "<tr>" +
            '<td><a class="backlink" href="#/agent/' + encodeURIComponent(r.a.id) + '">' + esc(agentName(r.a)) + "</a></td>" +
            "<td>" + esc(r.a.brokerage || "—") + "</td>" +
            "<td>" + healthChip(r.s.daysWorked) + "</td>" +
            '<td class="num">' + r.s.jobs + "</td>" +
            '<td><span class="touch-btns">' + quickTouchButtons(r.a) + "</span></td>" +
          "</tr>";
        }).join("") + "</tbody></table></div>"
      : '<p class="muted">Nobody’s gone cold. Nice work staying in touch. 🔥</p>') +
      "</div>" +

      '<div class="grid2">' +
        '<div class="card"><h2>🏆 Top agents by profit</h2>' +
        (top.length ? '<div class="table-scroll"><table><thead><tr><th>Agent</th><th class="num">Jobs won</th><th class="num">Revenue</th><th class="num">Profit</th></tr></thead><tbody>' +
          top.map(function (r) {
            return "<tr>" +
              '<td><a class="backlink" href="#/agent/' + encodeURIComponent(r.a.id) + '">' + esc(agentName(r.a)) + "</a></td>" +
              '<td class="num">' + r.s.won + "</td>" +
              '<td class="num money">' + fmtMoney(r.s.revenue) + "</td>" +
              '<td class="num money ' + (r.s.profit >= 0 ? "pos" : "neg") + '">' + fmtMoney(r.s.profit) + "</td>" +
            "</tr>";
          }).join("") + "</tbody></table></div>"
        : '<p class="muted">No won referrals yet — add agents and log their referrals to see your leaderboard.</p>') +
        "</div>" +

        '<div class="card"><h2>📊 Pipeline</h2><div class="kanban">' +
          STATUSES.map(function (st) {
            var c = pipeCounts[st];
            return '<div class="kcol"><h4>' + esc(st.toUpperCase()) + '</h4><div class="kv">' + c.n + '</div><div class="ks money">' + fmtMoney(c.v) + "</div></div>";
          }).join("") +
        "</div></div>" +
      "</div>" +

      '<div class="card"><h2>🕓 Recent activity</h2><div class="feed">' +
        (feed.length ? feed.map(function (t) {
          var a = getAgent(t.agentId);
          return "<div><time>" + esc(fmtDate(t.when)) + "</time> " + (TOUCH_LABEL[t.kind] || esc(t.kind)) + " — " +
            (a ? '<a class="backlink" href="#/agent/' + encodeURIComponent(a.id) + '">' + esc(agentName(a)) + "</a>" : "(removed)") +
            (t.note ? ' <span class="muted">· ' + esc(t.note) + "</span>" : "") +
            (t.rep ? ' <span class="tiny">by ' + esc(t.rep) + "</span>" : "") + "</div>";
        }).join("") : '<p class="muted">No activity logged yet.</p>') +
      "</div></div>";

    app.innerHTML = html;
    bindQuickTouch(app);
  }

  function stat(v, label, bad) {
    return '<div class="stat' + (bad ? " hot" : "") + '"><strong>' + v + "</strong><span>" + esc(label) + "</span></div>";
  }

  function quickTouchButtons(a) {
    var out = "";
    out += '<button class="btn small" data-qt="call" data-agent="' + escAttr(a.id) + '"' + (a.phone ? "" : " disabled") + ">📞</button>";
    out += '<button class="btn small" data-qt="text" data-agent="' + escAttr(a.id) + '"' + (a.phone ? "" : " disabled") + ">💬</button>";
    out += '<button class="btn small" data-qt="email" data-agent="' + escAttr(a.id) + '"' + (a.email ? "" : " disabled") + ">✉️</button>";
    return out;
  }
  function bindQuickTouch(root) {
    root.querySelectorAll("[data-qt]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var a = getAgent(btn.getAttribute("data-agent"));
        if (!a) return;
        var kind = btn.getAttribute("data-qt");
        if (kind === "call" && a.phone) location.href = "tel:" + digits(a.phone);
        if (kind === "text" && a.phone) location.href = "sms:" + digits(a.phone);
        if (kind === "email" && a.email) location.href = "mailto:" + a.email;
        logTouch(a.id, kind, "quick " + kind + " from dashboard");
        toast(TOUCH_LABEL[kind] + " logged for " + agentName(a));
        setTimeout(render, 400);
      });
    });
  }

  /* ---------------- agents list ---------------- */

  var agentsView = { q: "", tier: "", tag: "", sort: "name", dir: 1 };

  function allTags() {
    var set = {};
    DB.agents.forEach(function (a) { (a.tags || []).forEach(function (t) { set[t] = 1; }); });
    return Object.keys(set).sort();
  }

  function vAgents() {
    var rows = activeAgents().map(function (a) { return { a: a, s: agentStats(a) }; });
    var q = agentsView.q.toLowerCase();
    if (q) rows = rows.filter(function (r) {
      return (agentName(r.a) + " " + (r.a.brokerage || "") + " " + (r.a.email || "") + " " + (r.a.phone || "")).toLowerCase().indexOf(q) !== -1;
    });
    if (agentsView.tier) rows = rows.filter(function (r) { return (r.a.tier || "") === agentsView.tier; });
    if (agentsView.tag) rows = rows.filter(function (r) { return (r.a.tags || []).indexOf(agentsView.tag) !== -1; });

    var sorters = {
      name: function (r) { return agentName(r.a).toLowerCase(); },
      brokerage: function (r) { return (r.a.brokerage || "").toLowerCase(); },
      tier: function (r) { return r.a.tier || "Z"; },
      jobs: function (r) { return r.s.jobs; },
      revenue: function (r) { return r.s.revenue; },
      profit: function (r) { return r.s.profit; },
      touch: function (r) { return r.s.daysWorked === null ? 1e9 : r.s.daysWorked; }
    };
    var key = sorters[agentsView.sort] || sorters.name;
    rows.sort(function (x, y) {
      var a = key(x), b = key(y);
      return (a < b ? -1 : a > b ? 1 : 0) * agentsView.dir;
    });

    function th(id, label, num) {
      var arrow = agentsView.sort === id ? (agentsView.dir === 1 ? " ▲" : " ▼") : "";
      return '<th class="sort' + (num ? " num" : "") + '" data-sort="' + id + '">' + label + arrow + "</th>";
    }

    var html =
      '<div class="card"><div class="row spread">' +
        "<h2>Agents (" + rows.length + ")</h2>" +
        '<div class="row">' +
          '<input type="search" id="ag-q" placeholder="Search name, office, email…" value="' + escAttr(agentsView.q) + '">' +
          '<select id="ag-tier"><option value="">All tiers</option>' + TIERS.map(function (t) { return '<option' + (agentsView.tier === t ? " selected" : "") + ">" + t + "</option>"; }).join("") + "</select>" +
          '<select id="ag-tag"><option value="">All tags</option>' + allTags().map(function (t) { return '<option' + (agentsView.tag === t ? " selected" : "") + ">" + esc(t) + "</option>"; }).join("") + "</select>" +
          '<button class="btn primary" id="ag-add">+ Add agent</button>' +
        "</div>" +
      "</div>" +
      '<div class="table-scroll"><table><thead><tr>' +
        th("name", "Agent") + th("brokerage", "Brokerage") + th("tier", "Tier") +
        th("jobs", "Referrals", 1) + th("revenue", "Revenue", 1) + th("profit", "Profit", 1) +
        th("touch", "Last activity") + "<th>Quick log</th>" +
      "</tr></thead><tbody>" +
      (rows.length ? rows.map(function (r) {
        return '<tr class="clickable" data-open="' + escAttr(r.a.id) + '">' +
          "<td><strong>" + esc(agentName(r.a)) + "</strong>" +
            ((r.a.tags || []).length ? "<br>" + r.a.tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") : "") + "</td>" +
          "<td>" + esc(r.a.brokerage || "—") + "</td>" +
          '<td><span class="tier ' + escAttr(r.a.tier || "C") + '">' + esc(r.a.tier || "C") + "</span></td>" +
          '<td class="num">' + r.s.jobs + "</td>" +
          '<td class="num money">' + fmtMoney(r.s.revenue) + "</td>" +
          '<td class="num money ' + (r.s.profit >= 0 ? "pos" : "neg") + '">' + fmtMoney(r.s.profit) + "</td>" +
          "<td>" + healthChip(r.s.daysWorked) + "</td>" +
          '<td><span class="touch-btns">' + quickTouchButtons(r.a) + "</span></td>" +
        "</tr>";
      }).join("") : '<tr><td colspan="8" class="muted">No agents yet — hit “+ Add agent” to start your book of business.</td></tr>') +
      "</tbody></table></div></div>";

    app.innerHTML = html;

    var qEl = document.getElementById("ag-q");
    qEl.addEventListener("input", function () { agentsView.q = qEl.value; vAgents(); });
    if (agentsView.q) { qEl.focus(); qEl.setSelectionRange(qEl.value.length, qEl.value.length); }
    document.getElementById("ag-tier").addEventListener("change", function (e) { agentsView.tier = e.target.value; vAgents(); });
    document.getElementById("ag-tag").addEventListener("change", function (e) { agentsView.tag = e.target.value; vAgents(); });
    document.getElementById("ag-add").addEventListener("click", function () { agentForm(null); });
    app.querySelectorAll("th.sort").forEach(function (el) {
      el.addEventListener("click", function () {
        var id = el.getAttribute("data-sort");
        if (agentsView.sort === id) agentsView.dir *= -1; else { agentsView.sort = id; agentsView.dir = id === "name" || id === "brokerage" ? 1 : -1; }
        vAgents();
      });
    });
    app.querySelectorAll("tr[data-open]").forEach(function (tr) {
      tr.addEventListener("click", function (e) {
        if (e.target.closest("button")) return;
        location.hash = "#/agent/" + encodeURIComponent(tr.getAttribute("data-open"));
      });
    });
    bindQuickTouch(app);
  }

  function agentForm(a) {
    var isNew = !a;
    a = a || { id: uid(), first: "", last: "", brokerage: "", email: "", phone: "", tier: "B", tags: [], territory: "", birthday: "", notes: "" };
    openModal(
      "<h2>" + (isNew ? "Add agent" : "Edit " + esc(agentName(a))) + "</h2>" +
      '<div class="fgrid">' +
        '<label class="f">First name<input id="f-first" value="' + escAttr(a.first) + '"></label>' +
        '<label class="f">Last name<input id="f-last" value="' + escAttr(a.last) + '"></label>' +
        '<label class="f">Brokerage<input id="f-brok" value="' + escAttr(a.brokerage) + '" placeholder="e.g. Keller Williams"></label>' +
        '<label class="f">Tier <span class="tiny">(A = top referrer)</span><select id="f-tier">' + TIERS.map(function (t) { return "<option" + (a.tier === t ? " selected" : "") + ">" + t + "</option>"; }).join("") + "</select></label>" +
        '<label class="f">Email<input id="f-email" type="email" value="' + escAttr(a.email) + '"></label>' +
        '<label class="f">Phone<input id="f-phone" value="' + escAttr(a.phone) + '"></label>' +
        '<label class="f">Territory / market<input id="f-terr" value="' + escAttr(a.territory || "") + '"></label>' +
        '<label class="f">Birthday <span class="tiny">(optional)</span><input id="f-bday" type="date" value="' + escAttr(a.birthday || "") + '"></label>' +
      "</div>" +
      '<label class="f">Tags <span class="tiny">(comma-separated, e.g. luxury, investor-focused)</span><input id="f-tags" value="' + escAttr((a.tags || []).join(", ")) + '"></label>' +
      '<label class="f">Notes<textarea id="f-notes">' + esc(a.notes || "") + "</textarea></label>" +
      '<div class="row spread"><button class="btn" id="f-cancel">Cancel</button><button class="btn primary" id="f-save">' + (isNew ? "Add agent" : "Save changes") + "</button></div>"
    );
    document.getElementById("f-cancel").onclick = closeModal;
    document.getElementById("f-save").onclick = function () {
      a.first = document.getElementById("f-first").value.trim();
      a.last = document.getElementById("f-last").value.trim();
      a.brokerage = document.getElementById("f-brok").value.trim();
      a.tier = document.getElementById("f-tier").value;
      a.email = document.getElementById("f-email").value.trim();
      a.phone = document.getElementById("f-phone").value.trim();
      a.territory = document.getElementById("f-terr").value.trim();
      a.birthday = document.getElementById("f-bday").value;
      a.tags = document.getElementById("f-tags").value.split(",").map(function (t) { return t.trim(); }).filter(Boolean);
      a.notes = document.getElementById("f-notes").value;
      if (!a.first && !a.last) { toast("Give the agent a name.", true); return; }
      if (isNew) a.added = todayIso();
      upsertAgent(a);
      closeModal();
      toast((isNew ? "Added " : "Saved ") + agentName(a));
      render();
    };
  }

  /* ---------------- agent detail ---------------- */

  function vAgentDetail(id) {
    var a = getAgent(id);
    if (!a) { app.innerHTML = '<div class="card"><p class="err">Agent not found.</p><a class="backlink" href="#/agents">← Back to agents</a></div>'; return; }
    var s = agentStats(a);
    var jobs = agentJobs(id).sort(function (x, y) { return String(y.referred || "").localeCompare(String(x.referred || "")); });
    var touches = agentTouches(id).sort(function (x, y) { return String(y.when).localeCompare(String(x.when)); });

    var html =
      '<a class="backlink" href="#/agents">← All agents</a>' +
      '<div class="card" style="margin-top:.6rem"><div class="row spread">' +
        '<div><h2 style="margin-bottom:.15rem">' + esc(agentName(a)) + ' <span class="tier ' + escAttr(a.tier || "C") + '">' + esc(a.tier || "C") + "</span></h2>" +
          '<div class="muted">' + esc(a.brokerage || "No brokerage") + (a.territory ? " · " + esc(a.territory) : "") + "</div>" +
          "<div>" + (a.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" +
        "</div>" +
        '<div class="row">' +
          (a.phone ? '<a class="btn small" href="tel:' + escAttr(digits(a.phone)) + '" data-log="call">📞 Call</a><a class="btn small" href="sms:' + escAttr(digits(a.phone)) + '" data-log="text">💬 Text</a>' : "") +
          (a.email ? '<a class="btn small" href="mailto:' + escAttr(a.email) + '" data-log="email">✉️ Email</a>' : "") +
          '<button class="btn small" id="a-edit">✏️ Edit</button>' +
          '<button class="btn small danger" id="a-del">Delete</button>' +
        "</div>" +
      "</div>" +
      '<p class="muted" style="margin:.5rem 0 0">' +
        (a.phone ? "📱 " + esc(a.phone) + " · " : "") + (a.email ? "✉️ " + esc(a.email) + " · " : "") +
        (a.birthday ? "🎂 " + esc(fmtDate(a.birthday)) + " · " : "") +
        "Added " + esc(fmtDate(a.added)) + "</p>" +
      (a.notes ? '<p style="white-space:pre-wrap;background:var(--blue-bg);border-radius:10px;padding:.6rem .8rem;font-size:.85rem">' + esc(a.notes) + "</p>" : "") +
      "</div>" +

      '<div class="stat-strip">' +
        stat(s.jobs, "Referrals") +
        stat(s.won, "Jobs won") +
        stat(fmtMoney(s.revenue), "Revenue") +
        stat(fmtMoney(s.profit), "Profit", s.profit < 0) +
        stat(s.conv === null ? "—" : s.conv + "%", "Close rate") +
        stat(daysLabel(s.daysWorked), "Since last activity") +
      "</div>" +

      '<div class="grid2">' +
        '<div class="card"><div class="row spread"><h2>Referrals</h2><button class="btn primary small" id="j-add">+ Log referral</button></div>' +
          (jobs.length ? '<div class="table-scroll"><table><thead><tr><th>Client / job</th><th>Status</th><th>Referred</th><th class="num">Revenue</th><th class="num">Profit</th></tr></thead><tbody>' +
            jobs.map(function (j) {
              var p = (Number(j.revenue) || 0) - (Number(j.cost) || 0);
              return '<tr class="clickable" data-job="' + escAttr(j.id) + '">' +
                "<td><strong>" + esc(j.client || "(no name)") + "</strong><br><span class=\"tiny\">" + esc(j.type || "") + (j.address ? " · " + esc(j.address) : "") + "</span></td>" +
                "<td>" + statusChip(j.status) + "</td>" +
                "<td>" + esc(fmtDate(j.referred)) + "</td>" +
                '<td class="num money">' + fmtMoney(j.revenue) + "</td>" +
                '<td class="num money ' + (p >= 0 ? "pos" : "neg") + '">' + fmtMoney(p) + "</td>" +
              "</tr>";
            }).join("") + "</tbody></table></div>"
          : '<p class="muted">No referrals from ' + esc(a.first || "this agent") + " yet.</p>") +
        "</div>" +

        '<div class="card"><h2>Log a touch</h2>' +
          '<div class="touch-btns">' + TOUCH_KINDS.map(function (t) {
            return '<button class="btn small" data-touch="' + t.k + '">' + t.label + "</button>";
          }).join("") + "</div>" +
          '<label class="f" style="margin-top:.7rem">Note (optional)<input id="t-note" placeholder="e.g. dropped off donuts at the office"></label>' +
          "<h3>History</h3>" +
          '<div class="feed">' + (touches.length ? touches.map(function (t) {
            return "<div><time>" + esc(fmtDate(t.when)) + "</time>" + (TOUCH_LABEL[t.kind] || esc(t.kind)) +
              (t.note ? ' <span class="muted">· ' + esc(t.note) + "</span>" : "") +
              (t.rep ? ' <span class="tiny">by ' + esc(t.rep) + "</span>" : "") + "</div>";
          }).join("") : '<p class="muted">No touches logged yet.</p>') + "</div>" +
        "</div>" +
      "</div>";

    app.innerHTML = html;

    document.getElementById("a-edit").onclick = function () { agentForm(a); };
    document.getElementById("a-del").onclick = function () {
      if (!confirm("Delete " + agentName(a) + "? This also removes their referrals and touch history for the whole team.")) return;
      removeRecord("agents", a.id);
      toast("Deleted " + agentName(a));
      location.hash = "#/agents";
    };
    document.getElementById("j-add").onclick = function () { jobForm(null, a.id); };
    app.querySelectorAll("[data-log]").forEach(function (el) {
      el.addEventListener("click", function () { logTouch(a.id, el.getAttribute("data-log"), ""); setTimeout(render, 400); });
    });
    app.querySelectorAll("[data-touch]").forEach(function (el) {
      el.addEventListener("click", function () {
        logTouch(a.id, el.getAttribute("data-touch"), document.getElementById("t-note").value.trim());
        toast("Logged " + TOUCH_LABEL[el.getAttribute("data-touch")] + " for " + agentName(a));
        render();
      });
    });
    app.querySelectorAll("tr[data-job]").forEach(function (tr) {
      tr.addEventListener("click", function () { var j = getJob(tr.getAttribute("data-job")); if (j) jobForm(j); });
    });
  }

  /* ---------------- jobs / referrals ---------------- */

  var jobsView = { q: "", status: "" };

  function vJobs() {
    var rows = DB.jobs.slice();
    if (jobsView.status) rows = rows.filter(function (j) { return j.status === jobsView.status; });
    var q = jobsView.q.toLowerCase();
    if (q) rows = rows.filter(function (j) {
      var a = getAgent(j.agentId);
      return ((j.client || "") + " " + (j.address || "") + " " + (j.type || "") + " " + (a ? agentName(a) : "")).toLowerCase().indexOf(q) !== -1;
    });
    rows.sort(function (x, y) { return String(y.referred || "").localeCompare(String(x.referred || "")); });

    var totRev = 0, totProfit = 0;
    rows.forEach(function (j) { if (WON[j.status]) { totRev += Number(j.revenue) || 0; totProfit += (Number(j.revenue) || 0) - (Number(j.cost) || 0); } });

    var html =
      '<div class="card"><div class="row spread">' +
        "<h2>Referral jobs (" + rows.length + ")</h2>" +
        '<div class="row">' +
          '<input type="search" id="jb-q" placeholder="Search client, address, agent…" value="' + escAttr(jobsView.q) + '">' +
          '<select id="jb-status"><option value="">All statuses</option>' + STATUSES.map(function (s) { return "<option" + (jobsView.status === s ? " selected" : "") + ">" + s + "</option>"; }).join("") + "</select>" +
          '<button class="btn primary" id="jb-add">+ Log referral</button>' +
        "</div>" +
      "</div>" +
      '<p class="tiny">Won revenue in view: <strong class="money">' + fmtMoney(totRev) + '</strong> · profit: <strong class="money">' + fmtMoney(totProfit) + "</strong></p>" +
      '<div class="table-scroll"><table><thead><tr><th>Client / job</th><th>Referred by</th><th>Status</th><th>Referred</th><th>Closed</th><th class="num">Revenue</th><th class="num">Cost</th><th class="num">Profit</th><th></th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (j) {
        var a = getAgent(j.agentId);
        var p = (Number(j.revenue) || 0) - (Number(j.cost) || 0);
        return "<tr>" +
          "<td><strong>" + esc(j.client || "(no name)") + "</strong><br><span class=\"tiny\">" + esc(j.type || "") + (j.address ? " · " + esc(j.address) : "") + "</span></td>" +
          "<td>" + (a ? '<a class="backlink" href="#/agent/' + encodeURIComponent(a.id) + '">' + esc(agentName(a)) + "</a>" : '<span class="muted">—</span>') + "</td>" +
          '<td><select data-status="' + escAttr(j.id) + '">' + STATUSES.map(function (s) { return "<option" + (j.status === s ? " selected" : "") + ">" + s + "</option>"; }).join("") + "</select></td>" +
          "<td>" + esc(fmtDate(j.referred)) + "</td>" +
          "<td>" + esc(fmtDate(j.closed)) + "</td>" +
          '<td class="num money">' + fmtMoney(j.revenue) + "</td>" +
          '<td class="num money">' + fmtMoney(j.cost) + "</td>" +
          '<td class="num money ' + (p >= 0 ? "pos" : "neg") + '">' + fmtMoney(p) + "</td>" +
          '<td><button class="btn small" data-edit="' + escAttr(j.id) + '">✏️</button></td>' +
        "</tr>";
      }).join("") : '<tr><td colspan="9" class="muted">No referral jobs yet. When an agent sends you work, log it here so revenue and profit follow them.</td></tr>') +
      "</tbody></table></div></div>";

    app.innerHTML = html;

    var qEl = document.getElementById("jb-q");
    qEl.addEventListener("input", function () { jobsView.q = qEl.value; vJobs(); });
    if (jobsView.q) { qEl.focus(); qEl.setSelectionRange(qEl.value.length, qEl.value.length); }
    document.getElementById("jb-status").addEventListener("change", function (e) { jobsView.status = e.target.value; vJobs(); });
    document.getElementById("jb-add").addEventListener("click", function () { jobForm(null, null); });
    app.querySelectorAll("select[data-status]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var j = getJob(sel.getAttribute("data-status"));
        if (!j) return;
        j.status = sel.value;
        if (CLOSED[j.status] && !j.closed) j.closed = todayIso();
        upsertJob(j);
        toast("Moved to " + j.status);
        vJobs();
      });
    });
    app.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () { var j = getJob(btn.getAttribute("data-edit")); if (j) jobForm(j); });
    });
  }

  function jobForm(j, presetAgentId) {
    var isNew = !j;
    j = j || { id: uid(), agentId: presetAgentId || "", client: "", address: "", type: JOB_TYPES[0], status: "Lead", referred: todayIso(), closed: "", revenue: 0, cost: 0, notes: "" };
    var agents = activeAgents().slice().sort(function (a, b) { return agentName(a).localeCompare(agentName(b)); });
    if (!agents.length) { toast("Add an agent first — every referral is tied to one.", true); return; }
    openModal(
      "<h2>" + (isNew ? "Log a referral" : "Edit referral") + "</h2>" +
      '<div class="fgrid">' +
        '<label class="f">Referred by<select id="j-agent">' + agents.map(function (a) {
          return '<option value="' + escAttr(a.id) + '"' + (j.agentId === a.id ? " selected" : "") + ">" + esc(agentName(a)) + (a.brokerage ? " — " + esc(a.brokerage) : "") + "</option>";
        }).join("") + "</select></label>" +
        '<label class="f">Client name<input id="j-client" value="' + escAttr(j.client) + '"></label>' +
        '<label class="f">Job address<input id="j-addr" value="' + escAttr(j.address) + '"></label>' +
        '<label class="f">Job type<select id="j-type">' + JOB_TYPES.map(function (t) { return "<option" + (j.type === t ? " selected" : "") + ">" + t + "</option>"; }).join("") + "</select></label>" +
        '<label class="f">Status<select id="j-status">' + STATUSES.map(function (s) { return "<option" + (j.status === s ? " selected" : "") + ">" + s + "</option>"; }).join("") + "</select></label>" +
        '<label class="f">Date referred<input id="j-referred" type="date" value="' + escAttr(j.referred || "") + '"></label>' +
        '<label class="f">Date closed <span class="tiny">(completed/lost)</span><input id="j-closed" type="date" value="' + escAttr(j.closed || "") + '"></label>' +
        '<label class="f">Revenue (contract $)<input id="j-rev" inputmode="decimal" value="' + escAttr(j.revenue || "") + '"></label>' +
        '<label class="f">Cost (materials + labor $)<input id="j-cost" inputmode="decimal" value="' + escAttr(j.cost || "") + '"></label>' +
      "</div>" +
      '<label class="f">Notes<textarea id="j-notes">' + esc(j.notes || "") + "</textarea></label>" +
      '<div class="row spread">' +
        (isNew ? "<span></span>" : '<button class="btn danger" id="j-del">Delete</button>') +
        '<span class="row"><button class="btn" id="j-cancel">Cancel</button><button class="btn primary" id="j-save">' + (isNew ? "Log referral" : "Save") + "</button></span>" +
      "</div>"
    );
    document.getElementById("j-cancel").onclick = closeModal;
    if (!isNew) document.getElementById("j-del").onclick = function () {
      if (!confirm("Delete this referral job?")) return;
      removeRecord("jobs", j.id);
      closeModal(); toast("Referral deleted"); render();
    };
    document.getElementById("j-save").onclick = function () {
      j.agentId = document.getElementById("j-agent").value;
      j.client = document.getElementById("j-client").value.trim();
      j.address = document.getElementById("j-addr").value.trim();
      j.type = document.getElementById("j-type").value;
      j.status = document.getElementById("j-status").value;
      j.referred = document.getElementById("j-referred").value;
      j.closed = document.getElementById("j-closed").value;
      j.revenue = parseMoney(document.getElementById("j-rev").value);
      j.cost = parseMoney(document.getElementById("j-cost").value);
      j.notes = document.getElementById("j-notes").value;
      if (CLOSED[j.status] && !j.closed) j.closed = todayIso();
      upsertJob(j);
      closeModal();
      toast(isNew ? "Referral logged 🎉" : "Referral saved");
      render();
    };
  }

  /* ---------------- marketing ---------------- */

  var mkView = { channel: "email", templateId: "", audience: "all", done: {} };

  function audienceDefs() {
    var defs = [
      { id: "all", label: "All agents" },
      { id: "tier:A", label: "Tier A only" },
      { id: "tier:B", label: "Tier B only" },
      { id: "tier:C", label: "Tier C only" },
      { id: "cold", label: "Cold agents (past follow-up threshold)" },
      { id: "noref", label: "Never referred a job" }
    ];
    allTags().forEach(function (t) { defs.push({ id: "tag:" + t, label: "Tag: " + t }); });
    return defs;
  }

  function audienceAgents(id) {
    var rows = activeAgents();
    if (id === "cold") {
      var cold = Number(CFG.coldDays) || 30;
      return rows.filter(function (a) { var d = agentStats(a).daysWorked; return d === null || d > cold; });
    }
    if (id === "noref") return rows.filter(function (a) { return agentJobs(a.id).length === 0; });
    if (id.indexOf("tier:") === 0) { var t = id.slice(5); return rows.filter(function (a) { return (a.tier || "") === t; }); }
    if (id.indexOf("tag:") === 0) { var g = id.slice(4); return rows.filter(function (a) { return (a.tags || []).indexOf(g) !== -1; }); }
    return rows;
  }

  function vMarketing() {
    var templates = DB.templates.filter(function (t) { return t.channel === mkView.channel; });
    if (!getTemplate(mkView.templateId) || (getTemplate(mkView.templateId) || {}).channel !== mkView.channel) {
      mkView.templateId = templates.length ? templates[0].id : "";
    }
    var tpl = getTemplate(mkView.templateId);
    var recipients = audienceAgents(mkView.audience).filter(function (a) {
      return mkView.channel === "email" ? !!a.email : !!a.phone;
    });

    var canBackendEmail = !!(CFG.api && CFG.teamKey);

    var html =
      '<div class="card"><h2>📣 Marketing blast</h2>' +
      '<div class="helpbox">Write once, personalize automatically: <code class="mf">{{first}}</code> <code class="mf">{{last}}</code> <code class="mf">{{brokerage}}</code> <code class="mf">{{rep}}</code> fill in per agent. Every send is logged as a touch so “days since last contact” stays honest.</div>' +
      '<div class="row" style="margin-bottom:.8rem">' +
        '<label class="f" style="margin:0">Channel<select id="mk-channel">' +
          '<option value="email"' + (mkView.channel === "email" ? " selected" : "") + ">✉️ Email</option>" +
          '<option value="sms"' + (mkView.channel === "sms" ? " selected" : "") + ">💬 Text</option>" +
        "</select></label>" +
        '<label class="f" style="margin:0">Template<select id="mk-template">' +
          (templates.length ? templates.map(function (t) { return '<option value="' + escAttr(t.id) + '"' + (t.id === mkView.templateId ? " selected" : "") + ">" + esc(t.name) + "</option>"; }).join("") : "<option value=''>(no " + mkView.channel + " templates)</option>") +
        "</select></label>" +
        '<label class="f" style="margin:0">Audience<select id="mk-aud">' +
          audienceDefs().map(function (d) { return '<option value="' + escAttr(d.id) + '"' + (d.id === mkView.audience ? " selected" : "") + ">" + esc(d.label) + "</option>"; }).join("") +
        "</select></label>" +
        '<button class="btn small" id="mk-new">+ New template</button>' +
        (tpl ? '<button class="btn small" id="mk-edit">✏️ Edit template</button>' : "") +
      "</div>" +

      (tpl ?
        '<div class="card" style="background:var(--page)">' +
          (tpl.channel === "email" ? "<p><strong>Subject:</strong> " + esc(tpl.subject) + "</p>" : "") +
          '<p style="white-space:pre-wrap;font-size:.86rem;margin:.2rem 0">' + esc(tpl.body) + "</p>" +
        "</div>"
      : '<p class="muted">Create a template to get started.</p>') +

      "<h3>Recipients (" + recipients.length + ")" + (mkView.channel === "email" ? ' <span class="tiny">agents without an email are skipped</span>' : ' <span class="tiny">agents without a phone are skipped</span>') + "</h3>" +
      (tpl && recipients.length ?
        (mkView.channel === "email" ?
          '<div class="row" style="margin-bottom:.8rem">' +
            (canBackendEmail
              ? '<button class="btn primary" id="mk-send">🚀 Send ' + recipients.length + " personalized emails via your Gmail backend</button>"
              : '<span class="tiny">Connect the team backend in Settings to send personalized emails automatically — or use the one-tap drafts below.</span>') +
          "</div>"
        : '<p class="tiny" style="margin-bottom:.6rem">Text messages open in your phone’s messaging app pre-filled — tap through the list, hit send on each, and check them off. (Carriers don’t allow true bulk SMS from a web page.)</p>') +

        recipients.map(function (a) {
          var body = renderMerge(tpl.body, a);
          var subj = renderMerge(tpl.subject || "", a);
          var done = !!mkView.done[a.id];
          return '<div class="recip' + (done ? " done" : "") + '" data-rid="' + escAttr(a.id) + '">' +
            '<span class="who">' + esc(agentName(a)) + '<br><span class="tiny">' + esc(mkView.channel === "email" ? a.email : a.phone) + "</span></span>" +
            (mkView.channel === "email"
              ? '<a class="btn small" href="mailto:' + escAttr(a.email) + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body) + '" data-open1="' + escAttr(a.id) + '">✉️ Open draft</a>'
              : '<a class="btn small" href="sms:' + escAttr(digits(a.phone)) + "?&body=" + encodeURIComponent(body) + '" data-open1="' + escAttr(a.id) + '">💬 Open text</a>') +
            '<button class="btn small" data-copy="' + escAttr(a.id) + '">📋 Copy</button>' +
            '<button class="btn small" data-done="' + escAttr(a.id) + '">' + (done ? "↩︎ Undo" : "✓ Sent") + "</button>" +
          "</div>";
        }).join("")
      : (tpl ? '<p class="muted">Nobody in this audience has ' + (mkView.channel === "email" ? "an email address" : "a phone number") + " on file.</p>" : "")) +
      "</div>" +

      '<div class="card"><h2>Templates</h2>' +
      (DB.templates.length ? '<div class="table-scroll"><table><thead><tr><th>Name</th><th>Channel</th><th>Preview</th><th></th></tr></thead><tbody>' +
        DB.templates.map(function (t) {
          return "<tr><td><strong>" + esc(t.name) + "</strong></td><td>" + (t.channel === "email" ? "✉️ Email" : "💬 Text") + "</td>" +
            '<td class="tiny">' + esc(((t.subject ? t.subject + " — " : "") + t.body).slice(0, 90)) + "…</td>" +
            '<td class="row"><button class="btn small" data-tedit="' + escAttr(t.id) + '">✏️</button><button class="btn small danger" data-tdel="' + escAttr(t.id) + '">🗑</button></td></tr>';
        }).join("") + "</tbody></table></div>" : '<p class="muted">No templates yet.</p>') +
      "</div>";

    app.innerHTML = html;

    document.getElementById("mk-channel").addEventListener("change", function (e) { mkView.channel = e.target.value; mkView.templateId = ""; vMarketing(); });
    document.getElementById("mk-template").addEventListener("change", function (e) { mkView.templateId = e.target.value; vMarketing(); });
    document.getElementById("mk-aud").addEventListener("change", function (e) { mkView.audience = e.target.value; mkView.done = {}; vMarketing(); });
    document.getElementById("mk-new").addEventListener("click", function () { templateForm(null); });
    var editBtn = document.getElementById("mk-edit");
    if (editBtn) editBtn.addEventListener("click", function () { templateForm(getTemplate(mkView.templateId)); });

    var sendBtn = document.getElementById("mk-send");
    if (sendBtn) sendBtn.addEventListener("click", function () {
      var tpl2 = getTemplate(mkView.templateId);
      if (!tpl2) return;
      if (!confirm("Send " + recipients.length + " personalized emails from your connected Gmail account?")) return;
      sendBtn.disabled = true; sendBtn.textContent = "Sending…";
      var messages = recipients.map(function (a) {
        return { to: a.email, subject: renderMerge(tpl2.subject, a), body: renderMerge(tpl2.body, a) };
      });
      fetch(CFG.api, { method: "POST", body: JSON.stringify({ type: "email", key: CFG.teamKey, campaign: tpl2.name, messages: messages }) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res || !res.ok) throw new Error((res && res.error) || "send failed");
          recipients.forEach(function (a) { logTouch(a.id, "email", "campaign: " + tpl2.name); });
          toast("Sent " + res.sent + " emails ✅" + (res.skipped ? " (" + res.skipped + " skipped)" : "") + (res.quotaLeft != null ? " · " + res.quotaLeft + " left in today's Gmail quota" : ""));
          vMarketing();
        })
        .catch(function (err) { toast("Email send failed: " + err.message, true); vMarketing(); });
    });

    app.querySelectorAll("[data-open1]").forEach(function (el) {
      el.addEventListener("click", function () {
        var id = el.getAttribute("data-open1");
        var tpl2 = getTemplate(mkView.templateId);
        logTouch(id, mkView.channel === "email" ? "email" : "text", "campaign: " + (tpl2 ? tpl2.name : ""));
        mkView.done[id] = true;
        setTimeout(vMarketing, 300);
      });
    });
    app.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = getAgent(btn.getAttribute("data-copy"));
        var tpl2 = getTemplate(mkView.templateId);
        if (!a || !tpl2) return;
        var text = (tpl2.subject ? renderMerge(tpl2.subject, a) + "\n\n" : "") + renderMerge(tpl2.body, a);
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
          .then(function () { toast("Copied message for " + agentName(a)); })
          .catch(function () { prompt("Copy the message:", text); });
      });
    });
    app.querySelectorAll("[data-done]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-done");
        if (mkView.done[id]) delete mkView.done[id];
        else {
          mkView.done[id] = true;
          var tpl2 = getTemplate(mkView.templateId);
          logTouch(id, mkView.channel === "email" ? "email" : "text", "campaign: " + (tpl2 ? tpl2.name : ""));
        }
        vMarketing();
      });
    });
    app.querySelectorAll("[data-tedit]").forEach(function (btn) {
      btn.addEventListener("click", function () { templateForm(getTemplate(btn.getAttribute("data-tedit"))); });
    });
    app.querySelectorAll("[data-tdel]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var t = getTemplate(btn.getAttribute("data-tdel"));
        if (t && confirm("Delete template “" + t.name + "”?")) { removeRecord("templates", t.id); vMarketing(); }
      });
    });
  }

  function templateForm(t) {
    var isNew = !t;
    t = t || { id: uid(), name: "", channel: mkView.channel, subject: "", body: "" };
    openModal(
      "<h2>" + (isNew ? "New template" : "Edit template") + "</h2>" +
      '<p class="tiny">Merge fields: <code class="mf">{{first}}</code> <code class="mf">{{last}}</code> <code class="mf">{{brokerage}}</code> <code class="mf">{{rep}}</code></p>' +
      '<div class="fgrid">' +
        '<label class="f">Name<input id="tp-name" value="' + escAttr(t.name) + '" placeholder="e.g. Spring storm season check-in"></label>' +
        '<label class="f">Channel<select id="tp-channel"><option value="email"' + (t.channel === "email" ? " selected" : "") + '>✉️ Email</option><option value="sms"' + (t.channel === "sms" ? " selected" : "") + ">💬 Text</option></select></label>" +
      "</div>" +
      '<label class="f">Subject <span class="tiny">(email only)</span><input id="tp-subject" value="' + escAttr(t.subject) + '"></label>' +
      '<label class="f">Message<textarea id="tp-body" style="min-height:140px">' + esc(t.body) + "</textarea></label>" +
      '<div class="row spread"><button class="btn" id="tp-cancel">Cancel</button><button class="btn primary" id="tp-save">Save template</button></div>'
    );
    document.getElementById("tp-cancel").onclick = closeModal;
    document.getElementById("tp-save").onclick = function () {
      t.name = document.getElementById("tp-name").value.trim() || "Untitled";
      t.channel = document.getElementById("tp-channel").value;
      t.subject = document.getElementById("tp-subject").value;
      t.body = document.getElementById("tp-body").value;
      upsertTemplate(t);
      mkView.channel = t.channel;
      mkView.templateId = t.id;
      closeModal();
      vMarketing();
    };
  }

  /* ---------------- settings ---------------- */

  function vSettings() {
    var html =
      '<div class="card"><h2>👤 You</h2><div class="fgrid">' +
        '<label class="f">Your name <span class="tiny">(signs touches & merge fields)</span><input id="s-rep" value="' + escAttr(CFG.rep) + '" placeholder="e.g. Dom"></label>' +
        '<label class="f">“Cold” after this many days<input id="s-cold" type="number" min="5" value="' + escAttr(CFG.coldDays) + '"></label>' +
      '</div><button class="btn primary" id="s-save">Save</button></div>' +

      '<div class="card"><h2>☁️ Team backend (shared data + email sending)</h2>' +
      '<p class="muted">Connect the whole BD team to one Google Sheet you own: everyone sees the same agents, referrals and touches, and email blasts send from your Gmail. Setup takes ~5 minutes — see <a class="backlink" href="../CRM-SETUP.md" target="_blank">CRM-SETUP.md</a>.</p>' +
      '<div class="fgrid">' +
        '<label class="f">Apps Script web app URL<input id="s-api" value="' + escAttr(CFG.api) + '" placeholder="https://script.google.com/macros/s/…/exec"></label>' +
        '<label class="f">Team key<input id="s-key" value="' + escAttr(CFG.teamKey) + '" placeholder="the CRM_KEY you set in Code.gs"></label>' +
      "</div>" +
      '<div class="row">' +
        '<label class="row tiny" style="gap:.3rem"><input type="checkbox" id="s-auto"' + (CFG.autoSync ? " checked" : "") + "> Auto-sync after changes</label>" +
        '<button class="btn" id="s-test">Test connection</button>' +
        '<button class="btn" id="s-sync">Sync now</button>' +
      "</div><p class=\"tiny\" id=\"s-test-out\"></p></div>" +

      '<div class="card"><h2>📦 Data</h2><div class="row">' +
        '<button class="btn" id="s-exp-agents">⬇︎ Agents CSV</button>' +
        '<button class="btn" id="s-exp-jobs">⬇︎ Referrals CSV</button>' +
        '<button class="btn" id="s-exp-json">⬇︎ Full backup (JSON)</button>' +
        '<button class="btn" id="s-imp-json">⬆︎ Restore backup</button>' +
        '<button class="btn" id="s-imp-csv">⬆︎ Import agents CSV</button>' +
      "</div>" +
      '<p class="tiny">Agents CSV import expects headers: <code class="mf">first,last,email,phone,brokerage,tier,tags,notes</code> (tags separated by ;)</p>' +
      '<input type="file" id="s-file" accept=".json,.csv" style="display:none">' +
      "</div>" +

      '<div class="card"><h2>⚠️ Danger zone</h2><div class="row">' +
        '<button class="btn danger" id="s-wipe">Erase all local CRM data</button>' +
      "</div><p class=\"tiny\">Erasing local data does not touch the team backend — a sync will pull the team copy back down.</p></div>";

    app.innerHTML = html;

    document.getElementById("s-save").onclick = function () {
      CFG.rep = document.getElementById("s-rep").value.trim();
      CFG.coldDays = Math.max(5, parseInt(document.getElementById("s-cold").value, 10) || 30);
      saveBackendFields();
      persistCfg(); refreshSyncUi();
      toast("Settings saved");
    };
    function saveBackendFields() {
      CFG.api = document.getElementById("s-api").value.trim();
      CFG.teamKey = document.getElementById("s-key").value.trim();
      CFG.autoSync = document.getElementById("s-auto").checked;
    }
    document.getElementById("s-test").onclick = function () {
      saveBackendFields(); persistCfg(); refreshSyncUi();
      var out = document.getElementById("s-test-out");
      if (!CFG.api) { out.textContent = "Enter the web app URL first."; return; }
      out.textContent = "Testing…";
      fetch(CFG.api + (CFG.api.indexOf("?") === -1 ? "?" : "&") + "ping=1")
        .then(function (r) { return r.json(); })
        .then(function (res) { out.textContent = res && res.crm ? "✅ Connected — backend v" + res.version + " is live." : "⚠️ Reached a server, but it doesn't look like the CRM backend (check you deployed crm/Code.gs)."; })
        .catch(function (e) { out.textContent = "❌ Could not reach the backend: " + e.message; });
    };
    document.getElementById("s-sync").onclick = function () { saveBackendFields(); persistCfg(); refreshSyncUi(); syncNow(false); };

    document.getElementById("s-exp-agents").onclick = function () {
      var rows = [["first", "last", "email", "phone", "brokerage", "tier", "tags", "territory", "birthday", "notes", "referrals", "jobs_won", "revenue", "profit", "days_since_last_activity"]];
      activeAgents().forEach(function (a) {
        var s = agentStats(a);
        rows.push([a.first, a.last, a.email, a.phone, a.brokerage, a.tier, (a.tags || []).join(";"), a.territory || "", a.birthday || "", a.notes || "", s.jobs, s.won, s.revenue, s.profit, s.daysWorked === null ? "" : s.daysWorked]);
      });
      downloadFile("agents.csv", toCsv(rows), "text/csv");
    };
    document.getElementById("s-exp-jobs").onclick = function () {
      var rows = [["agent", "client", "address", "type", "status", "referred", "closed", "revenue", "cost", "profit", "notes"]];
      DB.jobs.forEach(function (j) {
        var a = getAgent(j.agentId);
        rows.push([a ? agentName(a) : "", j.client, j.address, j.type, j.status, j.referred, j.closed, j.revenue, j.cost, (Number(j.revenue) || 0) - (Number(j.cost) || 0), j.notes || ""]);
      });
      downloadFile("referrals.csv", toCsv(rows), "text/csv");
    };
    document.getElementById("s-exp-json").onclick = function () {
      downloadFile("crm-backup-" + todayIso() + ".json", JSON.stringify(DB, null, 2), "application/json");
    };

    var fileEl = document.getElementById("s-file"), fileMode = "";
    document.getElementById("s-imp-json").onclick = function () { fileMode = "json"; fileEl.accept = ".json"; fileEl.click(); };
    document.getElementById("s-imp-csv").onclick = function () { fileMode = "csv"; fileEl.accept = ".csv"; fileEl.click(); };
    fileEl.addEventListener("change", function () {
      var f = fileEl.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          if (fileMode === "json") {
            var data = JSON.parse(reader.result);
            if (!data || !Array.isArray(data.agents)) throw new Error("not a CRM backup file");
            applyMerge(data);
            markDirty();
            toast("Backup merged in — " + DB.agents.length + " agents on file.");
          } else {
            var rows = parseCsv(String(reader.result));
            if (!rows.length) throw new Error("empty file");
            var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
            function col(r, name) { var i = head.indexOf(name); return i === -1 ? "" : (r[i] || "").trim(); }
            var added = 0;
            for (var i = 1; i < rows.length; i++) {
              var r = rows[i];
              var first = col(r, "first"), last = col(r, "last");
              if (!first && !last) continue;
              var exists = DB.agents.some(function (a) {
                return !a.archived && (a.first || "").toLowerCase() === first.toLowerCase() && (a.last || "").toLowerCase() === last.toLowerCase();
              });
              if (exists) continue;
              DB.agents.push({
                id: uid(), first: first, last: last, email: col(r, "email"), phone: col(r, "phone"),
                brokerage: col(r, "brokerage"), tier: TIERS.indexOf(col(r, "tier").toUpperCase()) !== -1 ? col(r, "tier").toUpperCase() : "B",
                tags: col(r, "tags").split(";").map(function (t) { return t.trim(); }).filter(Boolean),
                notes: col(r, "notes"), added: todayIso(), updated: nowIso()
              });
              added++;
            }
            persist(); markDirty();
            toast("Imported " + added + " new agents.");
          }
          render();
        } catch (err) { toast("Import failed: " + err.message, true); }
        fileEl.value = "";
      };
      reader.readAsText(f);
    });

    document.getElementById("s-wipe").onclick = function () {
      if (!confirm("Erase ALL local CRM data on this device?")) return;
      if (!confirm("Last chance — this clears agents, referrals, touches and templates from this browser.")) return;
      DB = blankDb();
      persist();
      toast("Local data erased.");
      render();
    };
  }

  /* ---------------- boot ---------------- */

  refreshSyncUi();
  render();
  if (CFG.api && CFG.teamKey && CFG.autoSync) syncNow(true);
})();
