/**
 * Procedural heavy-duty wheel-end assembly (hub, drum or rotor, bearings,
 * seal, ABS ring, studs, nut, cap) built from turned profiles.
 *
 * Units are centimetres. The assembly is modelled around local +Y (outboard)
 * and the root group is rotated so the axle axis lies along world +X.
 * Client-only: import this module dynamically from an effect.
 */
import * as THREE from "three";

export type HubVariant =
  | "hub-drum"
  | "drive"
  | "trailer"
  | "steer"
  | "hub-rotor"
  | "preadjusted";

export type CalloutId =
  | "seal"
  | "inner-bearing"
  | "abs"
  | "hub"
  | "studs"
  | "drum"
  | "outer-bearing"
  | "cap";

type Pt = [number, number];

interface RigPart {
  object: THREE.Object3D;
  base: number;
  to: number;
  delay: number;
  spin: number;
}

interface RigAnchor {
  id: CalloutId;
  object: THREE.Object3D;
  part: RigPart | null;
  y: number;
}

export interface HubRig {
  root: THREE.Group;
  spinner: THREE.Group;
  anchors: { id: CalloutId; object: THREE.Object3D }[];
  setExplode: (t: number) => void;
  setSpin: (radians: number) => void;
  dispose: () => void;
}

const TAU = Math.PI * 2;
const SEGMENTS = 144;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (v: number) => {
  const x = clamp01(v);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};

function arc(
  cx: number,
  cy: number,
  r: number,
  fromDeg: number,
  toDeg: number,
  steps: number
): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = ((fromDeg + ((toDeg - fromDeg) * i) / steps) * Math.PI) / 180;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

/**
 * Lathe with crisp creases: each profile segment gets its own vertex rings,
 * and normals are only averaged across joints flatter than `crease` degrees.
 * Closed profiles are auto-oriented so normals face outward; open profiles
 * use (dy, -dr), negated when `flip` is set.
 */
