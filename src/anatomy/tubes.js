// Estruturas tubulares: tendões, músculos, ligamentos, fáscias, vasos e nervos.
// Cada item: { id, name, layer, kind, points, r (meia-largura), t (meia-espessura), up, caps }.
// "up" indica a direção da espessura (para estruturas achatadas).

const F = ['flat', 'round'];   // começa no corte da perna
const R = ['round', 'round'];
const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1], NZ = [0, 0, -1], NY = [0, -1, 0];

// ------------------------------------------------------------------ TENDÕES
export const tendons = [
  {
    id: 'achilles', name: 'Tendão do calcâneo (Aquiles)', kind: 'tendon', caps: F,
    points: [[17, 200, 1], [14.5, 165, 1], [11.5, 125, 1], [8.5, 92, 1.2], [6.8, 72, 1.5], [6.1, 58, 2], [6.2, 46, 2], [7.2, 37, 1.6], [9.5, 29, 1.2], [11.5, 24, 1]],
    r: [11, 9.5, 8, 7, 7, 7.8, 9.2, 10.5, 11.2, 11],
    t: [3, 3.2, 3.3, 3.4, 3.3, 3.2, 3.4, 3.5, 2.6, 1.6],
    up: X,
  },
  // compartimento posterior profundo (atrás do maléolo medial)
  {
    id: 'tib-post-t', name: 'Tendão do tibial posterior', kind: 'tendon', caps: R,
    points: [[50, 135, -10], [51, 110, -15], [53, 92, -24], [55, 80, -30.5], [60, 70, -33], [70, 61, -33], [84, 54, -31.5], [97, 49, -30.5], [106, 46, -29]],
    r: [3.4, 3, 2.9, 2.9, 3, 3.1, 3.3, 3.7, 4.2], t: [2.6, 2.6, 2.6, 2.6, 2.6, 2.6, 2.6, 2.8, 3],
    up: [0.3, 0.2, -1],
  },
  {
    id: 'tib-post-slips', name: 'Expansões plantares do tibial posterior', kind: 'tendon', caps: R,
    points: [[104, 42, -25], [114, 34, -16], [124, 33, -4], [126, 31, 10]], r: 1.6, t: 1.1, up: NY,
  },
  {
    id: 'fdl-t', name: 'Tendão do flexor longo dos dedos', kind: 'tendon', caps: R,
    points: [[49, 128, -13], [49, 105, -19], [49, 88, -28.5], [50, 78, -34.5], [57, 67, -36.5], [69, 54, -33], [86, 41, -27], [104, 33, -18], [120, 28, -10]],
    r: 2.2, t: 1.9,
  },
  {
    id: 'fhl-t', name: 'Tendão do flexor longo do hálux', kind: 'tendon', caps: R,
    points: [[37, 108, -2], [37, 88, -4.5], [37, 70, -6], [42, 56, -12], [52, 44, -19], [62, 37, -22], [84, 30, -24], [104, 27, -23], [140, 22, -27], [172, 14, -30], [193, 7.5, -30.5], [214, 12, -33], [236, 12, -33], [244, 12, -33]],
    r: 2.7, t: 2.3,
  },
  // compartimento anterior
  {
    id: 'tib-ant-t', name: 'Tendão do tibial anterior', kind: 'tendon', caps: R,
    points: [[86, 158, 7], [88.5, 125, -5], [89, 104, -12], [90.5, 90, -15.5], [98.5, 79, -19], [110, 70, -24], [121, 59, -28.5], [129, 47, -29], [134, 37, -26.5]],
    r: [3.8, 3.8, 3.7, 3.6, 3.5, 3.4, 3.3, 3.2, 3.4], t: [2.6, 2.6, 2.6, 2.6, 2.5, 2.4, 2.3, 2.3, 2.4],
    up: [1, 0.4, -0.3],
  },
  {
    id: 'ehl-t', name: 'Tendão do extensor longo do hálux', kind: 'tendon', caps: R,
    points: [[82, 135, 9], [86.5, 112, 0], [89.5, 92, -5.5], [100, 80, -8.5], [119, 69, -13.5], [145, 57, -21], [170, 45, -27], [196, 38.5, -31], [213, 34, -32], [231, 27.5, -33], [244, 22, -33]],
    r: 2.1, t: 1.6, up: Y,
  },
  {
    id: 'edl-t', name: 'Tendão do extensor longo dos dedos', kind: 'tendon', caps: R,
    points: [[80, 140, 17], [85.5, 112, 11], [89.5, 93, 8.5], [100, 81, 9], [112, 73, 10]],
    r: 3.2, t: 2.2, up: Y,
  },
  ...[
    [[112, 73, 10], [136, 62, -2], [170, 47, -8], [203, 31.5, -12], [221, 30.5, -12.5], [238, 29.5, -13], [247.5, 25, -13.5], [253, 19.5, -13.5]],
    [[112, 73, 10], [136, 60, 6], [170, 45, 4], [199, 29.5, 2.5], [210, 28.5, 2.5], [230, 28, 2], [240, 23, 2.3], [245, 17.5, 2.6]],
    [[112, 73, 10], [131, 58, 13], [165, 42.5, 15], [192, 27.5, 16], [202, 26.5, 16.2], [220, 26, 17.5], [229.5, 21, 18.3], [234, 16.5, 19]],
    [[112, 73, 10], [126, 55, 17], [160, 38.5, 27], [181, 24, 33], [190, 23.5, 33.5], [205, 22.5, 35], [212, 18.5, 36], [216.5, 14.5, 36.6]],
  ].map((points, i) => ({
    id: `edl-t${i + 2}`, name: `Tendão do extensor longo dos dedos (${i + 2}º dedo)`, kind: 'tendon', caps: R,
    points, r: 1.6, t: 1.0, up: Y,
  })),
  {
    id: 'per-tert-t', name: 'Tendão do fibular terceiro', kind: 'tendon', caps: R,
    points: [[76, 140, 24], [83, 112, 17.5], [90.5, 92, 14.5], [103, 79, 15], [117, 60, 25], [123, 45, 30]],
    r: 1.9, t: 1.3, up: Y,
  },
  // compartimento lateral
  {
    id: 'per-long-t', name: 'Tendão do fibular longo', kind: 'tendon', caps: R,
    points: [[39, 170, 31], [40, 140, 31.5], [40.5, 110, 32.5], [40.5, 90, 33.5], [41, 74, 34], [45, 61, 34], [55, 49, 30], [67, 36, 24.5], [80, 29, 24.5], [92, 24, 28.5], [99, 21, 32], [108, 22.5, 20], [118, 26, 6], [128, 30, -8], [137, 32, -18]],
    r: 2.6, t: 2.1,
  },
  {
    id: 'per-brev-t', name: 'Tendão do fibular curto', kind: 'tendon', caps: R,
    points: [[44, 118, 29], [44.5, 98, 29.5], [45, 84, 30], [46, 74, 30.5], [49, 62, 30.5], [59, 50, 27.5], [74, 41, 23.5], [92, 36, 30], [104, 33.5, 36], [113, 31, 38.5]],
    r: [3.4, 3.2, 3, 2.9, 2.9, 3, 3, 3, 3.2, 3.6], t: [2.2, 2.2, 2.2, 2.1, 2.1, 2.1, 2.1, 2.1, 2.1, 2.2],
    up: [0, 0.3, 1],
  },
  // tendões dos músculos intrínsecos
  {
    id: 'abd-hal-t', name: 'Tendão do abdutor do hálux', kind: 'tendon', caps: R,
    points: [[160, 23, -36.5], [182, 18, -37.5], [200, 16, -38], [211, 18, -36]], r: 2.2, t: 1.6, up: NZ,
  },
  ...[
    [[128, 15, -4], [160, 12, -9], [192, 7.5, -11.5], [214, 13, -12.5], [237, 18, -13]],
    [[128, 15, 1], [160, 12, 2], [190, 7.5, 2.5], [210, 12.5, 2.5], [230, 17, 2.2]],
    [[128, 15, 6], [158, 12, 12], [184, 7.5, 15.5], [202, 12, 16.3], [221, 15.5, 17.5]],
    [[128, 15, 10], [155, 12, 24], [176, 8, 32], [191, 11.5, 33.6], [205, 13, 35]],
  ].map((points, i) => ({
    id: `fdb-t${i + 2}`, name: `Tendão do flexor curto dos dedos (${i + 2}º dedo)`, kind: 'tendon', caps: R,
    points, r: 1.4, t: 0.9, up: Y,
  })),
  ...[
    [[120, 28, -10], [150, 21, -11], [190, 9, -12], [214, 14.5, -12.5], [240, 17, -13], [251.5, 10, -13.5]],
    [[120, 28, -10], [150, 21, -3], [186, 9, 2.5], [209, 14, 2.5], [233, 16, 2.1], [244, 9, 2.6]],
    [[120, 28, -10], [148, 21, 6], [180, 9, 16], [201, 13.5, 16.2], [223, 15, 17.8], [233, 8.5, 19]],
    [[120, 28, -10], [145, 21, 14], [172, 9.5, 32.5], [190, 12, 33.6], [207.5, 12.5, 35.4], [215.5, 7, 36.6]],
  ].map((points, i) => ({
    id: `fdl-t${i + 2}`, name: `Tendão do flexor longo dos dedos (${i + 2}º dedo)`, kind: 'tendon', caps: R,
    points, r: 1.3, t: 1.0,
  })),
  ...[
    [[115, 56, 16], [140, 55, -10], [175, 41, -24], [208, 31, -30]],
    [[115, 56, 16], [145, 53, -4], [190, 35, -10], [215, 30, -11.5]],
    [[115, 56, 16], [145, 51, 6], [185, 32, 3.5], [209, 28, 3]],
    [[115, 56, 16], [140, 48, 14], [180, 30, 15], [201, 25.5, 15.5]],
  ].map((points, i) => ({
    id: `edb-t${i + 1}`, name: i === 0 ? 'Tendão do extensor curto do hálux' : `Tendão do extensor curto dos dedos (${i + 1}º dedo)`,
    kind: 'tendon', caps: R, points, r: 1.2, t: 0.8, up: Y,
  })),
];

