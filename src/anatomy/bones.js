// Ossos do pé direito e da porção distal da perna (tíbia e fíbula), modelados por SDF.
// Coordenadas em mm: x = anterior, y = superior, z = lateral. Solo em y = 0, calcanhar posterior em x ≈ 0.
import {
  sphere as S, ellipsoid as E, cone as C, box as B, union as U, subtract as D,
  intersect as X, offset as O, plane as P, basis, euler,
} from '../sdf.js';

export const CUT_Y = 200; // corte da perna (20 cm acima do solo)
const topPlane = P([0, CUT_Y, 0], [0, 1, 0]);
const cutTop = (s) => X(0.8, s, topPlane);

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

// Osso longo curto (metatarso / falange): base, diáfise afilada e cabeça.
function longBone({ a, b, base, shaft, head, baseR, headR, k = 2.2, up = [0, 1, 0] }) {
  const R = basis(sub3(b, a), up);
  const m1 = lerp(a, b, 0.24), m2 = lerp(a, b, 0.76);
  return U(k,
    C(a, m1, base, shaft),
    C(m1, m2, shaft, shaft * 0.93),
    C(m2, b, shaft * 0.93, head),
    baseR ? E(a, baseR, R) : null,
    headR ? E(b, headR, R) : null,
  );
}

// ---------------- formas "cruas" (antes de ajustar as articulações) ----------------

// Tíbia distal
const tibiaRaw = U(5,
  C([71, 205, -5], [68, 128, -5], 12.5, 13.5),          // diáfise
  C([79, 205, -5], [77, 130, -6], 5, 6),                 // crista anterior
  E([65, 102, -3], [17.5, 15, 20.5]),                     // metáfise alargada
  E([64, 92, -2], [17, 6, 17]),                           // plafond
  C([66, 96, -20], [64, 76, -23], 8.5, 6),                // maléolo medial
  E([64, 84, -23], [10, 11, 5.5]),
  E([50, 95, 2], [5, 7, 14]),                             // margem posterior (maléolo posterior)
);

// Fíbula distal
const fibulaRaw = U(5,
  C([52, 205, 23], [53, 112, 24], 7, 8),                  // diáfise
  C([54, 104, 24], [51, 66, 27], 8.5, 7.5),
  E([52, 77, 26], [11, 16, 7.5]),                         // maléolo lateral
  E([49, 63, 27], [7.5, 6, 6]),                           // ponta
);

// Tálus
const talusRaw = U(4,
  E([60, 73, 0], [19, 14, 14.5]),                         // corpo
  E([68, 76, 0], [12, 10.5, 15.5]),                       // tróclea (mais larga à frente)
  E([60, 66, 15], [8, 6, 6]),                             // processo lateral
  C([46, 67, -1], [37, 63, -3], 6.5, 4),                  // processo posterior
  C([74, 70, -2], [87, 64, -8], 10, 9),                   // colo
  E([93, 61, -10], [9, 11, 14.5], euler([-30, 0, 0])),    // cabeça
);
const talusFHLgroove = C([36, 72, -5.5], [38, 54, -6.5], 2.6);

// Calcâneo (normal + deformidade de Haglund separada)
const calcNormalRaw = U(5,
  E([26, 35, 0], [17, 20, 15]),                           // tuberosidade
  C([32, 34, 0], [80, 40, 6], 15, 11),                    // corpo
  C([24, 22, -3], [76, 30, 5], 8, 8),                     // face plantar
  E([22, 19, -7], [12, 6, 8]),                            // processo medial da tuberosidade
  E([24, 21, 8], [9, 5, 6]),                              // processo lateral
  E([50, 51, 4], [14, 7, 12]),                            // faceta articular posterior
  C([66, 44, 6], [86, 41, 12], 9, 9),                     // processo anterior
  E([84, 36, 12], [6, 12, 11]),                           // face cubóidea
  E([61, 46, -18], [11, 4.5, 9]),                         // sustentáculo do tálus
  C([52, 43, -9], [63, 45, -24], 5, 4),
  E([66, 35, 17], [5, 3, 3]),                             // tróclea fibular
  E([19, 51, 0], [6, 5, 10]),                             // projeção bursal (normal)
);
const calcCuts = [
  E([42, 28, -25], [22, 12, 9]),                          // concavidade medial (canal do tarso)
  C([57, 56, 14], [70, 51, -4], 5, 4),                    // sulco do calcâneo / seio do tarso
];
// Proeminência póstero-súpero-lateral (deformidade de Haglund)
export const haglundBump = U(4,
  E([15.5, 54, 6], [5.5, 6, 10], euler([0, -18, 14])),
  E([18, 50, 11], [6, 6, 5]),
);

