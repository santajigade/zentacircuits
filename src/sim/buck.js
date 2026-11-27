// DC-DC converter time domain engine (buck and boost; set p.topo = 'boost' for boost). Plain JS so the browser and the Node test script share it.
// Model: switch (RDS(on)), diode (Vf) or synchronous FET, inductor with DCR, capacitor with ESR, resistive load.
// RK4 integration, 400 steps per switching period. DCM is handled by clamping inductor current at zero.

/** @typedef {{vin:number,d:number,fs:number,L:number,C:number,R:number,esr:number,dcr:number,rds:number,vf:number,sync:boolean,trf:number}} BuckParams */

export const DEFAULTS = { vin: 24, d: 0.5, fs: 100e3, L: 47e-6, C: 100e-6, R: 6, esr: 0, dcr: 0.03, rds: 0.025, vf: 0.45, sync: false, trf: 20e-9 };
export const IDEAL = { esr: 0, dcr: 0, rds: 0, vf: 0, trf: 0 };

const N = 400; // steps per period

// Current delivered to the output node (capacitor plus load): buck = iL, boost = iL only while the diode or top FET conducts.
function iNode(p, on, iL) { return p.topo === 'boost' ? (on ? 0 : (p.sync ? iL : Math.max(iL, 0))) : iL; }
function vout(p, iL, vC, on = false) { const i = iNode(p, on, iL); return p.esr > 0 ? (vC + p.esr * i) / (1 + p.esr / p.R) : vC; }

// Switch node voltage for the present state. Returns [vsw, phase] where phase 0 = switch on, 1 = diode/low FET, 2 = DCM idle.
function vsw(p, on, iL, vo) {
  if (p.topo === 'boost') {
    if (on) return [iL * p.rds, 0];
    if (p.sync) return [vo + iL * p.rds, 1];
    if (iL > 0) return [vo + p.vf, 1];
    return [p.vin, 2];
  }
  if (on) return [p.vin - iL * p.rds, 0];
  if (p.sync) return [-iL * p.rds, 1];
  if (iL > 0) return [-p.vf, 1];
  return [vo, 2];
}

function deriv(p, on, iL, vC) {
  const vo = vout(p, iL, vC, on);
  const [vs, ph] = vsw(p, on, iL, vo);
  // Inductor voltage: buck = vsw - vout, boost = vin - vsw.
  let diL = (p.topo === 'boost' ? p.vin - iL * p.dcr - vs : vs - iL * p.dcr - vo) / p.L;
  if (!on && !p.sync && iL <= 0 && diL < 0) diL = 0;
  return [diL, (iNode(p, on, iL) - vo / p.R) / p.C, ph];
}

