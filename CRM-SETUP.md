# Agent CRM — Setup Guide

The CRM lives at **`/crm/`** on your deployed site (e.g.
`https://<your-username>.github.io/<repo>/crm/`). It works immediately with
no setup at all — data saves in the browser on each device. Connecting the
optional Google backend (~5 minutes) is what turns it into a **team** CRM:

| Without backend | With backend |
| --- | --- |
| Each device keeps its own data | Whole BD team shares one live book of business |
| Email blasts open one draft at a time | One click sends every personalized email through your Gmail |
| Data lives only in the browser | Everything mirrored into a Google Sheet you own (browse, chart, back up) |

Texting works the same either way: carriers don't allow true bulk SMS from a
web page, so text blasts open your phone's messaging app pre-filled, one tap
per agent, with a checklist to track who you've sent.

## 1. Create the Google Sheet + Apps Script

1. Go to [sheets.new](https://sheets.new) and name the sheet something like
   **"BD Agent CRM"**. This one spreadsheet will hold the team's data, the
   readable Agents/Referrals mirrors, and the email send log.
2. In the sheet: **Extensions → Apps Script**.
3. Delete the placeholder code and paste in the full contents of
   [`crm/Code.gs`](crm/Code.gs).
4. Near the top, change this line to your own long random secret:

   ```js
   var CRM_KEY = "CHANGE-ME-TO-YOUR-OWN-SECRET";
   ```

   This is the **team key** — anyone who has it can read/write the CRM and
   send email from your Gmail, so treat it like a password. Share it only
   with your BD team. Change it here any time to revoke access.
5. Click **Save** (💾).

## 2. Deploy it as a web app

1. **Deploy → New deployment**.
2. Gear icon → **Web app**.
3. Description: anything. **Execute as: Me. Who has access: Anyone.**
   ("Anyone" is safe — every request still requires your team key.)
4. Click **Deploy**, authorize with your Google account
   (Advanced → "Go to … (unsafe)" is normal for your own script — the
   email permission is what lets the CRM send campaigns from your Gmail).
5. Copy the **Web app URL** (ends in `/exec`).

## 3. Connect the CRM

1. Open the CRM → **Settings** tab.
2. Paste the web app URL into **Apps Script web app URL**.
3. Enter your **team key** (the `CRM_KEY` you set).
4. Click **Test connection** — you should see "✅ Connected".
5. Click **Sync now**. Done — the header shows "team sync on".

Repeat step 3 on each teammate's device (same URL + key). Everyone now
works from the same shared data; the CRM merges changes automatically
(newest edit wins per record) and auto-syncs a couple of seconds after
every change.

## 4. Daily use, in short

- **Agents** — your book of real-estate agents: tier (A/B/C), brokerage,
  tags, notes. Sorted tables show referrals, revenue, profit, and a
  hot/warm/cold chip based on days since you last worked with them.
- **Referrals** — every job an agent sends you, through the pipeline
  Lead → Contacted → Inspected → Quoted → Sold → In Progress →
  Completed (or Lost), with revenue, cost, and auto-calculated profit.
- **Touches** — log calls, texts, pop-bys, lunches, gifts. The dashboard's
  follow-up queue surfaces whoever's gone cold (threshold configurable in
  Settings).
- **Marketing** — templates with `{{first}}` `{{last}}` `{{brokerage}}`
  `{{rep}}` merge fields; pick an audience (all, tier, tag, cold agents,
  never-referred) and blast email (auto via backend) or texts (tap-through).
  Every send is logged as a touch on the agent.
- **Settings → Data** — CSV export of agents/referrals, full JSON backup,
  and CSV import to bring in an existing agent list.

## Email quota

Apps Script sends through Gmail with a daily cap (typically ~100 recipients
per day on a free Gmail account; ~1,500 on Google Workspace). The CRM checks
your remaining quota before sending and refuses rather than half-sending a
campaign; the toast after each blast shows how much quota is left. For
audiences bigger than your quota, split the blast by tier or tag across days.

## Updating the backend later

Paste new `Code.gs` contents over the old, **Save**, then
**Deploy → Manage deployments → ✏️ → Version: "New version" → Deploy**.
The `/exec` URL stays the same, so nobody has to reconnect.

## Troubleshooting

- **"bad team key"** — the key in Settings doesn't match `CRM_KEY`, or you
  left the `CHANGE-ME` placeholder (it's rejected on purpose).
- **Test says it doesn't look like the CRM backend** — you pasted the
  course leaderboard script instead of `crm/Code.gs`, or forgot to deploy a
  new version after editing.
- **Emails not arriving** — check the **EmailLog** sheet in your
  spreadsheet: each attempted send is logged with the result.
- **Someone erased data locally** — nothing is lost: local erase never
  touches the backend; press **Sync now** and the team copy comes back.
