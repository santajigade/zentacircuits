// Builds the 1200 x 675 featured image (WebP) for every article from its frontmatter:
// category colour, kicker, two title lines and a small circuit illustration.
// Text is converted to outlines with opentype.js, so the image looks the same on any machine.
import { readFileSync, readdirSync, statSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import opentype from 'opentype.js';
import sharp from 'sharp';

const root = new URL('..', import.meta.url).pathname;
const fontDir = join(root, 'scripts/fonts');
const load = (w) => { const b = readFileSync(join(fontDir, `OpenSans-${w}.ttf`)); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const F = { bold: load('Bold'), semi: load('SemiBold'), med: load('Medium') };

const cats = readFileSync(join(root, 'src/data/categories.ts'), 'utf8');
const colorOf = (slug) => (cats.match(new RegExp(`slug: '${slug}', name: '([^']+)', short: '[^']+', color: '(#[0-9A-Fa-f]{6})'`)) || [])[2] || '#E11D48';
const nameOf = (slug) => (cats.match(new RegExp(`slug: '${slug}', name: '([^']+)'`)) || [])[1] || slug;

const text = (font, str, size, x, y, fill, maxW) => {
  let s = size;
  while (maxW && font.getAdvanceWidth(str, s) > maxW && s > 20) s -= 2;
  return `<path d="${font.getPath(str, x, y, s).toPathData(2)}" fill="${fill}"/>`;
};

const ART = {
  buck: `<g fill="none" stroke="#FFFFFF" stroke-width="3"><path d="M730 190H790M840 190H880M980 190H1080V215M1080 255V290H730V255M730 215V190M880 190V215M880 255V290M1030 190V215M1030 255V290"/><rect x="790" y="176" width="50" height="28" rx="4"/><path d="M880 190h14q8-15 16 0q8-15 16 0q8-15 16 0q8-15 16 0h6"/><path d="M868 255l12-22 12 22zM868 233h24"/><path d="M1014 217h32M1014 229h32"/><rect x="1068" y="215" width="24" height="40" rx="3"/><path d="M718 217h24M723 229h14"/></g>
<g stroke="#1E293B" stroke-width="2"><path d="M720 360H1110M720 430H1110M720 500H1110M817 330V540M915 330V540M1012 330V540"/></g>
<path d="M720 350L720 335L817 335L817 375L915 375L915 335L1012 335L1012 375L1110 375" fill="none" stroke="#A78BFA" stroke-width="4"/>
<path d="M720 470L817 410L915 470L1012 410L1110 470" fill="none" stroke="#22D3EE" stroke-width="5"/>
<path d="M720 520C760 540 790 540 817 525S880 495 915 505S980 540 1012 530S1080 498 1110 510" fill="none" stroke="#F472B6" stroke-width="4"/>`,
  boost: `<g fill="none" stroke="#FFFFFF" stroke-width="3"><path d="M730 190H760M860 190H930M960 190H1080V215M1080 255V290H730V255M730 215V190M915 190V215M915 255V290M1030 190V215M1030 255V290"/><path d="M760 190h14q8-15 16 0q8-15 16 0q8-15 16 0q8-15 16 0h22"/><path d="M930 178v24l20-12z"/><path d="M950 176v28"/><rect x="903" y="215" width="24" height="40" rx="3"/><path d="M1014 217h32M1014 229h32"/><rect x="1068" y="215" width="24" height="40" rx="3"/><path d="M718 217h24M723 229h14"/></g>
<g stroke="#1E293B" stroke-width="2"><path d="M720 360H1110M720 430H1110M720 500H1110M817 330V540M915 330V540M1012 330V540"/></g>
<path d="M720 375L720 335L817 335L817 375L915 375L915 335L1012 335L1012 375L1110 375" fill="none" stroke="#A78BFA" stroke-width="4"/>
<path d="M720 470L817 410L915 470L1012 410L1110 470" fill="none" stroke="#22D3EE" stroke-width="5"/>
<path d="M720 505L817 535L915 505L1012 535L1110 505" fill="none" stroke="#F472B6" stroke-width="4"/>`,
  rectifier: `<g fill="none" stroke="#FFFFFF" stroke-width="3"><path d="M840 230L915 160L990 230L915 300Z"/><path d="M760 160H915M760 300H915M990 230H1080M840 230H800V320H1080"/></g>
<g fill="#FFFFFF"><path d="M868 188l18-8-8 18z"/><path d="M944 180l18 8-18 8z" transform="rotate(45 953 188)"/><path d="M868 272l18 8-8-18z"/><path d="M944 280l18-8-18-8z" transform="rotate(-45 953 272)"/></g>
<g stroke="#1E293B" stroke-width="2"><path d="M720 420H1110M720 520H1110M817 360V540M915 360V540M1012 360V540"/></g>
<path d="M720 470C744 390 768 390 793 470S841 550 866 470S914 390 939 470S987 550 1012 470S1060 390 1085 470L1110 500" fill="none" stroke="#A78BFA" stroke-width="3" stroke-opacity="0.6"/>
<path d="M720 470C744 390 768 390 793 470C817 390 841 390 866 470C890 390 914 390 939 470C963 390 987 390 1012 470C1036 390 1060 390 1085 470" fill="none" stroke="#F472B6" stroke-width="5"/>
<path d="M720 400L793 412L800 398L866 410L873 398L939 410L946 398L1012 410L1019 398L1085 410" fill="none" stroke="#34D399" stroke-width="4"/>`,
  zener: `<g fill="none" stroke="#FFFFFF" stroke-width="3"><path d="M915 150V200M915 260V300"/><path d="M895 200h40l-20 32z" fill="#FFFFFF"/><path d="M887 240l8-8h40l8-8"/></g>
<g stroke="#1E293B" stroke-width="2"><path d="M720 380H1110M720 460H1110M720 540H1110M817 340V550M915 340V550M1012 340V550"/></g>
<path d="M720 420C760 370 800 370 840 420S920 470 960 420S1040 370 1110 420" fill="none" stroke="#F472B6" stroke-width="4"/>
<path d="M720 500H1110" fill="none" stroke="#34D399" stroke-width="6"/>`,
  rc: `<g fill="none" stroke="#FFFFFF" stroke-width="3"><path d="M740 190H830M910 190H1000V215M1000 245V290H740V190"/><rect x="830" y="176" width="80" height="28" rx="4"/><path d="M975 215h50M975 245h50"/></g>
<g stroke="#1E293B" stroke-width="2"><path d="M720 380H1110M720 460H1110M720 540H1110M817 340V550M915 340V550M1012 340V550"/></g>
<path d="M720 540C760 420 800 390 860 375S980 362 1110 360" fill="none" stroke="#F472B6" stroke-width="5"/>
<path d="M720 360C760 480 800 510 860 525S980 538 1110 540" fill="none" stroke="#34D399" stroke-width="4"/>`,
  rlc: `<g fill="none" stroke="#FFFFFF" stroke-width="3"><path d="M730 190H770M830 190H860M940 190H1040V215M1040 245V290H730V190"/><rect x="770" y="178" width="60" height="24" rx="4"/><path d="M860 190q10-22 20 0q10-22 20 0q10-22 20 0q10-22 20 0"/><path d="M1015 215h50M1015 245h50"/></g>
<g stroke="#1E293B" stroke-width="2"><path d="M720 380H1110M720 460H1110M720 540H1110M817 340V550M915 340V550M1012 340V550"/></g>
<path d="M720 540C740 330 760 330 780 450S820 560 840 470S880 420 900 465S940 490 960 462S1010 455 1110 460" fill="none" stroke="#F472B6" stroke-width="5"/>`,
  logic: `<g fill="none" stroke="#FFFFFF" stroke-width="3"><path d="M740 175H800M740 215H800M870 195H930"/><path d="M800 165H835A30 30 0 0 1 835 225H800Z"/><path d="M930 175H950M930 215H950"/><path d="M950 165H985A30 30 0 0 1 985 225H950Z"/><circle cx="1021" cy="195" r="6"/><path d="M1027 195H1080"/></g>
<g stroke="#1E293B" stroke-width="2"><path d="M720 330V550M817 330V550M915 330V550M1012 330V550M1110 330V550"/></g>
<path d="M720 380H817V340H915V380H1012V340H1110" fill="none" stroke="#A78BFA" stroke-width="4"/>
<path d="M720 450H768V410H817V450H866V410H915V450H963V410H1012V450H1060V410H1110" fill="none" stroke="#A78BFA" stroke-width="4"/>
<path d="M720 520H866V480H915V520H1060V480H1110" fill="none" stroke="#FBBF24" stroke-width="5"/>`,
  nand: `<g fill="none" stroke="#FFFFFF" stroke-width="4"><path d="M745 170H810M745 230H810M915 200H990"/><path d="M810 150H860A50 50 0 0 1 860 250H810Z"/><circle cx="920" cy="200" r="9"/></g>
<g stroke="#1E293B" stroke-width="2"><path d="M720 330V550M817 330V550M915 330V550M1012 330V550M1110 330V550"/></g>
<path d="M720 380H817V340H915V380H1012V340H1110" fill="none" stroke="#A78BFA" stroke-width="4"/>
<path d="M720 450H768V410H817V450H866V410H915V450H963V410H1012V450H1060V410H1110" fill="none" stroke="#A78BFA" stroke-width="4"/>
<path d="M720 480H866V520H915V480H1060V520H1110" fill="none" stroke="#FBBF24" stroke-width="5"/>`,
  generic: `<g stroke="#1E293B" stroke-width="2"><path d="M720 200H1110M720 300H1110M720 400H1110M720 500H1110M817 150V540M915 150V540M1012 150V540"/></g>
<path d="M720 340C760 200 800 200 840 340S920 480 960 340S1040 200 1080 340L1110 380" fill="none" stroke="#22D3EE" stroke-width="5"/>
<path d="M720 470H790V420H880V470H960V420H1040V470H1110" fill="none" stroke="#FBBF24" stroke-width="4"/>`,
};

const chip = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s / 64})"><rect x="4" y="4" width="56" height="56" rx="12" fill="#FFFFFF"/>${[20, 29, 38, 47].map((v) => `<path d="M6 ${v}H14M50 ${v}H58" stroke="#E11D48" stroke-width="4" stroke-linecap="round"/>`).join('')}<rect x="14" y="10" width="36" height="46" rx="5" fill="#E11D48"/><path d="M28 10a4 4 0 0 0 8 0" fill="#FFFFFF"/><path d="M24 24H40L24 44H40" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></g>`;

