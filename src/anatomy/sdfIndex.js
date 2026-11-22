// Lista de todas as estruturas geradas por SDF (usada pelo worker e pela thread principal).
import { boneDefs, cartilageDefs, calcaneusNormal, haglundBump, boneShapes } from './bones.js';
import {
  skinShape, skinWeight, nailShape, kagerShape, heelPadShape, bursaRetroShape, bursaSubcutShape,
} from './soft.js';

const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Peso de destaque da deformidade de Haglund: perto da proeminência e fora do contorno normal.
const hf = haglundBump.f, nf = boneShapes.calcNormal.f;
function haglundWeight(x, y, z) {
  // intensidade proporcional ao excesso ósseo além do contorno normal (0,3 a 4 mm)
  const near = clamp01((4 - hf(x, y, z)) / 4);
  const out = clamp01((nf(x, y, z) - 0.3) / 3.7);
  return smooth(near) * Math.sqrt(out);
}

export const sdfStructures = [
  ...boneDefs.map((d) => ({ ...d, layer: 'bones', weight: d.highlight === 'haglund' ? haglundWeight : null })),
  ...cartilageDefs.map((d) => ({ ...d, layer: 'cartilage' })),
  { ...calcaneusNormal, layer: 'compare', hiddenFromList: true },
  { id: 'skin', name: 'Pele', layer: 'skin', shape: skinShape, step: 1.55, weight: skinWeight, openTop: true, smooth: 1, ao: true },
  { id: 'nails', name: 'Unhas', layer: 'skin', shape: nailShape, step: 0.45 },
  { id: 'kager', name: 'Gordura de Kager (pré-aquileana)', layer: 'bursae', shape: kagerShape, step: 1.0 },
  { id: 'heelpad', name: 'Coxim adiposo do calcanhar', layer: 'bursae', shape: heelPadShape, step: 1.0 },
  { id: 'bursa-retro', name: 'Bursa retrocalcânea (inflamada)', layer: 'bursae', shape: bursaRetroShape, step: 0.45, pathology: true },
  { id: 'bursa-subcut', name: 'Bursa subcutânea do calcâneo (retroaquileana)', layer: 'bursae', shape: bursaSubcutShape, step: 0.45, pathology: true },
];

export function estimateCost(def) {
  const b = def.shape.b;
  const vol = (b[3] - b[0] + 4) * (b[4] - b[1] + 4) * (b[5] - b[2] + 4);
  return vol / (def.step ** 3);
}
