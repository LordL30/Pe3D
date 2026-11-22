// Funções de distância com sinal (SDF) e um gerador de malha (surface nets).
// Unidades: milímetros. Eixos: x = anterior (calcanhar -> dedos), y = superior, z = lateral (pé direito).
// Todas as funções avaliam escalares (x, y, z) para evitar alocações no laço quente.

const { sqrt, max, min, abs, cos, sin, PI } = Math;
const INF = 1e9;

// ---------- utilidades de rotação ----------
function norm3(v) {
  const l = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
function cross3(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

// Base local a partir de um eixo principal (x local) e de um vetor "para cima" aproximado (y local).
// Retorna a matriz R (colunas = eixos locais em coordenadas do mundo), em ordem linha-major.
export function basis(xdir, yhint = [0, 1, 0]) {
  const X = norm3(xdir);
  let Z = cross3(X, yhint);
  if (Z[0] * Z[0] + Z[1] * Z[1] + Z[2] * Z[2] < 1e-8) Z = cross3(X, [0, 0, 1]);
  Z = norm3(Z);
  const Y = cross3(Z, X);
  return [X[0], Y[0], Z[0], X[1], Y[1], Z[1], X[2], Y[2], Z[2]];
}

// Rotação a partir de ângulos de Euler em graus (R = Rz * Ry * Rx).
export function euler(deg) {
  const [ax, ay, az] = deg.map((d) => (d * PI) / 180);
  const cx = cos(ax), sx = sin(ax), cy = cos(ay), sy = sin(ay), cz = cos(az), sz = sin(az);
  return [
    cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx,
    sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx,
    -sy, cy * sx, cy * cx,
  ];
}

function toRot(rot) {
  if (!rot) return null;
  if (rot.length === 9) return rot;
  return euler(rot);
}

// ---------- primitivas ----------
// Cada primitiva é { f(x,y,z) -> distância, b: [minx,miny,minz,maxx,maxy,maxz] }

export function sphere(c, r) {
  const [cx, cy, cz] = c;
  return {
    f: (x, y, z) => {
      const dx = x - cx, dy = y - cy, dz = z - cz;
      return sqrt(dx * dx + dy * dy + dz * dz) - r;
    },
    b: [cx - r, cy - r, cz - r, cx + r, cy + r, cz + r],
  };
}

// Elipsoide (aproximação de Inigo Quilez). rot: Euler em graus ou matriz de basis().
export function ellipsoid(c, rad, rot) {
  const [cx, cy, cz] = c;
  const [rx, ry, rz] = rad;
  const R = toRot(rot);
  const irx = 1 / rx, iry = 1 / ry, irz = 1 / rz;
  const irx2 = irx * irx, iry2 = iry * iry, irz2 = irz * irz;
  const rm = max(rx, ry, rz);
  const f = R
    ? (x, y, z) => {
        const dx = x - cx, dy = y - cy, dz = z - cz;
        const lx = R[0] * dx + R[3] * dy + R[6] * dz;
        const ly = R[1] * dx + R[4] * dy + R[7] * dz;
        const lz = R[2] * dx + R[5] * dy + R[8] * dz;
        const a = lx * irx, b = ly * iry, d = lz * irz;
        const k0 = sqrt(a * a + b * b + d * d);
        const e = lx * irx2, g = ly * iry2, h = lz * irz2;
        const k1 = sqrt(e * e + g * g + h * h) || 1e-9;
        return (k0 * (k0 - 1)) / k1;
      }
    : (x, y, z) => {
        const lx = x - cx, ly = y - cy, lz = z - cz;
        const a = lx * irx, b = ly * iry, d = lz * irz;
        const k0 = sqrt(a * a + b * b + d * d);
        const e = lx * irx2, g = ly * iry2, h = lz * irz2;
        const k1 = sqrt(e * e + g * g + h * h) || 1e-9;
        return (k0 * (k0 - 1)) / k1;
      };
  return { f, b: [cx - rm, cy - rm, cz - rm, cx + rm, cy + rm, cz + rm] };
}

// Cone arredondado entre a (raio r1) e b (raio r2). Com r1 = r2 é uma cápsula.
export function cone(a, b, r1, r2 = r1) {
  const [ax, ay, az] = a;
  const bax = b[0] - ax, bay = b[1] - ay, baz = b[2] - az;
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const srr = Math.sign(rr) * rr * rr;
  const rm = max(r1, r2);
  return {
    f: (x, y, z) => {
      const pax = x - ax, pay = y - ay, paz = z - az;
      const yy = pax * bax + pay * bay + paz * baz;
      const zz = yy - l2;
      const qx = pax * l2 - bax * yy, qy = pay * l2 - bay * yy, qz = paz * l2 - baz * yy;
      const x2 = qx * qx + qy * qy + qz * qz;
      const y2 = yy * yy * l2;
      const z2 = zz * zz * l2;
      const k = srr * x2;
      if (Math.sign(zz) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
      if (Math.sign(yy) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
      return (sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
    },
    b: [
      min(ax - r1, b[0] - r2), min(ay - r1, b[1] - r2), min(az - r1, b[2] - r2),
      max(ax + r1, b[0] + r2), max(ay + r1, b[1] + r2), max(az + r1, b[2] + r2),
    ],
  };
}

// Cápsula achatada: cone arredondado avaliado num espaço escalonado (aproximação).
// s = [sx, sy, sz] escala no referencial local (rot), útil para tiras e lâminas.
export function flatCone(a, b, r1, r2, flat, up = [0, 1, 0]) {
  // flat: razão de espessura (0..1) na direção "up" perpendicular ao eixo
  const dir = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const R = basis(dir, up);
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const len = sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2);
  const inner = cone([-len / 2, 0, 0], [len / 2, 0, 0], r1, r2);
  const iflat = 1 / flat;
  const [cx, cy, cz] = mid;
  const rm = max(r1, r2) + len / 2;
  return {
    f: (x, y, z) => {
      const dx = x - cx, dy = y - cy, dz = z - cz;
      const lx = R[0] * dx + R[3] * dy + R[6] * dz;
      const ly = R[1] * dx + R[4] * dy + R[7] * dz;
      const lz = R[2] * dx + R[5] * dy + R[8] * dz;
      return inner.f(lx, ly * iflat, lz) * flat;
    },
    b: [cx - rm, cy - rm, cz - rm, cx + rm, cy + rm, cz + rm],
  };
}

// Caixa com cantos arredondados. half = semi-dimensões, r = raio do arredondamento.
export function box(c, half, rot, r = 0) {
  const [cx, cy, cz] = c;
  const [hx, hy, hz] = half;
  const R = toRot(rot);
  const bx = hx - r, by = hy - r, bz = hz - r;
  const rm = sqrt(hx * hx + hy * hy + hz * hz);
  return {
    f: (x, y, z) => {
      const dx = x - cx, dy = y - cy, dz = z - cz;
      let lx = dx, ly = dy, lz = dz;
      if (R) {
        lx = R[0] * dx + R[3] * dy + R[6] * dz;
        ly = R[1] * dx + R[4] * dy + R[7] * dz;
        lz = R[2] * dx + R[5] * dy + R[8] * dz;
      }
      const qx = abs(lx) - bx, qy = abs(ly) - by, qz = abs(lz) - bz;
      const mx = max(qx, 0), my = max(qy, 0), mz = max(qz, 0);
      return sqrt(mx * mx + my * my + mz * mz) + min(max(qx, max(qy, qz)), 0) - r;
    },
    b: R ? [cx - rm, cy - rm, cz - rm, cx + rm, cy + rm, cz + rm] : [cx - hx, cy - hy, cz - hz, cx + hx, cy + hy, cz + hz],
  };
}

// Semiespaço: dentro onde dot(n, p - p0) < 0.
export function plane(p0, n) {
  const [nx, ny, nz] = norm3(n);
  const d = nx * p0[0] + ny * p0[1] + nz * p0[2];
  const b = [-INF, -INF, -INF, INF, INF, INF];
  // semiespaço alinhado a um eixo: limita a caixa envolvente
  const ax = [nx, ny, nz].findIndex((v) => Math.abs(Math.abs(v) - 1) < 1e-9);
  if (ax >= 0) {
    const sgn = [nx, ny, nz][ax];
    if (sgn > 0) b[ax + 3] = p0[ax]; else b[ax] = p0[ax];
  }
  return { f: (x, y, z) => nx * x + ny * y + nz * z - d, b, unbounded: true, halfspace: true };
}

// ---------- combinadores ----------
function smin(a, b, k) {
  if (k <= 0) return a < b ? a : b;
  const h = max(k - abs(a - b), 0) / k;
  return min(a, b) - h * h * k * 0.25;
}
function smax(a, b, k) {
  return -smin(-a, -b, k);
}

function boxDist(b, x, y, z) {
  const dx = max(b[0] - x, 0, x - b[3]);
  const dy = max(b[1] - y, 0, y - b[4]);
  const dz = max(b[2] - z, 0, z - b[5]);
  return sqrt(dx * dx + dy * dy + dz * dz);
}

// União suave com descarte por caixa envolvente.
export function union(k, ...children) {
  children = children.flat().filter(Boolean);
  const n = children.length;
  const fs = children.map((c) => c.f);
  const bs = children.map((c) => c.b);
  const ub = children.map((c) => !!c.unbounded);
  const b = [INF, INF, INF, -INF, -INF, -INF];
  for (const c of children) {
    for (let i = 0; i < 3; i++) {
      b[i] = min(b[i], c.b[i]);
      b[i + 3] = max(b[i + 3], c.b[i + 3]);
    }
  }
  const lbs = new Float64Array(n);
  return {
    f: (x, y, z) => {
      // avalia primeiro o filho mais próximo; os demais só se puderem influenciar o resultado
      let best = 0, bestLb = INF;
      for (let i = 0; i < n; i++) {
        const lb = ub[i] ? -INF : boxDist(bs[i], x, y, z);
        lbs[i] = lb;
        if (lb < bestLb) { bestLb = lb; best = i; }
      }
      let d = fs[best](x, y, z);
      for (let i = 0; i < n; i++) {
        if (i === best || lbs[i] > d + k) continue;
        d = smin(d, fs[i](x, y, z), k);
      }
      return d;
    },
    b,
  };
}

// a menos b (subtração suave)
export function subtract(k, a, ...bs) {
  const b = bs.length === 1 ? bs[0] : union(0, ...bs);
  const fa = a.f, fb = b.f, bb = b.b;
  return {
    f: (x, y, z) => {
      const da = fa(x, y, z);
      if (!b.unbounded && boxDist(bb, x, y, z) > k + max(da, 0) + 1) return da;
      return smax(da, -fb(x, y, z), k);
    },
    b: a.b,
  };
}

// interseção suave
export function intersect(k, a, b) {
  const fa = a.f, fb = b.f;
  const bb = (a.unbounded && !a.halfspace) ? b.b : (b.unbounded && !b.halfspace) ? a.b : [
    max(a.b[0], b.b[0]), max(a.b[1], b.b[1]), max(a.b[2], b.b[2]),
    min(a.b[3], b.b[3]), min(a.b[4], b.b[4]), min(a.b[5], b.b[5]),
  ];
  return { f: (x, y, z) => smax(fa(x, y, z), fb(x, y, z), k), b: bb };
}

// Dilata (r > 0) ou contrai (r < 0) uma forma.
export function offset(a, r) {
  const fa = a.f;
  return {
    f: (x, y, z) => fa(x, y, z) - r,
    b: [a.b[0] - r, a.b[1] - r, a.b[2] - r, a.b[3] + r, a.b[4] + r, a.b[5] + r],
  };
}

// Casca: região entre a superfície e um desvio para fora de espessura t (fora do sólido).
export function shell(a, t) {
  const fa = a.f;
  return {
    f: (x, y, z) => {
      const d = fa(x, y, z);
      return max(d - t, -d);
    },
    b: [a.b[0] - t, a.b[1] - t, a.b[2] - t, a.b[3] + t, a.b[4] + t, a.b[5] + t],
  };
}

// ---------- gerador de malha: naive surface nets ----------
// Retorna { positions, normals, indices } (Float32Array / Uint32Array).
export function meshSDF(shape, opts = {}) {
  const f = shape.f;
  const step = opts.step || 1;
  const pad = step * 2;
  const bb = opts.bounds || shape.b;
  const x0 = bb[0] - pad, y0 = bb[1] - pad, z0 = bb[2] - pad;
  const nx = Math.ceil((bb[3] + pad - x0) / step) + 1;
  const ny = Math.ceil((bb[4] + pad - y0) / step) + 1;
  const nz = Math.ceil((bb[5] + pad - z0) / step) + 1;
  const sxy = nx * ny;
  const N = nx * ny * nz;
  const V = new Float32Array(N);

  // Avaliação em dois níveis: grade grossa e refinamento só perto da superfície.
  const C = 3; // fator grosso
  const cnx = Math.ceil((nx - 1) / C) + 1, cny = Math.ceil((ny - 1) / C) + 1, cnz = Math.ceil((nz - 1) / C) + 1;
  const useCoarse = N > 60000;
  if (useCoarse) {
    const cs = step * C;
    const CV = new Float32Array(cnx * cny * cnz);
    for (let k = 0; k < cnz; k++) {
      const z = z0 + k * cs;
      for (let j = 0; j < cny; j++) {
        const y = y0 + j * cs;
        let idx = (k * cny + j) * cnx;
        for (let i = 0; i < cnx; i++, idx++) CV[idx] = f(x0 + i * cs, y, z);
      }
    }
    const thr = cs * 1.3;
    const done = new Uint8Array(N);
    for (let ck = 0; ck < cnz - 1; ck++) {
      for (let cj = 0; cj < cny - 1; cj++) {
        for (let ci = 0; ci < cnx - 1; ci++) {
          const b0 = (ck * cny + cj) * cnx + ci;
          const c0 = CV[b0], c1 = CV[b0 + 1], c2 = CV[b0 + cnx], c3 = CV[b0 + cnx + 1];
          const b1 = b0 + cnx * cny;
          const c4 = CV[b1], c5 = CV[b1 + 1], c6 = CV[b1 + cnx], c7 = CV[b1 + cnx + 1];
          const mn = min(abs(c0), abs(c1), abs(c2), abs(c3), abs(c4), abs(c5), abs(c6), abs(c7));
          const allPos = c0 > 0 && c1 > 0 && c2 > 0 && c3 > 0 && c4 > 0 && c5 > 0 && c6 > 0 && c7 > 0;
          const allNeg = c0 < 0 && c1 < 0 && c2 < 0 && c3 < 0 && c4 < 0 && c5 < 0 && c6 < 0 && c7 < 0;
          const far = (allPos || allNeg) && mn > thr;
          const i0 = ci * C, j0 = cj * C, k0 = ck * C;
          const i1 = min(i0 + C, nx - 1), j1 = min(j0 + C, ny - 1), k1 = min(k0 + C, nz - 1);
          for (let k = k0; k <= k1; k++) {
            const z = z0 + k * step;
            for (let j = j0; j <= j1; j++) {
              const y = y0 + j * step;
              let idx = k * sxy + j * nx + i0;
              for (let i = i0; i <= i1; i++, idx++) {
                if (done[idx]) continue;
                done[idx] = 1;
                V[idx] = far ? (allPos ? mn : -mn) : f(x0 + i * step, y, z);
              }
            }
          }
        }
      }
    }
  } else {
    for (let k = 0; k < nz; k++) {
      const z = z0 + k * step;
      for (let j = 0; j < ny; j++) {
        const y = y0 + j * step;
        let idx = k * sxy + j * nx;
        for (let i = 0; i < nx; i++, idx++) V[idx] = f(x0 + i * step, y, z);
      }
    }
  }

  // Vértices: um por célula que cruza a superfície.
  const cellIndex = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cnxm = nx - 1, cnym = ny - 1;
  let pos = new Float32Array(1 << 16);
  let nv = 0;
  // offsets dos 8 cantos
  const co = [0, 1, nx, nx + 1, sxy, sxy + 1, sxy + nx, sxy + nx + 1];
  const cx = [0, 1, 0, 1, 0, 1, 0, 1], cyy = [0, 0, 1, 1, 0, 0, 1, 1], cz = [0, 0, 0, 0, 1, 1, 1, 1];
  const edges = [
    [0, 1], [2, 3], [4, 5], [6, 7], // x
    [0, 2], [1, 3], [4, 6], [5, 7], // y
    [0, 4], [1, 5], [2, 6], [3, 7], // z
  ];
  const g = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const base = k * sxy + j * nx + i;
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          const v = V[base + co[c]];
          g[c] = v;
          if (v < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let ax = 0, ay = 0, az = 0, cnt = 0;
        for (let e = 0; e < 12; e++) {
          const a = edges[e][0], b = edges[e][1];
          const va = g[a], vb = g[b];
          if ((va < 0) === (vb < 0)) continue;
          const t = va / (va - vb);
          ax += cx[a] + (cx[b] - cx[a]) * t;
          ay += cyy[a] + (cyy[b] - cyy[a]) * t;
          az += cz[a] + (cz[b] - cz[a]) * t;
          cnt++;
        }
        if (nv * 3 + 3 > pos.length) {
          const np = new Float32Array(pos.length * 2);
          np.set(pos);
          pos = np;
        }
        pos[nv * 3] = x0 + (i + ax / cnt) * step;
        pos[nv * 3 + 1] = y0 + (j + ay / cnt) * step;
        pos[nv * 3 + 2] = z0 + (k + az / cnt) * step;
        cellIndex[(k * cnym + j) * cnxm + i] = nv++;
      }
    }
  }

  // Faces: um quadrilátero por aresta da grade que cruza a superfície.
  let idxs = new Uint32Array(1 << 17);
  let ni = 0;
  const cell = (i, j, k) => cellIndex[(k * cnym + j) * cnxm + i];
  const pushQuad = (a, b, c, d, flip) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (ni + 6 > idxs.length) {
      const n2 = new Uint32Array(idxs.length * 2);
      n2.set(idxs);
      idxs = n2;
    }
    // escolhe a diagonal mais curta
    const d1 = dist2(pos, a, c), d2 = dist2(pos, b, d);
    let t;
    if (d1 <= d2) t = [a, b, c, a, c, d];
    else t = [a, b, d, b, c, d];
    if (flip) {
      idxs[ni++] = t[0]; idxs[ni++] = t[2]; idxs[ni++] = t[1];
      idxs[ni++] = t[3]; idxs[ni++] = t[5]; idxs[ni++] = t[4];
    } else {
      for (let q = 0; q < 6; q++) idxs[ni++] = t[q];
    }
  };
  for (let k = 0; k < nz - 1; k++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const p0 = k * sxy + j * nx + i;
        const v0 = V[p0] < 0;
        // aresta em x: (i,j,k)-(i+1,j,k) compartilhada pelas células (i, j-1..j, k-1..k)
        if (j > 0 && k > 0 && v0 !== V[p0 + 1] < 0) {
          pushQuad(cell(i, j - 1, k - 1), cell(i, j, k - 1), cell(i, j, k), cell(i, j - 1, k), !v0);
        }
        // aresta em y
        if (i > 0 && k > 0 && v0 !== V[p0 + nx] < 0) {
          pushQuad(cell(i - 1, j, k - 1), cell(i - 1, j, k), cell(i, j, k), cell(i, j, k - 1), !v0);
        }
        // aresta em z
        if (i > 0 && j > 0 && v0 !== V[p0 + sxy] < 0) {
          pushQuad(cell(i - 1, j - 1, k), cell(i, j - 1, k), cell(i, j, k), cell(i - 1, j, k), !v0);
        }
      }
    }
  }

  const positions = pos.slice(0, nv * 3);
  const indices = idxs.slice(0, ni);
  const normals = new Float32Array(nv * 3);
  // projeção na superfície + normais pelo gradiente (gradiente tetraédrico: 4 avaliações)
  const e = step * 0.35;
  for (let v = 0; v < nv; v++) {
    let x = positions[v * 3], y = positions[v * 3 + 1], z = positions[v * 3 + 2];
    const f1 = f(x + e, y - e, z - e), f2 = f(x - e, y - e, z + e), f3 = f(x - e, y + e, z - e), f4 = f(x + e, y + e, z + e);
    const gx = f1 - f2 - f3 + f4, gy = -f1 - f2 + f3 + f4, gz = -f1 + f2 - f3 + f4;
    const gl = sqrt(gx * gx + gy * gy + gz * gz) || 1;
    const nxv = gx / gl, nyv = gy / gl, nzv = gz / gl;
    const d = (f1 + f2 + f3 + f4) * 0.25;
    const sft = max(-step * 0.5, min(step * 0.5, d));
    x -= nxv * sft; y -= nyv * sft; z -= nzv * sft;
    normals[v * 3] = nxv; normals[v * 3 + 1] = nyv; normals[v * 3 + 2] = nzv;
    positions[v * 3] = x; positions[v * 3 + 1] = y; positions[v * 3 + 2] = z;
  }
  return { positions, normals, indices };
}

