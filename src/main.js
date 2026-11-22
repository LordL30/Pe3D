// Pé 3D — visualizador anatômico interativo do pé direito com deformidade de Haglund.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LAYERS, KIND_COLORS } from './anatomy/layers.js';
import { sdfStructures, estimateCost } from './anatomy/sdfIndex.js';
import { tendons, muscles, ligaments, fascia, vessels, nerves } from './anatomy/tubes.js';
import { INFO, LAYER_INFO } from './anatomy/info.js';
import { CUT_Y } from './anatomy/bones.js';
import { buildTube } from './tube.js';
import { buildSDFMesh } from './buildMesh.js';
import { TOUR } from './tour.js';

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// estado global da interface
let selected = null, hovered = null;
let haglundOn = true;
let compareOn = false;
let explodeT = 0;

// ------------------------------------------------------------------ cena
const stage = $('#stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: params.has('capture') });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.localClippingEnabled = true;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(32, 1, 2, 5000);
camera.position.set(-160, 230, 420);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(110, 70, 0);
controls.enableDamping = !reduceMotion;
controls.dampingFactor = 0.09;
controls.minDistance = 60;
controls.maxDistance = 1400;
controls.zoomSpeed = 0.9;
controls.screenSpacePanning = true;

const key = new THREE.DirectionalLight(0xffffff, 1.5);
key.position.set(-120, 400, 260);
scene.add(key);
const rim = new THREE.DirectionalLight(0xdfe8ff, 0.7);
rim.position.set(300, 120, -300);
scene.add(rim);
scene.add(new THREE.HemisphereLight(0xf4f1ea, 0x5a5550, 0.35));

// sombra de contato suave no solo
{
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,0.42)');
  grd.addColorStop(0.55, 'rgba(0,0,0,0.16)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(330, 150),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(128, -0.4, 0);
  shadow.renderOrder = -1;
  scene.add(shadow);
}

// ------------------------------------------------------------------ texturas e materiais
function fiberTexture(light = false) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = light ? '#f2f2f2' : '#d8d8d8';
  g.fillRect(0, 0, 128, 256);
  let seed = light ? 7 : 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < (light ? 60 : 140); i++) {
    const x = rnd() * 128;
    const w = 0.6 + rnd() * (light ? 1.2 : 2.2);
    const v = light ? 225 + rnd() * 30 : 150 + rnd() * 105;
    g.fillStyle = `rgba(${v},${v},${v},${light ? 0.5 : 0.85})`;
    g.fillRect(x, 0, w, 256);
    g.fillRect(x - 128, 0, w, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const TEX = { muscle: fiberTexture(false), tendon: fiberTexture(true) };

const clipPlanes = [];
// a cor da face de corte é aplicada depois da conversão de cor: precisa estar em sRGB
const capColor = (hex) => new THREE.Color(hex).convertLinearToSRGB();

function addCap(mat, hex) {
  const cap = { value: capColor(hex) };
  mat.userData.cap = cap;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uCap = cap;
    shader.fragmentShader = 'uniform vec3 uCap;\n' + shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      '#include <dithering_fragment>\n  if (!gl_FrontFacing) gl_FragColor.rgb = uCap;',
    );
  };
  return mat;
}

const CAPS = {
  skin: '#c98d7a', fat: '#e3b54c', bone: '#d6be8c', cartilage: '#8fbccb', muscle: '#7e211d',
  tendon: '#d9d0bb', ligament: '#b2a582', fascia: '#c9c0a8', retinaculum: '#c9c0a8', artery: '#7d1212',
  vein: '#1b356f', nerve: '#b98f12', bursa: '#7a2f63', kager: '#d9ad3e', heelpad: '#d9b54e', nail: '#d8bcb0',
};

function makeMaterial(kind) {
  const c = new THREE.Color(KIND_COLORS[kind] || '#cccccc');
  let m;
  switch (kind) {
    case 'skin':
      m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.62, sheen: 0.5, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ff9a7a'), clearcoat: 0.04 });
      break;
    case 'nail':
      m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.3 });
      break;
    case 'fat': case 'kager': case 'heelpad':
      m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.42, metalness: 0 });
      break;
    case 'bone':
      m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.66, metalness: 0 });
      break;
    case 'cartilage':
      m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.22, clearcoat: 0.7, clearcoatRoughness: 0.2, transmission: 0 });
      break;
    case 'muscle':
      m = new THREE.MeshStandardMaterial({ color: c, map: TEX.muscle, bumpMap: TEX.muscle, bumpScale: 0.6, roughness: 0.5 });
      break;
    case 'tendon':
      m = new THREE.MeshPhysicalMaterial({ color: c, map: TEX.tendon, roughness: 0.32, clearcoat: 0.35, clearcoatRoughness: 0.35, sheen: 0.4, sheenColor: new THREE.Color('#ffffff') });
      break;
    case 'ligament': case 'fascia': case 'retinaculum':
      m = new THREE.MeshPhysicalMaterial({ color: c, map: TEX.tendon, roughness: 0.4, clearcoat: 0.2 });
      break;
    case 'artery': case 'vein':
      m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.25 });
      break;
    case 'nerve':
      m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.38, clearcoat: 0.3, sheen: 0.4, sheenColor: new THREE.Color('#fff3b0') });
      break;
    case 'bursa':
      m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.1, emissive: new THREE.Color('#5a0f2c'), emissiveIntensity: 0.0 });
      break;
    default:
      m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 });
  }
  m.side = THREE.DoubleSide;
  m.clippingPlanes = clipPlanes;
  m.userData.kind = kind;
  m.userData.baseEmissive = m.emissive ? m.emissive.clone() : null;
  addCap(m, CAPS[kind] || '#888888');
  return m;
}

