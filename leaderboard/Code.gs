/**
 * Roofing Course backend — Google Apps Script Web App (v2).
 *
 * Lives inside a Google Sheet (Extensions → Apps Script). Handles:
 *   1. Score rows for the public leaderboard ("Scores" sheet)
 *   2. Per-player progress backups keyed by recovery code ("Progress" sheet)
 *
 * Upgrading from v1: paste this over the old code, Save, then
 * Deploy → Manage deployments → ✏️ edit → Version: "New version" → Deploy.
 * The /exec URL stays the same. See LEADERBOARD-SETUP.md.
 */

var SHEET_NAME = "Scores";
var PROGRESS_SHEET = "Progress";
var EVENTS_SHEET = "Events";
var MAX_PROGRESS_BYTES = 200000;
var MAX_EVENT_ROWS_RETURNED = 3000;

/* IMPORTANT (owner): set your own secret before deploying v3.
   This key protects the Admin HQ dashboard — anyone who knows it can
   read all trainee data. Pick something long and random, keep it out
   of texts/emails, and change it here any time to revoke access. */
var ADMIN_KEY = "CHANGE-ME-TO-YOUR-OWN-SECRET";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    var d = JSON.parse(e.postData.contents);
    if (d && d.type === "progress") return saveProgress_(d);
    if (d && d.type === "event") return saveEvent_(d);
    var sh = getSheet_();
    sh.appendRow([
      new Date(),
      String(d.playerId || "").slice(0, 64),
      String(d.first || "").slice(0, 40),
      String(d.last || "").slice(0, 40),
      String(d.kind || "").slice(0, 16),
      String(d.chapter || "").slice(0, 32),
      Math.max(0, Math.min(100, Number(d.score) || 0)),
      Number(d.correct) || 0,
      Number(d.total) || 0
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.ping) return json_({ ok: true, progress: true, version: 3 });
  if (p.admin) return adminData_(String(p.key || ""));
  if (p.code) return loadProgress_(String(p.code));

  var sh = getSheet_();
  var values = sh.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    rows.push({
      when: values[i][0],
      playerId: values[i][1],
      first: values[i][2],
      last: values[i][3],
      kind: values[i][4],
      chapter: values[i][5],
      score: Number(values[i][6]),
      correct: Number(values[i][7]),
      total: Number(values[i][8])
    });
  }
  return ContentService.createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveProgress_(d) {
  var code = cleanCode_(d.code);
  if (!code) return json_({ ok: false, error: "missing code" });
  var data = String(d.data || "");
  if (!data || data.length > MAX_PROGRESS_BYTES) return json_({ ok: false, error: "bad data size" });
  try { JSON.parse(data); } catch (err) { return json_({ ok: false, error: "data not JSON" }); }

  var sh = getProgressSheet_();
  var values = sh.getDataRange().getValues();
  var row = -1;
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === code) { row = i + 1; break; }
  }
  var payload = [code, String(d.name || "").slice(0, 80), new Date(), data];
  if (row === -1) sh.appendRow(payload);
  else sh.getRange(row, 1, 1, 4).setValues([payload]);
  return json_({ ok: true });
}

function loadProgress_(rawCode) {
  var code = cleanCode_(rawCode);
  if (!code) return json_({ ok: false, error: "missing code" });
  var sh = getProgressSheet_();
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === code) {
      return json_({ ok: true, name: values[i][1], when: values[i][2], data: values[i][3] });
    }
  }
  return json_({ ok: false, error: "not found" });
}

function saveEvent_(d) {
  var sh = getEventsSheet_();
  sh.appendRow([
    new Date(),
    String(d.playerId || "").slice(0, 64),
    String(d.name || "").slice(0, 80),
    String(d.ev || "").slice(0, 32),
    String(d.detail || "").slice(0, 120)
  ]);
  return json_({ ok: true });
}

/* Admin HQ endpoint: requires the ADMIN_KEY. Returns every player's
   latest progress backup, all score rows, and recent activity events. */
function adminData_(key) {
  if (!ADMIN_KEY || ADMIN_KEY.indexOf("CHANGE-ME") === 0 || key !== ADMIN_KEY) {
    return json_({ ok: false, error: "bad key" });
  }
  var out = { ok: true, players: [], scores: [], events: [] };

  var ps = getProgressSheet_().getDataRange().getValues();
  for (var i = 1; i < ps.length; i++) {
    out.players.push({ code: ps[i][0], name: ps[i][1], updated: ps[i][2], data: ps[i][3] });
  }
  var ss = getSheet_().getDataRange().getValues();
  for (var j = 1; j < ss.length; j++) {
    out.scores.push({
      when: ss[j][0], playerId: ss[j][1], first: ss[j][2], last: ss[j][3],
      kind: ss[j][4], chapter: ss[j][5], score: Number(ss[j][6]),
      correct: Number(ss[j][7]), total: Number(ss[j][8])
    });
  }
  var es = getEventsSheet_().getDataRange().getValues();
  var start = Math.max(1, es.length - MAX_EVENT_ROWS_RETURNED);
  for (var k = start; k < es.length; k++) {
    out.events.push({ when: es[k][0], playerId: es[k][1], name: es[k][2], ev: es[k][3], detail: es[k][4] });
  }
  return json_(out);
}

function getEventsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(EVENTS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(EVENTS_SHEET);
    sh.appendRow(["When", "Player ID", "Name", "Event", "Detail"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function cleanCode_(c) {
  return String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["When", "Player ID", "First", "Last", "Test", "Chapter", "Score %", "Correct", "Total"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function getProgressSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(PROGRESS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(PROGRESS_SHEET);
    sh.appendRow(["Code", "Name", "Updated", "Data"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