// ------------------------------------------------------------------ MÚSCULOS
export const muscles = [
  {
    id: 'soleus', name: 'Músculo sóleo (porção distal)', kind: 'muscle', caps: F,
    points: [[31, 200, 2], [25, 172, 2], [20.5, 145, 2], [17.5, 123, 2], [16, 112, 2]],
    r: [21, 17, 11, 5, 1.5], t: [11, 8.5, 5.5, 2.6, 1], up: X,
  },
  {
    id: 'fhl-m', name: 'Músculo flexor longo do hálux', kind: 'muscle', caps: F,
    points: [[43, 200, 10], [41, 165, 6], [38.5, 132, 1], [37, 108, -2], [37, 96, -3]],
    r: [9, 9.5, 8, 5, 2], t: [7, 7.5, 6.5, 4, 2], up: X,
  },
  {
    id: 'fdl-m', name: 'Músculo flexor longo dos dedos', kind: 'muscle', caps: F,
    points: [[53, 200, -13], [51.5, 170, -12], [50, 145, -12], [49, 125, -13]],
    r: [6.5, 6, 4.5, 2], t: [5, 4.5, 3.5, 1.6], up: X,
  },
  {
    id: 'tib-post-m', name: 'Músculo tibial posterior', kind: 'muscle', caps: F,
    points: [[52, 200, 3], [51.5, 170, -1], [51, 148, -6], [50, 132, -9]],
    r: [8, 7, 5, 2], t: [4.5, 4.2, 3.5, 1.8], up: X,
  },
  {
    id: 'per-brev-m', name: 'Músculo fibular curto', kind: 'muscle', caps: F,
    points: [[46, 200, 31], [45, 170, 31], [44, 140, 30], [44, 118, 29.5], [44.5, 104, 29.5]],
    r: [7, 7, 6, 4, 2], t: [6, 6, 5, 3.4, 2], up: Z,
  },
  {
    id: 'per-long-m', name: 'Músculo fibular longo (porção distal)', kind: 'muscle', caps: F,
    points: [[39, 200, 35.5], [39, 185, 33.5], [39, 170, 31]],
    r: [4.5, 3.5, 2.6], t: [4, 3, 2.1], up: Z,
  },
  {
    id: 'tib-ant-m', name: 'Músculo tibial anterior (porção distal)', kind: 'muscle', caps: F,
    points: [[79, 200, 12], [83, 178, 10], [86, 158, 7]],
    r: [8, 6, 3.8], t: [6.5, 4.5, 2.6], up: [1, 0, 0.3],
  },
  {
    id: 'ehl-m', name: 'Músculo extensor longo do hálux', kind: 'muscle', caps: F,
    points: [[71, 200, 19], [75, 175, 16], [79, 152, 12.5], [82, 135, 9]],
    r: [6.5, 6.5, 5, 2.1], t: [5, 5, 3.6, 1.6], up: [1, 0, 0.3],
  },
  {
    id: 'edl-m', name: 'Músculo extensor longo dos dedos', kind: 'muscle', caps: F,
    points: [[66, 200, 27], [71, 175, 24], [76, 155, 20.5], [80, 140, 17]],
    r: [7, 6.5, 5, 3.2], t: [5.5, 5, 3.8, 2.2], up: [1, 0, -0.3],
  },
  {
    id: 'per-tert-m', name: 'Músculo fibular terceiro', kind: 'muscle', caps: F,
    points: [[59, 200, 33], [65, 175, 30], [71, 155, 27], [76, 140, 24]],
    r: [5, 5, 3.6, 1.9], t: [4, 4, 2.8, 1.3], up: [1, 0, -0.3],
  },
  // músculos intrínsecos do pé — dorso
  {
    id: 'edb-m', name: 'Músculos extensor curto dos dedos e do hálux', kind: 'muscle', caps: R,
    points: [[76, 50, 25], [90, 55, 23], [104, 57, 20], [116, 56, 16]],
    r: [4, 8, 8.5, 4], t: [2.5, 3.5, 3.5, 2], up: [0.2, 1, 0.3],
  },
  // planta — 1ª camada
  {
    id: 'abd-hal', name: 'Músculo abdutor do hálux', kind: 'muscle', caps: R,
    points: [[24, 23, -18], [48, 26, -27.5], [88, 27, -32], [128, 25, -34], [160, 22, -36.5]],
    r: [4.5, 7.5, 8, 6.5, 2.4], t: [3, 4.4, 4.6, 4, 1.8], up: NZ,
  },
  {
    id: 'fdb', name: 'Músculo flexor curto dos dedos', kind: 'muscle', caps: R,
    points: [[26, 16, 0], [50, 14, 0], [82, 14, 1.5], [110, 14.5, 2], [128, 15, 3]],
    r: [6, 10, 11.5, 11, 9], t: [3.2, 4.4, 4.6, 4, 2.4], up: Y,
  },
  {
    id: 'abd-dig-min', name: 'Músculo abdutor do dedo mínimo', kind: 'muscle', caps: R,
    points: [[27, 18, 13], [58, 17, 23], [98, 17, 31], [140, 16.5, 35.5], [176, 14, 36.5], [190, 15, 35.5]],
    r: [4.5, 5.5, 5.5, 4, 2, 1.4], t: [3.6, 4.4, 4.2, 3.2, 1.6, 1.1], up: Z,
  },
  // planta — 2ª camada
  {
    id: 'quad-plantae', name: 'Músculo quadrado plantar', kind: 'muscle', caps: R,
    points: [[33, 24, -4], [56, 21, -8], [82, 22, -12], [102, 26, -16]],
    r: [10, 10, 7, 3], t: [2.8, 3.4, 2.8, 1.5], up: Y,
  },
  // planta — 3ª camada
  {
    id: 'fhb-med', name: 'Músculo flexor curto do hálux (cabeça medial)', kind: 'muscle', caps: R,
    points: [[137, 28, -25], [165, 20, -32], [190, 12, -35]], r: [3, 5, 3], t: [3, 4.2, 2.4],
  },
  {
    id: 'fhb-lat', name: 'Músculo flexor curto do hálux (cabeça lateral)', kind: 'muscle', caps: R,
    points: [[137, 28, -20], [165, 20, -24], [190, 12, -26]], r: [3, 5, 3], t: [3, 4, 2.4],
  },
  {
    id: 'add-hal-obl', name: 'Músculo adutor do hálux (cabeça oblíqua)', kind: 'muscle', caps: R,
    points: [[130, 30, 10], [155, 24, 0], [178, 17, -17], [191, 12, -25]],
    r: [6, 8, 6, 3], t: [3.6, 4.6, 4, 2], up: Y,
  },
  {
    id: 'add-hal-tr', name: 'Músculo adutor do hálux (cabeça transversa)', kind: 'muscle', caps: R,
    points: [[177, 13, 30], [184, 12.5, 12], [188, 12, -6], [190, 11.5, -22]],
    r: 3.6, t: 2.6, up: X,
  },
  {
    id: 'fdmb', name: 'Músculo flexor curto do dedo mínimo', kind: 'muscle', caps: R,
    points: [[122, 26, 30], [150, 20, 32.5], [182, 12.5, 33.5]], r: [3, 4, 2.5], t: [3, 3.8, 2.2],
  },
  // planta — 4ª camada (interósseos dorsais)
  ...[
    [[142, 44, -12], [170, 34, -17], [196, 25, -17]],
    [[140, 48, 1], [170, 34, -2.5], [200, 24, -6]],
    [[136, 44, 12], [170, 29, 10.5], [196, 21.5, 9]],
    [[128, 38, 23], [165, 24, 24], [187, 18.5, 25]],
  ].map((points, i) => ({
    id: `dorsal-int${i + 1}`, name: `Músculo interósseo dorsal ${i + 1}`, kind: 'muscle', caps: R,
    points, r: [4, 6, 2], t: [2.4, 3, 1.4], up: Z,
  })),
];

