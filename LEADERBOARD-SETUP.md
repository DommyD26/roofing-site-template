# Backend v3 upgrade: Admin HQ + activity tracking (~2 minutes)

v3 adds the owner-only **Admin HQ** dashboard (`/admin/` on the site) and an
activity log (visits, lessons read, tests started) in a new **Events** tab.

1. Open the **Roofing Course Leaderboard** sheet → **Extensions → Apps Script**
2. Paste the current [`leaderboard/Code.gs`](leaderboard/Code.gs) over the old code
3. **Set your admin key**: near the top, replace
   `var ADMIN_KEY = "CHANGE-ME-TO-YOUR-OWN-SECRET";`
   with your own long random secret (this never goes in the repo — it lives
   only in your deployed script). The dashboard refuses to serve any data
   until the placeholder is replaced.
4. 💾 Save → **Deploy → Manage deployments** → ✏️ pencil → **New version** → Deploy
   (the `/exec` URL stays the same)
5. Open `https://<your-site>/admin/`, enter that same key, and the crew
   dashboard unlocks. The admin page is never linked from the course.

Notes: the client only sends activity events once it detects a v3 backend,
so nothing breaks if you delay this upgrade. To revoke dashboard access,
change `ADMIN_KEY` and redeploy a new version. Good practice: tell your
crew their training activity is tracked — it's normal for workplace
training, and transparency keeps trust.

---

# Backend v2 upgrade: cloud progress backup (~2 minutes)

If your leaderboard is already live on a v1 deployment, upgrade to enable
automatic progress backup + restore-by-code:

1. Open the **Roofing Course Leaderboard** sheet → **Extensions → Apps Script**
2. Select all the old code, paste the current contents of
   [`leaderboard/Code.gs`](leaderboard/Code.gs) over it, hit 💾 save
3. **Deploy → Manage deployments** → click the ✏️ pencil on the active
   deployment → under **Version** choose **New version** → **Deploy**

The `/exec` URL stays exactly the same — nothing else changes. The site
auto-detects the upgrade (it pings the backend before ever sending progress
data), so deploying v2 flips backups on everywhere with no other steps.
Backups appear in a new **Progress** tab in the sheet, one row per person,
keyed by their Unique ID.

---

# Leaderboard setup (one time, ~3 minutes)

The leaderboard stores every test score in a **Google Sheet you own** and the
course site reads it back to show team rankings. No hosting costs, no accounts
for your testers — they just enter their name in the app.

## Steps (do these logged in as the course owner)

1. Go to **sheets.google.com** → create a blank spreadsheet → name it
   **Roofing Course Leaderboard**.
2. In the sheet: **Extensions → Apps Script**.
3. Delete whatever is in the editor and paste the entire contents of
   [`leaderboard/Code.gs`](leaderboard/Code.gs) from this repo. Hit the 💾 save icon.
4. Click **Deploy → New deployment** → gear icon → **Web app**:
   - Description: `leaderboard`
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, approve the permissions prompt (it only touches this
     one spreadsheet), and **copy the Web app URL** (ends in `/exec`).
5. Open `assets/course-data.js` in this repo and paste that URL into:
   ```js
   leaderboardUrl: "PASTE-THE-/exec-URL-HERE",
   ```
   Commit to `main` (or hand the URL to Claude to wire in). The site
   redeploys itself and the leaderboard goes live.

## Copy-paste prompt for a Claude that can drive your Chrome

> Open sheets.google.com and create a blank spreadsheet named "Roofing Course
> Leaderboard". Open Extensions → Apps Script, replace the default code with
> the contents of https://github.com/DommyD26/roofing-site-template/blob/main/leaderboard/Code.gs
> (raw), save, then Deploy → New deployment → Web app, execute as Me, access:
> Anyone, deploy, approve permissions, and give me the Web app URL that ends
> in /exec.

## How it works / good to know

- Each graded test POSTs one row: timestamp, player ID, first/last name,
  test type, chapter, score. The leaderboard page GETs all rows and ranks
  players: **certified first, then chapters passed, then average score**.
- You can watch scores arrive live in the Sheet, filter them, chart them —
  it's your data.
- Scores only submit for people who've entered a name in the app; everything
  still works offline (attempts made offline just aren't submitted later —
  the in-app history remains the personal record).
- This is a friendly-team leaderboard, not a bank: the endpoint is public,
  so a determined prankster could post fake scores. Fine for peer testing;
  if it ever matters, we can add a shared passcode.
- To reset the leaderboard: delete the rows in the Sheet (keep the header).