function lathe(
  points: Pt[],
  { closed = true, crease = 32, flip = false, segments = SEGMENTS } = {}
): THREE.BufferGeometry {
  const n = points.length;
  const segCount = closed ? n : n - 1;

  let orientation = flip ? -1 : 1;
  if (closed) {
    let area = 0;
    for (let i = 0; i < n; i += 1) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[(i + 1) % n];
      area += x0 * y1 - x1 * y0;
    }
    orientation = area >= 0 ? 1 : -1;
  }

  const segNormals: Pt[] = [];
  const segLengths: number[] = [];
  for (let i = 0; i < segCount; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % n];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    segLengths.push(len);
    segNormals.push([(orientation * dy) / len, (orientation * -dx) / len]);
  }
  const total = segLengths.reduce((sum, v) => sum + v, 0) || 1;
  const cosCrease = Math.cos((crease * Math.PI) / 180);

  const blend = (a: Pt, b: Pt): Pt => {
    const dot = a[0] * b[0] + a[1] * b[1];
    if (dot < cosCrease) return a;
    const x = a[0] + b[0];
    const y = a[1] + b[1];
    const len = Math.hypot(x, y) || 1;
    return [x / len, y / len];
  };

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let travelled = 0;

  for (let i = 0; i < segCount; i += 1) {
    const prev = i > 0 ? i - 1 : closed ? segCount - 1 : -1;
    const next = i < segCount - 1 ? i + 1 : closed ? 0 : -1;
    const own = segNormals[i];
    const startN = prev >= 0 ? blend(own, segNormals[prev]) : own;
    const endN = next >= 0 ? blend(own, segNormals[next]) : own;
    const ends: [Pt, Pt, number][] = [
      [points[i], startN, travelled / total],
      [points[(i + 1) % n], endN, (travelled + segLengths[i]) / total],
    ];
    const base = positions.length / 3;

    for (const [[r, y], [nr, ny], v] of ends) {
      for (let k = 0; k <= segments; k += 1) {
        const theta = (k / segments) * TAU;
        const s = Math.sin(theta);
        const c = Math.cos(theta);
        positions.push(r * s, y, r * c);
        normals.push(nr * s, ny, nr * c);
        uvs.push(k / segments, v);
      }
    }

    const ringB = base + segments + 1;
    for (let k = 0; k < segments; k += 1) {
      const a = base + k;
      const b = base + k + 1;
      const c = ringB + k + 1;
      const d = ringB + k;
      if (orientation > 0) {
        indices.push(a, b, d, b, c, d);
      } else {
        indices.push(a, d, b, b, d, c);
      }
    }
    travelled += segLengths[i];
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

/** Smooth value noise packed into a repeating greyscale DataTexture. */
function noiseTexture(size: number, cells: number, seed: number, contrast: number) {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const octave = (grid: number) => {
    const g: number[] = [];
    for (let i = 0; i < grid * grid; i += 1) g.push(rand());
    return (x: number, y: number) => {
      const gx = (x / size) * grid;
      const gy = (y / size) * grid;
      const x0 = Math.floor(gx) % grid;
      const y0 = Math.floor(gy) % grid;
      const x1 = (x0 + 1) % grid;
      const y1 = (y0 + 1) % grid;
      const fx = gx - Math.floor(gx);
      const fy = gy - Math.floor(gy);
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const top = g[y0 * grid + x0] * (1 - sx) + g[y0 * grid + x1] * sx;
      const bottom = g[y1 * grid + x0] * (1 - sx) + g[y1 * grid + x1] * sx;
      return top * (1 - sy) + bottom * sy;
    };
  };
  const o1 = octave(cells);
  const o2 = octave(cells * 2);
  const o3 = octave(cells * 8);
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const v = o1(x, y) * 0.5 + o2(x, y) * 0.3 + o3(x, y) * 0.2;
      const value = Math.round(clamp01(0.5 + (v - 0.5) * contrast) * 255);
      const i = (y * size + x) * 4;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/** Fine lines along V: turning marks on machined faces, threads on studs. */
function lineTexture(lines: number, sharpness: number) {
  const height = 256;
  const data = new Uint8Array(4 * height * 4);
  for (let y = 0; y < height; y += 1) {
    const phase = ((y / height) * lines) % 1;
    const wave = Math.pow(Math.abs(Math.sin(phase * Math.PI)), sharpness);
    const value = Math.round(wave * 255);
    for (let x = 0; x < 4; x += 1) {
      const i = (y * 4 + x) * 4;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, 4, height, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function createMaterials(wireframe: boolean) {
  const castNoise = noiseTexture(256, 32, 1967, 1.5);
  const turning = lineTexture(48, 3);
  const threads = lineTexture(1, 1.4);
  threads.repeat.set(1, 26);

  const castIron = new THREE.MeshPhysicalMaterial({
    bumpMap: castNoise,
    bumpScale: 0.32,
    color: 0x3b4049,
    metalness: 0.38,
    roughness: 0.8,
  });
  castNoise.repeat.set(24, 10);

  const machined = new THREE.MeshPhysicalMaterial({
    anisotropy: 0.45,
    bumpMap: turning,
    bumpScale: 0.12,
    color: 0xc4cad3,
    metalness: 1,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -2,
    roughness: 0.24,
  });

  const machinedInside = machined.clone();
  machinedInside.side = THREE.BackSide;

  const polished = new THREE.MeshPhysicalMaterial({
    color: 0xe4e7ec,
    metalness: 1,
    roughness: 0.14,
  });

  const zinc = new THREE.MeshPhysicalMaterial({
    bumpMap: threads,
    bumpScale: 0.35,
    color: 0xb3b9c2,
    metalness: 1,
    roughness: 0.32,
  });

  const darkSteel = new THREE.MeshPhysicalMaterial({
    color: 0x484d56,
    metalness: 0.92,
    roughness: 0.42,
  });

  const rubber = new THREE.MeshPhysicalMaterial({
    color: 0x0c0e12,
    metalness: 0,
    roughness: 0.82,
    sheen: 0.3,
    sheenColor: new THREE.Color(0x2a3140),
  });

  const paint = new THREE.MeshPhysicalMaterial({
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    color: 0xe30613,
    metalness: 0.25,
    roughness: 0.38,
  });

  const hole = new THREE.MeshBasicMaterial({ color: 0x04060c });

  const axis = new THREE.MeshBasicMaterial({
    color: 0xe30613,
    opacity: 0,
    toneMapped: false,
    transparent: true,
  });

  const textures = [castNoise, turning, threads];
  const all: THREE.Material[] = [castIron, machined, machinedInside, polished, zinc, darkSteel, rubber, paint, hole, axis];

  if (wireframe) {
    for (const material of [castIron, machined, machinedInside, polished, zinc, darkSteel, rubber, paint]) {
      material.visible = false;
    }
  }

  return {
    all,
    axis,
    castIron,
    darkSteel,
    hole,
    machined,
    machinedInside,
    paint,
    polished,
    rubber,
    textures,
    zinc,
  };
}

type Materials = ReturnType<typeof createMaterials>;

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material) {
  return new THREE.Mesh(geometry, material);
}

/* ---------------------------------------------------------------- parts */

function buildHub(m: Materials, variant: HubVariant) {
  const group = new THREE.Group();
  group.name = "hub";

  const body: Pt[] = [
    [6.6, -15],
    [8.6, -15],
    [9.2, -14.4],
    [9.2, -11],
    [9.8, -10.6],
    [9.8, -3.6],
    ...arc(12.4, -3.6, 2.6, 180, 90, 8).slice(1),
    [17, -1],
    [17.6, -0.4],
    [17.6, 1.6],
    [17, 2.2],
    [11.2, 2.2],
    [11.2, 5.4],
    [10.6, 6],
    [7.6, 6],
    [7.6, 7.8],
    [5.8, 7.8],
    [5.8, 1.2],
    [4.9, 0.8],
    [4.9, -9],
    [6, -9.4],
    [6, -13.6],
    [6.6, -13.8],
  ];
  group.add(mesh(lathe(body), m.castIron));

  // Machined faces: flange face, pilot, outboard face, cap seat, bearing bore.
  group.add(mesh(lathe([[17, 2.2], [11.2, 2.2]], { closed: false }), m.machined));
  group.add(mesh(lathe([[11.2, 2.2], [11.2, 5.4]], { closed: false }), m.machined));
  group.add(mesh(lathe([[10.6, 6], [7.6, 6]], { closed: false }), m.machined));
  group.add(mesh(lathe([[7.6, 6], [7.6, 7.8]], { closed: false }), m.machined));
  group.add(mesh(lathe([[5.8, 7.8], [5.8, 1.2]], { closed: false }), m.machined));
  group.add(mesh(lathe([[9.2, -14.4], [9.2, -11]], { closed: false }), m.machined));

  // Cast gussets between barrel and flange, set between the studs.
  const shape = new THREE.Shape();
  shape.moveTo(9.5, -9.6);
  shape.lineTo(9.5, -0.9);
  shape.lineTo(15.8, -0.9);
  shape.quadraticCurveTo(11.6, -2.8, 9.5, -9.6);
  const gusset = new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.18,
    bevelThickness: 0.18,
    depth: 0.9,
  });
  gusset.translate(0, 0, -0.45);
  for (let i = 0; i < 5; i += 1) {
    const g = mesh(gusset, m.castIron);
    // Shape X is radial; rotate so it points along local +Z at angle 0.
    g.rotation.y = -Math.PI / 2 + ((18 + i * 72) * Math.PI) / 180;
    group.add(g);
  }

  if (variant === "drive") {
    // Axle-shaft flange face with eight short studs on the outboard end.
    group.add(mesh(lathe([[5.8, 6.2], [10.4, 6.2], [10.4, 9], [5.8, 9]], { closed: true }), m.castIron));
    group.add(mesh(lathe([[10.4, 9], [5.8, 9]], { closed: false }), m.machined));
    const shortStud = new THREE.CylinderGeometry(0.62, 0.62, 3.2, 20);
    shortStud.translate(0, 10.6, 0);
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * TAU + Math.PI / 8;
      const stud = mesh(shortStud, m.zinc);
      stud.position.set(Math.sin(a) * 8.9, 0, Math.cos(a) * 8.9);
      group.add(stud);
    }
  }

  return group;
}

function buildStud(m: Materials) {
  const group = new THREE.Group();
  const head = new THREE.CylinderGeometry(1.5, 1.5, 0.9, 28);
  head.translate(0, -1.45, 0);
  group.add(mesh(head, m.polished));
  const shank = new THREE.CylinderGeometry(1.08, 1.08, 12.7, 28, 1, false);
  shank.translate(0, 5.35, 0);
  group.add(mesh(shank, m.zinc));
  const tip = new THREE.CylinderGeometry(0.78, 1.08, 0.5, 28);
  tip.translate(0, 11.95, 0);
  group.add(mesh(tip, m.polished));
  return group;
}

function buildDrum(m: Materials) {
  const group = new THREE.Group();
  group.name = "drum";
  const outer: Pt[] = [
    [19.4, -17.6],
    [22.8, -17.6],
    [23.2, -17.2],
    [23.2, -15],
    [22.6, -14.6],
    [21.4, -14.4],
  ];
  for (const y of [-11.4, -6.8, -2.2]) {
    outer.push([21.4, y], [22.1, y + 0.4], [22.1, y + 1.2], [21.4, y + 1.6]);
  }
  outer.push(...arc(18.8, 1, 2.6, 0, 90, 8));
  outer.push([11.4, 3.6], [11.4, 2.2], [18.6, 2.2], [19.4, 1.4]);
  group.add(mesh(lathe(outer), m.castIron));
  // Machined braking surface on the inside of the shell.
  group.add(mesh(lathe([[19.4, 1.4], [19.4, -17.6]], { closed: false }), m.machinedInside));
  group.add(mesh(lathe([[23.2, -17.2], [23.2, -15]], { closed: false }), m.machined));

  const holeGeo = new THREE.CircleGeometry(1.25, 24);
  holeGeo.rotateX(-Math.PI / 2);
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * TAU;
    const h = mesh(holeGeo, m.hole);
    h.position.set(Math.sin(a) * 14.3, 3.62, Math.cos(a) * 14.3);
    group.add(h);
  }
  return group;
}

