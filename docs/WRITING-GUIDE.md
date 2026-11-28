# ZentaCircuits writing guide

Rules for every article. The build (`npm run build`) enforces many of them and must pass before anything is pushed.

## Site and owner

- Site: https://zentacircuits.com, a free electronics learning site where each topic has a live browser simulator.
- Author: `santaji-gadepatil` (B.E. Electronics and Telecommunication, industrial process instrumentation).
- Audience: engineering and diploma students (largest group in India), hobbyists, technicians and working engineers.
- Tagline: Learn electronics. Run the circuit. See it work.

## Hard rules

1. Never use an em dash or en dash anywhere (text, titles, alt text, captions, figures). Hyphens inside words are fine. Use a minus sign (−) in formulas.
2. At least 1,200 words of body text (the checker counts prose, not tables or frontmatter). Aim for 1,250 to 1,450.
3. Facts must come from real sources. Every number in a worked example, table or caption must be computed by code (the simulator engine or a short Node script), never guessed.
4. References: at least 3, each a real page with a working URL (datasheets from TI, Nexperia, Vishay, onsemi; OpenStax; All About Circuits; publisher pages of standard textbooks). Fetch each URL to confirm it exists before using it.
5. Outbound links inside the article body may only be natural text hyperlinks to these sites: zentacalculator.com, zentaengineering.com, instrumentationblog.in, kleevme.ae, kleevusa.com. For zentacalculator.com, use only URLs listed in `docs/zentacalculator-urls.txt`. For the others, confirm the page exists with a web search or fetch. No link boxes, no lists of links. Other sites appear only in `references`.
6. Internal links: 2 or 3 natural links to related ZentaCircuits articles. Set `prev` and `next` so articles in a cluster form a chain, and update the neighbouring article's `prev`/`next` to point back.
7. Never change the slug of a published article.

## Slug and file

- The slug is the exact focus keyword from `docs/content-plan.csv`, lowercase, words joined by hyphens, apostrophes removed (de morgan's law → `de-morgans-law`). Max 40 characters and 4 words. No filler words or years.
- URL is `/<category>/<slug>/`. The file goes in `src/content/articles/<category>/<subcategory>/<slug>.mdx`.
- The slug must not equal a category or subcategory slug (see `src/data/categories.ts`).

## Frontmatter

Copy the shape of a recent article, for example `src/content/articles/analog/diode-circuits/smoothing-capacitor.mdx`.

- `title`: at most 70 characters, contains the focus keyword, in the pattern `<Keyword>: <three things it covers>`.
- `seoTitle`: a slightly fuller variant for the browser tab.
- `description`: 110 to 160 characters, contains the focus keyword, says what the reader gets.
- `focusKeyword`: exactly as in the plan (it must appear in title, description and slug).
- `pubDate`: `'YYYY-MM-DDT06:00:00+05:30'` for the plan date. The site builds at 06:00 IST and future-dated articles stay hidden until then.
- `readMinutes`: words / 110, rounded (usually 11 to 13).
- `simulator`: the anchor id of the simulator heading, for example `and-gate-simulator` for `## AND gate simulator`.
- `shortAnswer`: 2 or 3 sentences that answer the search directly (featured snippet target).
- `featured`: kicker (category name), line1 (keyword in title case), line2 (short subtitle), art (a key in `scripts/make-featured.mjs`; add a new ART entry for new visual themes).
- `image.alt`: describes the featured image.
- `prerequisites`: 1 or 2 existing articles.
- `learn`: 5 bullet points.
- `interview`: 5 or 6 questions with model answers (viva and interview style).
- `faq`: 4 questions people actually search.
- `references`: 3 or more, with URLs.

## Body structure

1. `## What is <keyword>?` A direct definition, why it matters, a link to a related article.
2. Main explanation sections with `###` subsections where useful.
3. Figures: 3 to 5 original images per article (see Figures).
4. A formulas or comparison table.
5. At least one `<Callout type="insight">` or `type="warning"`.
6. `## <Keyword> simulator`: 2 or 3 sentences telling the reader exactly what to try, then the simulator component.
7. `## Worked example` inside `<Callout type="example" title="Worked example">` with Given, Find, numbered Solution, Answer. Numbers computed by code.
8. `## Quick check` with one `<QuickCheck .../>`.
9. Applications or uses (bullets allowed).
10. `## Design steps` with `<Steps items={[...]} />` where it fits.
11. `## Common mistakes` with `<Mistakes items={[...]} />`.

MDX imports use `'../../../../components/...'`.

## Writing style

- Humanized, plain English. Short sentences (under 25 words), short paragraphs (2 or 3 sentences).
- Explain from the reader's point of view: what they see, measure or calculate.
- SI units with a space (12 V, 470 µF, 1.59 kHz). Use × for multiplication in prose.
- No emoji, no hype words, no "In this article we will".
- Include one practical angle from real work (bench testing, industrial use, datasheet reading) in every article.

## Simulators

- Every article embeds a live simulator. Reuse an existing lab where the plan says Ready:
  - `src/components/sims/BuckSim.astro` (buck, boost; engine `src/sim/buck.js`)
  - `src/components/sims/RectSim.astro` (rectifiers, smoothing, Zener; engine `src/sim/rectifier.js`)
  - `src/components/sims/RLCSim.astro` (series RC, RL, RLC, time and frequency; engine `src/sim/rlc.js`)
  - `src/components/sims/LogicSim.astro` (gates, NAND builds, timing; engine `src/sim/logic.js`)
- Where the plan says Extend or New, build it in that run before writing. A lab must be deep: several parameters, a multi-channel scope or plot with draggable cursors, readouts, a "Theory vs simulated" table that checks the simulation against textbook formulas, CSV export, copy link (URL hash), full screen, works on mobile. Copy the style block and patterns from an existing lab.
- Engines are plain JS in `src/sim/` shared with Node. Add accuracy cases to `scripts/test-sims.mjs` for every new mode; they must pass with tight tolerances.

## Figures

- Save as SVG in `public/images/figures/<slug>-<what>.svg`. The build converts them to WebP. Reference the `.webp` path with `width` and `height` equal to twice the SVG viewBox size, plus descriptive `alt` and a `figcaption` starting `Figure N.`
- Waveforms and graphs must come from the simulator engines (see `scripts/figs-rect.mjs`, `scripts/figs-rlc.mjs`, `scripts/figs-logic.mjs`; add a block or a new script). Circuit diagrams are hand-drawn SVG in the existing style (white background, #0F172A strokes, #BE123C labels, Open Sans).
- Render every new SVG to PNG and look at it before using it. Fix overlaps, clipped labels and wrong symbol directions.

## Before pushing

1. `npm run build` passes (content check, simulator tests, featured images, link check).
2. Preview with `npx astro preview` and take Playwright screenshots of each new simulator and figure; there must be no page errors.
3. Update `docs/content-plan.csv` status to `written` for the rows done.
4. Commit with a clear message and push to `main`.
