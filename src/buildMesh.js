// Constrói a malha de uma estrutura SDF (usado no worker e como alternativa na thread principal).
import { meshSDF, smoothMesh } from './sdf.js';

export function buildSDFMesh(def, quality = 1) {
  const step = def.step / quality;
  const m = meshSDF(def.shape, { step });
  if (def.smooth) smoothMesh(m, def.smooth);
  if (def.weight) {
    const n = m.positions.length / 3;
    const w = new Float32Array(n);
    const p = m.positions;
    for (let i = 0; i < n; i++) w[i] = def.weight(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]);
    m.weights = w;
  }
  return m;
}