const calcNormal = D(3, calcNormalRaw, ...calcCuts);
const calcRaw = D(3, U(5, calcNormalRaw, haglundBump), ...calcCuts);

// Navicular
const navRaw = U(3,
  E([111, 56, -11], [7.5, 11, 17], euler([-30, 0, 0])),
  E([108, 46, -28], [6.5, 6.5, 6]),                       // tuberosidade do navicular
);

// Cuboide
const cuboidRaw = U(3,
  B([103, 34, 20], [12, 10.5, 10], euler([-14, 0, -8]), 5.5),
  E([105, 25, 24], [7, 4, 8]),                            // tuberosidade do cuboide
);
const peronealGroove = C([98, 22, 34], [118, 27, 6], 3.4);

// Cuneiformes
const cun1Raw = B([128, 44, -19], [10, 14, 7], euler([8, 0, -12]), 4.8);
const cun2Raw = B([126, 54, -5], [8, 9, 6.5], euler([0, 0, -12]), 4.2);
const cun3Raw = B([128, 50, 7.5], [10, 10, 6.5], euler([-10, 0, -12]), 4.2);

// Metatarsos
const mtDefs = [
  { a: [141, 42, -20], b: [196, 25, -31], base: 9, shaft: 6.4, head: 9, baseR: [6, 13, 9], headR: [9, 11, 11] },
  { a: [135, 51, -5], b: [203, 20, -12], base: 6.5, shaft: 4.3, head: 6.5, baseR: [5, 9, 6], headR: [7, 8.5, 6.5] },
  { a: [139, 48, 7], b: [199, 19, 2.5], base: 6, shaft: 4.1, head: 6.2, baseR: [5, 8.5, 6], headR: [7, 8, 6] },
  { a: [121, 41, 18], b: [192, 18, 16], base: 6, shaft: 4.0, head: 6, baseR: [5, 8, 6], headR: [6.5, 7.5, 6] },
  { a: [118, 32, 28], b: [181, 15, 33], base: 6.5, shaft: 4.2, head: 6, baseR: [7, 7, 8], headR: [6.5, 7, 6] },
];
const mtRaw = mtDefs.map((d, i) => {
  const lb = longBone(d);
  if (i === 4) return U(3, lb, E([112, 31, 37], [9, 6, 6], euler([0, -20, 0]))); // tuberosidade (processo estiloide)
  return lb;
});

// Sesamoides do hálux
const sesRaw = [
  E([193, 13, -35], [6, 4, 4.5]),
  E([194, 13.5, -26], [5.5, 3.8, 4]),
];

