# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

## What this is

A **static, no-build roofing website template**. It is a plain HTML/CSS/JS
site with no framework, no package manager, no dependencies, and no build
step. The template is designed to be cloned per-customer and have its
placeholder tokens replaced to produce a branded single-page marketing site
for a roofing business.

There is no `package.json`, lockfile, CI config, or test suite. The entire
site is the set of static files committed to the repo.

## Repository layout

```
index.html          Main landing page (hero, services, about, blog teaser, footer)
blog/index.html     Standalone blog page (placeholder; "auto-generates posts weekly")
data/site.json      Runtime site config fetched by app.js (brand, city, phone, posts)
assets/app.js       Client-side JS: fetches site.json and populates the DOM
assets/styles.css   All site styles (single minified-ish stylesheet)
assets/badge1.svg   Trust badge — "Licensed & Insured"
assets/badge2.svg   Trust badge — "Insurance Experts"
assets/badge3.svg   Trust badge — "5-Star Rated"
```

## How the page renders (two templating layers)

This template fills content in **two different ways**. Know which is which
before editing.

1. **Runtime JS injection (`assets/app.js`).** On page load, `loadSite()`
   `fetch`es `/data/site.json` and writes values into elements by `id`:
   - `#brand` ← `brand_name`
   - `#cta-phone` text ← `Call <phone_display>`, `href` ← `tel:<phone>`
   - `#city`, `#city-foot` ← `city`
   - `#headline` is rebuilt with the city name
   - `#year` ← current year (computed, not from config)
   - `#blog-list` ← up to the first 3 entries of `posts[]` rendered as
     `.card` links (`title`, `excerpt`, `url`)

2. **Build-time token replacement (`{{TOKEN}}`).** Some content is *not*
   handled by JS and instead uses `{{...}}` placeholders meant to be string-
   replaced by an external provisioning/generation step before deploy. These
   tokens currently appear in:
   - `index.html`: `{{BRAND_NAME}}`, `{{CITY}}`, `{{STATE}}` (in `<title>`,
     meta description, the "Why {{BRAND_NAME}}?" heading, and footer)
   - `data/site.json`: `{{BRAND_NAME}}`, `{{CITY}}`, `{{STATE}}`,
     `{{PHONE}}`, `{{PHONE_DISPLAY}}`

   ⚠️ Because `site.json` itself contains tokens, the runtime JS in an
   un-provisioned checkout will render the literal strings `{{BRAND_NAME}}`,
   `{{CITY}}`, etc. The tokens must be replaced for the site to look correct.

When adding new dynamic content, prefer one approach consistently for a given
piece of text — don't both JS-inject *and* token-replace the same element.

## Conventions

- **Absolute root-relative paths.** All asset references use a leading slash
  (`/assets/styles.css`, `/assets/app.js`, `/data/site.json`). The site must
  be served from the **domain root**. Opening `index.html` directly via
  `file://` will break asset loading and the `fetch('/data/site.json')` call.
- **`id` attributes are the JS contract.** `app.js` selects elements by the
  exact ids listed above. Renaming or removing an id silently breaks
  population. If you add a config-driven field, add the id in the HTML and the
  corresponding `querySelector`/assignment in `app.js`.
- **Config shape.** `data/site.json` keys are `brand_name`, `city`, `state`,
  `phone`, `phone_display`, and `posts` (array of `{title, excerpt, url}`).
  Keep this shape in sync with `app.js`.
- **Styling.** Everything lives in the single `assets/styles.css`. Colors use
  the existing palette: dark slate header/footer (`#0f172a`), green CTA/badges
  (`#22c55e` / `#16a34a`). Reuse these rather than introducing new colors.
- **Plain ES, no transpilation.** `app.js` is browser-native ES with
  `async/await` and `fetch`. No bundler, so don't use `import`/`export` or npm
  modules — write code that runs directly in the browser.

## Running locally

There is no build. Serve the repo root over HTTP so absolute paths and the
`fetch` resolve:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Note the un-provisioned `{{...}}` tokens will be visible until replaced.

## Making changes

- **Edit copy/services/layout:** `index.html`.
- **Change dynamic brand/contact data:** `data/site.json` (and `app.js` if a
  new field is involved).
- **Adjust look:** `assets/styles.css`.
- **Blog:** `blog/index.html` is a static placeholder; the homepage blog
  teaser is driven by `posts[]` in `site.json`.
- Keep the template **generic and token-driven** — this is a reusable
  template, so avoid hard-coding a specific business's name, city, or phone
  into shared files; use the placeholder tokens / `site.json` instead.

## Git workflow

- Active development branch for this work: `claude/claude-md-docs-r05tfv`.
- Commit with clear messages and push with `git push -u origin <branch>`.
- Do **not** open a pull request unless explicitly asked.
</content>
</invoke>