// ------------------------------------------------------------------ registro de estruturas
const structures = new Map();
const layerState = new Map(LAYERS.map((l) => [l.id, { ...l, visible: true, opacity: 1, items: [] }]));
const root = new THREE.Group();
scene.add(root);
const pickables = [];

function kindFor(def) {
  if (def.kind) return def.kind;
  if (def.layer === 'bones') return 'bone';
  if (def.layer === 'cartilage') return 'cartilage';
  if (def.id === 'skin') return 'skin';
  if (def.id === 'nails') return 'nail';
  if (def.id === 'kager') return 'kager';
  if (def.id === 'heelpad') return 'heelpad';
  if (def.id === 'fat') return 'fat';
  if (def.id.startsWith('bursa')) return 'bursa';
  return 'bone';
}

function register(def, geometry, layerId) {
  const kind = kindFor(def);
  const material = makeMaterial(kind);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = def.id;
  mesh.userData.id = def.id;
  const layer = layerState.get(layerId);
  mesh.renderOrder = layer ? layer.order : 0;
  geometry.computeBoundingBox();
  const center = geometry.boundingBox.getCenter(new THREE.Vector3());
  const s = {
    id: def.id, name: def.name, layer: layerId, kind, mesh, material, visible: true,
    center, explodeVec: new THREE.Vector3(), pathology: !!def.pathology, parent: def.bone || null,
  };
  structures.set(def.id, s);
  if (layer) layer.items.push(s);
  root.add(mesh);
  pickables.push(mesh);
  applyMaterialState(s);
  return s;
}

// ------------------------------------------------------------------ tubos (rápidos, thread principal)
const tubeGroups = [
  ['tendons', tendons], ['muscles', muscles], ['ligaments', ligaments], ['fascia', fascia],
  ['vessels', vessels], ['nerves', nerves],
];
for (const [layerId, list] of tubeGroups) {
  for (const def of list) {
    const radial = def.kind === 'muscle' ? 18 : def.kind === 'tendon' ? 14 : 10;
    let points = def.points;
    // estruturas cortadas na altura da perna terminam um pouco abaixo do corte da pele
    if (def.caps?.[0] === 'flat' && points[0][1] >= CUT_Y - 0.5) points = [[points[0][0], CUT_Y - 0.8, points[0][2]], ...points.slice(1)];
    const geo = buildTube({ ...def, points, radial });
    register(def, geo, layerId);
  }
}

// ------------------------------------------------------------------ malhas SDF (workers)
const colorTmp = new THREE.Color();
const C_HAG = new THREE.Color(KIND_COLORS.haglund);
const C_CALLUS = new THREE.Color(KIND_COLORS.callus);
const C_RED = new THREE.Color('#c96f62');
const C_BONE = new THREE.Color(KIND_COLORS.bone);
const C_BONECUT = new THREE.Color('#c9a874');
const C_SKIN = new THREE.Color(KIND_COLORS.skin);

function hash3(x, y, z) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x, y, z) {
  // ruído de valor suave (barato) para variação de cor
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  let r = 0;
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) {
    const h = hash3(xi + a, yi + b, zi + c);
    r += h * (a ? u : 1 - u) * (b ? v : 1 - v) * (c ? w : 1 - w);
  }
  return r;
}

function computeColors(s) {
  const g = s.mesh.geometry;
  const pos = g.attributes.position.array;
  const nor = g.attributes.normal.array;
  const n = pos.length / 3;
  let col = g.attributes.color ? g.attributes.color.array : new Float32Array(n * 3);
  const w = s.weights;
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    if (s.kind === 'bone') {
      const nz = vnoise(x * 0.18, y * 0.18, z * 0.18) * 0.6 + vnoise(x * 0.6, y * 0.6, z * 0.6) * 0.4;
      colorTmp.copy(C_BONE).multiplyScalar(0.9 + nz * 0.16);
      if (y > CUT_Y - 0.9 && nor[i * 3 + 1] > 0.8) colorTmp.copy(C_BONECUT);
      if (w && haglundOn) colorTmp.lerp(C_HAG, Math.min(1, w[i] * 1.1));
    } else if (s.kind === 'skin') {
      const nz = vnoise(x * 0.25, y * 0.25, z * 0.25);
      colorTmp.copy(C_SKIN).multiplyScalar(0.95 + nz * 0.08);
      // leve variação: dorso e perna um pouco mais morenos, planta mais clara
      const sole = Math.max(0, Math.min(1, (14 - y) / 12));
      colorTmp.offsetHSL(0, -0.04 * sole, 0.05 * sole);
      if (w) {
        const ww = w[i];
        // eritema discreto ao redor e calosidade no centro
        colorTmp.lerp(C_RED, Math.min(1, ww * 2.2) * 0.35 * (1 - ww));
        colorTmp.lerp(C_CALLUS, Math.pow(ww, 1.3) * 0.85);
        const flake = vnoise(x * 1.6, y * 1.6, z * 1.6);
        if (ww > 0.35 && flake > 0.62) colorTmp.lerp(new THREE.Color('#f4efe2'), (flake - 0.62) * 1.6 * ww);
      }
    } else {
      colorTmp.set(0xffffff);
    }
    col[i * 3] = colorTmp.r; col[i * 3 + 1] = colorTmp.g; col[i * 3 + 2] = colorTmp.b;
  }
  if (!g.attributes.color) g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  else g.attributes.color.needsUpdate = true;
}