// Falanges: [proximal, média, distal] por dedo
const toeDefs = [
  // hálux (sem falange média)
  [
    { a: [209, 23, -32], b: [234, 18, -33], base: 7, shaft: 5.5, head: 5.5, baseR: [5, 9, 9], headR: [5, 6, 7.5] },
    null,
    { a: [240, 17, -33], b: [256, 13, -33], base: 6, shaft: 4.4, head: 3.5, baseR: [4, 7, 8], headR: [3.5, 3, 6.5] },
  ],
  [
    { a: [213, 21, -12.5], b: [237, 24, -13], base: 5, shaft: 3.5, head: 4, baseR: [4, 6.5, 6], headR: [4, 4.5, 4.8] },
    { a: [241, 22.5, -13], b: [249, 17, -13.5], base: 4.2, shaft: 3.2, head: 3.6, baseR: [3.5, 5, 5], headR: [3.5, 4, 4.2] },
    { a: [252, 14, -13.5], b: [258, 10, -13.5], base: 3.6, shaft: 2.8, head: 2.5, baseR: [3, 4.2, 4.5], headR: [2.5, 2.5, 4] },
  ],
  [
    { a: [209, 20, 2.5], b: [230, 22, 2], base: 4.8, shaft: 3.3, head: 3.8, baseR: [4, 6, 5.6], headR: [3.8, 4.3, 4.5] },
    { a: [234, 20.5, 2], b: [241, 15.5, 2.5], base: 4, shaft: 3, head: 3.4, baseR: [3.3, 4.7, 4.7], headR: [3.3, 3.8, 4] },
    { a: [244, 12.5, 2.5], b: [249, 9, 3], base: 3.4, shaft: 2.6, head: 2.4, baseR: [2.8, 4, 4.2], headR: [2.4, 2.4, 3.8] },
  ],
  [
    { a: [201, 19, 16], b: [220, 20, 17.5], base: 4.6, shaft: 3.1, head: 3.6, baseR: [3.8, 5.8, 5.3], headR: [3.6, 4.1, 4.3] },
    { a: [224, 19, 18], b: [230, 14.5, 18.5], base: 3.8, shaft: 2.9, head: 3.2, baseR: [3.1, 4.5, 4.4], headR: [3.1, 3.6, 3.8] },
    { a: [233, 12, 19], b: [237.5, 8.5, 19.5], base: 3.2, shaft: 2.5, head: 2.3, baseR: [2.7, 3.8, 4], headR: [2.3, 2.3, 3.6] },
  ],
  [
    { a: [190, 16, 33.5], b: [205, 16.5, 35], base: 4.4, shaft: 3, head: 3.4, baseR: [3.6, 5.5, 5], headR: [3.4, 3.9, 4] },
    { a: [208.5, 15, 35.5], b: [213, 12, 36], base: 3.5, shaft: 2.7, head: 3, baseR: [2.9, 4.2, 4.1], headR: [2.9, 3.3, 3.5] },
    { a: [215.5, 10, 36.5], b: [219.5, 7.5, 37], base: 3, shaft: 2.4, head: 2.2, baseR: [2.5, 3.5, 3.7], headR: [2.2, 2.2, 3.3] },
  ],
];
const phalRaw = toeDefs.map((toe) => toe.map((d) => (d ? longBone({ ...d, k: 1.8 }) : null)));

// ---------------- ajuste articular (espaços articulares conformados) ----------------
const GAP = 1.6;
const tibia = cutTop(D(1.2, tibiaRaw, O(talusRaw, GAP), O(fibulaRaw, 0.8)));
const fibula = cutTop(D(1.2, fibulaRaw, O(talusRaw, GAP)));
const talus = D(1.2, talusRaw, O(calcRaw, GAP), talusFHLgroove);
const calcaneus = calcRaw;
const navicular = D(1.0, navRaw, O(talusRaw, GAP));
const cuboid = D(1.0, cuboidRaw, O(calcRaw, GAP), O(navRaw, 1.2), peronealGroove);
const cun1 = D(1.0, cun1Raw, O(navRaw, GAP), O(cun2Raw, 1.2));
const cun2 = D(1.0, cun2Raw, O(navRaw, GAP), O(cun3Raw, 1.2));
const cun3 = D(1.0, cun3Raw, O(navRaw, GAP), O(cuboidRaw, 1.2));
const mt = mtRaw.map((m, i) => {
  const neighbors = [
    [cun1Raw], [cun1Raw, cun2Raw, cun3Raw], [cun3Raw], [cuboidRaw, cun3Raw], [cuboidRaw],
  ][i].map((n) => O(n, GAP));
  const sideBy = [];
  if (i > 0) sideBy.push(O(mtRaw[i - 1], 1.0));
  return D(1.0, m, ...neighbors, ...sideBy);
});
const ses = sesRaw.map((s) => D(1.0, s, O(mtRaw[0], 1.2)));
const phal = phalRaw.map((toe, t) => {
  const out = [];
  let prev = mtRaw[t];
  for (const ph of toe) {
    if (!ph) { out.push(null); continue; }
    out.push(D(1.0, ph, O(prev, GAP)));
    prev = ph;
  }
  return out;
});

// ---------------- cartilagem articular ----------------
const cart = (bone, region, t = 0.9) => X(0.6, O(bone, t), region);

// ---------------- exportação ----------------
// Cada item: id, nome, grupo, forma SDF, passo da malha, explode (vetor de afastamento).
const toeNames = ['hálux', '2º dedo', '3º dedo', '4º dedo', '5º dedo'];
const phalNames = ['proximal', 'média', 'distal'];
const mtNames = ['1º', '2º', '3º', '4º', '5º'];

