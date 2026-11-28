// Series RC and RLC circuit engine: time response (RK4) and frequency response (complex impedance).
// Shared by the browser simulator and the Node build tests.
// State: capacitor voltage vC and loop current i. Source: step, square (0 to V) or sine (amplitude V).

export const DEFAULTS = { circ: 'rlc', out: 'vC', src: 'step', V: 10, fsrc: 1000, R: 100, L: 10e-3, C: 1e-6, rest: false };
const TWO_PI = 2 * Math.PI;

export const isRC = (p) => p.circ === 'rc';
export const isRL = (p) => p.circ === 'rl';
export const firstOrder = (p) => isRC(p) || isRL(p);

/** Characteristic values. */
export function params(p) {
  if (isRC(p)) { const tau = p.R * p.C; return { tau, fc: 1 / (TWO_PI * tau), slow: tau, type: 'First order' }; }
  if (isRL(p)) { const tau = p.L / p.R; return { tau, fc: 1 / (TWO_PI * tau), slow: tau, type: 'First order' }; }
  const w0 = 1 / Math.sqrt(p.L * p.C), zeta = (p.R / 2) * Math.sqrt(p.C / p.L), Q = (1 / p.R) * Math.sqrt(p.L / p.C);
  const alpha = p.R / (2 * p.L);
  let slow, type, fd = 0;
  if (zeta < 1 - 1e-9) { type = 'Underdamped'; slow = 1 / alpha; fd = (w0 * Math.sqrt(1 - zeta * zeta)) / TWO_PI; }
  else if (zeta > 1 + 1e-9) { type = 'Overdamped'; slow = 1 / (alpha - Math.sqrt(alpha * alpha - w0 * w0)); }
  else { type = 'Critically damped'; slow = 1 / alpha; }
  return { f0: w0 / TWO_PI, w0, zeta, Q, alpha, fd, slow, type, bw: p.R / (TWO_PI * p.L) };
}

const vsrc = (p, t) => {
  if (p.src === 'step') return t >= 0 ? p.V : 0;
  if (p.src === 'sine') return p.V * Math.sin(TWO_PI * p.fsrc * t);
  const ph = (t * p.fsrc) % 1; return ph < 0.5 - 1e-12 ? p.V : 0;
};

function deriv(p, t, vC, i) {
  const vs = vsrc(p, t);
  if (isRC(p)) { const ic = (vs - vC) / p.R; return [ic / p.C, 0, ic]; }
  if (isRL(p)) return [0, (vs - p.R * i) / p.L, i];
  return [i / p.C, (vs - p.R * i - vC) / p.L, i];
}

function outputs(p, t, vC, i) {
  const vs = vsrc(p, t);
  if (isRC(p)) { const ir = (vs - vC) / p.R; return { vs, vC, vR: ir * p.R, vL: 0, i: ir }; }
  if (isRL(p)) return { vs, vC: 0, vR: p.R * i, vL: vs - p.R * i, i };
  return { vs, vC, vR: p.R * i, vL: vs - p.R * i - vC, i };
}

/** Integrate from state s over [t0, t0 + T] with n steps. Square edges must fall on step boundaries. */
function integrate(p, s, t0, T, n, rec) {
  let [vC, i] = s; const h = T / n;
  if (rec) { const o = outputs(p, t0, vC, i); for (const k in o) rec[k].push(o[k]); rec.t.push(t0); }
  for (let k = 0; k < n; k++) {
    // Evaluate the square wave in the middle of each step so the edge is never sampled on its discontinuity.
    const t = t0 + k * h, tm = t + h / 2;
    const f = (tt, a, b) => deriv(p, tt, a, b);
    const k1 = f(t + h * 1e-9, vC, i), k2 = f(tm, vC + (h / 2) * k1[0], i + (h / 2) * k1[1]);
    const k3 = f(tm, vC + (h / 2) * k2[0], i + (h / 2) * k2[1]), k4 = f(t + h * (1 - 1e-9), vC + h * k3[0], i + h * k3[1]);
    vC += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    i += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    if (rec) { const o = outputs(p, t + h, vC, i); if (isRC(p)) o.i = o.vR / p.R; for (const kk in o) rec[kk].push(o[kk]); rec.t.push(t + h); }
  }
  return [vC, i];
}