// ------------------------------------------------------------------ LIGAMENTOS
export const ligaments = [
  // complexo lateral do tornozelo
  { id: 'atfl', name: 'Ligamento talofibular anterior', points: [[60, 67, 28.5], [66, 66, 24], [72, 65, 18.5]], r: 5, t: 1.2, up: [0.55, 0, 0.83] },
  { id: 'cfl', name: 'Ligamento calcaneofibular', points: [[49, 59, 30], [45, 50, 26.5], [42, 42, 22]], r: 3.4, t: 1.4, up: Z },
  { id: 'ptfl', name: 'Ligamento talofibular posterior', points: [[44, 71, 21], [40, 67.5, 13], [38, 64.5, 4]], r: 3.6, t: 1.8, up: Y },
  { id: 'aitfl', name: 'Ligamento tibiofibular anterior inferior', points: [[70, 100, 14], [65, 93, 19], [60, 86, 24]], r: 5, t: 1.2, up: [1, 0, 0.3] },
  { id: 'pitfl', name: 'Ligamento tibiofibular posterior inferior', points: [[48, 101, 8], [45, 94, 15], [43, 87, 21]], r: 5, t: 1.4, up: [-1, 0, 0.2] },
  // complexo medial (deltoide)
  { id: 'deltoid-tn', name: 'Ligamento deltoide — feixe tibionavicular', points: [[69, 77, -25.5], [86, 67, -26], [104, 54, -26]], r: 3.6, t: 1.1, up: NZ },
  { id: 'deltoid-ts', name: 'Ligamento deltoide — feixe tibiomola', points: [[65, 75, -26], [72, 62, -27], [80, 52, -25.5]], r: 3.8, t: 1.1, up: NZ },
  { id: 'deltoid-tc', name: 'Ligamento deltoide — feixe tibiocalcâneo', points: [[61, 75, -26], [60, 60, -25.5], [60, 50, -24.5]], r: 4.2, t: 1.1, up: NZ },
  { id: 'deltoid-ptt', name: 'Ligamento deltoide — feixe tibiotalar posterior', points: [[57, 77, -22], [50, 70, -18.5], [44, 66, -13]], r: 4.6, t: 1.8, up: [-0.4, 0, -1] },
  // arco medial
  { id: 'spring', name: 'Ligamento calcaneonavicular plantar (mola)', points: [[62, 42, -20], [77, 44, -21.5], [92, 47.5, -21.5], [105, 47, -20]], r: 6, t: 1.8, up: [0, -0.6, -0.8] },
  // planta
  { id: 'long-plantar', name: 'Ligamento plantar longo', points: [[32, 14.5, 2], [60, 19.5, 5], [88, 22, 11], [108, 22.5, 15], [124, 29, 12]], r: [7, 8, 7.5, 6, 5], t: 1.5, up: NY },
  { id: 'short-plantar', name: 'Ligamento plantar curto (calcaneocubóideo plantar)', points: [[72, 27, 8], [86, 27, 12], [98, 26.5, 16]], r: 6, t: 1.8, up: NY },
  // dorso e seio do tarso
  { id: 'bifurcate-n', name: 'Ligamento bifurcado — feixe calcaneonavicular', points: [[80, 50, 10], [94, 56, 4], [106, 60, 0]], r: 2.6, t: 1.2, up: Y },
  { id: 'bifurcate-c', name: 'Ligamento bifurcado — feixe calcaneocubóideo', points: [[80, 49, 11], [90, 48, 14], [99, 46, 16]], r: 2.6, t: 1.2, up: Y },
  { id: 'talonav-dorsal', name: 'Ligamento talonavicular dorsal', points: [[82, 74, -2], [94, 71, -5], [106, 66, -7]], r: 5, t: 1.1, up: [0.3, 1, 0] },
  { id: 'interosseous-tc', name: 'Ligamento talocalcâneo interósseo', points: [[64, 61, 5], [63, 56, 6], [63, 50.5, 6.5]], r: 4.5, t: 2.6, up: X },
  { id: 'cervical', name: 'Ligamento cervical', points: [[73, 58, 14], [73, 53, 16], [74, 49, 17]], r: 3.2, t: 1.8, up: X },
  // mediopé
  { id: 'lisfranc', name: 'Ligamento de Lisfranc (cuneiforme medial – 2º metatarso)', points: [[131, 42, -12.5], [135, 44, -10], [139, 46, -8]], r: 3.4, t: 2.4, up: Y },
  { id: 'tmt-d1', name: 'Ligamento tarsometatarsal dorsal (1º)', points: [[133, 58, -19.5], [140, 57.5, -20.5], [148, 55, -21.5]], r: 3.4, t: 0.9, up: Y },
  { id: 'tmt-d2', name: 'Ligamento tarsometatarsal dorsal (2º)', points: [[130, 63, -5], [136, 61.5, -5.5], [143, 59, -6]], r: 3, t: 0.9, up: Y },
  { id: 'tmt-d3', name: 'Ligamento tarsometatarsal dorsal (3º)', points: [[133, 59.5, 7], [139, 58, 7], [146, 55, 6.8]], r: 3, t: 0.9, up: Y },
  { id: 'tmt-d4', name: 'Ligamento tarsometatarsal dorsal (4º)', points: [[112, 46.5, 18], [119, 48.5, 18], [127, 49, 18]], r: 3, t: 0.9, up: Y },
  { id: 'tmt-d5', name: 'Ligamento tarsometatarsal dorsal (5º)', points: [[111, 43, 26], [117, 41.5, 28], [124, 39.5, 29.5]], r: 3, t: 0.9, up: [0, 1, 0.4] },
  { id: 'cuneonav-dorsal', name: 'Ligamentos cuneonaviculares dorsais', points: [[113, 66, -14], [118, 64, -10], [122, 62, -6]], r: 5, t: 0.9, up: Y },
  // antepé
  { id: 'deep-transverse', name: 'Ligamento metatarsal transverso profundo', points: [[195, 15, -27], [202, 12.5, -12], [198, 12, 2.5], [191, 11.5, 16], [180, 10.5, 32]], r: 2.6, t: 1.6, up: Y },
];
ligaments.forEach((l) => { l.kind = 'ligament'; l.caps = R; });

