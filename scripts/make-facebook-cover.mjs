// Facebook page cover, 820 x 312 at 2x. Key content stays inside the centre 555 px that mobile shows.
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import opentype from 'opentype.js';
const W = 820, H = 312, S = 2;
const semi = opentype.loadSync('scripts/fonts/OpenSans-SemiBold.ttf'), med = opentype.loadSync('scripts/fonts/OpenSans-Medium.ttf'), bold = opentype.loadSync('scripts/fonts/OpenSans-Bold.ttf');
const txtC = (f, s, cx, y, size, fill) => { const w = f.getAdvanceWidth(s, size); return `<path d="${f.getPath(s, cx - w / 2, y, size).toPathData(2)}" fill="${fill}"/>`; };
const logo = readFileSync('brand/zentacircuits-logo-horizontal-on-dark.svg', 'utf8').replace(/<svg[^>]*>/, '').replace('</svg>', '');
let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * S}" height="${H * S}"><defs>
<radialGradient id="g" cx="0.5" cy="0.35" r="0.6"><stop offset="0" stop-color="#E11D48" stop-opacity="0.24"/><stop offset="1" stop-color="#E11D48" stop-opacity="0"/></radialGradient>
<pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#15233A"/></pattern></defs>
<rect width="${W}" height="${H}" fill="#0B1424"/><rect width="${W}" height="${H}" fill="url(#grid)"/><rect width="${W}" height="${H}" fill="url(#g)"/>`;
// Edge waveforms (decorative; mobile crops them)
const wave = (fn, x0, x1, y, amp, col, w = 2.4) => { let d = ''; for (let i = 0; i <= 200; i++) { const u = i / 200; d += `${i ? 'L' : 'M'}${(x0 + (x1 - x0) * u).toFixed(1)} ${(y - amp * fn(u)).toFixed(1)}`; } return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" opacity="0.9"/>`; };
s += wave((u) => ((u * 3) % 1 < 0.5 ? 1 : 0), 16, 116, 90, 20, '#A78BFA');
s += wave((u) => { const v = (u * 3) % 1; return v < 0.5 ? v * 2 : (1 - v) * 2; }, 16, 116, 160, 20, '#FBBF24');
s += wave((u) => Math.abs(Math.sin(u * 2 * Math.PI)), 16, 116, 232, 24, '#F472B6');
s += wave((u) => 1 - Math.exp(-4 * u) * Math.cos(20 * u), 704, 804, 104, 22, '#22D3EE');
s += wave((u) => (((u * 3) % 1) < 0.5 ? 1 : 0), 704, 804, 170, 20, '#A78BFA');
s += wave((u) => Math.sin(u * 3 * Math.PI) * 0.5 + 0.5, 704, 804, 240, 20, '#34D399');
// Top half: logo and tagline (the profile picture covers the lower centre)
const lw = 390 * 0.62; s += `<g transform="translate(${(W - lw) / 2} 26) scale(0.62)">${logo}</g>`;
const t1 = 'Learn electronics. Run the circuit. ', t2 = 'See it work.', ts = 21;
const w1 = semi.getAdvanceWidth(t1, ts), w2 = semi.getAdvanceWidth(t2, ts), x0 = (W - w1 - w2) / 2;
s += `<path d="${semi.getPath(t1, x0, 118, ts).toPathData(2)}" fill="#FFFFFF"/><path d="${semi.getPath(t2, x0 + w1, 118, ts).toPathData(2)}" fill="#F472B6"/>`;
// Lower left and lower right, clear of the profile picture
const txtR = (f, t, rx, y, size, fill) => { const w = f.getAdvanceWidth(t, size); return `<path d="${f.getPath(t, rx - w, y, size).toPathData(2)}" fill="${fill}"/>`; };
s += txtR(semi, 'Free tutorials', 300, 204, 17, '#FFFFFF') + txtR(med, 'with live circuit simulators', 300, 228, 13, '#94A3B8');
s += `<rect x="508" y="194" width="164" height="36" rx="18" fill="#E11D48"/>` + txtC(bold, 'zentacircuits.com', 590, 217, 14.5, '#FFFFFF');
s += '</svg>';
await sharp(Buffer.from(s)).png().toFile('/tmp/banner/zentacircuits-facebook-cover.png');
console.log('ok');
