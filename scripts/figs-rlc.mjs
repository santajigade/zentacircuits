// Generates RC and RLC figures from the simulator engine (run: node scripts/figs-rlc.mjs).
import { writeFileSync } from 'node:fs';
import { timeResponse, sweep, DEFAULTS } from '../src/sim/rlc.js';
const out = 'public/images/figures/', W = 720, L = 70, R = 700, F = 'font-family="Open Sans, DejaVu Sans, sans-serif"', M = 'font-family="DejaVu Sans Mono, monospace"';
function chart({ title, xs, series, ylab, xlab, logx = false, h = 300, marks = [], yr, legY = 0 }) {
  const H = h + 90, y0 = 46, ph = h;
  let mn = yr ? yr[0] : Math.min(0, ...series.flatMap((s) => s.y)), mx = yr ? yr[1] : Math.max(...series.flatMap((s) => s.y));
  if (!yr) { const pad = (mx - mn) * 0.06; mx += pad; if (mn < 0) mn -= pad; }
  const fx = (x) => (logx ? Math.log10(x) : x), x0 = fx(xs[0]), x1 = fx(xs[xs.length - 1]);
  const X = (x) => L + ((fx(x) - x0) / (x1 - x0)) * (R - L), Y = (v) => y0 + ph - ((Math.max(mn, Math.min(mx, v)) - mn) / (mx - mn)) * ph;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}"><rect width="${W}" height="${H}" fill="#0E1828"/><text x="${W / 2}" y="26" text-anchor="middle" ${F} font-size="15" fill="#FFFFFF">${title}</text>`;
  s += `<g stroke="#1E293B">${Array.from({ length: 9 }, (_, g) => `<path d="M${L + (g * (R - L)) / 8} ${y0}V${y0 + ph}"/>`).join('')}${Array.from({ length: 5 }, (_, g) => `<path d="M${L} ${y0 + (g * ph) / 4}H${R}"/>`).join('')}</g>`;
  marks.forEach((m) => { s += `<path d="${m.x !== undefined ? `M${X(m.x)} ${y0}V${y0 + ph}` : `M${L} ${Y(m.y)}H${R}`}" stroke="#64748B" stroke-dasharray="4 4"/><text x="${m.x !== undefined ? X(m.x) + 4 : m.right ? R - 90 : L + 6}" y="${m.x !== undefined ? y0 + 14 : Y(m.y) - 5}" ${M} font-size="11" fill="#CBD5E1">${m.t}</text>`; });
  series.forEach((sr) => { let d = ''; const st = Math.max(1, Math.floor(xs.length / 700)); for (let i = 0; i < xs.length; i += st) d += `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)} ${Y(sr.y[i]).toFixed(1)}`; s += `<path d="${d}" fill="none" stroke="${sr.c}" stroke-width="2.4"/>`; });
  s += `<g ${F} font-size="12">${series.map((sr, i) => `<text x="${R - 8}" y="${y0 + (legY || 18) + i * 17}" text-anchor="end" fill="${sr.c}">${sr.name}</text>`).join('')}</g>`;
  s += `<g ${M} font-size="11" fill="#94A3B8"><text x="6" y="${Y(mx) + 10}">${ylab[0]}</text><text x="6" y="${Y(mn) + 4}">${ylab[1]}</text></g><text x="${W / 2}" y="${H - 14}" text-anchor="middle" ${M} font-size="11" fill="#94A3B8">${xlab}</text></svg>`;
  return s;
}
// RC charging
const rc = { ...DEFAULTS, circ: 'rc', R: 1000, C: 1e-6, V: 10 }, r = timeResponse(rc).rec, tms = r.t.map((t) => t * 1000);
writeFileSync(out + 'rc-circuit-charging-curve.svg', chart({ title: 'RC charging, R = 1 kΩ, C = 1 µF, V = 10 V (τ = 1 ms)', xs: tms, series: [{ y: r.vC, c: '#F472B6', name: 'Capacitor voltage' }, { y: r.vR, c: '#34D399', name: 'Resistor voltage (current × R)' }], ylab: ['10 V', '0'], xlab: 'time, 0 to 5 ms', legY: 160, marks: [1, 2, 3, 4].map((k) => ({ x: k, t: `${k}τ` })).concat([{ y: 6.32, t: '63.2%' }]), yr: [0, 10.4] }));
// RC Bode
const b = sweep({ ...rc, out: 'vC' });
writeFileSync(out + 'rc-low-pass-filter-bode-plot.svg', chart({ title: 'RC low pass filter response, fc = 159 Hz', xs: b.f, logx: true, series: [{ y: b.db, c: '#F472B6', name: 'Gain (dB)' }], ylab: ['0 dB', '−60 dB'], xlab: 'frequency, 0.16 Hz to 159 kHz (log scale)', marks: [{ x: 159.15, t: 'fc' }, { y: -3, t: '−3 dB' }], yr: [-60, 3] }));
// RLC step for three damping cases
const cases = [[10, '#F472B6', 'R = 10 Ω, underdamped (Q = 10)'], [100, '#FBBF24', 'R = 100 Ω, underdamped (Q = 1)'], [200, '#34D399', 'R = 200 Ω, critically damped'], [600, '#22D3EE', 'R = 600 Ω, overdamped']];
const Tw = 4e-3, grab = (R) => { const p = { ...DEFAULTS, R, V: 10 }; const res = timeResponse(p).rec; return res.t.map((_, i) => i).filter((i) => res.t[i] <= Tw).map((i) => [res.t[i] * 1000, res.vC[i]]); };
const data = cases.map(([R]) => grab(R)), n = Math.min(...data.map((d) => d.length));
const xs = Array.from({ length: 800 }, (_, k) => (k / 799) * Tw * 1000);
const interp = (d, x) => { let i = d.findIndex((q) => q[0] >= x); if (i <= 0) return i === 0 ? d[0][1] : d[d.length - 1][1]; const [a, b2] = [d[i - 1], d[i]]; return a[1] + ((x - a[0]) / (b2[0] - a[0])) * (b2[1] - a[1]); };
writeFileSync(out + 'rlc-circuit-step-response.svg', chart({ title: 'Series RLC step response, L = 10 mH, C = 1 µF, V = 10 V', xs, series: cases.map(([, c, name], k) => ({ y: xs.map((x) => interp(data[k], x)), c, name })), ylab: ['20 V', '0'], xlab: 'time, 0 to 4 ms', marks: [{ y: 10, t: 'final value', right: true }], legY: 250, yr: [0, 20] }));
// RLC resonance curves
const fr = sweep({ ...DEFAULTS, R: 10, out: 'i' }).f;
const curves = [[10, '#F472B6', 'R = 10 Ω, Q = 10'], [31.6, '#FBBF24', 'R = 31.6 Ω, Q ≈ 3.2'], [100, '#22D3EE', 'R = 100 Ω, Q = 1']].map(([R, c, name]) => ({ y: fr.map((f) => { const p = { ...DEFAULTS, R }; const w = 2 * Math.PI * f, x = w * p.L - 1 / (w * p.C); return 10 / Math.hypot(R, x) * 1000; }), c, name }));
const idx = fr.map((f, i) => i).filter((i) => fr[i] >= 159 && fr[i] <= 15900);
writeFileSync(out + 'rlc-resonance-curve.svg', chart({ title: 'Current in a series RLC circuit vs frequency, V = 10 V', xs: idx.map((i) => fr[i]), logx: true, series: curves.map((c) => ({ ...c, y: idx.map((i) => c.y[i]) })), ylab: ['1000 mA', '0'], xlab: 'frequency, 159 Hz to 15.9 kHz (log scale), f0 = 1.59 kHz', marks: [{ x: 1591.5, t: 'f0' }], yr: [0, 1050] }));
console.log('ok');