function svgFor(fm) {
  const bg = colorOf(fm.category);
  const grid = Array.from({ length: 8 }, (_, i) => `M0 ${75 * (i + 1)}H1200`).join('') + Array.from({ length: 15 }, (_, i) => `M${75 * (i + 1)} 0V675`).join('');
  const parts = [
    `<rect width="1200" height="675" fill="${bg}"/>`,
    `<path d="${grid}" stroke="#FFFFFF" stroke-opacity="0.08"/>`,
    chip(64, 56, 44),
    text(F.bold, 'ZentaCircuits', 28, 122, 88, '#FFFFFF'),
    text(F.semi, (fm.kicker || nameOf(fm.category)).toUpperCase(), 22, 64, 250, '#FFFFFF', 590),
    text(F.bold, fm.line1, 72, 64, 335, '#FFFFFF', 600),
    text(F.med, fm.line2a || '', 36, 64, 395, '#FFFFFF', 600),
    text(F.med, fm.line2b || '', 36, 64, 440, '#FFFFFF', 600),
    fm.simulator ? `<rect x="64" y="530" width="280" height="56" rx="28" fill="#FFFFFF"/>${text(F.semi, 'Live simulator inside', 22, 89, 566, bg)}` : '',
    `<rect x="690" y="110" width="450" height="455" rx="22" fill="#0B1320"/>`,
    ART[fm.art] || ART.generic,
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">${parts.join('')}</svg>`;
}

// Tiny frontmatter reader for the fields we need.
const fmOf = (src) => {
  const m = src.match(/^---\n([\s\S]*?)\n---/); const y = m ? m[1] : '';
  const get = (k) => (y.match(new RegExp(`^\\s*${k}:\\s*['"]?(.*?)['"]?\\s*$`, 'm')) || [])[1];
  const block = (y.match(/featured:\n((?:\s{2,}.*\n?)+)/) || [])[1] || '';
  const fget = (k) => (block.match(new RegExp(`${k}:\\s*['"]?(.*?)['"]?\\s*$`, 'm')) || [])[1] || '';
  const line2 = fget('line2');
  const words = line2.split(' '); const half = Math.ceil(words.length / 2);
  return { category: get('category'), simulator: get('simulator'), kicker: fget('kicker'), line1: fget('line1'), line2a: words.slice(0, half).join(' '), line2b: words.slice(half).join(' '), art: fget('art') || 'generic' };
};

const files = [];
const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.mdx?$/.test(f) && files.push(p); });
walk(join(root, 'src/content/articles'));
const out = join(root, 'public/images/featured'); mkdirSync(out, { recursive: true });
for (const f of files) {
  const fm = fmOf(readFileSync(f, 'utf8'));
  const svg = svgFor(fm);
  const name = basename(f).replace(/\.mdx?$/, '');
  writeFileSync(join(out, `${name}.svg`), svg);
  await sharp(Buffer.from(svg)).webp({ quality: 86 }).toFile(join(out, `${name}.webp`));
}
console.log(`Featured images: ${files.length} built.`);

// Static WebP copies of article figures, so Google Images can index them.
const figDir = join(root, 'public/images/figures');
if (existsSync(figDir)) {
  const svgs = readdirSync(figDir).filter((f) => f.endsWith('.svg'));
  for (const f of svgs) await sharp(join(figDir, f), { density: 144 }).webp({ quality: 88 }).toFile(join(figDir, f.replace(/\.svg$/, '.webp')));
  console.log(`Figures: ${svgs.length} exported to WebP.`);
}
