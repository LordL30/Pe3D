// Worker que converte as estruturas SDF em malhas, fora da thread principal.
import { sdfStructures } from './anatomy/sdfIndex.js';
import { buildSDFMesh } from './buildMesh.js';

const byId = new Map(sdfStructures.map((d) => [d.id, d]));

self.onmessage = (e) => {
  const { ids, quality } = e.data;
  for (const id of ids) {
    const def = byId.get(id);
    if (!def) continue;
    const m = buildSDFMesh(def, quality);
    const transfer = [m.positions.buffer, m.normals.buffer, m.indices.buffer];
    if (m.weights) transfer.push(m.weights.buffer);
    if (m.ao) transfer.push(m.ao.buffer);
    self.postMessage({ id, mesh: m }, transfer);
  }
  self.postMessage({ done: true });
};
