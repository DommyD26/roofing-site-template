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
var MAX_PROGRESS_BYTES = 200000;

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    var d = JSON.parse(e.postData.contents);
    if (d && d.type === "progress") return saveProgress_(d);
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
  if (p.ping) return json_({ ok: true, progress: true, version: 2 });
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
