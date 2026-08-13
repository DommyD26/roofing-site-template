/**
 * Roofing Course Leaderboard backend — Google Apps Script Web App.
 *
 * Lives inside a Google Sheet (Extensions → Apps Script). The course site
 * POSTs one row per graded test and GETs all rows to build the leaderboard.
 * See LEADERBOARD-SETUP.md in the repo root for the 3-minute setup.
 */

var SHEET_NAME = "Scores";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    var d = JSON.parse(e.postData.contents);
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
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  var sh = getSheet_();
  var values = sh.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < values.length; i++) { // skip header
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