const blank = () => ({ t: [], vs: [], vC: [], vR: [], vL: [], i: [] });
const N = 4000;

/** Time response. Step: from rest. Square or sine: exact periodic steady state (affine one period map), or from rest. */
export function timeResponse(p) {
  const c = params(p);
  if (p.src === 'step') {
    let W = 5 * c.slow;
    if (!firstOrder(p) && c.fd) W = Math.min(W, 12 / c.fd);
    const rec = blank(); integrate(p, [0, 0], 0, W, N, rec); return { rec, window: W };
  }
  const T = 1 / p.fsrc, n = 2000;
  if (p.rest) {
    const W = Math.min(Math.max(2 * T, 5 * c.slow), 40 * T), periods = Math.max(2, Math.round(W / T));
    const rec = blank(); integrate(p, [0, 0], 0, periods * T, Math.min(periods * n, 40000), rec); return { rec, window: periods * T };
  }
  const P = (s) => integrate(p, s, 0, T, n, null);
  const b = P([0, 0]), a1 = P([1, 0]), a2 = P([0, 1]);
  const A = [[a1[0] - b[0], a2[0] - b[0]], [a1[1] - b[1], a2[1] - b[1]]];
  const m = [[1 - A[0][0], -A[0][1]], [-A[1][0], 1 - A[1][1]]], det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
  const x0 = isRC(p) ? [b[0] / m[0][0], 0] : isRL(p) ? [0, b[1] / m[1][1]] : [(b[0] * m[1][1] - m[0][1] * b[1]) / det, (m[0][0] * b[1] - m[1][0] * b[0]) / det];
  const rec = blank(); integrate(p, x0, 0, 2 * T, 2 * n, rec); return { rec, window: 2 * T };
}

/** Complex transfer function from source to the chosen output at frequency f. */
export function H(p, f, out = p.out) {
  const w = TWO_PI * f;
  if (isRL(p) && out === 'vC') out = 'vR';
  const zr = p.R, zi = (isRC(p) ? 0 : w * p.L) - (isRL(p) ? 0 : 1 / (w * p.C));
  const d = zr * zr + zi * zi, ir = zr / d, ii = -zi / d; // I = 1 / Z
  if (out === 'i') return [ir, ii];
  if (out === 'vR') return [ir * p.R, ii * p.R];
  if (out === 'vL') return [-ii * w * p.L, ir * w * p.L];
  return [ii / (w * p.C), -ir / (w * p.C)]; // vC = I / (jwC)
}
export const mag = (z) => Math.hypot(z[0], z[1]);
export const phase = (z) => (Math.atan2(z[1], z[0]) * 180) / Math.PI;

/** Bode data over 6 decades centred on fc or f0. */
export function sweep(p, n = 600) {
  const c = params(p), fc = firstOrder(p) ? c.fc : c.f0, f = [], db = [], ph = [];
  for (let k = 0; k < n; k++) {
    const x = fc * 10 ** (-3 + (6 * k) / (n - 1)), z = H(p, x);
    f.push(x); db.push(20 * Math.log10(Math.max(mag(z), 1e-12)) - (p.out === 'i' ? 20 * Math.log10(1 / p.R) : 0)); ph.push(phase(z));
  }
  return { f, db, ph, unitDb: p.out === 'i' ? 'dB re 1/R' : 'dB' };
}

const bisectLog = (g, lo, hi) => { for (let k = 0; k < 100; k++) { const m = Math.sqrt(lo * hi); g(m) > 0 ? (hi = m) : (lo = m); } return Math.sqrt(lo * hi); };

