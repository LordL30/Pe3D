// Partes moles modeladas por SDF: pele, unhas, coxins de gordura, gordura de Kager e bursas.
import {
  sphere as S, ellipsoid as E, cone as C, union as U, subtract as D,
  intersect as X, offset as O, plane as P, basis, euler, flatCone, loftX, loftY,
} from '../sdf.js';
import { CUT_Y, boneShapes, landmarks } from './bones.js';
import { tendons, muscles, vessels } from './tubes.js';

const ground = P([0, 0, 0], [0, -1, 0]);   // dentro: y > 0
const topCut = P([0, CUT_Y, 0], [0, 1, 0]); // dentro: y < CUT_Y

const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// ---------------- pele ----------------
// Envelope modelado com "lofts" (seções que variam ao longo do eixo) a partir das fotos:
// perna de seção oval que afina acima do tornozelo, pé com dorso inclinado para lateral e arco
// medial elevado, calcanhar arredondado, dedos com polpa, articulações e unhas.

const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Perna (terço distal): x = anteroposterior, z = mediolateral
const legLoft = loftY([
  { y: 52, cx: 53, cz: 2, rx: 38, rz: 28 },
  { y: 75, cx: 52, cz: 2, rx: 39, rz: 29 },
  { y: 100, cx: 50.5, cz: 2, rx: 39.5, rz: 30 },
  { y: 125, cx: 49.5, cz: 2.5, rx: 40, rz: 31.5 },
  { y: 160, cx: 50, cz: 3, rx: 39.5, rz: 35 },
  { y: 206, cx: 49, cz: 4, rx: 42, rz: 39 },
]);

// Pé: do calcanhar à região das cabeças metatarsais
const footLoft = loftX([
  { x: 33, yc: 35, zc: 1, h: 30, w: 21, s: -0.03, nt: 2, nb: 2.4 },
  { x: 48, yc: 38.5, zc: 1, h: 38.5, w: 30, s: -0.06, nt: 2, nb: 2.6 },
  { x: 66, yc: 41, zc: 0.5, h: 41, w: 33, s: -0.15, nt: 2.1, nb: 3 },
  { x: 96, yc: 43, zc: 1.5, h: 41, w: 37.5, s: -0.22, nt: 2.2, nb: 3 },
  { x: 125, yc: 36, zc: 2, h: 34, w: 40, s: -0.28, nt: 2.3, nb: 3 },
  { x: 155, yc: 29, zc: 0, h: 27, w: 43, s: -0.2, nt: 2.4, nb: 3 },
  { x: 180, yc: 23, zc: -1.5, h: 22, w: 46.5, s: -0.07, nt: 2.4, nb: 2.8 },
  { x: 198, yc: 20.5, zc: -2, h: 19, w: 47.5, s: 0, nt: 2.3, nb: 2.6 },
  { x: 210, yc: 20.5, zc: -3, h: 15, w: 44, s: 0.04, nt: 2.2, nb: 2.3 },
  { x: 218, yc: 21, zc: -3, h: 10, w: 38, s: 0.04, nt: 2, nb: 2 },
]);

// Dedos: falanges como cápsulas levemente achatadas, polpa digital e saliência das articulações
const toeRadius = [
  [11.2, 10.4, 9.6],
  [8.2, 7.3, 6.6],
  [7.8, 6.9, 6.2],
  [7.4, 6.5, 5.8],
  [7.1, 6.2, 5.5],
];
const toeFlat = [0.84, 0.88, 0.88, 0.88, 0.88];
const nailRegions = [];
const toeParts = landmarks.toeDefs.map((toe, t) => {
  const segs = toe.filter(Boolean);
  const pts = [segs[0].a, ...segs.map((sg) => sg.b)];
  const r = toeRadius[t], fl = toeFlat[t];
  const parts = [];
  const a0 = [pts[0][0] - 10, pts[0][1] + 0.5, pts[0][2]];
  parts.push(flatCone(a0, pts[0], r[0] * 1.02, r[0], fl, [0, 1, 0]));
  for (let i = 0; i < pts.length - 1; i++) {
    const ra = r[Math.min(i, 2)], rb = r[Math.min(i + 1, 2)];
    parts.push(flatCone(pts[i], pts[i + 1], ra, rb, fl, [0, 1, 0]));
    // coxim plantar (polpa sob as falanges)
    const da = ra * 0.42, db = rb * 0.42;
    parts.push(flatCone([pts[i][0], pts[i][1] - da, pts[i][2]], [pts[i + 1][0], pts[i + 1][1] - db, pts[i + 1][2]], ra * 0.82, rb * 0.82, 0.8, [0, 1, 0]));
  }
  // saliência dorsal das articulações interfalângicas
  for (let i = 1; i < pts.length - 1; i++) {
    const rr = r[Math.min(i, 2)];
    parts.push(S([pts[i][0], pts[i][1] + rr * fl * 0.35, pts[i][2]], rr * 0.78));
  }
  // polpa digital: além da falange distal e um pouco abaixo
  const tip = pts[pts.length - 1], prev = pts[pts.length - 2];
  const rr = r[2];
  const dir = sub3(tip, prev);
  parts.push(E([tip[0] - rr * 0.25, tip[1] - rr * 0.18, tip[2]], [rr * 1.05, rr * 0.88, rr * 1.08], basis(dir, [0, 1, 0])));
  // unha: lâmina que acompanha a superfície do dedo (pele + 0,45 mm), recortada no contorno ungueal
  const len = Math.hypot(...dir);
  const c = lerp3(prev, tip, 0.6);
  const R = basis(dir, [0, 1, 0]);
  const up = [R[1], R[4], R[7]];
  const off = rr * fl * 0.55;
  nailRegions.push(E([c[0] + up[0] * off, c[1] + up[1] * off, c[2] + up[2] * off], [len * 0.55 + rr * 0.2, rr * 0.62, rr * 0.8], R));
  return U(2.2, ...parts);
});
const toes = U(1.6, ...toeParts);
const nailParts = toeParts.map((tp, i) => X(0.3, O(tp, 0.45), nailRegions[i]));

