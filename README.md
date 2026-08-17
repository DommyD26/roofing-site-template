# Roofing Construction & Estimating — The Certification E-Course

A self-paced certification course companion to *Roofing Construction & Estimating, Revised*
by Daniel Atcheson (Craftsman Book Company). Installable as an app, works offline,
and tracks every test you've ever taken.

## Features

- **15 chapters matching the book chapter-for-chapter**, with **46 detailed lessons**,
  each with its own time estimate (~8.4 hours total). Every lesson opens with a book
  reading assignment (chapter + page range) and closes with a Summary / Key Points /
  Things to Remember / Tips & Tricks recap.
- **Chapter tests (~10 Q), a 20-question practice test, and a 45-question certification exam**
  (70% passes chapters, 80% passes the exam) drawn from a 175-question bank.
- **Fresh numbers every attempt** — math/takeoff problems are generated with new values
  each time, so retakes test skill, not memory.
- **Complete grading history** — every attempt is saved; each chapter shows a *chapter score*
  that's the average of every test you've ever taken for it, plus best/last scores.
- **Skill rankings** — each chapter's categories ranked strongest-first
  (Nailed it → Solid → Getting there → On the punch list).
- **10 badges** (First Nail, Hot Streak, Perfect Square, Chapter Boss, Certified Roofer, …)
  awarded automatically with toast notifications.
- **Printable certificate** with the student's name after passing the exam.
- **Live team leaderboard** — every graded test submits name + score to a Google Sheet
  the owner controls (Apps Script web app); the Leaderboard page ranks everyone.
- **Cloud progress backup** — each player's full record auto-backs up after every action,
  keyed by a personal backup code shown in My Stats; entering the code on any device
  restores everything. Local-first, so the course still works fully offline.
- **Feedback button** — opens a pre-addressed email to the course owner with page and
  device context filled in.
- **PWA**: installable on phone/desktop from the browser ("Add to Home Screen" /
  "Install app"), offline-capable via a service worker.
- No accounts and no hosting costs: static site + the owner's own Google Sheet.

## Running / deploying

No build step. Options:

- **GitHub Pages** (recommended): repo Settings → Pages → deploy from branch.
  HTTPS from Pages is what makes install-as-app and offline mode work.
- Locally: `python3 -m http.server` → `http://localhost:8000`
  (service worker also works on localhost).

To train a team: send them the Pages URL. Once they enter their name, every
test they take lands on the shared leaderboard and in the owner's Google Sheet,
and their progress backs up automatically (restorable anywhere with their
backup code). Backend setup lives in [`LEADERBOARD-SETUP.md`](LEADERBOARD-SETUP.md).

## Editing course content

Chapter/lesson/quiz content lives in [`assets/course-data.js`](assets/course-data.js):

- `lessons`: title, `min` (time estimate), and HTML body per lesson.
- `bank`: static questions — `cat` must match one of the chapter's `cats`;
  `correct` is the zero-based index of the right answer (the engine shuffles
  answer order at test time).
- `gens`: generated questions — a function receiving `{int, pick}` random
  helpers that returns `{q, a, correct}` with the right answer first.
- `badges` and `masteryLevels` are also data-driven.

Reading assignments and the end-of-lesson recaps live in
[`assets/course-extras.js`](assets/course-extras.js), keyed `"chapterId|lessonIndex"` —
if you add or reorder lessons, update the matching recap keys.

After changing files, bump `VERSION` in `sw.js` so installed apps pick up the update.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | App shell |
| `assets/course-data.js` | Chapters, lessons, question banks, badges (content lives here) |
| `assets/course-extras.js` | Book reading assignments + lesson recaps |
| `assets/course.js` | Router, test engine, scoring/history, badges, leaderboard, cloud backup, certificate |
| `assets/styles.css` | Styling incl. print styles for the certificate |
| `leaderboard/Code.gs`, `LEADERBOARD-SETUP.md` | Google Apps Script backend (scores + progress backups) and its setup guide |
| `manifest.webmanifest`, `sw.js`, `assets/icons/` | PWA install + offline |