function dist2(p, a, b) {
  const dx = p[a * 3] - p[b * 3], dy = p[a * 3 + 1] - p[b * 3 + 1], dz = p[a * 3 + 2] - p[b * 3 + 2];
  return dx * dx + dy * dy + dz * dz;
}

// Suavização leve (Taubin) para reduzir o serrilhado da grade, preservando volume.
export function smoothMesh(mesh, iterations = 2) {
  const { positions, indices } = mesh;
  const nv = positions.length / 3;
  // vizinhança
  const deg = new Uint32Array(nv);
  for (let i = 0; i < indices.length; i++) deg[indices[i]] += 2;
  const start = new Uint32Array(nv + 1);
  for (let i = 0; i < nv; i++) start[i + 1] = start[i] + deg[i];
  const nb = new Uint32Array(start[nv]);
  const fill = start.slice(0, nv);
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t], b = indices[t + 1], c = indices[t + 2];
    nb[fill[a]++] = b; nb[fill[a]++] = c;
    nb[fill[b]++] = c; nb[fill[b]++] = a;
    nb[fill[c]++] = a; nb[fill[c]++] = b;
  }
  const tmp = new Float32Array(positions.length);
  const pass = (lambda) => {
    for (let v = 0; v < nv; v++) {
      const s = start[v], e = start[v + 1];
      if (e === s) { tmp[v * 3] = positions[v * 3]; tmp[v * 3 + 1] = positions[v * 3 + 1]; tmp[v * 3 + 2] = positions[v * 3 + 2]; continue; }
      let ax = 0, ay = 0, az = 0;
      for (let q = s; q < e; q++) {
        const u = nb[q];
        ax += positions[u * 3]; ay += positions[u * 3 + 1]; az += positions[u * 3 + 2];
      }
      const n = e - s;
      tmp[v * 3] = positions[v * 3] + lambda * (ax / n - positions[v * 3]);
      tmp[v * 3 + 1] = positions[v * 3 + 1] + lambda * (ay / n - positions[v * 3 + 1]);
      tmp[v * 3 + 2] = positions[v * 3 + 2] + lambda * (az / n - positions[v * 3 + 2]);
    }
    positions.set(tmp);
  };
  for (let i = 0; i < iterations; i++) {
    pass(0.5);
    pass(-0.53);
  }
  return mesh;
}

