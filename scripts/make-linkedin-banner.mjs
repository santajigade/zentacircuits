// LinkedIn company page banner, 1128 x 191 at 2x (run: node scripts/make-linkedin-banner.mjs).
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import opentype from 'opentype.js';
const W = 1128, H = 191, S = 2;
const semi = opentype.loadSync('scripts/fonts/OpenSans-SemiBold.ttf'), reg = opentype.loadSync('scripts/fonts/OpenSans-Medium.ttf'), bold = opentype.loadSync('scripts/fonts/OpenSans-Bold.ttf');
const txt = (f, s, x, y, size, fill) => `<path d="${f.getPath(s, x, y, size).toPathData(2)}" fill="${fill}"/>`;
const width = (f, s, size) => f.getAdvanceWidth(s, size);
const logo = readFileSync('brand/zentacircuits-logo-horizontal-on-dark.svg', 'utf8').replace(/<svg[^>]*>/, '').replace('</svg>', '');

let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * S}" height="${H * S}">
<defs>
  <radialGradient id="glow" cx="0.78" cy="0.5" r="0.55"><stop offset="0" stop-color="#E11D48" stop-opacity="0.22"/><stop offset="1" stop-color="#E11D48" stop-opacity="0"/></radialGradient>
  <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#15233A" stroke-width="1"/></pattern>
</defs>
<rect width="${W}" height="${H}" fill="#0B1424"/><rect width="${W}" height="${H}" fill="url(#grid)"/><rect width="${W}" height="${H}" fill="url(#glow)"/>`;
// PCB traces with pads
s += `<g fill="none" stroke="#1E3150" stroke-width="2" stroke-linecap="round">
<path d="M40 0V30L70 60H180"/><path d="M120 0V18L140 38"/><path d="M760 191V166L780 146"/><path d="M790 0V20L800 30"/></g>
<g fill="#1E3150"><circle cx="180" cy="60" r="4"/><circle cx="140" cy="38" r="4"/><circle cx="780" cy="146" r="4"/><circle cx="800" cy="30" r="4"/></g>`;
// Left: logo, tagline, subline
s += `<g transform="translate(300 30) scale(0.68)">${logo}</g>`;
const tag = 'Learn electronics. Run the circuit. See it work.';
s += txt(semi, tag, 304, 114, 19.5, '#FFFFFF');
let x = 304;
for (const [t, c] of [['Free tutorials', '#94A3B8'], ['  ·  ', '#475569'], ['Live circuit simulators', '#94A3B8'], ['  ·  ', '#475569'], ['zentacircuits.com', '#FB7185']]) { s += txt(t === 'zentacircuits.com' ? semi : reg, t, x, 142, 13.5, c); x += width(t === 'zentacircuits.com' ? semi : reg, t, 13.5); }
// Right: oscilloscope panel
const px = 818, py = 26, pw = 284, ph = 139;
s += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="14" fill="#0E1828" stroke="#26364F" stroke-width="1.5"/>`;
s += `<g stroke="#1A2740" stroke-width="1">${Array.from({ length: 6 }, (_, i) => `<path d="M${px + 16 + i * 50.4} ${py + 34}V${py + ph - 12}"/>`).join('')}${[0, 1, 2, 3].map((i) => `<path d="M${px + 16} ${py + 34 + i * 30.5}H${px + pw - 16}"/>`).join('')}</g>`;
// Header chip and dots
s += `<rect x="${px + 14}" y="${py + 10}" width="108" height="18" rx="9" fill="#E11D48"/>` + txt(bold, 'LIVE SIMULATOR', px + 24, py + 23, 9.5, '#FFFFFF');
s += [['#A78BFA', 0], ['#FBBF24', 1], ['#F472B6', 2]].map(([c, i]) => `<circle cx="${px + pw - 52 + i * 14}" cy="${py + 19}" r="4" fill="${c}"/>`).join('');
// Waveforms: digital clock, buck inductor ripple, RLC ringing
const x0 = px + 16, x1 = px + pw - 16, wv = x1 - x0;
let d = `M${x0} ${py + 62}`; for (let k = 0; k < 8; k++) { const a = x0 + (k * wv) / 8, b = a + wv / 16; d += `H${b}V${py + 44}H${a + wv / 8}V${py + 62}`; }
s += `<path d="${d}" fill="none" stroke="#A78BFA" stroke-width="2.2" stroke-linejoin="round"/>`;
let r = `M${x0} ${py + 90}`; for (let k = 0; k < 6; k++) { const a = x0 + (k * wv) / 6; r += `L${a + wv / 12} ${py + 74}L${a + wv / 6} ${py + 90}`; }
s += `<path d="${r}" fill="none" stroke="#FBBF24" stroke-width="2.4" stroke-linejoin="round"/>`;
let q = ''; for (let i = 0; i <= 300; i++) { const t = i / 300, xx = x0 + t * wv, y = py + 127 - 13 * (1 - Math.exp(-4 * t) * (Math.cos(28 * t) + 0.14 * Math.sin(28 * t))); q += `${i ? 'L' : 'M'}${xx.toFixed(1)} ${y.toFixed(1)}`; }
s += `<path d="${q}" fill="none" stroke="#F472B6" stroke-width="2.4"/>`;
s += `</svg>`;
await sharp(Buffer.from(s)).png().toFile('/tmp/banner/zentacircuits-linkedin-banner.png');
console.log('ok');