function geometryFromMesh(m, { openTop = false, offset = 0 } = {}) {
  let pos = m.positions, nor = m.normals, idx = m.indices;
  if (offset) {
    pos = new Float32Array(pos.length);
    for (let i = 0; i < pos.length; i++) pos[i] = m.positions[i] - m.normals[i] * offset;
  }
  if (openTop) {
    const keep = [];
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t], b = idx[t + 1], c = idx[t + 2];
      const lim = CUT_Y - 0.6 - offset;
      if (pos[a * 3 + 1] > lim && pos[b * 3 + 1] > lim && pos[c * 3 + 1] > lim
        && nor[a * 3 + 1] > 0.5 && nor[b * 3 + 1] > 0.5 && nor[c * 3 + 1] > 0.5) continue;
      keep.push(a, b, c);
    }
    idx = new Uint32Array(keep);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

const sdfById = new Map(sdfStructures.map((d) => [d.id, d]));
let compareMesh = null;

function onSDFMesh(id, m) {
  const def = sdfById.get(id);
  if (!def) return;
  if (def.layer === 'compare') {
    // recuado 0,35 mm para não disputar profundidade com a superfície do calcâneo real
    const g = geometryFromMesh(m, { offset: 0.35 });
    const mat = new THREE.MeshStandardMaterial({ color: '#6f9fc8', roughness: 0.5, clippingPlanes: clipPlanes, side: THREE.DoubleSide });
    addCap(mat, '#4b7499');
    compareMesh = new THREE.Mesh(g, mat);
    compareMesh.visible = false;
    compareMesh.renderOrder = 1;
    root.add(compareMesh);
    syncCompare();
    return;
  }
  const g = geometryFromMesh(m, { openTop: def.openTop });
  const s = register(def, g, def.layer);
  s.weights = m.weights || null;
  if (s.kind === 'bone' || s.kind === 'skin') {
    computeColors(s);
    s.material.needsUpdate = true;
  }
  if (id === 'skin') {
    // tecido subcutâneo: casca deslocada 2,2 mm para dentro da pele
    const fg = geometryFromMesh(m, { openTop: true, offset: 1.9 });
    register({ id: 'fat', name: 'Tecido subcutâneo (gordura)' }, fg, 'fat').material.color.set(KIND_COLORS.fat);
    structures.get('fat').kind = 'fat';
  }
  if (s.kind === 'bone' || s.kind === 'cartilage') setupExplode(s);
  refreshLayerList(def.layer);
  if (id === 'skin') refreshLayerList('fat');
  requestRender();
}

const explodePivot = new THREE.Vector3(62, 60, 0);
function setupExplode(s) {
  const parent = s.parent ? structures.get(s.parent) : null;
  const c = parent ? parent.center : s.center;
  s.explodeVec.copy(c).sub(explodePivot).multiplyScalar(0.5);
  if (s.id === 'tibia' || s.id === 'fibula' || s.parent === 'tibia' || s.parent === 'fibula') s.explodeVec.y += 25;
  s.mesh.position.copy(s.explodeVec).multiplyScalar(explodeT);
  // cartilagens criadas antes do osso pai
  for (const o of structures.values()) if (o.parent === s.id) setupExplode(o);
}

const quality = params.has('q') ? parseFloat(params.get('q'))
  : (Math.min(window.innerWidth, window.innerHeight) < 600 || (navigator.hardwareConcurrency || 4) <= 4 ? 0.85 : 1);

function buildAllSDF() {
  const defs = [...sdfStructures].sort((a, b) => estimateCost(b) - estimateCost(a));
  const total = defs.length;
  let done = 0;
  const progress = () => {
    done++;
    setProgress(done / total, `${done} de ${total} estruturas`);
    if (done >= total) finishLoading();
  };
  const nW = Math.max(1, Math.min(6, (navigator.hardwareConcurrency || 4) - 1));
  const bins = Array.from({ length: nW }, () => ({ cost: 0, ids: [] }));
  for (const d of defs) {
    bins.sort((a, b) => a.cost - b.cost);
    bins[0].ids.push(d.id);
    bins[0].cost += estimateCost(d) / d.step ** 0; // custo relativo
  }
  let fellBack = false;
  const fallback = (ids) => {
    // gera na thread principal, com pausas para a interface responder
    const queue = [...ids];
    const next = () => {
      const id = queue.shift();
      if (!id) return;
      const m = buildSDFMesh(sdfById.get(id), quality);
      onSDFMesh(id, m);
      progress();
      setTimeout(next, 0);
    };
    next();
  };
  try {
    for (const bin of bins) {
      if (!bin.ids.length) continue;
      const w = new Worker(new URL('./meshWorker.js', import.meta.url), { type: 'module' });
      const pending = new Set(bin.ids);
      w.onmessage = (e) => {
        if (e.data.done) { w.terminate(); return; }
        pending.delete(e.data.id);
        onSDFMesh(e.data.id, e.data.mesh);
        progress();
      };
      w.onerror = (err) => {
        console.warn('Worker falhou, gerando na thread principal', err);
        err.preventDefault?.();
        w.terminate();
        fellBack = true;
        fallback([...pending]);
      };
      w.postMessage({ ids: bin.ids, quality });
    }
  } catch (err) {
    console.warn('Workers indisponíveis', err);
    if (!fellBack) fallback(defs.map((d) => d.id));
  }
}