function buildRotor(m: Materials) {
  const group = new THREE.Group();
  group.name = "rotor";
  group.add(
    mesh(
      lathe([
        [15.4, -4.6],
        [16.4, -4.6],
        [16.4, 2.8],
        [15.6, 3.6],
        [11.4, 3.6],
        [11.4, 2.2],
        [15.4, 2.2],
      ]),
      m.castIron
    )
  );
  group.add(mesh(lathe([[15.4, -6], [22, -6], [22, -4.6], [15.4, -4.6]]), m.castIron));
  group.add(mesh(lathe([[13, -10.6], [22, -10.6], [22, -9.2], [13, -9.2]]), m.castIron));
  group.add(mesh(lathe([[22, -4.6], [16.4, -4.6]], { closed: false }), m.machined));
  group.add(mesh(lathe([[13, -10.6], [22, -10.6]], { closed: false }), m.machined));
  const vane = new THREE.BoxGeometry(0.7, 3.2, 7.4);
  vane.translate(0, -7.6, 17.8);
  for (let i = 0; i < 36; i += 1) {
    const v = mesh(vane, m.castIron);
    v.rotation.y = (i / 36) * TAU;
    group.add(v);
  }
  return group;
}

interface BearingSpec {
  cupOuter: number;
  cupInnerLarge: number;
  cupInnerSmall: number;
  coneInner: number;
  coneOuterLarge: number;
  coneOuterSmall: number;
  width: number;
  rollers: number;
}