export const boneDefs = [
  { id: 'tibia', name: 'Tíbia (extremidade distal)', shape: tibia, step: 1.1 },
  { id: 'fibula', name: 'Fíbula (extremidade distal)', shape: fibula, step: 1.0 },
  { id: 'talus', name: 'Tálus', shape: talus, step: 0.8 },
  { id: 'calcaneus', name: 'Calcâneo', shape: calcaneus, step: 0.8, highlight: 'haglund' },
  { id: 'navicular', name: 'Navicular', shape: navicular, step: 0.7 },
  { id: 'cuboid', name: 'Cuboide', shape: cuboid, step: 0.7 },
  { id: 'cuneiform1', name: 'Cuneiforme medial', shape: cun1, step: 0.7 },
  { id: 'cuneiform2', name: 'Cuneiforme intermédio', shape: cun2, step: 0.7 },
  { id: 'cuneiform3', name: 'Cuneiforme lateral', shape: cun3, step: 0.7 },
  ...mt.map((s, i) => ({ id: `mt${i + 1}`, name: `${mtNames[i]} metatarso`, shape: s, step: 0.7 })),
  { id: 'sesamoid-med', name: 'Sesamoide medial (tibial) do hálux', shape: ses[0], step: 0.5 },
  { id: 'sesamoid-lat', name: 'Sesamoide lateral (fibular) do hálux', shape: ses[1], step: 0.5 },
];
phal.forEach((toe, t) => toe.forEach((s, p) => {
  if (!s) return;
  boneDefs.push({ id: `ph${t + 1}-${p + 1}`, name: `Falange ${phalNames[p]} do ${toeNames[t]}`, shape: s, step: 0.5 });
}));

// Calcâneo sem a deformidade (para comparação)
export const calcaneusNormal = { id: 'calcaneus-normal', name: 'Contorno normal do calcâneo (referência)', shape: calcNormal, step: 0.9 };

export const cartilageDefs = [
  { id: 'cart-talus-troch', bone: 'talus', name: 'Cartilagem da tróclea do tálus', shape: cart(talus, E([64, 80, 0], [22, 11, 24])), step: 0.6 },
  { id: 'cart-talus-head', bone: 'talus', name: 'Cartilagem da cabeça do tálus', shape: cart(talus, E([98, 59, -11], [8, 14, 18], euler([-30, 0, 0]))), step: 0.6 },
  { id: 'cart-tibia', bone: 'tibia', name: 'Cartilagem do plafond tibial', shape: cart(tibia, U(2, B([64, 88, -2], [20, 4, 18], null, 2), E([64, 82, -18], [9, 8, 4]))), step: 0.6 },
  { id: 'cart-fibula', bone: 'fibula', name: 'Cartilagem da faceta maleolar lateral', shape: cart(fibula, E([55, 76, 18], [10, 12, 4])), step: 0.6 },
  { id: 'cart-calc-post', bone: 'calcaneus', name: 'Cartilagem da faceta posterior do calcâneo', shape: cart(calcaneus, E([50, 57, 4], [12, 4, 11])), step: 0.6 },
  { id: 'cart-calc-cub', bone: 'calcaneus', name: 'Cartilagem da face cubóidea do calcâneo', shape: cart(calcaneus, E([90, 37, 12], [4, 12, 12])), step: 0.6 },
  { id: 'cart-nav', bone: 'navicular', name: 'Cartilagem do navicular', shape: cart(navicular, E([104, 57, -10], [4, 12, 17], euler([-30, 0, 0]))), step: 0.6 },
  ...mtDefs.map((d, i) => ({
    id: `cart-mt${i + 1}`, bone: `mt${i + 1}`, name: `Cartilagem da cabeça do ${mtNames[i]} metatarso`,
    shape: cart(mt[i], S([d.b[0] + 3, d.b[1] - 1, d.b[2]], d.headR[1] + 0.5)), step: 0.5,
  })),
];

// Pontos usados por outras camadas (pele, tendões etc.)
export const landmarks = {
  medMalleolus: [64, 82, -23],
  latMalleolus: [51, 72, 27],
  latMalleolusTip: [49, 60, 27],
  navTuberosity: [108, 46, -29],
  mt5Styloid: [112, 31, 37],
  haglund: [12, 56, 9],
  achillesInsertion: [9, 32, 1],
  mtHeads: mtDefs.map((d) => d.b),
  toeDefs,
};

// Formas usadas pela pele (saliências ósseas palpáveis)
export const boneShapes = { tibiaRaw, fibulaRaw, talusRaw, calcRaw, navRaw, cuboidRaw, mtRaw, calcaneus, haglundBump, calcNormal };
