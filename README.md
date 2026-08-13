# Roofing Construction & Estimating — The E-Course

A self-paced online course companion to *Roofing Construction & Estimating, Revised*
by Daniel Atcheson (Craftsman Book Company).

- **12 modules** following the book's flow: measuring roofs → sheathing → underlayment →
  asphalt, wood, tile, slate, metal → low-slope systems → single-ply & coatings →
  flashing/ventilation → estimating & bidding.
- **Quizzes** after every module plus a final exam (70% to pass).
- **Progress tracking** saved in the browser (localStorage) — no server or login needed.
- **"Open the book"** links point to the full PDF for chapter-depth reading. Lesson text
  is an original summary of each topic, not the book's text.

## Running it

It's a fully static site — no build step.

- Open `index.html` in a browser, or
- Serve it: `python3 -m http.server` and visit `http://localhost:8000`, or
- Enable **GitHub Pages** on this repo (Settings → Pages → deploy from branch) for a live URL.

## Editing course content

All lessons and quiz questions live in one file: [`assets/course-data.js`](assets/course-data.js).
Each module has an `id`, `title`, `intro`, `sections` (HTML), and a `quiz`
(`correct` is the zero-based index of the right answer). The app
(`assets/course.js`) and styles (`assets/styles.css`) don't need to change
when you edit content.