function buildBearing(m: Materials, spec: BearingSpec, largeEndOutboard: boolean) {
  const cupGroup = new THREE.Group();
  const coneGroup = new THREE.Group();
  const w = spec.width;

  cupGroup.add(
    mesh(
      lathe([
        [spec.cupInnerLarge, 0],
        [spec.cupOuter, 0],
        [spec.cupOuter, w],
        [spec.cupInnerSmall, w],
      ]),
      m.machined
    )
  );

  coneGroup.add(
    mesh(
      lathe([
        [spec.coneInner, 0],
        [spec.coneOuterLarge + 0.4, 0],
        [spec.coneOuterLarge + 0.4, 0.35],
        [spec.coneOuterLarge, 0.35],
        [spec.coneOuterSmall, w - 0.25],
        [spec.coneOuterSmall + 0.2, w - 0.25],
        [spec.coneOuterSmall + 0.2, w],
        [spec.coneInner, w],
      ]),
      m.machined
    )
  );

  const pitchLarge = (spec.cupInnerLarge + spec.coneOuterLarge) / 2;
  const pitchSmall = (spec.cupInnerSmall + spec.coneOuterSmall) / 2;
  const gapLarge = (spec.cupInnerLarge - spec.coneOuterLarge) / 2;
  const gapSmall = (spec.cupInnerSmall - spec.coneOuterSmall) / 2;
  const length = w - 0.7;
  const tilt = Math.atan2(pitchLarge - pitchSmall, length);
  const roller = new THREE.CylinderGeometry(gapSmall * 0.96, gapLarge * 0.96, length, 18);
  const rollers = new THREE.InstancedMesh(roller, m.polished, spec.rollers);
  const matrix = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const pos = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < spec.rollers; i += 1) {
    const a = (i / spec.rollers) * TAU;
    const pitch = (pitchLarge + pitchSmall) / 2;
    pos.set(Math.sin(a) * pitch, w / 2, Math.cos(a) * pitch);
    euler.set(-tilt, a, 0, "YXZ");
    q.setFromEuler(euler);
    matrix.compose(pos, q, scale);
    rollers.setMatrixAt(i, matrix);
  }
  rollers.instanceMatrix.needsUpdate = true;
  coneGroup.add(rollers);

  if (largeEndOutboard) {
    for (const g of [cupGroup, coneGroup]) {
      for (const child of g.children) {
        child.rotation.x += Math.PI;
        child.position.y += w;
      }
    }
  }
  return { cone: coneGroup, cup: cupGroup };
}

