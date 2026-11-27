// Generates rectifier and Zener waveform figures from the simulator engine (run: node scripts/figs-rect.mjs).
import { writeFileSync } from 'node:fs';
import { steadyState, DEFAULTS } from '../src/sim/rectifier.js';
const out = 'public/images/figures/';
const W = 720, L = 70, R = 700;
function plot(title, panels, file) {
  const H = 40 + panels.length * 150 + 30;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}"><rect width="${W}" height="${H}" fill="#0E1828"/>`;
  s += `<text x="${W / 2}" y="24" text-anchor="middle" font-family="Open Sans, DejaVu Sans, sans-serif" font-size="15" fill="#FFFFFF">${title}</text>`;
  panels.forEach((pn, k) => {
    const y0 = 40 + k * 150, h = 130;
    let mn = 0, mx = 0;
    pn.lines.forEach((l) => l.y.forEach((v) => { mn = Math.min(mn, v); mx = Math.max(mx, v); }));
    const pad = (mx - mn) * 0.08; mn -= pad; mx += pad;
    const Y = (v) => y0 + h - ((v - mn) / (mx - mn)) * h, n = pn.lines[0].y.length, X = (i) => L + (i / (n - 1)) * (R - L);
    s += `<g stroke="#1E293B">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((g) => `<path d="M${L + (g * (R - L)) / 8} ${y0}V${y0 + h}"/>`).join('')}<path d="M${L} ${y0}H${R}M${L} ${y0 + h}H${R}"/></g>`;
    s += `<path d="M${L} ${Y(0).toFixed(1)}H${R}" stroke="#475569" stroke-dasharray="4 4"/>`;
    pn.lines.forEach((l) => { const st = Math.max(1, Math.floor(n / 700)); let d = ''; for (let i = 0; i < n; i += st) d += `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(l.y[i]).toFixed(1)}`; s += `<path d="${d}" fill="none" stroke="${l.c}" stroke-width="2.2"/>`; });
    s += `<g font-family="DejaVu Sans Mono, monospace" font-size="11" fill="#94A3B8"><text x="6" y="${Y(mx - pad) + 4}">${(mx - pad).toFixed(1)} ${pn.unit}</text><text x="6" y="${Y(0) + 4}">0</text>${mn + pad < -0.01 ? `<text x="6" y="${Y(mn + pad) + 4}">${(mn + pad).toFixed(1)} ${pn.unit}</text>` : ''}</g>`;
    s += `<g font-family="Open Sans, DejaVu Sans, sans-serif" font-size="12">${pn.lines.map((l, i) => `<text x="${R - 6}" y="${y0 + 16 + i * 16}" text-anchor="end" fill="${l.c}">${l.name}</text>`).join('')}</g>`;
  });
  s += `<text x="${W / 2}" y="${H - 8}" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-size="11" fill="#64748B">two mains cycles, 50 Hz (40 ms)</text></svg>`;
  writeFileSync(out + file, s);
}
const base = { ...DEFAULTS, vrms: 12, R: 100 };
const h0 = steadyState({ ...base, topo: 'half', C: 0 }).rec, h1 = steadyState({ ...base, topo: 'half', C: 1e-3 }).rec;
plot('Half wave rectifier, 12 V RMS secondary, 100 Ω load', [
  { unit: 'V', lines: [{ y: h0.vs, c: '#A78BFA', name: 'Secondary voltage' }, { y: h0.vo, c: '#F472B6', name: 'Output, no capacitor' }] },
  { unit: 'V', lines: [{ y: h1.vs, c: '#A78BFA', name: 'Secondary voltage' }, { y: h1.vo, c: '#F472B6', name: 'Output with 1000 µF' }] },
  { unit: 'A', lines: [{ y: h1.id, c: '#FBBF24', name: 'Diode current with 1000 µF' }] },
], 'half-wave-rectifier-waveforms.svg');
const b0 = steadyState({ ...base, topo: 'bridge', C: 0 }).rec, b1 = steadyState({ ...base, topo: 'bridge', C: 1e-3 }).rec;
plot('Bridge rectifier, 12 V RMS secondary, 100 Ω load', [
  { unit: 'V', lines: [{ y: b0.vs, c: '#A78BFA', name: 'Secondary voltage' }, { y: b0.vo, c: '#F472B6', name: 'Output, no capacitor' }] },
  { unit: 'V', lines: [{ y: b1.vs, c: '#A78BFA', name: 'Secondary voltage' }, { y: b1.vo, c: '#F472B6', name: 'Output with 1000 µF' }] },
  { unit: 'A', lines: [{ y: b1.id, c: '#FBBF24', name: 'Diode current with 1000 µF' }] },
], 'full-wave-rectifier-waveforms.svg');
const z = steadyState({ ...base, topo: 'bridge', C: 470e-6, zen: true, rser: 100, R: 220 }).rec;
plot('Zener regulator after a bridge rectifier, 9.1 V Zener', [
  { unit: 'V', lines: [{ y: z.vo, c: '#F472B6', name: 'Capacitor voltage (input)' }, { y: z.vz, c: '#34D399', name: 'Regulated output' }] },
  { unit: 'A', lines: [{ y: z.iz, c: '#22D3EE', name: 'Zener current' }] },
], 'zener-regulator-waveforms.svg');
console.log('figures written');