// ------------------------------------------------------------------ FÁSCIAS E RETINÁCULOS
export const fascia = [
  {
    id: 'plantar-fascia', name: 'Fáscia (aponeurose) plantar — banda central', kind: 'fascia', caps: R,
    points: [[22, 11.5, -4], [45, 9.5, -1], [80, 9.6, 3.5], [120, 11, 3], [158, 12.5, 1]],
    r: [7, 9.5, 10.5, 14, 21], t: [1.5, 1.3, 1.1, 0.9, 0.8], up: Y,
  },
  {
    id: 'plantar-fascia-lat', name: 'Fáscia plantar — banda lateral', kind: 'fascia', caps: R,
    points: [[26, 13, 11], [60, 12, 23], [95, 14, 32], [116, 23, 37]], r: [4, 5, 4.5, 3], t: 0.8, up: [0, 1, 0.3],
  },
  ...[
    [[158, 13, -17.5], [180, 11.5, -26], [193, 8.5, -30.5], [205, 14.5, -32]],
    [[158, 12, -7], [182, 10, -10.5], [197, 8.5, -12], [211, 14.5, -12.5]],
    [[158, 12, 4], [180, 10, 3], [193, 8.5, 2.5], [207, 14, 2.5]],
    [[158, 12, 13], [176, 10, 15], [188, 8.5, 16], [200, 13.5, 16]],
    [[156, 12, 22], [170, 10, 29], [180, 8.5, 33], [190, 12, 33.5]],
  ].map((points, i) => ({
    id: `plantar-fascia-slip${i + 1}`, name: `Fáscia plantar — faixa digital (${i + 1}º raio)`, kind: 'fascia', caps: R,
    points, r: [4, 3.6, 3.2, 2.4], t: 0.7, up: Y,
  })),
  {
    id: 'ret-ext-sup', name: 'Retináculo superior dos extensores', kind: 'retinaculum', caps: R,
    points: [[50, 122, 24.5], [62, 121, 24], [75, 119, 19.5], [85.5, 117, 11.5], [92, 115, 0], [91, 113, -10], [82, 112, -19], [69, 110, -23]],
    r: 9, t: 0.6,
    up: [[-0.2, 0, 1], [0.3, 0, 1], [0.7, 0, 0.7], [0.9, 0, 0.4], [1, 0, 0], [1, 0, -0.3], [0.6, 0, -0.8], [0, 0, -1]],
  },
  {
    id: 'ret-ext-inf', name: 'Retináculo inferior dos extensores', kind: 'retinaculum', caps: R,
    points: [[80, 52, 24], [90, 64, 20.5], [98, 76, 14], [101.5, 84, 4], [99, 86, -7], [88, 87.5, -18], [72, 88, -24]],
    r: 4.5, t: 0.6,
    up: [[0.2, 0.3, 1], [0.5, 0.5, 0.7], [0.6, 0.7, 0.4], [0.6, 0.8, 0], [0.6, 0.7, -0.4], [0.3, 0.4, -0.9], [0, 0, -1]],
  },
  {
    id: 'ret-ext-inf-2', name: 'Retináculo inferior dos extensores — feixe distal', kind: 'retinaculum', caps: R,
    points: [[102, 82, 6], [110, 76, -6], [117, 66, -19], [121, 56, -29.5]],
    r: 4, t: 0.6, up: [[0.5, 0.85, 0], [0.4, 0.8, -0.4], [0.2, 0.5, -0.85], [0, 0.1, -1]],
  },
  {
    id: 'ret-flex', name: 'Retináculo dos flexores (teto do túnel do tarso)', kind: 'retinaculum', caps: R,
    points: [[63, 79, -28.5], [52, 68, -34.5], [41, 56, -29], [34, 46, -23]],
    r: 5.5, t: 0.5, up: [[0.1, 0, -1], [-0.2, 0, -1], [-0.4, 0, -0.9], [-0.5, 0, -0.8]],
  },
  {
    id: 'ret-per-sup', name: 'Retináculo superior dos fibulares', kind: 'retinaculum', caps: R,
    points: [[49, 73, 34], [42, 70, 38], [34, 62, 33], [29, 53, 24]],
    r: 5, t: 0.6, up: [[0.3, 0, 1], [-0.2, 0, 1], [-0.6, 0, 0.8], [-0.8, 0, 0.5]],
  },
];

