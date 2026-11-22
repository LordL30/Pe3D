// Verifica se alguma estrutura interna atravessa a pele: imprime as estruturas cujo ponto mais
// externo fica a menos de 1,2 mm da superfície (valor > 0 = fora da pele). Uso: node tools/check-skin.mjs
import { skinShape } from '../src/anatomy/soft.js';
import { tendons, muscles, ligaments, fascia, vessels, nerves } from '../src/anatomy/tubes.js';
import { sdfStructures } from '../src/anatomy/sdfIndex.js';
import { meshSDF } from '../src/sdf.js';
const f = skinShape.f;
const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const dot = (a, b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const arr = (v, n) => Array.isArray(v) ? v : Array(n).fill(v);
const res = [];
for (const d of [...tendons, ...muscles, ...ligaments, ...fascia, ...vessels, ...nerves]) {
  const P = d.points, n = P.length;
  const R = arr(d.r, n), T = arr(d.t ?? d.r, n);
  let worst = -99, where = null;
  for (let i = 0; i < n - 1; i++) {
    for (let s = 0; s <= 6; s++) {
      const u = s / 6;
      const c = [0,1,2].map((k) => P[i][k] + (P[i+1][k] - P[i][k]) * u);
      if (c[1] > 199) continue;
      const tg = norm([0,1,2].map((k) => P[i+1][k] - P[i][k]));
      let up = d.up ? (Array.isArray(d.up[0]) ? d.up[i] : d.up) : (Math.abs(tg[1]) < 0.9 ? [0,1,0] : [1,0,0]);
      let nn = up.map((x, k) => x - dot(up, tg) * tg[k]); nn = norm(nn);
      const b = norm(cross(tg, nn));
      const w = R[i] + (R[i+1]-R[i])*u, t = T[i] + (T[i+1]-T[i])*u;
      for (let a = 0; a < 16; a++) {
        const th = a / 16 * Math.PI * 2;
        const p = [0,1,2].map((k) => c[k] + b[k]*w*Math.cos(th) + nn[k]*t*Math.sin(th));
        if (p[1] > 199) continue;
        const v = f(...p);
        if (v > worst) { worst = v; where = p.map((x) => x.toFixed(0)); }
      }
    }
  }
  if (worst > -1.2) res.push([d.id, worst.toFixed(2), where.join(',')]);
}
for (const d of sdfStructures) {
  if (['skin', 'nails', 'calcaneus-normal'].includes(d.id)) continue;
  const m = meshSDF(d.shape, { step: Math.max(d.step, 1.2) });
  let worst = -99, where = null;
  for (let i = 0; i < m.positions.length; i += 3 * 7) {
    const p = [m.positions[i], m.positions[i+1], m.positions[i+2]];
    if (p[1] > 199) continue;
    const v = f(...p);
    if (v > worst) { worst = v; where = p.map((x) => x.toFixed(0)); }
  }
  if (worst > -1.2) res.push([d.id, worst.toFixed(2), where.join(',')]);
}
res.sort((a, b) => b[1] - a[1]);
for (const r of res) console.log(r.join('\t'));