// ---------- lofts (seções que variam ao longo de um eixo) ----------
const LOFT_PAD = 25;
// Interpolação cúbica de Hermite com tangentes de Catmull-Rom não uniformes.
function interpolator(ts, vs) {
  const n = ts.length;
  const m = vs.map((_, i) => {
    if (n < 2) return 0;
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
    return (vs[b] - vs[a]) / (ts[b] - ts[a]);
  });
  return (t) => {
    if (t <= ts[0]) return vs[0];
    if (t >= ts[n - 1]) return vs[n - 1];
    let i = 0;
    while (i < n - 2 && t > ts[i + 1]) i++;
    const h = ts[i + 1] - ts[i], u = (t - ts[i]) / h;
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * vs[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * vs[i + 1] + (u3 - u2) * h * m[i + 1];
  };
}

// Loft vertical (perna): seção elíptica no plano xz. keys: [{ y, cx, cz, rx, rz }]
export function loftY(keys, RE = 6) {
  keys = [...keys].sort((a, b) => a.y - b.y);
  const ys = keys.map((k) => k.y);
  const F = {};
  for (const f of ['cx', 'cz', 'rx', 'rz']) F[f] = interpolator(ys, keys.map((k) => k[f]));
  const y0 = ys[0], y1 = ys[ys.length - 1];
  let b = [INF, y0, INF, -INF, y1, -INF];
  for (const k of keys) {
    b[0] = min(b[0], k.cx - k.rx); b[3] = max(b[3], k.cx + k.rx);
    b[2] = min(b[2], k.cz - k.rz); b[5] = max(b[5], k.cz + k.rz);
  }
  for (let i = 0; i < 3; i++) { b[i] -= LOFT_PAD; b[i + 3] += LOFT_PAD; }
  return {
    f: (x, y, z) => {
      const yc = y < y0 ? y0 : y > y1 ? y1 : y;
      const rx = F.rx(yc), rz = F.rz(yc);
      const dx = x - F.cx(yc), dz = z - F.cz(yc);
      const a = dx / rx, c = dz / rz;
      const k0 = sqrt(a * a + c * c);
      const e = dx / (rx * rx), g = dz / (rz * rz);
      const k1 = sqrt(e * e + g * g) || 1e-9;
      const d = (k0 * (k0 - 1)) / k1;
      const dy = max(y0 - y, y - y1);
      const ea = d + RE, ec = dy + RE;
      const ox = max(ea, 0), oy = max(ec, 0);
      return sqrt(ox * ox + oy * oy) + min(max(ea, ec), 0) - RE;
    },
    b,
  };
}

// Loft longitudinal (pé): seção superelíptica no plano yz, com cisalhamento (dorso inclinado,
// arco medial elevado). keys: [{ x, yc, zc, h, w, s, nt, nb }]
export function loftX(keys, RE = 8) {
  keys = [...keys].sort((a, b) => a.x - b.x);
  const xs = keys.map((k) => k.x);
  const F = {};
  for (const f of ['yc', 'zc', 'h', 'w', 's', 'nt', 'nb']) F[f] = interpolator(xs, keys.map((k) => k[f] ?? (f === 's' ? 0 : f === 'nt' ? 2.2 : f === 'nb' ? 3 : 0)));
  const x0 = xs[0], x1 = xs[xs.length - 1];
  const b = [x0, INF, INF, x1, -INF, -INF];
  for (const k of keys) {
    const sh = abs(k.s || 0) * k.w;
    b[1] = min(b[1], k.yc - k.h - sh); b[4] = max(b[4], k.yc + k.h + sh);
    b[2] = min(b[2], k.zc - k.w); b[5] = max(b[5], k.zc + k.w);
  }
  // o campo do loft é aproximado (subestima a distância longe da superfície): caixa folgada para que
  // o descarte por caixa na união nunca corte uma contribuição real (evita vincos retos na pele)
  for (let i = 0; i < 3; i++) { b[i] -= LOFT_PAD; b[i + 3] += LOFT_PAD; }
  return {
    f: (x, y, z) => {
      const xc = x < x0 ? x0 : x > x1 ? x1 : x;
      const h = F.h(xc), w = F.w(xc);
      const zz = z - F.zc(xc);
      const yy = y - F.yc(xc) - F.s(xc) * zz;
      const n = yy > 0 ? F.nt(xc) : F.nb(xc);
      const ay = abs(yy) / h, az = abs(zz) / w;
      const A = Math.pow(ay, n), Bz = Math.pow(az, n);
      const S = A + Bz;
      let d;
      if (S < 1e-12) d = -min(h, w);
      else {
        const k = Math.pow(S, 1 / n);
        const kk = Math.pow(k, 1 - n);
        const gy = kk * Math.pow(ay, n - 1) / h, gz = kk * Math.pow(az, n - 1) / w;
        const gl = sqrt(gy * gy + gz * gz) || 1e-9;
        d = (k - 1) / gl;
        if (d < -min(h, w)) d = -min(h, w);
      }
      // extremidades arredondadas (raio RE): evita a aresta viva onde a seção termina
      const dx = max(x0 - x, x - x1);
      const ea = d + RE, ec = dx + RE;
      const ox = max(ea, 0), oy = max(ec, 0);
      return sqrt(ox * ox + oy * oy) + min(max(ea, ec), 0) - RE;
    },
    b,
  };
}