// ------------------------------------------------------------------ estado visual
function applyMaterialState(s) {
  const layer = layerState.get(s.layer);
  const op = layer ? layer.opacity : 1;
  const m = s.material;
  const transparent = op < 0.995;
  if (m.transparent !== transparent) m.needsUpdate = true;
  m.transparent = transparent;
  m.opacity = op;
  m.depthWrite = !transparent;
  m.side = transparent ? THREE.FrontSide : THREE.DoubleSide;
  s.mesh.visible = !!(layer && layer.visible && s.visible && op > 0.02);
  // destaque de seleção / hover
  const sel = selected === s.id, hov = hovered === s.id;
  if (m.emissive) {
    if (s.kind === 'bursa' && haglundOn) {
      m.emissive.set('#a3164e');
      m.emissiveIntensity = 0.35;
    } else {
      m.emissive.copy(m.userData.baseEmissive || new THREE.Color(0));
      m.emissiveIntensity = 1;
    }
    if (sel) { m.emissive.set('#2f7fd0'); m.emissiveIntensity = 0.45; }
    else if (hov) { m.emissive.set('#2f7fd0'); m.emissiveIntensity = 0.22; }
  }
}

function applyAll() {
  for (const s of structures.values()) applyMaterialState(s);
  syncCompare();
  requestRender();
}

function syncCompare() {
  if (!compareMesh) return;
  const bonesL = layerState.get('bones');
  compareMesh.visible = compareOn && bonesL.visible;
  const calc = structures.get('calcaneus');
  if (calc) {
    if (compareOn) {
      calc.material.transparent = true;
      calc.material.opacity = Math.min(0.5, bonesL.opacity);
      calc.material.depthWrite = false;
      calc.material.side = THREE.FrontSide;
      calc.material.needsUpdate = true;
      calc.mesh.renderOrder = 3;
    } else {
      calc.mesh.renderOrder = bonesL.order;
    }
  }
}

// ------------------------------------------------------------------ renderização
let needsRender = true;
const requestRender = () => { needsRender = true; };
controls.addEventListener('change', requestRender);

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
  requestRender();
}
window.addEventListener('resize', resize);
new ResizeObserver(resize).observe(stage);

let tween = null;
let pulseT = 0;
const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = clock.getDelta();
  if (tween) {
    tween.t = Math.min(1, tween.t + dt / tween.dur);
    const e = tween.t < 0.5 ? 4 * tween.t ** 3 : 1 - (-2 * tween.t + 2) ** 3 / 2;
    camera.position.lerpVectors(tween.p0, tween.p1, e);
    controls.target.lerpVectors(tween.t0, tween.t1, e);
    if (tween.t >= 1) tween = null;
    needsRender = true;
  }
  if (controls.update()) needsRender = true;
  // pulsação das bursas inflamadas quando o destaque está ativo
  if (haglundOn && !reduceMotion) {
    pulseT += dt;
    for (const id of ['bursa-retro', 'bursa-subcut']) {
      const s = structures.get(id);
      if (s && s.mesh.visible && selected !== id) {
        s.material.emissiveIntensity = 0.25 + 0.2 * (0.5 + 0.5 * Math.sin(pulseT * 3));
        needsRender = true;
      }
    }
  }
  if (needsRender) {
    renderer.render(scene, camera);
    updateOverlays();
    needsRender = false;
  }
}

function flyTo(target, dir, dist, dur = 0.9) {
  const t1 = new THREE.Vector3(...target);
  const d = new THREE.Vector3(...dir).normalize();
  const p1 = t1.clone().addScaledVector(d, dist);
  if (reduceMotion) {
    camera.position.copy(p1);
    controls.target.copy(t1);
    requestRender();
    return;
  }
  tween = { t: 0, dur, p0: camera.position.clone(), p1, t0: controls.target.clone(), t1 };
}

const VIEWS = {
  lateral: { target: [125, 62, 0], dir: [0, 0.12, 1], dist: 560 },
  medial: { target: [125, 62, 0], dir: [0, 0.12, -1], dist: 560 },
  posterior: { target: [30, 70, 2], dir: [-1, 0.14, 0.04], dist: 380 },
  anterior: { target: [120, 70, 0], dir: [1, 0.18, 0], dist: 520 },
  dorsal: { target: [130, 60, 0], dir: [0.02, 1, 0.001], dist: 560 },
  plantar: { target: [130, 30, 0], dir: [0.02, -1, 0.001], dist: 560 },
  oblique: { target: [105, 70, 2], dir: [-0.55, 0.42, 0.72], dist: 520 },
  heel: { target: [22, 55, 6], dir: [-0.7, 0.28, 0.66], dist: 250 },
};
function setView(name, dur) {
  const v = VIEWS[name];
  if (v) flyTo(v.target, v.dir, fitDist(v.dist), dur);
}
function fitDist(d) {
  // aproxima mais em telas largas, afasta em telas estreitas (retrato)
  const a = camera.aspect;
  return a < 1 ? d * Math.min(1.55, 1.1 / a) : d;
}

// ------------------------------------------------------------------ explodir e corte
function setExplode(t) {
  explodeT = t;
  for (const s of structures.values()) {
    if (s.kind === 'bone' || s.kind === 'cartilage') s.mesh.position.copy(s.explodeVec).multiplyScalar(t);
  }
  if (compareMesh) {
    const c = structures.get('calcaneus');
    if (c) compareMesh.position.copy(c.mesh.position);
  }
  requestRender();
}

const clipPlane = new THREE.Plane();
const clipState = { axis: 'none', pos: 0, flip: false };
const CLIP_RANGES = { sagittal: [-50, 50, 8], coronal: [-5, 268, 30], transverse: [0, 200, 45] };
function applyClip() {
  clipPlanes.length = 0;
  if (clipState.axis !== 'none') {
    const s = clipState.flip ? -1 : 1;
    if (clipState.axis === 'sagittal') clipPlane.set(new THREE.Vector3(0, 0, -s), s * clipState.pos);
    if (clipState.axis === 'coronal') clipPlane.set(new THREE.Vector3(s, 0, 0), -s * clipState.pos);
    if (clipState.axis === 'transverse') clipPlane.set(new THREE.Vector3(0, -s, 0), s * clipState.pos);
    clipPlanes.push(clipPlane);
  }
  requestRender();
}

