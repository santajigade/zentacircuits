// Logic gate engine: gate functions, truth tables, NAND only networks and a transport delay timing simulator.
// Shared by the browser simulator and the Node build tests.

export const GATES = {
  BUF: { n: [1], f: (x) => x[0], expr: (v) => v[0], sym: 'buf' },
  NOT: { n: [1], f: (x) => 1 - x[0], expr: (v) => `${v[0]}′`, sym: 'buf', bubble: true },
  AND: { n: [2, 3, 4], f: (x) => +x.every(Boolean), expr: (v) => v.join('·'), sym: 'and' },
  NAND: { n: [2, 3, 4], f: (x) => 1 - +x.every(Boolean), expr: (v) => `(${v.join('·')})′`, sym: 'and', bubble: true },
  OR: { n: [2, 3, 4], f: (x) => +x.some(Boolean), expr: (v) => v.join(' + '), sym: 'or' },
  NOR: { n: [2, 3, 4], f: (x) => 1 - +x.some(Boolean), expr: (v) => `(${v.join(' + ')})′`, sym: 'or', bubble: true },
  XOR: { n: [2, 3, 4], f: (x) => x.reduce((a, b) => a ^ b, 0), expr: (v) => v.join(' ⊕ '), sym: 'xor' },
  XNOR: { n: [2, 3, 4], f: (x) => 1 - x.reduce((a, b) => a ^ b, 0), expr: (v) => `(${v.join(' ⊕ ')})′`, sym: 'xor', bubble: true },
};
export const NAMES = ['A', 'B', 'C', 'D'];

// Typical datasheet values (worst case levels, typical delay per gate).
export const FAMILIES = {
  '74HC': { vcc: 5, vih: 3.5, vil: 1.5, voh: 4.4, vol: 0.33, tpd: 8e-9, note: 'CMOS, 2 to 6 V' },
  '74HCT': { vcc: 5, vih: 2.0, vil: 0.8, voh: 4.4, vol: 0.33, tpd: 10e-9, note: 'CMOS with TTL input levels' },
  '74LS': { vcc: 5, vih: 2.0, vil: 0.8, voh: 2.7, vol: 0.5, tpd: 10e-9, note: 'Low power Schottky TTL' },
  '74LVC': { vcc: 3.3, vih: 2.0, vil: 0.8, voh: 2.4, vol: 0.4, tpd: 3e-9, note: 'Low voltage CMOS at 3.3 V' },
  CD4000B: { vcc: 5, vih: 3.5, vil: 1.5, voh: 4.95, vol: 0.05, tpd: 125e-9, note: 'CMOS 4000 series, 3 to 18 V' },
};
export const margins = (f) => ({ nmh: f.voh - f.vih, nml: f.vil - f.vol });

export const evalGate = (type, bits) => GATES[type].f(bits);
export function truthTable(type, n) {
  const rows = [];
  for (let k = 0; k < 1 << n; k++) { const x = Array.from({ length: n }, (_, i) => (k >> (n - 1 - i)) & 1); rows.push({ x, y: evalGate(type, x) }); }
  return rows;
}

// NAND only networks. Each gate: [id, inputA, inputB, column, row]. The last gate is the output.
export const NAND_NETS = {
  NOT: { n: 1, gates: [['g1', 'A', 'A', 0, 0]] },
  AND: { n: 2, gates: [['g1', 'A', 'B', 0, 0], ['g2', 'g1', 'g1', 1, 0]] },
  OR: { n: 2, gates: [['g1', 'A', 'A', 0, -1], ['g2', 'B', 'B', 0, 1], ['g3', 'g1', 'g2', 1, 0]] },
  NOR: { n: 2, gates: [['g1', 'A', 'A', 0, -1], ['g2', 'B', 'B', 0, 1], ['g3', 'g1', 'g2', 1, 0], ['g4', 'g3', 'g3', 2, 0]] },
  XOR: { n: 2, gates: [['g1', 'A', 'B', 0, 0], ['g2', 'A', 'g1', 1, -1], ['g3', 'g1', 'B', 1, 1], ['g4', 'g2', 'g3', 2, 0]] },
  XNOR: { n: 2, gates: [['g1', 'A', 'B', 0, 0], ['g2', 'A', 'g1', 1, -1], ['g3', 'g1', 'B', 1, 1], ['g4', 'g2', 'g3', 2, 0], ['g5', 'g4', 'g4', 3, 0]] },
};
export const MIN_NANDS = { NOT: 1, AND: 2, OR: 3, NOR: 4, XOR: 4, XNOR: 5 };

/** Static evaluation of a network: returns every node value. */
export function evalNet(net, x) {
  const v = {}; NAMES.slice(0, net.n).forEach((k, i) => (v[k] = x[i]));
  for (const [id, a, b] of net.gates) v[id] = 1 - (v[a] & v[b]);
  return v;
}
export function depth(net) {
  const d = { A: 0, B: 0, C: 0, D: 0 };
  for (const [id, a, b] of net.gates) d[id] = 1 + Math.max(d[a], d[b]);
  return d[net.gates[net.gates.length - 1][0]];
}

