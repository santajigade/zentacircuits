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
let fail = 0;
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
