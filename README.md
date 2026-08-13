# Roofing Construction & Estimating — The Certification E-Course

A self-paced certification course companion to *Roofing Construction & Estimating, Revised*
by Daniel Atcheson (Craftsman Book Company). Installable as an app, works offline,
and tracks every test you've ever taken.

## Features

- **12 chapters, 36 detailed lessons**, each lesson with its own time estimate (~6.6 hours total).
- **Chapter tests (~10 Q), a 20-question practice test, and a 36-question certification exam**
  (70% passes chapters, 80% passes the exam).
- **Fresh numbers every attempt** — math/takeoff problems are generated with new values
  each time, so retakes test skill, not memory.
- **Complete grading history** — every attempt is saved; each chapter shows a *chapter score*
  that's the average of every test you've ever taken for it, plus best/last scores.
- **Skill rankings** — each chapter's categories ranked strongest-first
  (Nailed it → Solid → Getting there → On the punch list).
- **10 badges** (First Nail, Hot Streak, Perfect Square, Chapter Boss, Certified Roofer, …)
  awarded automatically with toast notifications.
- **Printable certificate** with the student's name after passing the exam.
- **PWA**: installable on phone/desktop from the browser ("Add to Home Screen" /
  "Install app"), offline-capable via a service worker.
- All progress lives in the browser's localStorage — no server, no accounts, free to host.

## Running / deploying

No build step. Options:

- **GitHub Pages** (recommended): repo Settings → Pages → deploy from branch.
  HTTPS from Pages is what makes install-as-app and offline mode work.
- Locally: `python3 -m http.server` → `http://localhost:8000`
  (service worker also works on localhost).

To train a team: send them the Pages URL; each person's device keeps its own
scores and badges. For shared/central tracking across many students, the next
step would be adding a small backend or LMS integration.

## Editing course content

Everything lives in [`assets/course-data.js`](assets/course-data.js):

- `lessons`: title, `min` (time estimate), and HTML body per lesson.
- `bank`: static questions — `cat` must match one of the chapter's `cats`;
  `correct` is the zero-based index of the right answer (the engine shuffles
  answer order at test time).
- `gens`: generated questions — a function receiving `{int, pick}` random
  helpers that returns `{q, a, correct}` with the right answer first.
- `badges` and `masteryLevels` are also data-driven.

After changing files, bump `VERSION` in `sw.js` so installed apps pick up the update.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | App shell |
| `assets/course-data.js` | All lessons, question banks, badges (content lives here) |
| `assets/course.js` | Router, test engine, scoring/history, badges, certificate |
| `assets/styles.css` | Styling incl. print styles for the certificate |
| `manifest.webmanifest`, `sw.js`, `assets/icons/` | PWA install + offline |
