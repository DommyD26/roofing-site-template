/**
 * Agent CRM backend — Google Apps Script Web App.
 *
 * Lives inside a Google Sheet the owner controls (Extensions → Apps Script).
 * Handles, for the whole BD team:
 *   1. Shared CRM data (agents, referral jobs, touches, templates) with
 *      merge-sync so several reps can work at once ("CrmData" sheet).
 *   2. Readable mirrors of the book of business ("Agents" and "Referrals"
 *      sheets — auto-rewritten on every sync so the owner can browse/chart
 *      the data right in Google Sheets).
 *   3. Sending personalized marketing emails through the owner's Gmail
 *      ("EmailLog" sheet records every send).
 *
 * Deploy: Deploy → New deployment → Web app → Execute as "Me",
 * access "Anyone". Full walkthrough in CRM-SETUP.md.
 */

var DATA_SHEET = "CrmData";
var AGENTS_SHEET = "Agents";
var JOBS_SHEET = "Referrals";
var EMAIL_LOG_SHEET = "EmailLog";
var MAX_DATA_BYTES = 900000;   // total JSON blob cap (~hundreds of agents + years of touches)
var CHUNK = 45000;             // stay under the 50k-chars-per-cell Sheets limit
var MAX_EMAILS_PER_CALL = 90;

/* IMPORTANT (owner): set your own secret before deploying.
   This key is the team password — anyone who has it can read and write
   the whole CRM and send email from your Gmail. Pick something long and
   random, share it only with your BD team, and change it here any time
   to revoke access. */
var CRM_KEY = "CHANGE-ME-TO-YOUR-OWN-SECRET";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    if (!keyOk_(d.key)) return json_({ ok: false, error: "bad team key" });
    if (d.type === "sync") return sync_(d);
    if (d.type === "email") return sendEmails_(d);
    return json_({ ok: false, error: "unknown request type" });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.ping) return json_({ ok: true, crm: true, version: 1 });
  if (p.pull) {
    if (!keyOk_(p.key)) return json_({ ok: false, error: "bad team key" });
    return json_({ ok: true, data: readBlob_() });
  }
  return json_({ ok: true, crm: true, version: 1, hint: "POST {type:'sync'|'email', key, ...}" });
}

function keyOk_(key) {
  return CRM_KEY && CRM_KEY.indexOf("CHANGE-ME") !== 0 && String(key || "") === CRM_KEY;
}

/* ---------- sync: merge the client's copy with the stored team copy ---------- */

function sync_(d) {
  var incomingRaw = String(d.data || "");
  if (incomingRaw.length > MAX_DATA_BYTES) return json_({ ok: false, error: "data too large" });
  var incoming;
  try { incoming = JSON.parse(incomingRaw); } catch (err) { return json_({ ok: false, error: "data not JSON" }); }

  var stored = {};
  try { stored = JSON.parse(readBlob_() || "{}"); } catch (err) { stored = {}; }

  var merged = mergeDb_(stored, incoming);
  var out = JSON.stringify(merged);
  if (out.length > MAX_DATA_BYTES) return json_({ ok: false, error: "merged data too large" });

  writeBlob_(out);
  mirrorSheets_(merged);
  return json_({ ok: true, data: out });
}

function mergeDb_(a, b) {
  var tombs = {};
  copyKeys_(a.tombstones, tombs);
  copyKeys_(b.tombstones, tombs);
  var out = { agents: [], jobs: [], touches: [], templates: [], tombstones: tombs };
  ["agents", "jobs", "touches", "templates"].forEach(function (k) {
    out[k] = mergeColl_(a[k] || [], b[k] || [], tombs);
  });
  return out;
}

function copyKeys_(src, dst) {
  if (!src || typeof src !== "object") return;
  for (var k in src) if (!dst[k] || String(src[k]) > String(dst[k])) dst[k] = src[k];
}

function mergeColl_(x, y, tombs) {
  var byId = {};
  x.concat(y).forEach(function (r) {
    if (!r || !r.id) return;
    var t = tombs[r.id];
    if (t && (!r.updated || String(t) >= String(r.updated))) return; // deleted
    var cur = byId[r.id];
    if (!cur || String(r.updated || "") > String(cur.updated || "")) byId[r.id] = r;
  });
  return Object.keys(byId).map(function (k) { return byId[k]; });
}

/* Blob storage: one row in CrmData, JSON split across 45k-char cells. */

function readBlob_() {
  var sh = getDataSheet_();
  if (sh.getLastRow() < 2) return "";
  var row = sh.getRange(2, 2, 1, Math.max(1, sh.getLastColumn() - 1)).getValues()[0];
  return row.join("");
}

function writeBlob_(json) {
  var sh = getDataSheet_();
  var cells = [new Date()];
  for (var i = 0; i < json.length; i += CHUNK) cells.push(json.slice(i, i + CHUNK));
  var width = Math.max(sh.getLastColumn(), cells.length);
  if (sh.getLastRow() >= 2) sh.getRange(2, 1, 1, width).clearContent();
  sh.getRange(2, 1, 1, cells.length).setValues([cells]);
}