// ------------------------------------------------------------------ VASOS
export const vessels = [
  // artérias
  {
    id: 'a-tib-ant', name: 'Artéria tibial anterior → dorsal do pé', kind: 'artery', caps: F,
    points: [[67, 200, 13], [73, 165, 9], [81, 125, 3], [88, 100, -1], [96, 84, -3.5], [110, 74, -6], [129, 63, -9], [140, 56.5, -12], [146, 50, -14], [150, 40, -16], [152, 31, -16]],
    r: [1.7, 1.7, 1.6, 1.6, 1.6, 1.5, 1.4, 1.3, 1.3, 1.2, 1.1],
  },
  { id: 'a-arcuate', name: 'Artéria arqueada', kind: 'artery', caps: R, points: [[141, 56, -11], [150, 51, 1], [148, 46, 14], [139, 40, 25]], r: 0.8 },
  { id: 'a-dmt1', name: 'Artéria metatarsal dorsal (1ª)', kind: 'artery', caps: R, points: [[146, 52, -14], [172, 43, -19], [200, 33, -22]], r: 0.7 },
  ...[
    [[150, 53, 1], [176, 42, -5], [203, 30, -6]],
    [[148, 47, 14], [174, 36, 9], [197, 26, 9]],
    [[139, 41, 25], [165, 30, 24.5], [189, 22, 25]],
  ].map((points, i) => ({ id: `a-dmt${i + 2}`, name: `Artéria metatarsal dorsal (${i + 2}ª)`, kind: 'artery', caps: R, points, r: 0.6 })),
  { id: 'a-lat-tarsal', name: 'Artéria tarsal lateral', kind: 'artery', caps: R, points: [[101, 79, -3], [102, 68, 12], [107, 54, 25]], r: 0.8 },
  {
    id: 'a-tib-post', name: 'Artéria tibial posterior', kind: 'artery', caps: F,
    points: [[50, 200, -4], [48, 150, -10], [46, 110, -18], [46, 90, -30], [46.5, 76, -35.5], [50, 62, -34], [58, 47, -28.5]],
    r: [1.9, 1.9, 1.8, 1.8, 1.7, 1.6, 1.5],
  },
  { id: 'a-med-plantar', name: 'Artéria plantar medial', kind: 'artery', caps: R, points: [[58, 47, -28.5], [80, 33, -29], [120, 24.5, -29], [160, 18.5, -31], [190, 14.5, -35]], r: [1.1, 1, 0.9, 0.8, 0.6] },
  { id: 'a-lat-plantar', name: 'Artéria plantar lateral e arco plantar', kind: 'artery', caps: R, points: [[58, 47, -28.5], [70, 35, -16], [90, 27.5, 2], [110, 25.5, 18], [128, 27, 26], [141, 31, 22], [149, 34, 8], [152, 34, -6], [152, 32, -15]], r: [1.3, 1.2, 1.2, 1.1, 1, 1, 1, 1, 1] },
  { id: 'a-calc-med', name: 'Ramos calcâneos mediais', kind: 'artery', caps: R, points: [[47, 74, -35], [37, 48, -28], [28, 27, -20]], r: 0.55 },
  {
    id: 'a-fibular', name: 'Artéria fibular e ramos calcâneos laterais', kind: 'artery', caps: F,
    points: [[48, 200, 9], [45, 150, 13], [43, 110, 16], [41, 90, 18], [39, 74, 21], [35, 54, 25.5], [30, 35, 24.5]],
    r: [1.3, 1.3, 1.2, 1.1, 1, 0.8, 0.6],
  },
  // veias
  {
    id: 'v-saph-great', name: 'Veia safena magna', kind: 'vein', caps: F,
    points: [[54, 200, -35], [65, 150, -32], [72, 110, -30.5], [77, 92, -30], [87, 77, -30], [100, 63, -32], [122, 55, -30.5], [150, 51, -24], [165, 47, -10], [168, 44, 6], [163, 40, 20], [150, 36, 32]],
    r: [2.3, 2.2, 2.1, 2, 2, 1.9, 1.8, 1.6, 1.5, 1.5, 1.5, 1.6],
  },
  {
    id: 'v-saph-small', name: 'Veia safena parva', kind: 'vein', caps: F,
    points: [[18, 200, 8], [20, 160, 14], [24, 120, 22], [31, 82, 32], [43, 59, 37], [62, 41, 39], [90, 30.5, 40.5], [125, 30, 39], [150, 36, 32]],
    r: [2.0, 2.0, 1.9, 1.8, 1.7, 1.6, 1.6, 1.6, 1.6],
  },
  {
    id: 'v-tib-post-1', name: 'Veias tibiais posteriores (comitantes)', kind: 'vein', caps: F,
    points: [[48, 200, -1], [46.5, 150, -7.5], [44.5, 110, -15.5], [44, 90, -27.5], [44, 77, -33.5], [48, 63, -32.5], [56, 48, -27]],
    r: 1.4,
  },
  {
    id: 'v-tib-post-2', name: 'Veias tibiais posteriores (comitantes) — par', kind: 'vein', caps: F,
    points: [[52.5, 200, -6.5], [50.5, 150, -12.5], [48.5, 110, -20.5], [48.5, 90, -32.5], [49, 76, -37], [52, 61, -35.5], [60, 46, -30]],
    r: 1.4,
  },
];