/** Run n periods from state s. If rec, returns samples for every step. */
export function runPeriods(p, s, n, rec = false, bucket = 0) {
  const T = 1 / p.fs, h = T / N, ton = p.d * T;
  const out = rec ? { t: [], vsw: [], iL: [], iD: [], vo: [] } : null;
  // With bucket > 0 the recording keeps the min and max of every channel per bucket of steps (an envelope),
  // so long startup runs stay light and still show the switching ripple.
  const K = ['vsw', 'iL', 'iD', 'vo'];
  if (out && bucket) K.forEach((k) => { out[k + 'Min'] = []; out[k + 'Max'] = []; });
  let cnt = 0, mn = {}, mx = {};
  let { iL, vC, t } = s;
  for (let k = 0; k < n; k++) {
    for (let j = 0; j < N; j++) {
      // Exact switching instant: a step that spans the turn-off point is split in two.
      const ts = j * h, te = ts + h, on = te <= ton + 1e-15;
      const parts = !on && ts < ton ? [[ton - ts, true], [te - ton, false]] : [[h, on]];
      for (const [hh, o] of parts) {
        const a = deriv(p, o, iL, vC);
        const b = deriv(p, o, iL + hh / 2 * a[0], vC + hh / 2 * a[1]);
        const c = deriv(p, o, iL + hh / 2 * b[0], vC + hh / 2 * b[1]);
        const e = deriv(p, o, iL + hh * c[0], vC + hh * c[1]);
        iL += hh / 6 * (a[0] + 2 * b[0] + 2 * c[0] + e[0]);
        vC += hh / 6 * (a[1] + 2 * b[1] + 2 * c[1] + e[1]);
        if (!o && !p.sync && iL < 0) iL = 0;
        if (out && !bucket && parts.length === 2 && o) { const vo = vout(p, iL, vC, true); const [vs] = vsw(p, true, iL, vo); out.t.push(t + hh); out.vsw.push(vs); out.iL.push(iL); out.iD.push(0); out.vo.push(vo); }
      }
      t += h;
      if (out) {
        const vo = vout(p, iL, vC, on);
        const [vs] = vsw(p, on, iL, vo);
        const v = { vsw: vs, iL, iD: on ? 0 : (p.sync ? iL : Math.max(iL, 0)), vo };
        if (!bucket) { out.t.push(t); K.forEach((k) => out[k].push(v[k])); }
        else {
          if (cnt === 0) K.forEach((k) => { mn[k] = Infinity; mx[k] = -Infinity; });
          K.forEach((k) => { if (v[k] < mn[k]) mn[k] = v[k]; if (v[k] > mx[k]) mx[k] = v[k]; });
          if (++cnt === bucket) { cnt = 0; out.t.push(t); K.forEach((k) => { out[k + 'Min'].push(mn[k]); out[k + 'Max'].push(mx[k]); out[k].push((mn[k] + mx[k]) / 2); }); }
        }
      }
    }
  }
  void ton;
  return { s: { iL, vC, t }, rec: out };
}

/** Steady state: start near the ideal operating point, settle, then record two periods. */
export function steadyState(p) {
  const vo0 = theory(p).vo;
  let st = { iL: p.topo === 'boost' ? vo0 * vo0 / (p.R * p.vin) : vo0 / p.R, vC: vo0, t: 0 };
  // Periodic steady state by shooting: solve x = F(x) for the one-period map F with Newton's method
  // (finite-difference Jacobian). Exact and fast; falls back to plain settling if it does not converge.
  st = runPeriods(p, st, 20).s;
  const F = (x) => { const r = runPeriods(p, { iL: x[0], vC: x[1], t: 0 }, 1).s; return [r.iL, r.vC]; };
  let x = [st.iL, st.vC], ok = false;
  for (let it = 0; it < 12; it++) {
    const f = F(x), g = [f[0] - x[0], f[1] - x[1]];
    const sc = [Math.max(1e-6, Math.abs(x[0]) * 1e-6), Math.max(1e-6, Math.abs(x[1]) * 1e-6)];
    if (Math.abs(g[0]) < 1e-9 * (1 + Math.abs(x[0])) && Math.abs(g[1]) < 1e-9 * (1 + Math.abs(x[1]))) { ok = true; break; }
    const J = [0, 1].map((k) => { const y = x.slice(); y[k] += sc[k]; const fy = F(y); return [(fy[0] - y[0] - g[0]) / sc[k], (fy[1] - y[1] - g[1]) / sc[k]]; });
    const a = J[0][0], b = J[1][0], c = J[0][1], d = J[1][1], det = a * d - b * c;
    if (!isFinite(det) || Math.abs(det) < 1e-18) break;
    x = [x[0] - (d * g[0] - b * g[1]) / det, x[1] - (-c * g[0] + a * g[1]) / det];
    if (!p.sync && x[0] < 0) x[0] = 0;
  }
  if (ok) st = { iL: x[0], vC: x[1], t: 0 };
  else st = runPeriods(p, st, Math.min(4000, Math.max(200, Math.ceil(12 * 2 * p.R * p.C * p.fs)))).s;
  const r = runPeriods(p, { ...st, t: 0 }, 2, true).rec;
  return { rec: r, ...measure(p, r) };
}

/** Startup from zero, recorded and decimated to about 2000 points. */
export function startup(p, periods) {
  const n = periods ?? Math.min(3000, Math.max(100, Math.ceil(8 * 2 * p.R * p.C * p.fs)));
  const bucket = Math.max(1, Math.ceil(n * N / 1500));
  const r = runPeriods(p, { iL: 0, vC: 0, t: 0 }, n, true, bucket).rec;
  return { rec: r, periods: n };
}

