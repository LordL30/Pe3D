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
  if (def.ao) m.ao = ambientOcclusion(def.shape.f, m.positions, m.normals);
  return m;
}

// Oclusão ambiente a partir do próprio campo de distância: amostra ao longo da normal e mede
// quanto a superfície vizinha "fecha" o espaço (dobras entre os dedos, maléolos, arco).
const AO_H = [1.8, 4.5, 9, 15];
const AO_W = [0.32, 0.3, 0.22, 0.16];
function ambientOcclusion(f, pos, nor) {
  const n = pos.length / 3;
  const ao = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const nx = nor[i * 3], ny = nor[i * 3 + 1], nz = nor[i * 3 + 2];
    let occ = 0;
    for (let k = 0; k < AO_H.length; k++) {
      const h = AO_H[k];
      // o solo também oclui
      const d = Math.min(f(x + nx * h, y + ny * h, z + nz * h), y + ny * h + 0.5);
      occ += AO_W[k] * Math.max(0, (h - d) / h);
    }
    ao[i] = Math.max(0, Math.min(1, 1 - occ * 1.15));
  }
  return ao;
}