// ------------------------------------------------------------------ NERVOS
export const nerves = [
  {
    id: 'n-tibial', name: 'Nervo tibial', kind: 'nerve', caps: F,
    points: [[43, 200, -2], [43, 150, -8], [42.5, 110, -16], [42, 89, -27.5], [42.5, 75, -32], [47, 61, -31], [55, 47, -25.5]],
    r: [2.4, 2.4, 2.3, 2.2, 2.1, 2, 1.9],
  },
  { id: 'n-med-plantar', name: 'Nervo plantar medial', kind: 'nerve', caps: R, points: [[55, 47, -25.5], [80, 31, -25.5], [120, 23, -25.5], [150, 19, -26.5], [168, 16, -27]], r: [1.5, 1.4, 1.3, 1.2, 1] },
  ...[
    [[168, 16, -27], [190, 12, -36], [230, 12.5, -39.5]],
    [[168, 16, -27], [185, 12.5, -21], [205, 12, -22]],
    [[168, 16, -27], [184, 12.5, -8], [204, 12, -5]],
    [[160, 17, -20], [180, 12.5, 5], [200, 12, 9]],
  ].map((points, i) => ({ id: `n-dig-med${i + 1}`, name: `Nervo digital plantar comum/próprio (ramo medial ${i + 1})`, kind: 'nerve', caps: R, points, r: 0.65 })),
  { id: 'n-lat-plantar', name: 'Nervo plantar lateral', kind: 'nerve', caps: R, points: [[55, 47, -25.5], [70, 33.5, -14], [90, 25.5, 4], [110, 22.5, 20], [140, 20, 29], [165, 16, 30]], r: [1.3, 1.2, 1.1, 1, 0.9, 0.8] },
  ...[
    [[165, 16, 30], [182, 12, 31], [207, 12, 37.5]],
    [[160, 17, 26], [176, 12, 19], [198, 11.5, 24]],
  ].map((points, i) => ({ id: `n-dig-lat${i + 1}`, name: `Nervo digital plantar (ramo lateral ${i + 1})`, kind: 'nerve', caps: R, points, r: 0.6 })),
  { id: 'n-calc-med', name: 'Ramos calcâneos mediais do nervo tibial', kind: 'nerve', caps: R, points: [[43, 82, -32], [35, 52, -29], [29, 24, -17]], r: 0.6 },
  { id: 'n-baxter', name: 'Nervo de Baxter (1º ramo do plantar lateral)', kind: 'nerve', caps: R, points: [[60, 44, -24], [42, 24, -12], [34, 19, 5], [41, 18, 18]], r: 0.55 },
  {
    id: 'n-sural', name: 'Nervo sural', kind: 'nerve', caps: F,
    points: [[16, 200, 10], [22, 150, 18], [30, 102, 28.5], [38, 76, 35], [47, 57, 38.5], [70, 40, 41.5], [110, 31.5, 42.5], [150, 25.5, 40.5], [185, 20, 39.5], [205, 16, 39]],
    r: [1.4, 1.3, 1.2, 1.1, 1.0, 0.95, 0.9, 0.85, 0.75, 0.6],
  },
  {
    id: 'n-fib-sup', name: 'Nervo fibular superficial', kind: 'nerve', caps: F,
    points: [[61, 200, 35], [75, 150, 31], [86, 112, 23], [92, 94, 15], [98, 85, 9]],
    r: [1.5, 1.4, 1.3, 1.2, 1.1],
  },
  ...[
    [[98, 85, 9], [118, 73, -9], [150, 59, -22], [200, 39, -33]],
    [[150, 59, -22], [175, 50, -16], [198, 37, -18]],
    [[98, 85, 9], [130, 65, 19], [170, 45, 14], [200, 30, 12]],
    [[170, 45, 14], [186, 37, 22], [202, 27, 26]],
  ].map((points, i) => ({ id: `n-fib-sup-b${i + 1}`, name: `Nervo cutâneo dorsal (ramo ${i + 1} do fibular superficial)`, kind: 'nerve', caps: R, points, r: 0.6 })),
  {
    id: 'n-fib-deep', name: 'Nervo fibular profundo', kind: 'nerve', caps: F,
    points: [[65, 200, 15], [72, 165, 11], [79.5, 125, 5], [86, 100, 1], [95, 86, -0.5], [113, 73, -4], [138, 56, -10], [175, 40, -19], [205, 33, -21.5]],
    r: [1.3, 1.25, 1.2, 1.15, 1.1, 1, 0.9, 0.8, 0.6],
  },
  {
    id: 'n-saphenous', name: 'Nervo safeno', kind: 'nerve', caps: F,
    points: [[57, 200, -35.5], [67, 150, -31], [74, 110, -29], [79, 92, -28.5], [89, 77, -28.5], [101, 65, -30]],
    r: 0.8,
  },
];
