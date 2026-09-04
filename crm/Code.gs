/**
 * T^Rock CRM — optional cloud sync backend (Google Apps Script).
 *
 * Stores the whole CRM state as one JSON file in the owner's Google Drive,
 * so every device pointed at this web app shares the same company book.
 * Deploy: Extensions won't work — this is a standalone script. See CRM-SETUP.md.
 *
 * 1) script.google.com → New project → paste this file.
 * 2) Change SECRET below to a long private passphrase.
 * 3) Deploy → New deployment → Web app → Execute as: Me →
 *    Who has access: Anyone. Copy the /exec URL.
 * 4) In the CRM: Settings → Cloud sync → paste the URL and the SECRET.
 */

var SECRET = "CHANGE-ME";
var FILE_NAME = "trock-crm-data.json";

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getFile_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("fileId");
  if (id) {
    try { return DriveApp.getFileById(id); } catch (e) { /* deleted — recreate */ }
  }
  var it = DriveApp.getFilesByName(FILE_NAME);
  var file = it.hasNext() ? it.next() : DriveApp.createFile(FILE_NAME, "", MimeType.PLAIN_TEXT);
  props.setProperty("fileId", file.getId());
  return file;
}

/** Load: GET ?key=SECRET */
function doGet(e) {
  var key = (e && e.parameter && e.parameter.key) || "";
  if (SECRET === "CHANGE-ME" || key !== SECRET) return json_({ ok: false, error: "bad key" });
  var raw = getFile_().getBlob().getDataAsString();
  var state = null;
  if (raw) { try { state = JSON.parse(raw); } catch (err) { state = null; } }
  return json_({ ok: true, state: state });
}

/** Save: POST text/plain body {"op":"save","key":SECRET,"state":{...}} */
function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "bad body" }); }
  if (SECRET === "CHANGE-ME" || body.key !== SECRET) return json_({ ok: false, error: "bad key" });
  if (body.op !== "save" || !body.state || !body.state.jobs) return json_({ ok: false, error: "bad op" });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getFile_().setContent(JSON.stringify(body.state));
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true, savedAt: new Date().toISOString() });
}
