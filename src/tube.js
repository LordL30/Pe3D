// Gera tubos de seção elíptica ao longo de curvas Catmull-Rom (tendões, músculos, vasos, nervos, ligamentos).
import * as THREE from 'three';

const tmp = new THREE.Vector3();

function sampleArray(arr, u) {
  // u em [0, n-1]; interpolação cosseno entre valores por ponto
  if (!Array.isArray(arr)) return arr;
  const n = arr.length;
  if (n === 1) return arr[0];
  const i = Math.min(Math.floor(u), n - 2);
  const f = u - i;
  const s = (1 - Math.cos(f * Math.PI)) / 2;
  return arr[i] * (1 - s) + arr[i + 1] * s;
}

function sampleVecArray(arr, u) {
  if (!Array.isArray(arr[0])) return arr;
  const n = arr.length;
  const i = Math.min(Math.floor(u), n - 2);
  const f = u - i;
  const s = (1 - Math.cos(f * Math.PI)) / 2;
  return [0, 1, 2].map((k) => arr[i][k] * (1 - s) + arr[i + 1][k] * s);
}

// def: { points, r (meia-largura), t (meia-espessura, padrão = r), up (direção da espessura, opcional,
//        vetor ou lista por ponto), seg (amostras por trecho), radial, caps: ['round'|'flat'|'none', ...] }
export function buildTube(def) {
  const pts = def.points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const nPts = pts.length;
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  const len = curve.getLength();
  const segPer = def.seg || Math.max(6, Math.round(len / (nPts - 1) / 2.2));
  const S = (nPts - 1) * segPer;
  const radial = def.radial || 12;
  const rArr = def.r, tArr = def.t ?? def.r;
  const caps = def.caps || ['round', 'round'];

  // amostras e referenciais
  const P = [], T = [], N = [], B = [], W = [], H = [], V = [];
  let arc = 0;
  let prevN = null;
  for (let i = 0; i <= S; i++) {
    const t = i / S;
    const u = t * (nPts - 1);
    const p = curve.getPoint(t);
    const tg = curve.getTangent(t).normalize();
    if (i > 0) arc += p.distanceTo(P[i - 1]);
    let n;
    if (def.up) {
      const up = sampleVecArray(def.up, u);
      n = new THREE.Vector3(up[0], up[1], up[2]);
      n.addScaledVector(tg, -n.dot(tg));
      if (n.lengthSq() < 1e-6) n = prevN ? prevN.clone() : new THREE.Vector3(0, 1, 0);
      n.normalize();
    } else if (!prevN) {
      // perpendicular arbitrária
      const a = Math.abs(tg.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      n = a.addScaledVector(tg, -a.dot(tg)).normalize();
    } else {
      // transporte paralelo
      n = prevN.clone().addScaledVector(tg, -prevN.dot(tg));
      if (n.lengthSq() < 1e-8) n = new THREE.Vector3(0, 1, 0);
      n.normalize();
    }
    prevN = n;
    const b = new THREE.Vector3().crossVectors(tg, n).normalize();
    P.push(p); T.push(tg); N.push(n); B.push(b);
    W.push(sampleArray(rArr, u));
    H.push(sampleArray(tArr, u));
    V.push(arc);
  }

  const positions = [], normals = [], uvs = [], indices = [];
  const ring = (center, tg, n, b, w, h, v, scale = 1, normalBias = 0) => {
    const start = positions.length / 3;
    for (let j = 0; j <= radial; j++) {
      const th = (j / radial) * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      const px = center.x + (b.x * w * c + n.x * h * s) * scale;
      const py = center.y + (b.y * w * c + n.y * h * s) * scale;
      const pz = center.z + (b.z * w * c + n.z * h * s) * scale;
      positions.push(px, py, pz);
      tmp.set(0, 0, 0).addScaledVector(b, c / w).addScaledVector(n, s / h).normalize();
      if (normalBias) tmp.multiplyScalar(1 - Math.abs(normalBias)).addScaledVector(tg, normalBias).normalize();
      normals.push(tmp.x, tmp.y, tmp.z);
      uvs.push(j / radial, v / 18);
    }
    return start;
  };
  const connect = (a, b) => {
    for (let j = 0; j < radial; j++) {
      const i0 = a + j, i1 = a + j + 1, i2 = b + j, i3 = b + j + 1;
      indices.push(i0, i2, i1, i1, i2, i3);
    }
  };

  const rings = [];
  // tampa inicial
  if (caps[0] === 'round') {
    const K = 4;
    const rr = Math.min(W[0], H[0]);
    for (let k = K; k >= 1; k--) {
      const phi = (k / (K + 0.0001)) * (Math.PI / 2);
      const c = P[0].clone().addScaledVector(T[0], -rr * Math.sin(phi) * 0.9);
      rings.push(ring(c, T[0], N[0], B[0], W[0], H[0], V[0] - rr * Math.sin(phi), Math.max(Math.cos(phi), 0.04), -Math.sin(phi)));
    }
  }
  for (let i = 0; i <= S; i++) rings.push(ring(P[i], T[i], N[i], B[i], W[i], H[i], V[i]));
  if (caps[1] === 'round') {
    const K = 4;
    const L = S;
    const rr = Math.min(W[L], H[L]);
    for (let k = 1; k <= K; k++) {
      const phi = (k / (K + 0.0001)) * (Math.PI / 2);
      const c = P[L].clone().addScaledVector(T[L], rr * Math.sin(phi) * 0.9);
      rings.push(ring(c, T[L], N[L], B[L], W[L], H[L], V[L] + rr * Math.sin(phi), Math.max(Math.cos(phi), 0.04), Math.sin(phi)));
    }
  }
  for (let r = 0; r < rings.length - 1; r++) connect(rings[r], rings[r + 1]);

  // tampas planas
  const flatCap = (idx, sign) => {
    const i = idx;
    const center = positions.length / 3;
    positions.push(P[i].x, P[i].y, P[i].z);
    normals.push(T[i].x * sign, T[i].y * sign, T[i].z * sign);
    uvs.push(0.5, 0.5);
    const start = positions.length / 3;
    for (let j = 0; j <= radial; j++) {
      const th = (j / radial) * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      positions.push(
        P[i].x + B[i].x * W[i] * c + N[i].x * H[i] * s,
        P[i].y + B[i].y * W[i] * c + N[i].y * H[i] * s,
        P[i].z + B[i].z * W[i] * c + N[i].z * H[i] * s,
      );
      normals.push(T[i].x * sign, T[i].y * sign, T[i].z * sign);
      uvs.push(0.5 + c * 0.5, 0.5 + s * 0.5);
    }
    for (let j = 0; j < radial; j++) {
      if (sign < 0) indices.push(center, start + j, start + j + 1);
      else indices.push(center, start + j + 1, start + j);
    }
  };
  if (caps[0] === 'flat') flatCap(0, -1);
  if (caps[1] === 'flat') flatCap(S, 1);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeBoundingSphere();
  return g;
}
