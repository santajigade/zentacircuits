// Generates logic gate figures (run: node scripts/figs-logic.mjs). Timing figure comes from the simulator engine.
import { writeFileSync } from 'node:fs';
import { GATES, NAND_NETS, timing, truthTable } from '../src/sim/logic.js';
const out = 'public/images/figures/', F = 'font-family="Open Sans, DejaVu Sans, sans-serif"', M = 'font-family="DejaVu Sans Mono, monospace"', K = '#0F172A';
const sym = (s, bubble, x, y, h, stroke = K, fill = '#FFF1F2') => {
  const t = h / 2; let d;
  if (s === 'and') d = `M${x} ${y - t}H${x + 70 - t}A${t} ${t} 0 0 1 ${x + 70 - t} ${y + t}H${x}Z`;
  else if (s === 'buf') d = `M${x} ${y - t}L${x + 70} ${y}L${x} ${y + t}Z`;
  else d = `M${x} ${y - t}Q${x + 45} ${y - t} ${x + 70} ${y}Q${x + 45} ${y + t} ${x} ${y + t}Q${x + 14} ${y} ${x} ${y - t}Z`;
  let o = `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>`;
  if (s === 'xor') o += `<path d="M${x - 10} ${y - t}Q${x + 4} ${y} ${x - 10} ${y + t}" fill="none" stroke="${stroke}" stroke-width="2.5"/>`;
  if (bubble) o += `<circle cx="${x + 75}" cy="${y}" r="5" fill="#fff" stroke="${stroke}" stroke-width="2.5"/>`;
  return o;
};
const T = (x, y, s, c = K, sz = 14, a = 'middle', f = F) => `<text x="${x}" y="${y}" ${f} font-size="${sz}" fill="${c}" text-anchor="${a}">${s}</text>`;
// 1. Symbols and truth tables
{
  const list = ['NOT', 'AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUF'], cw = 190, ch = 250;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cw * 4} ${ch * 2}" width="${cw * 8}" height="${ch * 4}"><rect width="${cw * 4}" height="${ch * 2}" fill="#fff"/>`;
  list.forEach((g, k) => {
    const cx = (k % 4) * cw, cy = Math.floor(k / 4) * ch, G = GATES[g], n = G.n.includes(2) ? 2 : 1, gx = cx + 60, gy = cy + 70;
    s += `<rect x="${cx + 6}" y="${cy + 6}" width="${cw - 12}" height="${ch - 12}" rx="12" fill="#F8FAFC" stroke="#E2E8F0"/>` + T(cx + cw / 2, cy + 30, g, '#BE123C', 16);
    const ins = n === 1 ? [gy] : [gy - 12, gy + 12], ox = gx + 70 + (G.bubble ? 10 : 0);
    ins.forEach((y) => (s += `<path d="M${gx - 30} ${y}H${G.sym === 'or' || G.sym === 'xor' ? gx + 6 : gx}" stroke="${K}" stroke-width="2.5"/>`));
    s += `<path d="M${ox} ${gy}H${ox + 25}" stroke="${K}" stroke-width="2.5"/>` + sym(G.sym, !!G.bubble, gx, gy, 46);
    const tt = truthTable(g, n), ty = cy + 120, cols = [...['A', 'B'].slice(0, n), 'Y'], x0 = cx + cw / 2 - (cols.length * 34) / 2;
    cols.forEach((c, i) => (s += T(x0 + 17 + i * 34, ty, c, '#475569', 13, 'middle', M)));
    s += `<path d="M${x0} ${ty + 6}H${x0 + cols.length * 34}" stroke="#CBD5E1"/>`;
    tt.forEach((r, j) => [...r.x, r.y].forEach((v, i) => (s += T(x0 + 17 + i * 34, ty + 24 + j * 20, v, i === cols.length - 1 ? (v ? '#BE123C' : K) : K, 13, 'middle', M))));
    s += T(cx + cw / 2, cy + ch - 18, `Y = ${G.expr(['A', 'B'].slice(0, n))}`, '#334155', 12, 'middle', M);
  });
  writeFileSync(out + 'logic-gates-symbols-truth-tables.svg', s + '</svg>');
}
// 2. NAND universal constructions
{
  const order = ['NOT', 'AND', 'OR', 'XOR'], bw = 380, bh = 230;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${bw * 2} ${bh * 2}" width="${bw * 4}" height="${bh * 4}"><rect width="${bw * 2}" height="${bh * 2}" fill="#fff"/>`;
  order.forEach((g, k) => {
    const ox = (k % 2) * bw, oy = Math.floor(k / 2) * bh, net = NAND_NETS[g], pos = {};
    s += `<rect x="${ox + 6}" y="${oy + 6}" width="${bw - 12}" height="${bh - 12}" rx="12" fill="#F8FAFC" stroke="#E2E8F0"/>` + T(ox + 20, oy + 30, `${g} from ${net.gates.length} NAND`, '#BE123C', 15, 'start');
    const ins = ['A', 'B'].slice(0, net.n);
    ins.forEach((v, i) => (pos[v] = [ox + 40, oy + (net.n === 1 ? 125 : 85 + i * 90)]));
    const colX = (c) => ox + 95 + c * 78, rowY = (r) => oy + 130 + r * 50;
    net.gates.forEach(([id, , , c, r]) => (pos[id] = [colX(c) + 60, rowY(r)]));
    net.gates.forEach(([id, a, b, c, r]) => {
      const gx = colX(c), gy = rowY(r);
      [[a, gy - 11], [b, gy + 11]].forEach(([src, yy], j) => {
        const [sx, sy] = pos[src], mx = gx - 16 - (j ? 0 : 7) - (src.length === 1 ? 5 * ins.indexOf(src) : 0);
        s += `<path d="M${sx + (src.length === 1 ? 10 : 10)} ${sy}H${mx}V${yy}H${gx}" fill="none" stroke="${K}" stroke-width="2"/><circle cx="${mx}" cy="${sy}" r="2.5" fill="${K}"/>`;
      });
    });
    net.gates.forEach(([, , , c, r]) => (s += sym('and', true, colX(c), rowY(r), 40)));
    const last = pos[net.gates[net.gates.length - 1][0]];
    s += `<path d="M${last[0] + 10} ${last[1]}H${ox + bw - 36}" stroke="${K}" stroke-width="2"/>` + T(ox + bw - 22, last[1] + 5, 'Y', '#BE123C', 15);
    ins.forEach((v) => (s += T(pos[v][0] - 10, pos[v][1] + 5, v, K, 15)));
  });
  writeFileSync(out + 'nand-gate-universal-gate.svg', s + '</svg>');
}
// 3. CMOS NAND transistor circuit
{
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 430" width="1120" height="860"><rect width="560" height="430" fill="#fff"/>`;
  const L = (d, w = 2.5) => `<path d="${d}" fill="none" stroke="${K}" stroke-width="${w}"/>`;
  // MOSFET with channel at x, gate on side g (-1 left, 1 right).
  const fet = (x, y, p, lab, g = -1) => L(`M${x} ${y - 28}V${y - 14}H${x + g * 20}V${y + 14}H${x}V${y + 28}`) + L(`M${x + g * 26} ${y - 16}V${y + 16}`, 3)
    + (p ? `<circle cx="${x + g * 33}" cy="${y}" r="6" fill="#fff" stroke="${K}" stroke-width="2.5"/>` + L(`M${x + g * 39} ${y}H${x + g * 70}`) : L(`M${x + g * 26} ${y}H${x + g * 70}`))
    + T(x - g * 12, y + 5, lab, '#475569', 13, g < 0 ? 'start' : 'end');
  s += L('M170 40H350') + T(260, 30, 'VDD', '#BE123C', 14);
  s += L('M190 40V62M330 40V62') + fet(190, 90, true, 'P1', -1) + fet(330, 90, true, 'P2', 1) + L('M190 118V150H330V118M260 150V202');
  s += `<circle cx="260" cy="150" r="4" fill="${K}"/>` + L('M260 150H420') + T(436, 155, 'Y', '#BE123C', 16, 'start');
  s += fet(260, 230, false, 'N1', -1) + L('M260 258V292') + fet(260, 320, false, 'N2', 1) + L('M260 348V372M226 372H294M238 382H282M250 392H270');
  s += L('M60 90H120M120 90V230H190') + `<circle cx="120" cy="90" r="3.5" fill="${K}"/>` + T(50, 95, 'A', K, 16, 'end');
  s += L('M400 90H470M470 90V320H330M470 90H500') + `<circle cx="470" cy="90" r="3.5" fill="${K}"/>` + T(510, 95, 'B', K, 16, 'start');
  s += T(280, 418, 'PMOS in parallel pull Y high if A or B is 0. NMOS in series pull Y low only when both are 1.', '#475569', 11);
  writeFileSync(out + 'cmos-nand-gate-circuit.svg', s + '</svg>');
}
// 4. 7400 pinout
{
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 360" width="1120" height="720"><rect width="560" height="360" fill="#fff"/>`;
  s += `<rect x="150" y="40" width="260" height="280" rx="10" fill="#1E293B"/><path d="M265 40a15 15 0 0 0 30 0" fill="#fff"/>` + T(280, 190, '7400', '#fff', 22) + T(280, 214, 'quad 2 input NAND', '#CBD5E1', 12);
  const lp = ['1A', '1B', '1Y', '2A', '2B', '2Y', 'GND'], rp = ['VCC', '4B', '4A', '4Y', '3B', '3A', '3Y'];
  lp.forEach((n, i) => { const y = 70 + i * 38; s += `<rect x="128" y="${y - 7}" width="22" height="14" fill="#94A3B8"/>` + T(120, y + 5, n, n === 'GND' ? '#2563EB' : K, 14, 'end') + T(168, y + 5, i + 1, '#94A3B8', 12, 'middle', M); });
  rp.forEach((n, i) => { const y = 70 + i * 38; s += `<rect x="410" y="${y - 7}" width="22" height="14" fill="#94A3B8"/>` + T(440, y + 5, n, n === 'VCC' ? '#BE123C' : K, 14, 'start') + T(392, y + 5, 14 - i, '#94A3B8', 12, 'middle', M); });
  s += T(280, 345, 'Same pinout for 74HC00, 74HCT00, 74LS00 and 74LVC00 in DIP and SOIC packages', '#475569', 12);
  writeFileSync(out + '7400-nand-gate-ic-pinout.svg', s + '</svg>');
}
// 5. Timing diagrams from the engine
function timingSvg(r, title, file, rows, labels) {
  const W = 720, rh = 46, H = 70 + rows.length * rh + 30, L = 70, R = 700, n = r.t.length, Tt = r.t[n - 1];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}"><rect width="${W}" height="${H}" fill="#0E1828"/>` + T(W / 2, 28, title, '#fff', 15);
  const states = Math.round(Tt / r.hold);
  s += `<g stroke="#1E293B">${Array.from({ length: states + 1 }, (_, k) => `<path d="M${L + (k * r.hold / Tt) * (R - L)} 50V${50 + rows.length * rh}"/>`).join('')}</g>`;
  rows.forEach((k, ri) => {
    const y0 = 50 + ri * rh, yh = y0 + 10, yl = y0 + rh - 10, d = r.sig[k], col = k === r.out ? '#FBBF24' : ri < r.ins.length ? '#A78BFA' : '#22D3EE';
    let p = `M${L} ${d[0] ? yh : yl}`, prev = d[0];
    for (let i = 1; i < n; i++) if (d[i] !== prev) { const x = (L + (i / (n - 1)) * (R - L)).toFixed(1); p += `H${x}V${d[i] ? yh : yl}`; prev = d[i]; }
    s += `<path d="${p}H${R}" fill="none" stroke="${col}" stroke-width="2.4"/>` + T(14, (yh + yl) / 2 + 5, labels[ri], col, 13, 'start', M);
  });
  s += T(W / 2, H - 12, `each grid step = ${(r.hold * 1e9).toFixed(0)} ns`, '#94A3B8', 11, 'middle', M);
  writeFileSync(out + file, s + '</svg>');
}
const t1 = timing({ mode: 'gate', type: 'NAND', n: 2, tpd: 8e-9, hold: 32e-9 });
timingSvg(t1, '2 input NAND (74HC00, tpd 8 ns): output changes one delay after the inputs', 'nand-gate-timing-diagram.svg', [...t1.ins, t1.out], ['A', 'B', 'Y']);
const t2 = timing({ mode: 'nand', type: 'XOR', tpd: 8e-9, skew: 8e-9, hold: 48e-9 });
timingSvg(t2, 'XOR from four NAND gates, B arriving 8 ns late: glitches on Y', 'nand-xor-glitch-timing.svg', [...t2.ins, ...t2.nodes], ['A', 'B', 'g1', 'g2', 'g3', 'Y']);
console.log('ok', t2.glitches);
// XOR figures
{
  // Symbol with 2 and 3 input truth tables
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 330" width="1440" height="660"><rect width="720" height="330" fill="#fff"/>`;
  const gx = 80, gy = 110;
  s += `<path d="M${gx - 40} ${gy - 16}H${gx + 6}M${gx - 40} ${gy + 16}H${gx + 6}M${gx + 70} ${gy}H${gx + 110}" stroke="${K}" stroke-width="2.5"/>` + sym('xor', false, gx, gy, 64);
  s += T(gx - 50, gy - 11, 'A', K, 15, 'end') + T(gx - 50, gy + 21, 'B', K, 15, 'end') + T(gx + 118, gy + 5, 'Y', '#BE123C', 15, 'start') + T(gx + 35, gy + 70, 'Y = A ⊕ B', '#334155', 15, 'middle', M);
  s += T(gx + 35, gy + 100, 'Output is 1 when the', '#475569', 12) .replace('text-anchor="middle"', 'text-anchor="middle"') + T(gx + 35, gy + 118, 'inputs are different', '#475569', 12);
  const table = (x0, y0, n) => {
    const tt = truthTable('XOR', n), cols = [...['A', 'B', 'C'].slice(0, n), 'Y']; let o = '';
    cols.forEach((c, i) => (o += T(x0 + 20 + i * 40, y0, c, '#475569', 13, 'middle', M)));
    o += `<path d="M${x0} ${y0 + 7}H${x0 + cols.length * 40}" stroke="#CBD5E1"/>`;
    tt.forEach((r, j) => [...r.x, r.y].forEach((v, i) => (o += T(x0 + 20 + i * 40, y0 + 26 + j * 20, v, i === cols.length - 1 && v ? '#BE123C' : K, 13, 'middle', M))));
    return o;
  };
  s += T(360, 40, '2 input', '#BE123C', 14, 'middle') + table(300, 64, 2) + T(560, 40, '3 input (odd parity)', '#BE123C', 14, 'middle') + table(480, 64, 3);
  writeFileSync(out + 'xor-gate-symbol-truth-table.svg', s + '</svg>');
  // Half adder
  let h = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 280" width="1120" height="560"><rect width="560" height="280" fill="#fff"/>`;
  const W2 = (d) => `<path d="${d}" fill="none" stroke="${K}" stroke-width="2.2"/>`;
  h += W2('M60 80H190M60 200H190') + W2('M120 80V188H246M150 200V92H246');
  h += W2('M220 80H252M220 200H246') ;
  h = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 280" width="1120" height="560"><rect width="560" height="280" fill="#fff"/>`;
  h += W2('M60 90H256M60 190H246M120 90V206H246M160 190V106H256') + `<circle cx="120" cy="90" r="3.5" fill="${K}"/><circle cx="160" cy="190" r="3.5" fill="${K}"/>`;
  h += W2('M250 74H256') + sym('xor', false, 250, 98, 50) + sym('and', false, 246, 198, 50) + W2('M320 98H430M316 198H430');
  h = h.replace('M60 90H256', 'M60 90H120M120 90H256'); // keep wires tidy
  h += T(48, 95, 'A', K, 16, 'end') + T(48, 195, 'B', K, 16, 'end') + T(440, 103, 'Sum S = A ⊕ B', '#BE123C', 14, 'start') + T(440, 203, 'Carry C = A · B', '#BE123C', 14, 'start');
  h += T(280, 262, 'Half adder: one XOR gate makes the sum bit, one AND gate makes the carry.', '#475569', 12);
  writeFileSync(out + 'xor-gate-half-adder.svg', h + '</svg>');
  // Timing from the engine
  const tx = timing({ mode: 'gate', type: 'XOR', n: 2, tpd: 8e-9, hold: 32e-9 });
  timingSvg(tx, '2 input XOR (74HC86, tpd about 8 ns): Y is 1 when A and B differ', 'xor-gate-timing-diagram.svg', [...tx.ins, tx.out], ['A', 'B', 'Y']);
}