function buildSeal(m: Materials) {
  const group = new THREE.Group();
  group.add(mesh(lathe([[6, 0], [6.6, 0], [6.6, 1.4], [6, 1.4]]), m.machined));
  group.add(
    mesh(
      lathe([
        [4, 0.35],
        [4.35, 0],
        [6, 0],
        [6, 1.4],
        [4.7, 1.4],
        [4.15, 0.9],
      ]),
      m.rubber
    )
  );
  const spring = new THREE.TorusGeometry(4.75, 0.16, 10, 96);
  spring.rotateX(Math.PI / 2);
  spring.translate(0, 0.95, 0);
  group.add(mesh(spring, m.polished));
  return group;
}

function buildAbs(m: Materials) {
  const group = new THREE.Group();
  group.add(mesh(lathe([[9.2, 0], [10.3, 0], [10.3, 1.6], [9.2, 1.6]]), m.darkSteel));
  const tooth = new THREE.BoxGeometry(0.34, 1.6, 0.8);
  tooth.translate(0, 0.8, 10.65);
  const teeth = new THREE.InstancedMesh(tooth, m.darkSteel, 90);
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < 90; i += 1) {
    matrix.makeRotationY((i / 90) * TAU);
    teeth.setMatrixAt(i, matrix);
  }
  teeth.instanceMatrix.needsUpdate = true;
  group.add(teeth);
  return group;
}

function buildNut(m: Materials) {
  const group = new THREE.Group();
  group.add(mesh(lathe([[3.6, 0], [5, 0], [5, 0.4], [3.6, 0.4]]), m.machined));
  const nut = new THREE.CylinderGeometry(4, 4, 1.6, 6);
  nut.translate(0, 1.2, 0);
  const nutMat = m.polished.clone();
  nutMat.flatShading = true;
  m.all.push(nutMat);
  group.add(mesh(nut, nutMat));
  return group;
}

