# ZentaCircuits

Free electronics lessons with worked examples and a live simulator on every topic. https://zentacircuits.com

Stack: Astro 5 (static), MDX, KaTeX, Pagefind, GitHub Actions deploy to Hostinger, IndexNow.

## Commands
- `npm run dev`: local preview
- `npm run build`: content checks, featured images, Astro build, search index, link check
- `npm run check`: content checks only

## Adding an article
Create `src/content/articles/<category>/<subcategory>/<slug>.mdx`. Category and subcategory slugs are in `src/data/categories.ts`.
The build fails unless the article has 1,200+ words, no em or en dashes, a slug under 60 characters, 3+ references, a 110 to 160 character description with the focus keyword in title, description and slug, and outbound links only to:
zentacalculator.com, zentaengineering.com, instrumentationblog.in, kleevme.ae, kleevusa.com (text links inside the body only).

Featured images (1200 x 675 WebP) are generated from the `featured` frontmatter. Article figures go in `public/images/figures/*.svg`; the build exports WebP copies for Google Images.

## Launch
Set `LAUNCHED = true` in `src/data/site.ts` to open robots.txt, the sitemap and indexing.

## Deploy secrets
FTP_SERVER, FTP_USERNAME, FTP_PASSWORD (or SSH_HOST, SSH_PORT, SSH_USER, SSH_KEY, SSH_PATH). Optional preview: PREVIEW_FTP_*.

Brand assets: `brand/` (logo kit). Fonts for image generation: `scripts/fonts/` (IBM Plex Sans, SIL Open Font License).