/* ---------- human-readable mirrors ---------- */

function mirrorSheets_(db) {
  try {
    var agents = db.agents || [], jobs = db.jobs || [], touches = db.touches || [];

    var lastTouch = {}, lastJob = {};
    touches.forEach(function (t) {
      if (t.when && (!lastTouch[t.agentId] || t.when > lastTouch[t.agentId])) lastTouch[t.agentId] = t.when;
    });
    var stats = {};
    jobs.forEach(function (j) {
      var s = stats[j.agentId] || (stats[j.agentId] = { n: 0, won: 0, rev: 0, cost: 0 });
      s.n++;
      if (j.status === "Sold" || j.status === "In Progress" || j.status === "Completed") {
        s.won++; s.rev += Number(j.revenue) || 0; s.cost += Number(j.cost) || 0;
      }
      var when = j.closed || j.referred;
      if (when && (!lastJob[j.agentId] || when > lastJob[j.agentId])) lastJob[j.agentId] = when;
    });

    var aRows = [["First", "Last", "Brokerage", "Tier", "Email", "Phone", "Tags", "Referrals", "Jobs won", "Revenue", "Profit", "Last referral", "Last touch"]];
    agents.forEach(function (a) {
      if (a.archived) return;
      var s = stats[a.id] || { n: 0, won: 0, rev: 0, cost: 0 };
      aRows.push([a.first || "", a.last || "", a.brokerage || "", a.tier || "", a.email || "", a.phone || "",
        (a.tags || []).join(", "), s.n, s.won, s.rev, s.rev - s.cost, lastJob[a.id] || "", lastTouch[a.id] || ""]);
    });
    rewrite_(AGENTS_SHEET, aRows);

    var names = {};
    agents.forEach(function (a) { names[a.id] = ((a.first || "") + " " + (a.last || "")).trim(); });
    var jRows = [["Agent", "Client", "Address", "Type", "Status", "Referred", "Closed", "Revenue", "Cost", "Profit", "Notes"]];
    jobs.forEach(function (j) {
      jRows.push([names[j.agentId] || "", j.client || "", j.address || "", j.type || "", j.status || "",
        j.referred || "", j.closed || "", Number(j.revenue) || 0, Number(j.cost) || 0,
        (Number(j.revenue) || 0) - (Number(j.cost) || 0), j.notes || ""]);
    });
    rewrite_(JOBS_SHEET, jRows);
  } catch (err) {
    // Mirrors are cosmetic — never fail a sync over them.
  }
}

function rewrite_(name, rows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clearContents();
  if (rows.length) {
    var width = rows[0].length;
    sh.getRange(1, 1, rows.length, width).setValues(rows.map(function (r) {
      while (r.length < width) r.push("");
      return r.slice(0, width);
    }));
    sh.setFrozenRows(1);
  }
}

/* ---------- marketing email ---------- */

function sendEmails_(d) {
  var msgs = d.messages;
  if (!msgs || !msgs.length) return json_({ ok: false, error: "no messages" });
  if (msgs.length > MAX_EMAILS_PER_CALL) return json_({ ok: false, error: "too many messages in one call (max " + MAX_EMAILS_PER_CALL + ")" });

  var quota = MailApp.getRemainingDailyQuota();
  if (quota < msgs.length) return json_({ ok: false, error: "Gmail daily quota too low (" + quota + " left, " + msgs.length + " requested) — try again tomorrow or shrink the audience" });

  var log = getLogSheet_();
  var campaign = String(d.campaign || "").slice(0, 80);
  var sent = 0, skipped = 0;
  for (var i = 0; i < msgs.length; i++) {
    var m = msgs[i] || {};
    var to = String(m.to || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) { skipped++; continue; }
    try {
      MailApp.sendEmail({
        to: to,
        subject: String(m.subject || "").slice(0, 250),
        body: String(m.body || "").slice(0, 20000)
      });
      sent++;
      log.appendRow([new Date(), campaign, to, String(m.subject || "").slice(0, 120), "sent"]);
    } catch (err) {
      skipped++;
      log.appendRow([new Date(), campaign, to, String(m.subject || "").slice(0, 120), "error: " + String(err).slice(0, 120)]);
    }
  }
  return json_({ ok: true, sent: sent, skipped: skipped, quotaLeft: MailApp.getRemainingDailyQuota() });
}

/* ---------- sheet helpers ---------- */

function getDataSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(DATA_SHEET);
  if (!sh) {
    sh = ss.insertSheet(DATA_SHEET);
    sh.appendRow(["Updated", "Data (do not edit — managed by the CRM)"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function getLogSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(EMAIL_LOG_SHEET);
  if (!sh) {
    sh = ss.insertSheet(EMAIL_LOG_SHEET);
    sh.appendRow(["When", "Campaign", "To", "Subject", "Result"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