function buildCap(m: Materials) {
  const group = new THREE.Group();
  const dome: Pt[] = [];
  for (let i = 0; i <= 10; i += 1) {
    const t = (i / 10) * (Math.PI / 2);
    dome.push([7.4 * Math.cos(t), 12.4 + 1.5 * Math.sin(t)]);
  }
  group.add(
    mesh(
      lathe([
        [7, 7.8],
        [9, 7.8],
        [9, 8.5],
        [7.4, 8.5],
        ...dome,
        [0, 13.4],
        [6.8, 12.2],
        [6.8, 8.6],
      ]),
      m.paint
    )
  );
  const bolt = new THREE.CylinderGeometry(0.55, 0.55, 0.6, 6);
  bolt.translate(0, 8.8, 0);
  const boltMat = m.polished.clone();
  boltMat.flatShading = true;
  m.all.push(boltMat);
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * TAU;
    const b = mesh(bolt, boltMat);
    b.position.set(Math.sin(a) * 8.25, 0, Math.cos(a) * 8.25);
    group.add(b);
  }
  const plug = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 6);
  plug.translate(0, 14.1, 0);
  group.add(mesh(plug, boltMat));
  return group;
}

function buildAxis(m: Materials) {
  const dash = new THREE.CylinderGeometry(0.12, 0.12, 1.5, 8);
  const count = 64;
  const dashes = new THREE.InstancedMesh(dash, m.axis, count);
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < count; i += 1) {
    matrix.makeTranslation(0, -82 + i * 2.7, 0);
    dashes.setMatrixAt(i, matrix);
  }
  dashes.instanceMatrix.needsUpdate = true;
  return dashes;
}

/* ------------------------------------------------------------------ rig */

export interface HubOptions {
  variant?: HubVariant;
  wireframe?: boolean;
  wireColor?: number;
  wireAccent?: number;
}

