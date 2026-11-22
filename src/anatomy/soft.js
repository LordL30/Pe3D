// Partes moles modeladas por SDF: pele, unhas, coxins de gordura, gordura de Kager e bursas.
import {
  sphere as S, ellipsoid as E, cone as C, union as U, subtract as D,
  intersect as X, offset as O, plane as P, basis, euler,
} from '../sdf.js';
import { CUT_Y, boneShapes, landmarks } from './bones.js';
import { tendons, muscles, vessels, nerves, fascia, ligaments } from './tubes.js';

const ground = P([0, 0, 0], [0, -1, 0]);   // dentro: y > 0
const topCut = P([0, CUT_Y, 0], [0, 1, 0]); // dentro: y < CUT_Y

const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// ---------------- pele ----------------
// Dedos: cápsulas que seguem as falanges, com polpa digital.
const toeRadius = [
  [11.5, 10.5, 9.5],
  [8.4, 7.4, 6.6],
  [8.0, 7.0, 6.2],
  [7.6, 6.6, 5.8],
  [7.4, 6.3, 5.5],
];
const toeParts = landmarks.toeDefs.map((toe, t) => {
  const segs = toe.filter(Boolean);
  const pts = [segs[0].a, ...segs.map((s) => s.b)];
  const r = toeRadius[t];
  const parts = [];
  // começa um pouco antes da base para unir à região metatarsal
  const a0 = [pts[0][0] - 8, pts[0][1] + 1, pts[0][2]];
  parts.push(C(a0, pts[0], r[0], r[0]));
  for (let i = 0; i < pts.length - 1; i++) {
    const ra = r[Math.min(i, 2)], rb = r[Math.min(i + 1, 2)];
    parts.push(C(pts[i], pts[i + 1], ra, rb));
  }
  // polpa: projeta-se além da falange distal, mais abaixo
  const tip = pts[pts.length - 1];
  const rr = r[2];
  parts.push(E([tip[0] - rr * 0.35, tip[1] - rr * 0.1, tip[2]], [rr * 1.0, rr * 0.95, rr * 1.12]));
  return U(2.5, ...parts);
});
const toes = U(1.2, ...toeParts);

// Saliências ósseas subcutâneas: a pele acompanha os ossos a ~3 mm (maléolos, face medial da tíbia,
// calcâneo com a proeminência de Haglund, tuberosidade do navicular, base do 5º metatarso...).
const B = boneShapes;
const boneHull = U(5,
  O(B.tibiaRaw, 3.2), O(B.fibulaRaw, 3.0), O(B.calcRaw, 3.4), O(B.talusRaw, 4.5),
  O(B.navRaw, 3.6), O(B.cuboidRaw, 4.0), O(B.mtRaw[0], 3.4), O(B.mtRaw[4], 3.2),
);

// Envoltórios das estruturas superficiais: garantem que tendões, veias e nervos fiquem sob a pele
// (e criam o leve relevo que se vê, por exemplo, dos tendões no dorso do pé).
const HULL = {
  'v-saph-great': 1.3, 'v-saph-small': 1.3, 'n-sural': 1.8, 'n-saphenous': 1.8, 'n-fib-sup': 1.8,
  'n-fib-sup-b1': 1.6, 'n-fib-sup-b2': 1.6, 'n-fib-sup-b3': 1.6, 'n-fib-sup-b4': 1.6,
  'tib-ant-t': 2.6, 'ehl-t': 2.5, 'edl-t': 2.6, 'edl-t2': 2.4, 'edl-t3': 2.4, 'edl-t4': 2.4, 'edl-t5': 2.4,
  'per-tert-t': 2.5, 'per-long-t': 3.0, 'per-brev-t': 3.0, 'tib-post-t': 3.0, 'fdl-t': 3.0, 'achilles': 2.6,
  'tib-ant-m': 3.0, 'ehl-m': 3.0, 'edl-m': 3.0, 'per-tert-m': 3.0, 'per-brev-m': 3.0, 'per-long-m': 3.0,
  'ret-ext-sup': 3.2, 'ret-ext-inf': 3.0, 'ret-ext-inf-2': 3.0, 'ret-flex': 3.0, 'ret-per-sup': 3.0,
  'deltoid-tn': 2.6, 'deltoid-ts': 2.4, 'deltoid-tc': 2.4, 'atfl': 2.2,
  'fhl-t': 2.0, 'fdl-t2': 1.9, 'fdl-t3': 1.9, 'fdl-t4': 1.9, 'fdl-t5': 1.9,
  'fdb-t2': 1.9, 'fdb-t3': 1.9, 'fdb-t4': 1.9, 'fdb-t5': 1.9, 'n-dig-med1': 1.6, 'n-dig-lat1': 1.6,
  'abd-hal': 3.0, 'abd-dig-min': 3.0, 'a-tib-post': 3.0, 'n-tibial': 3.0, 'v-tib-post-2': 3.0, 'edb-m': 2.6,
};
function tubeHull(def, margin) {
  const pts = def.points;
  const rw = Array.isArray(def.r) ? def.r : pts.map(() => def.r);
  const tt = def.t === undefined ? rw : Array.isArray(def.t) ? def.t : pts.map(() => def.t);
  const parts = [];
  for (let i = 0; i < pts.length - 1; i++) {
    // estruturas achatadas: usa a espessura (não a largura) para não inflar a pele
    const ra = Math.min(rw[i], tt[i] * 1.6) + margin, rb = Math.min(rw[i + 1], tt[i + 1] * 1.6) + margin;
    parts.push(C(pts[i], pts[i + 1], ra, rb));
  }
  return U(1, ...parts);
}
const hulls = [...tendons, ...muscles, ...vessels, ...nerves, ...fascia, ...ligaments]
  .filter((d) => HULL[d.id] !== undefined)
  .map((d) => tubeHull(d, HULL[d.id]));