/** Numeric measurements from simulation and sweep, for the accuracy table. */
export function measure(p) {
  const c = params(p), r = timeResponse({ ...p, src: 'step' }).rec, t = r.t, v = isRL(p) ? r.vR : r.vC, V = p.V;
  const res = {};
  // Time to reach 63.2% of the final value (interpolated).
  const target = V * (1 - Math.exp(-1));
  for (let k = 1; k < t.length; k++) if (v[k] >= target) { res.t63 = t[k - 1] + ((target - v[k - 1]) / (v[k] - v[k - 1])) * (t[k] - t[k - 1]); break; }
  if (firstOrder(p)) {
    const lp = isRL(p) ? 'vR' : 'vC'; // low pass output
    res.fc = bisectLog((f) => mag(H(p, f, lp)) - Math.SQRT1_2 > 0 ? -1 : 1, c.fc / 1e3, c.fc * 1e3);
    res.phaseFc = phase(H(p, c.fc, lp));
    return res;
  }
  // Resonance: peak of |I| (golden section on log f), bandwidth from the two half power points.
  let a = Math.log(c.f0 / 100), b = Math.log(c.f0 * 100); const gr = (Math.sqrt(5) - 1) / 2;
  const I = (x) => mag(H(p, Math.exp(x), 'i'));
  for (let k = 0; k < 200; k++) { const x1 = b - gr * (b - a), x2 = a + gr * (b - a); I(x1) > I(x2) ? (b = x2) : (a = x1); }
  res.f0 = Math.exp((a + b) / 2);
  const Imax = I(Math.log(res.f0)), half = Imax * Math.SQRT1_2;
  const f1 = bisectLog((f) => (mag(H(p, f, 'i')) > half ? 1 : -1), res.f0 / 1e6, res.f0);
  const f2 = bisectLog((f) => (mag(H(p, f, 'i')) > half ? -1 : 1), res.f0, res.f0 * 1e6);
  res.bw = f2 - f1; res.Q = res.f0 / res.bw;
  if (c.fd) {
    // Ringing: peaks of vC refined by a parabola through three samples.
    const pk = [];
    for (let k = 1; k < v.length - 1 && pk.length < 3; k++) if (v[k] > v[k - 1] && v[k] >= v[k + 1]) {
      const d = (v[k - 1] - v[k + 1]) / (2 * (v[k - 1] - 2 * v[k] + v[k + 1])), h = t[1] - t[0];
      pk.push({ t: t[k] + d * h, v: v[k] - 0.25 * (v[k - 1] - v[k + 1]) * d });
    }
    if (pk.length >= 2) res.fd = 1 / (pk[1].t - pk[0].t);
    if (pk.length) res.os = ((pk[0].v - V) / V) * 100;
  }
  return res;
}

export function accuracy(p) {
  const c = params(p), m = measure(p), rows = [];
  const row = (name, th, sim, unit, tol) => { const err = th ? (Math.abs(sim - th) / Math.abs(th)) * 100 : Math.abs(sim); return { name, theory: th, sim, unit, tol, err, pass: isFinite(sim) && err <= tol }; };
  const sineRow = () => {
    if (p.src !== 'sine' || p.rest) return;
    const r = timeResponse(p).rec, k = p.out === 'i' ? 'i' : isRL(p) && p.out === 'vC' ? 'vR' : p.out, y = r[k];
    rows.push(row(`Output amplitude at ${p.fsrc} Hz`, p.V * mag(H(p, p.fsrc)), Math.max(...y), p.out === 'i' ? 'A' : 'V', 0.05));
  };
  if (firstOrder(p)) {
    rows.push(row('Time constant τ (63.2%)', c.tau, m.t63, 's', 0.1));
    rows.push(row('Cutoff frequency fc', c.fc, m.fc, 'Hz', 0.01));
    rows.push(row('Phase at fc', -45, m.phaseFc, '°', 0.01));
    sineRow();
    return { rows, c, m };
  }
  rows.push(row('Resonant frequency f0', c.f0, m.f0, 'Hz', 0.01));
  rows.push(row('Bandwidth', c.bw, m.bw, 'Hz', 0.1));
  rows.push(row('Quality factor Q', c.Q, m.Q, '', 0.1));
  if (c.fd && m.fd) rows.push(row('Ringing frequency fd', c.fd, m.fd, 'Hz', 0.5));
  if (c.fd && m.os !== undefined && c.zeta < 0.9) rows.push(row('Overshoot', 100 * Math.exp((-Math.PI * c.zeta) / Math.sqrt(1 - c.zeta ** 2)), m.os, '%', 1));
  sineRow();
  return { rows, c, m };
}
