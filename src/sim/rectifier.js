// Rectifier and Zener regulator engine (half wave, centre tap full wave, bridge). Plain JS shared by the browser and Node tests.
// Model: sine source Vm sin(wt) with winding resistance Rs, piecewise linear diodes (Vf knee plus Rd),
// optional reservoir capacitor C, resistive load, optional Zener shunt regulator (series R, Vz, rz) in front of the load.
// Backward Euler integration (stable for stiff diode conduction), 1200 steps per mains cycle, shooting method for steady state.

export const DEFAULTS = { topo: 'bridge', vrms: 12, f: 50, rs: 0.5, vf: 0.7, rd: 0.05, C: 470e-6, R: 100, zen: false, vz: 9.1, rz: 5, rser: 100, pz: 1 };
export const IDEAL = { rs: 0, vf: 0, rd: 0 };
const N = 1200;

const vm = (p) => p.vrms * Math.SQRT2;
const nd = (p) => (p.topo === 'bridge' ? 2 : 1); // diodes in the conduction path
const rth = (p) => Math.max(p.rs + nd(p) * p.rd, 1e-3);
const emf = (p, t) => { const v = vm(p) * Math.sin(2 * Math.PI * p.f * t); return p.topo === 'half' ? v : Math.abs(v); };

// Zener stage: node voltage vz for a given input v (piecewise linear, exact).
function zNode(p, v) {
  const off = (v * p.R) / (p.rser + p.R);
  if (off <= p.vz) return off;
  return (v / p.rser + p.vz / p.rz) / (1 / p.rser + 1 / p.rz + 1 / p.R);
}
// Current the load network draws from the rectifier output node.
function g(p, v) { return p.zen ? (v - zNode(p, v)) / p.rser : v / p.R; }
const idOf = (p, e, v) => Math.max(0, (e - nd(p) * p.vf - v) / rth(p));

function bisect(F, lo, hi) { for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; F(m) > 0 ? (hi = m) : (lo = m); } return (lo + hi) / 2; }

// One step: returns the new output node voltage.
function step(p, v, t1, h) {
  const e = emf(p, t1);
  if (!(p.C > 0)) { const top = e - nd(p) * p.vf; return top <= 0 ? 0 : bisect((x) => g(p, x) - (top - x) / rth(p), 0, top); }
  const k = h / p.C;
  return bisect((x) => x - v - k * (idOf(p, e, x) - g(p, x)), -1, Math.max(v, vm(p)) + 1);
}

function sample(p, t, v, r) {
  const s = vm(p) * Math.sin(2 * Math.PI * p.f * t), e = p.topo === 'half' ? s : Math.abs(s);
  const id = p.C > 0 ? idOf(p, e, v) : (v > 0 ? (e - nd(p) * p.vf - v) / rth(p) : 0);
  const vz = p.zen ? zNode(p, v) : v;
  const iz = p.zen && vz >= p.vz ? (vz - p.vz) / p.rz : 0;
  let vr;
  if (p.topo === 'half') vr = v - s;
  else if (p.topo === 'ct') vr = v + Math.abs(s);
  else vr = (Math.abs(s) - id * p.rs + v) / 2;
  r.t.push(t); r.vs.push(s); r.vo.push(v); r.id.push(Math.max(0, id)); r.vz.push(vz); r.iz.push(iz); r.vr.push(vr);
}

/** Run n cycles from output voltage v. */
export function runCycles(p, v, n, rec = false) {
  const T = 1 / p.f, h = T / N, r = rec ? { t: [], vs: [], vo: [], id: [], vz: [], iz: [], vr: [] } : null;
  if (rec) sample(p, 0, v, r);
  for (let i = 1; i <= n * N; i++) { v = step(p, v, i * h, h); if (rec) sample(p, i * h, v, r); }
  return { v, rec: r };
}

/** Periodic steady state (shooting with secant on the one cycle map). */
export function steadyState(p) {
  let v0 = 0;
  if (p.C > 0) {
    const F = (x) => runCycles(p, x, 1).v - x;
    let a = Math.max(0, vm(p) - nd(p) * p.vf), fa = F(a), b = a * 0.9, fb = F(b);
    for (let k = 0; k < 30 && Math.abs(fa) > 1e-10 * (1 + a); k++) {
      const c = fb === fa ? a - fa : a - (fa * (a - b)) / (fa - fb);
      b = a; fb = fa; a = Math.max(0, c); fa = F(a);
    }
    v0 = a;
  }
  const { rec } = runCycles(p, v0, 2, true);
  return { rec, ...measure(p, rec) };
}

/** Power-up from a discharged capacitor. */
export function startup(p, cycles = 8) { const { rec } = runCycles(p, 0, cycles, true); return { rec, inrush: Math.max(...rec.id) }; }