// ------------------------------------------------------------------ seleção e hover
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pick(clientX, clientY) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const vis = pickables.filter((m) => m.visible && m.material.opacity > 0.18);
  if (compareMesh && compareMesh.visible) vis.push(compareMesh);
  const hits = raycaster.intersectObjects(vis, false);
  for (const h of hits) {
    if (clipPlanes.length && clipPlane.distanceToPoint(h.point) < 0) continue;
    if (h.object === compareMesh) return 'calcaneus-normal';
    return h.object.userData.id;
  }
  return null;
}

const tooltip = $('#tooltip');
let lastMove = 0, downAt = null;
renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  const now = performance.now();
  if (now - lastMove < 70 || e.buttons) { if (e.buttons) tooltip.hidden = true; return; }
  lastMove = now;
  const id = pick(e.clientX, e.clientY);
  if (id !== hovered) {
    const prev = hovered;
    hovered = id;
    if (prev && structures.get(prev)) applyMaterialState(structures.get(prev));
    if (id && structures.get(id)) applyMaterialState(structures.get(id));
    requestRender();
  }
  if (id) {
    tooltip.textContent = nameOf(id);
    tooltip.hidden = false;
    const r = stage.getBoundingClientRect();
    tooltip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 12}px)`;
  } else tooltip.hidden = true;
});
renderer.domElement.addEventListener('pointerleave', () => { tooltip.hidden = true; });
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY, performance.now()]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  const quick = performance.now() - downAt[2] < 500;
  downAt = null;
  if (moved > 6 || !quick) return;
  select(pick(e.clientX, e.clientY));
});
renderer.domElement.addEventListener('dblclick', (e) => {
  const id = pick(e.clientX, e.clientY);
  if (id) focusOn(id);
});

function nameOf(id) {
  if (id === 'calcaneus-normal') return 'Contorno normal do calcâneo (referência)';
  return structures.get(id)?.name || id;
}

function select(id) {
  const prev = selected;
  selected = id;
  if (prev && structures.get(prev)) applyMaterialState(structures.get(prev));
  if (id && structures.get(id)) applyMaterialState(structures.get(id));
  showInfo(id);
  document.querySelectorAll('.item.is-selected').forEach((el) => el.classList.remove('is-selected'));
  if (id) document.querySelector(`.item[data-id="${CSS.escape(id)}"]`)?.classList.add('is-selected');
  requestRender();
}

function focusOn(id) {
  const s = structures.get(id);
  if (!s) return;
  const box = new THREE.Box3().setFromObject(s.mesh);
  const c = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  const dir = camera.position.clone().sub(controls.target).normalize();
  flyTo([c.x, c.y, c.z], [dir.x, dir.y, dir.z], Math.max(90, size * 2.2));
}

// ------------------------------------------------------------------ painel de informações
const info = $('#info');
function showInfo(id) {
  if (!id) { info.hidden = true; return; }
  const s = structures.get(id);
  const layer = s ? layerState.get(s.layer) : null;
  $('#info-name').textContent = nameOf(id);
  $('#info-layer').textContent = id === 'calcaneus-normal' ? 'Comparação' : layer ? layer.name : '';
  $('#info-layer').style.setProperty('--chip', layer ? layer.color : '#6f9fc8');
  const cands = [id, id.replace(/\d+$/, ''), id.replace(/-b\d+$/, ''), id.replace(/-\d+$/, ''), id.replace(/\d.*$/, ''), id.split('-')[0] + '-'];
  const hit = cands.find((k) => INFO[k]);
  $('#info-text').textContent = hit ? INFO[hit] : s ? LAYER_INFO[s.layer] : '';
  $('#info-path').hidden = !(s && s.pathology) && id !== 'calcaneus';
  $('#info-hide').disabled = !s;
  $('#info-isolate').disabled = !s;
  info.hidden = false;
}
$('#info-close').addEventListener('click', () => select(null));
$('#info-hide').addEventListener('click', () => {
  const s = structures.get(selected);
  if (!s) return;
  s.visible = false;
  syncItemCheckbox(s);
  select(null);
  applyAll();
});
$('#info-isolate').addEventListener('click', () => {
  const s = structures.get(selected);
  if (!s) return;
  for (const o of structures.values()) { o.visible = o.id === s.id || o.parent === s.id; syncItemCheckbox(o); }
  const l = layerState.get(s.layer);
  l.visible = true;
  syncLayerControls();
  applyAll();
  focusOn(s.id);
});
$('#info-focus').addEventListener('click', () => selected && focusOn(selected));

// ------------------------------------------------------------------ painel de camadas
const layerList = $('#layers');
function buildLayerPanel() {
  layerList.innerHTML = '';
  for (const l of LAYERS) {
    const st = layerState.get(l.id);
    const li = document.createElement('li');
    li.className = 'layer';
    li.dataset.layer = l.id;
    li.innerHTML = `
      <div class="layer-row">
        <button class="disclose" aria-expanded="false" aria-controls="items-${l.id}" title="Mostrar estruturas">
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2.5 7.5 6 4 9.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <label class="layer-toggle">
          <input type="checkbox" id="layer-${l.id}" checked>
          <span class="swatch" style="--sw:${l.color}"></span>
          <span class="layer-name">${l.name}</span>
          <span class="count" id="count-${l.id}"></span>
        </label>
        <input type="range" class="opacity" id="op-${l.id}" min="0" max="100" value="100" aria-label="Opacidade: ${l.name}">
      </div>
      <ul class="items" id="items-${l.id}" hidden></ul>`;
    layerList.appendChild(li);
    li.querySelector('input[type=checkbox]').addEventListener('change', (e) => {
      st.visible = e.target.checked;
      applyAll();
    });
    li.querySelector('.opacity').addEventListener('input', (e) => {
      st.opacity = e.target.value / 100;
      if (st.opacity > 0.02 && !st.visible) { st.visible = true; li.querySelector('input[type=checkbox]').checked = true; }
      applyAll();
    });
    const disc = li.querySelector('.disclose');
    disc.addEventListener('click', () => {
      const ul = li.querySelector('.items');
      ul.hidden = !ul.hidden;
      disc.setAttribute('aria-expanded', String(!ul.hidden));
      li.classList.toggle('open', !ul.hidden);
    });
    refreshLayerList(l.id);
  }
}

function refreshLayerList(layerId) {
  const st = layerState.get(layerId);
  const ul = document.getElementById(`items-${layerId}`);
  if (!st || !ul) return;
  const cnt = document.getElementById(`count-${layerId}`);
  if (cnt) cnt.textContent = st.items.length ? st.items.length : '';
  const items = [...st.items].sort((a, b) => a.name.localeCompare(b.name, 'pt'));
  ul.innerHTML = '';
  for (const s of items) {
    const li = document.createElement('li');
    li.className = 'item';
    li.dataset.id = s.id;
    if (s.pathology || s.id === 'calcaneus') li.classList.add('is-path');
    li.innerHTML = `<label><input type="checkbox" ${s.visible ? 'checked' : ''}><span>${s.name}</span></label>`;
    li.querySelector('input').addEventListener('change', (e) => { s.visible = e.target.checked; applyMaterialState(s); requestRender(); });
    li.querySelector('span').addEventListener('click', (e) => { e.preventDefault(); select(s.id); });
    ul.appendChild(li);
  }
  applyFilter();
}

function syncItemCheckbox(s) {
  const el = document.querySelector(`.item[data-id="${CSS.escape(s.id)}"] input`);
  if (el) el.checked = s.visible;
}
function syncLayerControls() {
  for (const st of layerState.values()) {
    const cb = document.getElementById(`layer-${st.id}`);
    const op = document.getElementById(`op-${st.id}`);
    if (cb) cb.checked = st.visible;
    if (op) op.value = Math.round(st.opacity * 100);
  }
}

const filterInput = $('#filter');
function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
function applyFilter() {
  const q = norm(filterInput.value.trim());
  for (const li of layerList.querySelectorAll('.layer')) {
    const ul = li.querySelector('.items');
    let any = false;
    for (const it of ul.querySelectorAll('.item')) {
      const show = !q || norm(it.textContent).includes(q);
      it.hidden = !show;
      any = any || show;
    }
    if (q) {
      li.hidden = !any;
      ul.hidden = !any;
      li.classList.toggle('open', any);
    } else {
      li.hidden = false;
    }
  }
}
filterInput.addEventListener('input', () => {
  applyFilter();
  if (!filterInput.value.trim()) {
    for (const li of layerList.querySelectorAll('.layer')) {
      const open = li.querySelector('.disclose').getAttribute('aria-expanded') === 'true';
      li.querySelector('.items').hidden = !open;
      li.classList.toggle('open', open);
    }
  }
});

function setLayers(map, { resetItems = true } = {}) {
  // map: { layerId: opacidade }; camadas ausentes ficam ocultas
  for (const st of layerState.values()) {
    const v = map[st.id];
    st.visible = v !== undefined && v > 0;
    st.opacity = v === undefined ? 1 : v;
  }
  if (resetItems) for (const s of structures.values()) { s.visible = true; syncItemCheckbox(s); }
  syncLayerControls();
  applyAll();
}
const ALL = Object.fromEntries(LAYERS.map((l) => [l.id, 1]));
$('#preset-all').addEventListener('click', () => setLayers(ALL));
$('#preset-deep').addEventListener('click', () => setLayers({ ...ALL, skin: 0, fat: 0 }));
$('#preset-bones').addEventListener('click', () => setLayers({ bones: 1, cartilage: 1 }));
$('#preset-xray').addEventListener('click', () => setLayers({ skin: 0.22, bones: 1, cartilage: 1, tendons: 1, bursae: 1 }));

// ------------------------------------------------------------------ Haglund
const hagToggle = $('#hag-highlight');
hagToggle.addEventListener('change', () => setHaglund(hagToggle.checked));
function setHaglund(on) {
  haglundOn = on;
  hagToggle.checked = on;
  for (const s of structures.values()) if (s.kind === 'bone' && s.weights) computeColors(s);
  document.body.classList.toggle('hag-on', on);
  applyAll();
}
const cmpToggle = $('#hag-compare');
cmpToggle.addEventListener('change', () => setCompare(cmpToggle.checked));
function setCompare(on) {
  compareOn = on;
  cmpToggle.checked = on;
  applyAll();
}

// rótulos ancorados em 3D (modo Haglund)
const LABELS = [
  { id: 'calcaneus', text: 'Proeminência de Haglund', p: [10.5, 59, 12], layer: 'bones' },
  { id: 'bursa-retro', text: 'Bursa retrocalcânea', p: [12.5, 50, 3], layer: 'bursae' },
  { id: 'bursa-subcut', text: 'Bursa subcutânea (retroaquileana)', p: [1.5, 45, 15], layer: 'bursae' },
  { id: 'achilles', text: 'Tendão do calcâneo', p: [8, 96, 1], layer: 'tendons' },
  { id: 'skin', text: 'Calosidade sobre a saliência', p: [-0.5, 39, 19], layer: 'skin' },
  { id: 'kager', text: 'Gordura de Kager', p: [24, 84, 9], layer: 'bursae' },
];
const labelsEl = $('#labels');
for (const L of LABELS) {
  const el = document.createElement('button');
  el.className = 'label3d';
  el.type = 'button';
  el.innerHTML = `<span class="dot"></span><span class="txt">${L.text}</span>`;
  el.addEventListener('click', () => select(L.id));
  labelsEl.appendChild(el);
  L.el = el;
  L.v = new THREE.Vector3(...L.p);
}
const proj = new THREE.Vector3();
const occl = new THREE.Raycaster();
let lastOcclusion = 0;
function updateLabels() {
  const show = haglundOn;
  const r = stage.getBoundingClientRect();
  const now = performance.now();
  const doOcc = now - lastOcclusion > 180;
  if (doOcc) lastOcclusion = now;
  for (const L of LABELS) {
    const s = structures.get(L.id);
    const vis = show && s && s.mesh.visible && !(clipPlanes.length && clipPlane.distanceToPoint(L.v) < 0);
    if (!vis) { L.el.hidden = true; continue; }
    const wp = L.v.clone().add(s.mesh.position);
    proj.copy(wp).project(camera);
    if (proj.z > 1) { L.el.hidden = true; continue; }
    L.el.hidden = false;
    L.sx = (proj.x * 0.5 + 0.5) * r.width;
    L.sy = (-proj.y * 0.5 + 0.5) * r.height;
    L.el.style.transform = `translate(${L.sx}px, ${L.sy}px)`;
    if (doOcc) {
      // atenua o rótulo quando há outra estrutura opaca na frente
      const dir = wp.clone().sub(camera.position);
      const dist = dir.length();
      occl.set(camera.position, dir.normalize());
      const vis2 = pickables.filter((m) => m.visible && !m.material.transparent);
      const hit = occl.intersectObjects(vis2, false).find((h) => !(clipPlanes.length && clipPlane.distanceToPoint(h.point) < 0));
      const behind = hit && hit.distance < dist - 3 && hit.object.userData.id !== L.id;
      L.el.classList.toggle('is-behind', !!behind);
    }
  }
  // evita sobreposição: desloca o texto (não o ponto) dos rótulos muito próximos
  const shown = LABELS.filter((L) => !L.el.hidden && !L.el.classList.contains('is-behind')).sort((a, b) => a.sy - b.sy);
  const placed = [];
  for (const L of shown) {
    const txt = L.el.querySelector('.txt');
    const w = txt.offsetWidth || 160;
    let ty = L.sy;
    for (const P of placed) {
      if (Math.abs(P.x - L.sx) < Math.max(w, P.w) && Math.abs(P.y - ty) < 22) ty = P.y + 22;
    }
    placed.push({ x: L.sx, y: ty, w });
    txt.style.transform = ty !== L.sy ? `translateY(${ty - L.sy}px)` : '';
    L.el.classList.toggle('is-shifted', ty !== L.sy);
  }
}

// ------------------------------------------------------------------ gizmo de orientação e escala
const gizmo = $('#gizmo');
const AX = [
  { v: new THREE.Vector3(1, 0, 0), pos: 'Ant', neg: 'Post', cls: 'ax-x' },
  { v: new THREE.Vector3(0, 1, 0), pos: 'Sup', neg: 'Inf', cls: 'ax-y' },
  { v: new THREE.Vector3(0, 0, 1), pos: 'Lat', neg: 'Med', cls: 'ax-z' },
];
gizmo.innerHTML = AX.map((a) => `
  <line class="${a.cls} neg" x1="40" y1="40" x2="40" y2="40"/>
  <line class="${a.cls}" x1="40" y1="40" x2="40" y2="40"/>
  <text class="${a.cls} t-pos" x="40" y="40">${a.pos}</text>
  <text class="${a.cls} t-neg" x="40" y="40">${a.neg}</text>`).join('');
const gq = new THREE.Quaternion();
function updateGizmo() {
  gq.copy(camera.quaternion).invert();
  AX.forEach((a, i) => {
    const d = a.v.clone().applyQuaternion(gq);
    const lines = gizmo.querySelectorAll(`line.${a.cls}`);
    const tp = gizmo.querySelector(`text.${a.cls}.t-pos`);
    const tn = gizmo.querySelector(`text.${a.cls}.t-neg`);
    const R = 24;
    lines[0].setAttribute('x2', 40 - d.x * R * 0.7); lines[0].setAttribute('y2', 40 + d.y * R * 0.7);
    lines[1].setAttribute('x2', 40 + d.x * R); lines[1].setAttribute('y2', 40 - d.y * R);
    tp.setAttribute('x', 40 + d.x * (R + 9)); tp.setAttribute('y', 40 - d.y * (R + 9) + 3);
    tn.setAttribute('x', 40 - d.x * (R * 0.7 + 9)); tn.setAttribute('y', 40 + d.y * (R * 0.7 + 9) + 3);
    tp.style.opacity = 0.35 + 0.65 * Math.min(1, Math.hypot(d.x, d.y));
    tn.style.opacity = 0.25 + 0.4 * Math.min(1, Math.hypot(d.x, d.y));
  });
}
const scaleBar = $('#scalebar');
function updateScale() {
  const dist = camera.position.distanceTo(controls.target);
  const hmm = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const pxPerMm = stage.clientHeight / hmm;
  const opts = [5, 10, 20, 50, 100];
  let mm = opts[0];
  for (const o of opts) if (o * pxPerMm <= 120) mm = o;
  scaleBar.querySelector('.bar').style.width = `${mm * pxPerMm}px`;
  scaleBar.querySelector('.lbl').textContent = mm >= 10 ? `${mm / 10} cm` : `${mm} mm`;
}
function updateOverlays() {
  updateLabels();
  updateGizmo();
  updateScale();
}

// ------------------------------------------------------------------ controles da interface
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));

const explodeInput = $('#explode');
explodeInput.addEventListener('input', () => setExplode(explodeInput.value / 100));

const clipAxis = $('#clip-axis'), clipPos = $('#clip-pos'), clipFlip = $('#clip-flip');
function syncClipUI() {
  const on = clipState.axis !== 'none';
  clipPos.disabled = !on;
  clipFlip.disabled = !on;
  if (on) {
    const [a, b] = CLIP_RANGES[clipState.axis];
    clipPos.min = a; clipPos.max = b; clipPos.value = clipState.pos;
  }
  $('#clip-val').textContent = on ? `${Math.round(clipState.pos)} mm` : '';
}
clipAxis.addEventListener('change', () => {
  clipState.axis = clipAxis.value;
  if (clipState.axis !== 'none') clipState.pos = CLIP_RANGES[clipState.axis][2];
  syncClipUI();
  applyClip();
});
clipPos.addEventListener('input', () => { clipState.pos = parseFloat(clipPos.value); syncClipUI(); applyClip(); });
clipFlip.addEventListener('click', () => { clipState.flip = !clipState.flip; applyClip(); });
function setClip(axis, pos = null, flip = false) {
  clipState.axis = axis;
  clipState.pos = pos ?? (CLIP_RANGES[axis]?.[2] || 0);
  clipState.flip = flip;
  clipAxis.value = axis;
  syncClipUI();
  applyClip();
}

$('#reset').addEventListener('click', () => {
  stopTour();
  setLayers(ALL);
  setClip('none');
  explodeInput.value = 0;
  setExplode(0);
  setCompare(false);
  setHaglund(true);
  select(null);
  setView('oblique');
});

const panel = $('#panel');
$('#panel-toggle').addEventListener('click', () => {
  const open = !document.body.classList.contains('panel-open');
  document.body.classList.toggle('panel-open', open);
  $('#panel-toggle').setAttribute('aria-expanded', String(open));
});
$('#panel-close').addEventListener('click', () => {
  document.body.classList.remove('panel-open');
  $('#panel-toggle').setAttribute('aria-expanded', 'false');
});

window.addEventListener('keydown', (e) => {
  if (e.target.closest('input, select, textarea')) return;
  if (e.key === 'Escape') { if (tourIdx >= 0) stopTour(); else select(null); }
  const map = { 1: 'lateral', 2: 'medial', 3: 'posterior', 4: 'anterior', 5: 'dorsal', 6: 'plantar', 7: 'oblique' };
  if (map[e.key]) setView(map[e.key]);
});

// ------------------------------------------------------------------ tour guiado
let tourIdx = -1;
const tourEl = $('#tour');
function runStep(i) {
  const step = TOUR[i];
  if (!step) return stopTour();
  tourIdx = i;
  document.body.classList.add('touring');
  tourEl.hidden = false;
  $('#tour-count').textContent = `${i + 1} / ${TOUR.length}`;
  $('#tour-title').textContent = step.title;
  $('#tour-text').textContent = step.text;
  $('#tour-prev').disabled = i === 0;
  $('#tour-next').textContent = i === TOUR.length - 1 ? 'Concluir' : 'Próximo';
  setLayers(step.layers);
  if (step.hide) for (const id of step.hide) { const s = structures.get(id); if (s) { s.visible = false; syncItemCheckbox(s); } }
  setCompare(!!step.compare);
  setHaglund(step.haglund !== false);
  explodeInput.value = 0;
  setExplode(0);
  if (step.clip) setClip(step.clip[0], step.clip[1], step.clip[2]); else setClip('none');
  select(step.select || null);
  info.hidden = true;
  flyTo(step.view.target, step.view.dir, fitDist(step.view.dist), 1.2);
  applyAll();
}
function stopTour() {
  if (tourIdx < 0) return;
  tourIdx = -1;
  tourEl.hidden = true;
  document.body.classList.remove('touring');
}
$('#tour-start').addEventListener('click', () => { document.body.classList.remove('panel-open'); runStep(0); });
$('#tour-next').addEventListener('click', () => (tourIdx >= TOUR.length - 1 ? (stopTour(), $('#reset').click()) : runStep(tourIdx + 1)));
$('#tour-prev').addEventListener('click', () => runStep(Math.max(0, tourIdx - 1)));
$('#tour-close').addEventListener('click', () => stopTour());

// ------------------------------------------------------------------ carregamento
const loader = $('#loader');
function setProgress(f, text) {
  loader.querySelector('.fill').style.transform = `scaleX(${f})`;
  loader.querySelector('.ptext').textContent = text;
}
function finishLoading() {
  loader.classList.add('done');
  setTimeout(() => { loader.hidden = true; }, 500);
  document.body.classList.add('ready');
  if (params.has('view')) setView(params.get('view'), 0.01);
  window.__ready = true;
  requestRender();
}

buildLayerPanel();
syncClipUI();
document.body.classList.add('hag-on');
resize();
setView(params.get('view') || 'oblique', 0.01);
if (!params.has('view')) { camera.position.copy(tween ? tween.p1 : camera.position); controls.target.copy(tween ? tween.t1 : controls.target); tween = null; }
loop();
buildAllSDF();

// gancho para testes automatizados
window.__pe3d = { pick, setView, setLayers, setClip, setExplode, setHaglund, setCompare, select, runStep, structures, camera, controls, requestRender, flyTo };
