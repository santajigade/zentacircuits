// Quality gate for every article. The build fails if any rule breaks.
// Rules: no em or en dash, 1,200+ words of body text, SEO slug (max 40 characters, 4 words, no stop words or years),
// outbound links only to allowed sites, 3+ references, description and title lengths.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const ALLOWED = ['zentacircuits.com', 'zentacalculator.com', 'zentaengineering.com', 'instrumentationblog.in', 'kleevme.ae', 'kleevusa.com', 'linkedin.com'];
const files = [];
const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.mdx?$/.test(f) && files.push(p); });
walk(join(root, 'src/content/articles'));
const errors = [];
const cats = readFileSync(join(root, 'src/data/categories.ts'), 'utf8');
const seen = new Map();
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const rel = f.slice(root.length);
  const slug = basename(f).replace(/\.mdx?$/, '');
  if (/[–—]/.test(src)) errors.push(`${rel}: contains an em or en dash`);
  // SEO slug rules: short, lowercase hyphenated keyword, no filler or stop words, no years.
  if (slug.length > 40) errors.push(`${rel}: slug is ${slug.length} characters (limit 40)`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors.push(`${rel}: slug must be lowercase words joined by single hyphens`);
  if (slug.split('-').length > 4) errors.push(`${rel}: slug has ${slug.split('-').length} words (limit 4)`);
  const STOP = ['a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'how', 'what', 'why', 'is', 'are', 'guide', 'tutorial', 'working', 'types', 'explained', 'complete', 'best', 'basics', 'introduction'];
  const bad = slug.split('-').filter((w) => STOP.includes(w) || /^(19|20)\d\d$/.test(w));
  if (bad.length) errors.push(`${rel}: slug contains filler or stop words: ${bad.join(', ')}`);
  if (seen.has(slug)) errors.push(`${rel}: slug "${slug}" is already used by ${seen.get(slug)}`); seen.set(slug, rel);
  const catSlug = (src.match(/^category:\s*(\S+)/m) || [])[1];
  const catLine = cats.split('\n').find((l) => l.includes(`slug: '${catSlug}'`)) || '';
  const subsLine = cats.slice(cats.indexOf(catLine)).split('subs: s(')[1]?.split(')')[0] || '';
  if (subsLine.split('|').some((x) => x.replace(/^'/, '').split(':')[0] === slug)) errors.push(`${rel}: slug "${slug}" clashes with a subcategory URL in ${catSlug}`);
  const fm = (src.match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
  const body = src.slice(fm.length + 8);
  const words = (fm.match(/shortAnswer:.*$/m)?.[0] ?? '') + ' ' + body
    .replace(/^import .*$/gm, '').replace(/<[^>]+>/g, ' ').replace(/\$\$[\s\S]*?\$\$/g, ' ').replace(/[#*_`|>\[\]()]/g, ' ');
  const n = words.split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).length;
  if (n < 1200) errors.push(`${rel}: ${n} words (minimum 1,200)`);
  const noRefs = src.replace(/references:\n(?:\s+.*\n)+?(?=\S)/, '');
  for (const m of noRefs.matchAll(/https?:\/\/([^/\s)"']+)/g)) {
    const host = m[1].replace(/^www\./, '');
    if (!ALLOWED.some((a) => host === a || host.endsWith('.' + a))) errors.push(`${rel}: outbound link to ${host} is not on the allowed list`);
  }
  const refs = (fm.match(/references:\n((?:\s+- .*\n?(?:\s{4,}.*\n?)*)+)/) || [])[1] || '';
  if ((refs.match(/- text:/g) || []).length < 3) errors.push(`${rel}: needs 3 or more references`);
  const desc = (fm.match(/^description:\s*['"]?(.*?)['"]?$/m) || [])[1] || '';
  if (desc.length < 110 || desc.length > 160) errors.push(`${rel}: description is ${desc.length} characters (110 to 160)`);
  const kw = ((fm.match(/^focusKeyword:\s*['"]?(.*?)['"]?$/m) || [])[1] || '').toLowerCase();
  const title = ((fm.match(/^title:\s*['"]?(.*?)['"]?$/m) || [])[1] || '').toLowerCase();
  if (kw && !(title.includes(kw) && desc.toLowerCase().includes(kw) && slug.includes(kw.replace(/\s+/g, '-')))) errors.push(`${rel}: focus keyword must be in title, description and slug`);
  console.log(`${rel}: ${n} words`);
}
if (errors.length) { console.error('\nContent check failed:\n' + errors.join('\n')); process.exit(1); }
console.log(`Content check: ${files.length} articles passed.`);