export function measure(p, r) {
  const n = r.t.length, half = n / 2; // second period only for per-period values
  const iL = r.iL.slice(half), vo = r.vo.slice(half), vs = r.vsw.slice(half);
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const voAvg = avg(vo), iLmax = Math.max(...iL), iLmin = Math.min(...iL);
  const on = Math.round(p.d * iL.length);
  const iOut = voAvg / p.R;
  const pOut = avg(vo.map((v) => v * v / p.R));
  const condQ = avg(iL.map((i, k) => (k < on ? i * i * p.rds : 0)));
  const condLow = avg(iL.map((i, k) => (k >= on ? (p.sync ? i * i * p.rds : Math.max(i, 0) * p.vf) : 0)));
  const dcr = avg(iL.map((i) => i * i * p.dcr));
  const iLavg = avg(iL);
  const sw = p.topo === 'boost' ? 0.5 * voAvg * iLavg * p.trf * p.fs : 0.5 * p.vin * iOut * p.trf * p.fs;
  const loss = condQ + condLow + dcr + sw;
  return {
    voAvg, iOut, dIL: iLmax - iLmin, iLpk: iLmax, iLmin, ripple: Math.max(...vo) - Math.min(...vo),
    iLavg, dcm: !p.sync && iLmin <= 1e-9, vdsPk: Math.max(...vs) - Math.min(...vs),
    loss: { switchCond: condQ, lowSide: condLow, dcr, switching: sw, total: loss }, eff: pOut / (pOut + loss), pOut,
  };
}

/** Textbook values for ideal parts (CCM and DCM). */
export function theory(p) {
  const T = 1 / p.fs, K = 2 * p.L / (p.R * T);
  if (p.topo === 'boost') {
    const Lcrit = p.d * (1 - p.d) ** 2 * p.R / (2 * p.fs);
    const ccm = p.sync || p.L >= Lcrit;
    const M = ccm ? 1 / (1 - p.d) : (1 + Math.sqrt(1 + 4 * p.d * p.d / K)) / 2;
    const vo = M * p.vin, io = vo / p.R, iin = vo * io / p.vin;
    const dIL = p.vin * p.d / (p.L * p.fs);
    return { vo, io, iin, dIL, iLpk: ccm ? iin + dIL / 2 : dIL, Lcrit, ccm, ripple: ccm ? io * p.d / (p.fs * p.C) : NaN };
  }
  const Lcrit = (1 - p.d) * p.R / (2 * p.fs);
  const ccm = p.sync || p.L >= Lcrit;
  const M = ccm ? p.d : 2 / (1 + Math.sqrt(1 + 4 * K / (p.d * p.d)));
  const vo = M * p.vin, io = vo / p.R;
  const dIL = (p.vin - vo) * p.d / (p.L * p.fs);
  const r = { vo, io, dIL, iLpk: ccm ? io + dIL / 2 : dIL, Lcrit, ccm, ripple: ccm ? dIL / (8 * p.fs * p.C) : NaN };
  return r;
}

/** Ideal-parts comparison used by the on page accuracy table and by the build tests. */
export function accuracy(p) {
  const ip = { ...p, ...IDEAL };
  const th = theory(ip), sim = steadyState(ip);
  const row = (name, a, b, unit, tol) => ({ name, theory: a, sim: b, unit, err: Math.abs(b - a) / Math.abs(a) * 100, tol, pass: Math.abs(b - a) / Math.abs(a) * 100 <= tol });
  const rows = [row('Vout', th.vo, sim.voAvg, 'V', 0.5), row('ΔIL', th.dIL, sim.dIL, 'A', 1), row('IL peak', th.iLpk, sim.iLpk, 'A', 1)];
  if (ip.topo === 'boost' && th.ccm) rows.push(row('IL average', th.iin, sim.iLavg, 'A', 1));
  if (th.ccm) rows.push(row('ΔVout', th.ripple, sim.ripple, 'V', 3));
  return { rows, ccm: th.ccm };
}
