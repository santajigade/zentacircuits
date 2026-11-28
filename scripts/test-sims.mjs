// Numeric tests: every simulator must match textbook equations before the site builds.
import { accuracy, DEFAULTS } from '../src/sim/buck.js';
const cases = [
  { name: 'Worked example 24 V to 12 V, 47 µH, 100 µF, 6 Ω', p: { ...DEFAULTS } },
  { name: '12 V to 3.3 V, 10 µH, 47 µF, 1.65 Ω, 500 kHz', p: { ...DEFAULTS, vin: 12, d: 0.275, fs: 500e3, L: 10e-6, C: 47e-6, R: 1.65 } },
  { name: '48 V, D 0.25, 100 µH, 220 µF, 4 Ω, 50 kHz', p: { ...DEFAULTS, vin: 48, d: 0.25, fs: 50e3, L: 100e-6, C: 220e-6, R: 4 } },
  { name: 'DCM: 24 V, D 0.3, 10 µH, 100 µF, 50 Ω', p: { ...DEFAULTS, d: 0.3, L: 10e-6, R: 50 } },
  { name: 'Boost 12 V to 24 V, 47 µH, 100 µF, 24 Ω, 100 kHz', p: { ...DEFAULTS, topo: 'boost', vin: 12, d: 0.5, R: 24 } },
  { name: 'Boost 5 V to 12 V, 22 µH, 220 µF, 12 Ω, 300 kHz', p: { ...DEFAULTS, topo: 'boost', vin: 5, d: 7 / 12, L: 22e-6, C: 220e-6, R: 12, fs: 300e3 } },
  { name: 'Boost DCM: 12 V, D 0.4, 4.7 µH, 100 µF, 200 Ω', p: { ...DEFAULTS, topo: 'boost', vin: 12, d: 0.4, L: 4.7e-6, R: 200 } },
];
import * as rect from '../src/sim/rectifier.js';
const R0 = rect.DEFAULTS;
const rcases = [
  { name: 'Half wave, resistive load', p: { ...R0, topo: 'half', C: 0 } },
  { name: 'Centre tap, resistive load', p: { ...R0, topo: 'ct', C: 0 } },
  { name: 'Bridge, resistive load', p: { ...R0, topo: 'bridge', C: 0 } },
  { name: 'Half wave, 4700 µF, 1 kΩ', p: { ...R0, topo: 'half', C: 4700e-6, R: 1000 } },
  { name: 'Centre tap, 2200 µF, 200 Ω', p: { ...R0, topo: 'ct', C: 2200e-6, R: 200 } },
  { name: 'Bridge, 1000 µF, 100 Ω', p: { ...R0, topo: 'bridge', C: 1000e-6, R: 100 } },
  { name: 'Bridge with 9.1 V Zener regulator', p: { ...R0, C: 470e-6, zen: true, rser: 100, R: 220 } },
];
let fail = 0;
for (const c of rcases) {
  for (const r of rect.accuracy(c.p).rows) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${c.name}  ${r.name}: theory ${r.theory.toPrecision(5)} ${r.unit}, sim ${r.sim.toPrecision(5)} ${r.unit}, error ${r.err.toFixed(3)}% (limit ${r.tol}%)`);
    if (!r.pass) fail++;
  }
}
import * as rlc from '../src/sim/rlc.js';
const L0 = rlc.DEFAULTS;
const lcases = [
  { name: 'RC 1 kΩ, 1 µF', p: { ...L0, circ: 'rc', R: 1000, C: 1e-6 } },
  { name: 'RC low pass, 1 kHz sine', p: { ...L0, circ: 'rc', R: 1000, C: 1e-6, src: 'sine' } },
  { name: 'RL 100 Ω, 10 mH', p: { ...L0, circ: 'rl', R: 100, L: 10e-3 } },
  { name: 'RL high pass, sine, inductor voltage', p: { ...L0, circ: 'rl', R: 1000, L: 1e-3, src: 'sine', fsrc: 100000, out: 'vL' } },
  { name: 'RLC Q = 10', p: { ...L0, R: 10 } },
  { name: 'RLC Q = 1', p: { ...L0, R: 100 } },
  { name: 'RLC critically damped', p: { ...L0, R: 200 } },
  { name: 'RLC overdamped', p: { ...L0, R: 500 } },
  { name: 'RLC at resonance, sine, current', p: { ...L0, R: 10, src: 'sine', fsrc: 1591.549, out: 'i' } },
  { name: 'RLC, sine, inductor voltage', p: { ...L0, R: 50, src: 'sine', fsrc: 2000, out: 'vL' } },
];
for (const c of lcases) {
  for (const r of rlc.accuracy(c.p).rows) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${c.name}  ${r.name}: theory ${r.theory.toPrecision(6)} ${r.unit}, sim ${r.sim.toPrecision(6)} ${r.unit}, error ${r.err.toFixed(4)}% (limit ${r.tol}%)`);
    if (!r.pass) fail++;
  }
}
import * as logic from '../src/sim/logic.js';
for (const g of Object.keys(logic.GATES)) for (const n of logic.GATES[g].n) for (const fam of ['74HC', 'CD4000B']) {
  for (const r of logic.accuracy({ type: g, n, tpd: logic.FAMILIES[fam].tpd }).rows) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${g} ${n} input, ${fam}  ${r.name}: theory ${r.theory}, sim ${r.sim}`);
    if (!r.pass) fail++;
  }
}
for (const g of Object.keys(logic.NAND_NETS)) for (const r of logic.accuracy({ mode: 'nand', type: g, tpd: 8e-9 }).rows) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${g} from NAND  ${r.name}: theory ${r.theory}, sim ${r.sim}`);
  if (!r.pass) fail++;
}
for (const topo of ['half', 'ct', 'bridge']) {
  const p = { ...R0, topo, C: 0 }, s = rect.steadyState(p), e = rect.exactNoCap(p);
  const err = (Math.abs(s.vdc - e.vdc) / e.vdc) * 100, ok = err < 0.1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  Real diodes ${topo}: exact V dc ${e.vdc.toFixed(4)} V, sim ${s.vdc.toFixed(4)} V, error ${err.toFixed(4)}%`);
  if (!ok) fail++;
}
for (const c of cases) {
  const { rows, ccm } = accuracy(c.p);
  for (const r of rows) {
    const line = `${r.pass ? 'PASS' : 'FAIL'}  ${c.name} [${ccm ? 'CCM' : 'DCM'}]  ${r.name}: theory ${r.theory.toPrecision(5)} ${r.unit}, sim ${r.sim.toPrecision(5)} ${r.unit}, error ${r.err.toFixed(3)}% (limit ${r.tol}%)`;
    console.log(line);
    if (!r.pass) fail++;
  }
}
if (fail) { console.error(`\nSimulator tests failed: ${fail}`); process.exit(1); }
console.log('\nSimulator tests: all passed.');
