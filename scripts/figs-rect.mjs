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
// Smoothing capacitor figures
{
  const p = { ...DEFAULTS, topo: 'bridge', vrms: 12, R: 100 };
  const caps = [[100e-6, '#22D3EE', '100 µF'], [470e-6, '#FBBF24', '470 µF'], [2200e-6, '#F472B6', '2200 µF']];
  const recs = caps.map(([C]) => steadyState({ ...p, C }).rec);
  plot('Bridge rectifier output with three smoothing capacitors, 100 Ω load', [
    { unit: 'V', lines: caps.map(([, c, name], k) => ({ y: recs[k].vo, c, name: `C = ${name}` })) },
  ], 'smoothing-capacitor-ripple-comparison.svg');
  const r = recs[1], iL = r.vo.map((v) => v / p.R), iC = r.id.map((v, i) => v - iL[i]);
  plot('Currents with 470 µF: the capacitor charges in short pulses', [
    { unit: 'A', lines: [{ y: r.id, c: '#FBBF24', name: 'Diode (charging) current' }, { y: iL, c: '#34D399', name: 'Load current' }] },
    { unit: 'A', lines: [{ y: iC, c: '#22D3EE', name: 'Capacitor current' }] },
  ], 'smoothing-capacitor-charging-current.svg');
  // Ripple vs capacitance: textbook estimate vs simulation
  const Cs = [47e-6, 100e-6, 220e-6, 470e-6, 1e-3, 2.2e-3, 4.7e-3, 10e-3];
  const pts = Cs.map((C) => { const s = steadyState({ ...p, C }); return { C, sim: s.ripple, th: (s.vdc / p.R) / (2 * p.f * C) }; });
  const W = 720, H = 420, L = 80, R = 690, T = 50, B = 360, lx = (c) => L + ((Math.log10(c) - Math.log10(30e-6)) / (Math.log10(15e-3) - Math.log10(30e-6))) * (R - L), ly = (v) => B - ((Math.log10(v) - Math.log10(0.01)) / (Math.log10(20) - Math.log10(0.01))) * (B - T);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}"><rect width="${W}" height="${H}" fill="#0E1828"/><text x="${W / 2}" y="28" text-anchor="middle" font-family="Open Sans, DejaVu Sans, sans-serif" font-size="15" fill="#fff">Ripple vs capacitance, bridge rectifier, 12 V RMS, 100 Ω (log scales)</text>`;
  for (const c of [1e-4, 1e-3, 1e-2]) s += `<path d="M${lx(c)} ${T}V${B}" stroke="#1E293B"/><text x="${lx(c)}" y="${B + 18}" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-size="11" fill="#94A3B8">${c >= 1e-3 ? c * 1e3 + ' mF' : c * 1e6 + ' µF'}</text>`;
  for (const v of [0.01, 0.1, 1, 10]) s += `<path d="M${L} ${ly(v)}H${R}" stroke="#1E293B"/><text x="${L - 8}" y="${ly(v) + 4}" text-anchor="end" font-family="DejaVu Sans Mono, monospace" font-size="11" fill="#94A3B8">${v} V</text>`;
  s += `<path d="${pts.map((q, i) => `${i ? 'L' : 'M'}${lx(q.C).toFixed(1)} ${ly(q.th).toFixed(1)}`).join('')}" fill="none" stroke="#64748B" stroke-width="2" stroke-dasharray="6 5"/>`;
  s += `<path d="${pts.map((q, i) => `${i ? 'L' : 'M'}${lx(q.C).toFixed(1)} ${ly(q.sim).toFixed(1)}`).join('')}" fill="none" stroke="#F472B6" stroke-width="2.4"/>` + pts.map((q) => `<circle cx="${lx(q.C)}" cy="${ly(q.sim)}" r="4.5" fill="#F472B6"/>`).join('');
  s += `<g font-family="Open Sans, DejaVu Sans, sans-serif" font-size="12"><text x="${R - 8}" y="${T + 18}" text-anchor="end" fill="#F472B6">Simulated ripple (p-p)</text><text x="${R - 8}" y="${T + 36}" text-anchor="end" fill="#94A3B8">Estimate ΔV = I / (2fC)</text></g>`;
  s += `<text x="${W / 2}" y="${H - 18}" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-size="11" fill="#94A3B8">capacitance, 47 µF to 10 mF</text></svg>`;
  writeFileSync(out + 'smoothing-capacitor-ripple-vs-capacitance.svg', s);
  console.log(pts.map((q) => `${(q.C * 1e6).toFixed(0)}uF sim ${q.sim.toFixed(3)} est ${q.th.toFixed(3)}`).join('\n'));
}