export function createHub({
  variant = "hub-drum",
  wireframe = false,
  wireColor = 0xeef1f6,
  wireAccent = 0xe30613,
}: HubOptions = {}): HubRig {
  const m = createMaterials(wireframe);
  const root = new THREE.Group();
  root.rotation.z = -Math.PI / 2;
  const spinner = new THREE.Group();
  root.add(spinner);

  const parts: RigPart[] = [];
  const anchors: RigAnchor[] = [];

  const add = (
    object: THREE.Object3D,
    base: number,
    to: number,
    delay: number,
    spin = 0
  ) => {
    object.position.y = base;
    spinner.add(object);
    const part = { base, delay, object, spin, to };
    parts.push(part);
    return part;
  };
  const anchor = (id: CalloutId, part: RigPart | null, y: number, radius: number) => {
    const object = new THREE.Object3D();
    object.position.set(-radius, y, 0);
    root.add(object);
    anchors.push({ id, object, part, y });
  };

  const withDrum = variant === "hub-drum";
  const withBearings = variant === "hub-drum" || variant === "preadjusted";
  const withCap = variant !== "drive";
  const withAbs = variant !== "drive" && variant !== "preadjusted";

  const hub = add(buildHub(m, variant), 0, 0, 0);
  anchor("hub", hub, 0.6, 17.8);

  if (variant !== "preadjusted") {
    const stud = buildStud(m);
    const studs: RigPart[] = [];
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * TAU;
      const s = i === 0 ? stud : stud.clone();
      s.position.set(Math.sin(a) * 14.3, 0, Math.cos(a) * 14.3);
      const holder = new THREE.Group();
      holder.add(s);
      studs.push(add(holder, 0, -19, 0.12 + (i % 5) * 0.035));
    }
    anchor("studs", studs[0], -6, 15.8);
  }

  if (withDrum) {
    const drum = add(buildDrum(m), 0, 31, 0.32, 0.35);
    anchor("drum", drum, -7, 23.4);
  }
  if (variant === "hub-rotor") {
    add(buildRotor(m), 0, 0, 0);
  }

  if (withAbs) {
    const abs = add(buildAbs(m), -13.2, variant === "hub-drum" ? -24 : 0, 0.18);
    anchor("abs", abs, -12.4, 11.4);
  }

  if (withBearings) {
    const spread = variant === "preadjusted" ? 0.42 : 1;
    const inner = buildBearing(
      m,
      {
        coneInner: 3.6,
        coneOuterLarge: 4.65,
        coneOuterSmall: 4.15,
        cupInnerLarge: 5.45,
        cupInnerSmall: 5.05,
        cupOuter: 6,
        rollers: 18,
        width: 2.8,
      },
      false
    );
    const innerCup = add(inner.cup, -13.4, -34 * spread, 0.05);
    const innerCone = add(inner.cone, -13.4, -45 * spread, 0.02, 0.6);
    anchor("inner-bearing", innerCone, -12, 7.2);
    void innerCup;

    const outer = buildBearing(
      m,
      {
        coneInner: 3.2,
        coneOuterLarge: 4.25,
        coneOuterSmall: 3.85,
        cupInnerLarge: 5.15,
        cupInnerSmall: 4.8,
        cupOuter: 5.8,
        rollers: 16,
        width: 2.4,
      },
      true
    );
    const outerBearing = new THREE.Group();
    outerBearing.add(outer.cup, outer.cone);
    const ob = add(outerBearing, 2.4, 50 * spread, 0.4, -0.5);
    anchor("outer-bearing", ob, 3.6, 7.4);

    const seal = add(buildSeal(m), -15, -56 * spread, 0, 0.8);
    anchor("seal", seal, -14.3, 7.8);

    add(buildNut(m), 5.2, 58 * spread, 0.46, -0.9);
  }

  if (withCap) {
    const cap = add(buildCap(m), 0, variant === "hub-drum" ? 70 : variant === "preadjusted" ? 30 : 0, 0.5, -0.4);
    anchor("cap", cap, 11.4, 9.6);
  }

  const axis = buildAxis(m);
  if (variant === "hub-drum" || variant === "preadjusted") root.add(axis);

  const wireLines: THREE.LineSegments[] = [];
  if (wireframe) {
    const lineMat = new THREE.LineBasicMaterial({ color: wireColor, transparent: true, opacity: 0.8 });
    const accentMat = new THREE.LineBasicMaterial({ color: wireAccent });
    m.all.push(lineMat, accentMat);
    spinner.traverse((child) => {
      if (child instanceof THREE.Mesh && !(child instanceof THREE.InstancedMesh)) {
        const edges = new THREE.EdgesGeometry(child.geometry, 24);
        const isCap = child.material === m.paint;
        const lines = new THREE.LineSegments(edges, isCap ? accentMat : lineMat);
        child.add(lines);
        wireLines.push(lines);
      }
    });
  }

  const setExplode = (t: number) => {
    for (const part of parts) {
      const local = easeInOut((t - part.delay) / (1 - part.delay));
      part.object.position.y = part.base + part.to * local;
      part.object.rotation.y = part.spin * local;
    }
    for (const a of anchors) {
      const offset = a.part ? a.part.object.position.y - a.part.base : 0;
      a.object.position.y = a.y + offset;
    }
    m.axis.opacity = 0.85 * easeInOut((t - 0.04) / 0.3);
    axis.visible = m.axis.opacity > 0.01;
  };

  const setSpin = (radians: number) => {
    spinner.rotation.y = radians;
  };

  setExplode(0);

  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>();
    root.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        geometries.add(child.geometry);
      }
    });
    for (const g of geometries) g.dispose();
    for (const material of m.all) material.dispose();
    for (const texture of m.textures) texture.dispose();
  };

  return {
    anchors: anchors.map(({ id, object }) => ({ id, object })),
    dispose,
    root,
    setExplode,
    setSpin,
    spinner,
  };
}