const leg = U(18,
  // perna (terço distal): colunas tibial, fibular e posterior + preenchimento
  C([73, 205, -5], [71, 100, -6], 16, 17),
  C([56, 205, 26], [52, 100, 27], 15, 11),
  C([31, 205, 5], [14, 112, 2], 22, 12),
  C([50, 205, 6], [52, 110, 3], 30, 24),
  C([46, 205, 5], [44, 112, 2], 36, 27),
  C([84, 150, 2], [90, 94, -3], 8, 8),               // tendões anteriores no tornozelo
);
const body = U(12,
  leg,
  C([14, 120, 1.5], [6.5, 42, 1.5], 10, 10.5),       // relevo do tendão do calcâneo
  C([44, 112, -17], [40, 62, -21], 12, 12),          // goteira retromaleolar medial
  C([41, 112, 21], [36, 62, 25], 11, 11),            // goteira retromaleolar lateral
  E([56, 80, 2], [37, 24, 29]),                      // tornozelo
  E([90, 84, 0], [15, 12, 22]),                      // face anterior do tornozelo (tendões e retináculo)
  E([34, 32, 1], [34, 32, 31]),                      // calcanhar
  E([44, 12, 0], [30, 14, 26]),                      // coxim plantar do calcanhar
  E([100, 48, -3], [46, 32, 33]),                    // mediopé dorsal
  E([92, 42, 20], [34, 18, 17]),                     // dorso lateral (ventre do extensor curto)
  E([110, 17, 9], [52, 13, 29]),                     // mediopé plantar
  C([48, 15, 21], [182, 12, 37], 13, 11),            // borda lateral (apoio)
  C([64, 36, -26], [140, 30, -33], 13, 12.5),        // borda medial (arco longitudinal)
  E([162, 30, -2], [44, 21, 42]),                    // antepé
  C([140, 30, -33], [196, 23, -37], 12.5, 13.5),     // borda medial do antepé
  C([196, 16, -35], [186, 13, 35], 15, 11),          // região das cabeças metatarsais
  E([5, 47, 13], [6.5, 10, 9]),                      // saliência póstero-lateral (Haglund + bursa)
);

export const skinShape = X(0.6, X(3, U(6, body, boneHull, toes, U(4, ...hulls)), ground), topCut);

// Calosidade (hiperqueratose) póstero-lateral observada nas fotos + leve eritema ao redor
const callusC = [2, 42, 16];
export function skinWeight(x, y, z) {
  const dx = (x - callusC[0]) / 1.0, dy = (y - callusC[1]) / 1.35, dz = (z - callusC[2]) / 1.0;
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return smooth(clamp01((15 - d) / 9));
}

// ---------------- unhas ----------------
const nailDefs = [
  { c: [249, 23.6, -33], r: [8.2, 1.3, 7.4], dir: [1, -0.22, 0] },
  { c: [253.5, 16.2, -13.5], r: [4.8, 1.0, 4.6], dir: [1, -0.55, 0] },
  { c: [245, 15.0, 2.7], r: [4.4, 0.95, 4.3], dir: [1, -0.6, 0] },
  { c: [233.5, 13.8, 19.2], r: [4.0, 0.9, 3.9], dir: [1, -0.62, 0] },
  { c: [216, 12.0, 36.8], r: [3.5, 0.85, 3.4], dir: [1, -0.55, 0] },
];
export const nailShape = U(0, ...nailDefs.map((n) => E(n.c, n.r, basis(n.dir, [0, 1, 0]))));

// ---------------- coxins de gordura ----------------
const calc = boneShapes.calcaneus;
const talus = boneShapes.talusRaw;

// Gordura de Kager (pré-aquileana): triângulo entre o Aquiles, o FHL e o calcâneo
export const kagerShape = X(1.5, D(2.5,
  U(7,
    E([27.5, 86, 2], [11.5, 30, 8.5]),
    E([27.5, 63, 2], [11.5, 10, 8.5]),
    E([34, 58, 2], [10, 5, 10]),
  ),
  O(calc, 0.6), O(talus, 0.8),
  C([4, 130, 1], [5, 30, 1], 6), // espaço do tendão do calcâneo
), topCut);

// Coxim adiposo do calcanhar (septado, absorve impacto)
export const heelPadShape = X(2, D(2.5,
  U(6, E([40, 12, 0], [30, 13.5, 25]), E([24, 20, 0], [17, 13, 22])),
  O(calc, 0.6),
), P([0, 1.2, 0], [0, -1, 0]));

// ---------------- bursas ----------------
// Bursa retrocalcânea: entre a face anterior do Aquiles e o ângulo póstero-superior do calcâneo
export const bursaRetroShape = D(1, E([12.2, 53, 4], [2.6, 8.5, 9.5], euler([0, 0, -22])), O(calc, 0.2));
// Bursa subcutânea do calcâneo (retroaquileana / "pump bump"): entre a pele e o tendão, póstero-lateral
export const bursaSubcutShape = E([2.6, 47, 11.5], [1.9, 8, 6.5], euler([0, -25, 0]));