export function measure(p, r) {
  const n = Math.floor((r.t.length - 1) / 2), lo = r.t.length - 1 - n; // last cycle
  let s = 0, s2 = 0, mn = Infinity, mx = -Infinity, zs = 0, zmn = Infinity, zmx = -Infinity, izs = 0, izmn = Infinity, izmx = -Infinity, ids = 0, ids2 = 0, idp = 0, on = 0, piv = 0, pz = 0, pser = 0;
  for (let i = lo + 1; i < r.t.length; i++) {
    const v = r.vo[i]; s += v; s2 += v * v; mn = Math.min(mn, v); mx = Math.max(mx, v);
    const z = r.vz[i]; zs += z; zmn = Math.min(zmn, z); zmx = Math.max(zmx, z);
    const iz = r.iz[i]; izs += iz; izmn = Math.min(izmn, iz); izmx = Math.max(izmx, iz); pz += iz * z;
    pser += ((v - z) ** 2) / p.rser;
    const id = r.id[i]; ids += id; ids2 += id * id; idp = Math.max(idp, id); if (id > 1e-9) on++;
    piv = Math.max(piv, r.vr[i]);
  }
  const vo = p.zen ? zs / n : s / n, vdc = s / n, vrms = Math.sqrt(s2 / n);
  const ac = Math.sqrt(Math.max(0, vrms * vrms - vdc * vdc));
  const pulses = p.topo === 'half' ? 1 : 2;
  return {
    vdc, vrms, ripple: mx - mn, rf: vdc > 0 ? ac / vdc : NaN, eta: vrms > 0 ? (vdc * vdc) / (vrms * vrms) : 0, vpk: mx,
    idAvg: ids / n, idRms: Math.sqrt(ids2 / n), idPk: idp, cond: (on / n) * 360 / pulses, condMs: (on / n) / p.f * 1000 / pulses, piv,
    vz: zs / n, vzRipple: zmx - zmn, iz: izs / n, izMin: izmn, izMax: izmx, pz: pz / n, pser: pser / n, regulated: izmn > 0,
    vout: vo, iLoad: vo / p.R, pLoad: p.zen ? (zs / n) ** 2 / p.R : (s2 / n) / p.R,
  };
}

/** Exact average and RMS for a resistive load with no capacitor (piecewise linear diodes). */
export function exactNoCap(p) {
  const Vm = vm(p), V0 = nd(p) * p.vf, k = p.R / (p.R + rth(p)), m = p.topo === 'half' ? 1 : 2;
  if (V0 >= Vm) return { vdc: 0, vrms: 0 };
  const a = Math.asin(V0 / Vm), w = Math.PI - 2 * a;
  const avg = (k * m / (2 * Math.PI)) * (2 * Vm * Math.cos(a) - V0 * w);
  const I = Vm * Vm * (w / 2 + Math.sin(2 * a) / 2) - 4 * Vm * V0 * Math.cos(a) + V0 * V0 * w;
  return { vdc: avg, vrms: k * Math.sqrt((m * I) / (2 * Math.PI)) };
}

/** Theory vs simulation with ideal diodes. */
export function accuracy(p0) {
  const p = { ...p0, ...IDEAL }, s = steadyState(p), Vm = vm(p), m = p.topo === 'half' ? 1 : 2;
  const row = (name, theory, sim, unit, tol, note) => { const err = theory ? (Math.abs(sim - theory) / Math.abs(theory)) * 100 : 0; return { name, theory, sim, unit, tol, err, pass: err <= tol, note }; };
  const rows = [];
  if (!(p.C > 0) && !p.zen) {
    rows.push(row('V dc', (m * Vm) / Math.PI, s.vdc, 'V', 0.5));
    rows.push(row('V rms', m === 1 ? Vm / 2 : Vm / Math.SQRT2, s.vrms, 'V', 0.5));
    rows.push(row('Ripple factor', m === 1 ? Math.sqrt(Math.PI ** 2 / 4 - 1) : Math.sqrt(Math.PI ** 2 / 8 - 1), s.rf, '', 0.5));
    rows.push(row('Efficiency', (4 * m) / Math.PI ** 2, s.eta, '', 0.5));
  } else if (p.C > 0) {
    // Textbook approximation: constant load current, capacitor discharges for a full ripple period.
    const Req = p.zen ? s.vdc / Math.max(1e-12, s.idAvg) : p.R;
    const vdc = Vm / (1 + 1 / (2 * Req * m * p.f * p.C)), dv = vdc / (Req * m * p.f * p.C);
    const ok = dv / Vm < 0.1;
    rows.push(row('V dc (approx.)', vdc, s.vdc, 'V', ok ? 2 : 100, ok ? '' : 'large ripple'));
    rows.push(row('Ripple p-p (approx.)', dv, s.ripple, 'V', ok ? 15 : 100, ok ? '' : 'large ripple'));
  }
  rows.push(row('Peak inverse voltage', p.topo === 'bridge' ? Vm : p.topo === 'ct' || p.C > 0 ? 2 * Vm : Vm, s.piv, 'V', 5));
  if (p.zen && s.regulated) {
    const vin = s.vdc, vz = (vin / p.rser + p.vz / p.rz) / (1 / p.rser + 1 / p.rz + 1 / p.R);
    rows.push(row('Zener output', vz, s.vz, 'V', 0.2));
    rows.push(row('Zener current', (vz - p.vz) / p.rz, s.iz, 'A', 0.5));
    if (p.C > 0 && s.ripple > 1e-6) { const par = 1 / (1 / p.rz + 1 / p.R), gain = par / (p.rser + par); rows.push(row('Ripple after Zener', s.ripple * gain, s.vzRipple, 'V', 1)); }
  }
  return { rows, s };
}