/**
 * Transport delay timing simulation. Inputs count in binary (A is the most significant bit and toggles slowest).
 * Each state lasts `hold` seconds; inputs after A can be skewed (delayed) by `skew` seconds to model real edges.
 * mode 'gate' simulates one gate of `type` with n inputs; mode 'nand' simulates the network for `type`.
 */
export function timing({ mode = 'gate', type = 'NAND', n = 2, tpd = 10e-9, hold, skew = 0, cycles = 2 }) {
  const net = mode === 'nand' ? NAND_NETS[type] : { n, gates: [['y', ...Array.from({ length: n }, (_, i) => NAMES[i])]] };
  if (mode === 'nand') n = net.n;
  const dep = mode === 'nand' ? depth(net) : 1;
  hold = hold ?? Math.max(4, dep * 2 + 2) * tpd;
  const K = 20, h = tpd / K, states = (1 << n) * cycles, steps = Math.round((states * hold) / h);
  const sig = {}, ins = NAMES.slice(0, n);
  const inAt = (i, t) => { const tt = t - (i > 0 ? skew : 0); if (tt < 0) return 0; const s = Math.floor(tt / hold) % (1 << n); return (s >> (n - 1 - i)) & 1; };
  ins.forEach((k) => (sig[k] = new Uint8Array(steps + 1)));
  net.gates.forEach((g) => (sig[g[0]] = new Uint8Array(steps + 1)));
  // Settle the circuit for the all zero input before t = 0.
  const v0 = mode === 'nand' ? evalNet(net, Array(n).fill(0)) : { y: evalGate(type, Array(n).fill(0)) };
  for (let s = 0; s <= steps; s++) {
    const t = s * h;
    ins.forEach((k, i) => (sig[k][s] = inAt(i, t)));
    for (const g of net.gates) {
      const id = g[0];
      if (s < K) { sig[id][s] = v0[id]; continue; }
      const xs = g.slice(1, mode === 'nand' ? 3 : 1 + n).map((src) => sig[src][s - K]);
      sig[id][s] = mode === 'nand' ? 1 - (xs[0] & xs[1]) : evalGate(type, xs);
    }
  }
  const out = net.gates[net.gates.length - 1][0];
  // Measurements: after every input change, how long until the output reaches its final value, and any glitches.
  let maxDelay = 0, glitches = 0, minDelay = Infinity;
  const target = (s) => { const x = ins.map((k) => sig[k][s]); return mode === 'nand' ? evalNet(net, x)[out] : evalGate(type, x); };
  for (let s = 1; s <= steps; s++) {
    if (!ins.some((k) => sig[k][s] !== sig[k][s - 1])) continue;
    let e = s + 1; while (e <= steps && !ins.some((k) => sig[k][e] !== sig[k][e - 1])) e++;
    const fin = target(s);
    let last = -1, changes = 0;
    for (let j = s; j < e; j++) { if (sig[out][j] !== sig[out][j - 1]) { changes++; last = j; } }
    if (sig[out][e - 1] !== fin) continue; // did not settle inside the window
    if (last >= 0 && sig[out][s - 1] !== fin) { const d = (last - s) * h; maxDelay = Math.max(maxDelay, d); minDelay = Math.min(minDelay, d); }
    // Extra transitions beyond the one needed form glitch pulses (two transitions each).
    glitches += (changes - (sig[out][s - 1] !== fin ? 1 : 0)) / 2;
  }
  return { t: Float64Array.from({ length: steps + 1 }, (_, s) => s * h), sig, ins, out, nodes: net.gates.map((g) => g[0]), depth: dep, hold, maxDelay, minDelay: isFinite(minDelay) ? minDelay : 0, glitches };
}

/** Theory vs simulation checks. */
export function accuracy({ mode = 'gate', type = 'NAND', n = 2, tpd = 10e-9, skew = 0 }) {
  const rows = [];
  const row = (name, th, sim, unit, tol) => { const err = th ? (Math.abs(sim - th) / Math.abs(th)) * 100 : Math.abs(sim - th) * 100; return { name, theory: th, sim, unit, tol, err, pass: err <= tol }; };
  if (mode === 'gate') {
    const tt = truthTable(type, n), r = timing({ mode, type, n, tpd, skew: 0 });
    const h = r.t[1] - r.t[0];
    const ok = tt.filter(({ y }, k) => r.sig[r.out][Math.round(((k + 0.9) * r.hold) / h)] === y).length;
    rows.push(row('Truth table rows correct', tt.length, ok, '', 0));
    rows.push(row('Propagation delay', tpd, r.maxDelay, 's', 0.01));
  } else {
    const net = NAND_NETS[type];
    const tt = truthTable(type, net.n);
    const ok = tt.filter(({ x, y }) => evalNet(net, x)[net.gates[net.gates.length - 1][0]] === y).length;
    rows.push(row(`Matches ${type} truth table`, tt.length, ok, '', 0));
    rows.push(row('NAND gates used', MIN_NANDS[type], net.gates.length, '', 0));
    const r = timing({ mode, type, tpd, skew: 0 });
    rows.push(row('Worst case delay (depth × tpd)', depth(net) * tpd, r.maxDelay, 's', 0.01));
  }
  return { rows };
}
