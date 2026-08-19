# T^Rock CRM — setup guide

The CRM lives at **`/crm/`** on the site (e.g. `https://<your-pages-url>/crm/`).
It's local-first: everything you enter saves instantly to the device you're on,
works offline, and costs nothing to host. Two optional layers sit on top:
JSON backups and shared cloud sync.

## What it does

The pipeline **is** the company process. Every job moves through:

**New Lead → Inspection → Proposal → Insurance → Approved → In Production →
Job Complete → Paid & Closed** (or **Lost**).

Moving a job into a stage automatically drops that stage's playbook onto its
checklist — the same procedure every time:

| Stage | Playbook |
| --- | --- |
| New Lead | Call back · schedule the inspection on the work calendar |
| Inspection | Full roof + attic/interior inspection · photos into CompanyCam · write & send the inspection summary |
| Proposal | Order the Roofr report · write the scope (summary + detailed + Roofr paste block) · price at 2.0× markup / $500 minimum · build the client deck (deductible offset analysis) · send & follow up |
| Insurance | Confirm claim + claim # · meet the adjuster · review RCV/ACV/deductible · submit supplements |
| Approved | Sign the contract · collect deductible/first payment · order materials · assign crew & schedule |
| In Production | Job-start walkthrough · daily CompanyCam photos · daily field summary · final walkthrough & punch list |
| Job Complete | Build the CompanyCam photo report · send the final invoice · send the final email (photos + invoice + Google review ask) |
| Paid & Closed | Confirm paid in full · register the warranty · ask for referrals |

Each job also carries:

- **Insurance card** — carrier, claim #, adjuster, RCV, deductible, and *ACV
  not in scope*, with the **deductible offset** computed live (how much of the
  deductible the out-of-scope ACV covers, in $ and %, and the customer's true
  out-of-pocket).
- **Money card** — cost, estimate, contract price, with the **2.0× markup /
  $500 minimum sale-price check** flagged right on the card, plus a payment
  log and running balance.
- **Links** — one-tap buttons for the job's Roofr proposal, CompanyCam
  project, Dropbox folder, and Google Maps.
- **Checklist, notes, and a full activity history** per job.

Plus: a **Dashboard** (pipeline value, outstanding balances, overdue tasks,
jobs going quiet), a drag-and-drop **Pipeline board**, a global **Tasks** view
(overdue / today / upcoming), **Contacts** (adjusters, suppliers, subs), and
**Crews** with live job assignments.

## Backups (do this)

Settings → **Export backup (.json)** downloads the whole book. Import restores
it anywhere. Export whenever you've put in real work.

## Cloud sync (optional, free — one shared book for the whole company)

Without sync, each device keeps its own book. To share one book:

1. Go to [script.google.com](https://script.google.com) → **New project**.
2. Delete the starter code, paste in [`crm/Code.gs`](crm/Code.gs).
3. Change `SECRET = "CHANGE-ME"` to a long private passphrase.
4. **Deploy → New deployment → Web app** — *Execute as: Me*,
   *Who has access: Anyone*. Authorize it, copy the `/exec` URL.
5. In the CRM on each device: **Settings → Cloud sync** → paste the URL and
   the passphrase → **Save** → **Push to cloud now** (first device) or
   **Pull from cloud** (every other device).

After that, changes auto-push a few seconds after you make them. On a device
that's been away, hit **Pull from cloud** before working — last push wins, so
don't edit the same job from two devices at the same moment.

The data lives in a single `trock-crm-data.json` file in the script owner's
Google Drive. The secret never leaves your devices except to your own script.

## Settings that drive behavior

- **Sales markup / minimum sale** — powers the price check on every Money card
  (defaults: 2.0× and $500).
- **Google review link** — keep it handy for closeout emails.
- **Work calendar email** — defaults to the scheduling calendar.