// Saliências ósseas subcutâneas: a pele acompanha os ossos (maléolos, face medial da tíbia,
// calcâneo com a proeminência de Haglund, tuberosidade do navicular, base do 5º metatarso).
const B = boneShapes;
const below = (yMax) => P([0, yMax, 0], [0, 1, 0]);
const behind = (xMax) => P([xMax, 0, 0], [1, 0, 0]);
const boneHull = U(5,
  O(B.tibiaRaw, 2.6),
  O(U(4, E([52, 77, 26], [11, 16, 7.5]), E([49, 63, 27], [7.5, 6, 6])), 2.4),  // maléolo lateral
  O(B.haglundBump, 3.4),                            // proeminência de Haglund
  O(B.navRaw, 2.6), O(B.mtRaw[0], 3.0), O(B.mtRaw[4], 1.2),
);

// Relevos tendíneos suaves (tendão do calcâneo, tibial anterior e extensor longo do hálux, visíveis nas fotos)
function tubeHull(def, margin) {
  const pts = def.points;
  const rw = Array.isArray(def.r) ? def.r : pts.map(() => def.r);
  const tt = def.t === undefined ? rw : Array.isArray(def.t) ? def.t : pts.map(() => def.t);
  const parts = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const ra = Math.min(rw[i], tt[i] * 1.6) + margin, rb = Math.min(rw[i + 1], tt[i + 1] * 1.6) + margin;
    parts.push(C(pts[i], pts[i + 1], ra, rb));
  }
  return U(1, ...parts);
}
const HULL = { 'tib-ant-t': 1.6, 'ehl-t': 1.5, 'abd-hal': 1.8, 'v-saph-great': 0.9 };
const hulls = [...tendons, ...muscles, ...vessels].filter((d) => HULL[d.id] !== undefined).map((d) => tubeHull(d, HULL[d.id]));

const body = U(13,
  legLoft,
  footLoft,
  C([73, 205, -5], [71, 100, -6], 16, 17),           // coluna tibial (face medial da tíbia é subcutânea)
  C([64, 206, 22], [80, 96, 13], 15, 12.5),          // compartimento anterolateral
  E([40, 100, 22], [14, 40, 13]),                    // compartimento lateral (fibulares)
  E([46, 80, -21], [14, 26, 14]),                    // goteira retromaleolar medial (túnel do tarso)
  E([62, 60, -24], [15, 12, 12]),                    // abaixo do maléolo medial
  E([80, 86, -14], [14, 12, 13]),                    // face anteromedial do tornozelo
  E([62, 45, 22], [16, 10, 14]),                     // abaixo do maléolo lateral
  E([40, 80, 23], [12, 26, 12]),                     // goteira retromaleolar lateral
  E([91, 84, 4], [16, 12, 21]),                      // face anterior do tornozelo (tendões extensores)
  E([31, 33, 1], [31, 33, 29]),                      // calcanhar (contorno posterior arredondado)
  E([44, 12, 0], [30, 13, 26]),                      // coxim plantar do calcanhar
  C([18, 165, 1.5], [13.5, 100, 1.5], 11, 10.5),    // relevo do tendão do calcâneo
  C([13.5, 100, 1.5], [8, 62, 1.5], 10.5, 10.5),
  C([8, 62, 1.5], [6.5, 44, 1.5], 10.5, 11),
  E([5, 47, 13], [6.5, 10, 9]),                      // saliência póstero-lateral (Haglund + bursa)
);

export const skinShape = X(0.6, X(3, U(4.5, U(9, U(8, body, boneHull), ...hulls), toes), ground), topCut);

// Calosidade (hiperqueratose) póstero-lateral observada nas fotos
const callusC = [2, 42, 16];
export function skinWeight(x, y, z) {
  const dx = (x - callusC[0]) / 1.0, dy = (y - callusC[1]) / 1.35, dz = (z - callusC[2]) / 1.0;
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return smooth(clamp01((15 - d) / 9));
}

// ---------------- unhas ----------------
export const nailShape = U(0, ...nailParts);

// ---------------- coxins de gordura ----------------
const calc = boneShapes.calcaneus;
const talus = boneShapes.talusRaw;

// Gordura de Kager (pré-aquileana): triângulo entre o Aquiles, o FHL e o calcâneo
export const kagerShape = X(1.5, D(2.5,
  U(7,
    E([29, 86, 2], [11, 30, 8.5]),
    E([28.5, 63, 2], [11.5, 10, 8.5]),
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
