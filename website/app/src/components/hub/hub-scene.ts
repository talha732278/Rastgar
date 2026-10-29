/**
 * Renderer, lights and camera path for the wheel-end journey. Shared by the
 * live page (hub-stage.tsx) and the offline render script that produces the
 * posters and product images, so both always show the same model and grade.
 * Client-only: import dynamically from an effect.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import { createHub, type CalloutId, type HubOptions } from "./hub-model";

export interface ShotKey {
  p: number;
  az: number;
  el: number;
  dist: number;
  tx: number;
  ty: number;
  shift: number;
  explode: number;
  spin: number;
  heat: number;
}

/** Camera path over scroll progress; each key is a held "chapter" pose. */
export const JOURNEY_KEYS: ShotKey[] = [
  { az: 34, dist: 138, el: 13, explode: 0, heat: 0.12, p: 0, shift: 0.34, spin: 0, tx: 2, ty: 0 },
  { az: 62, dist: 156, el: 20, explode: 0, heat: 1, p: 0.25, shift: -0.42, spin: 0.7, tx: -6, ty: -1 },
  { az: 16, dist: 104, el: 7, explode: 0, heat: 0.15, p: 0.48, shift: 0.42, spin: 1.15, tx: 6, ty: 0 },
  { az: 46, dist: 205, el: 15, explode: 0.62, heat: 0.05, p: 0.7, shift: -0.4, spin: 1.7, tx: 4, ty: 0 },
  { az: 84, dist: 268, el: 12, explode: 1, heat: 0, p: 0.9, shift: -0.06, spin: 2.1, tx: 6, ty: -9 },
  { az: 88, dist: 264, el: 10, explode: 1, heat: 0, p: 1, shift: -0.06, spin: 2.25, tx: 6, ty: -9 },
];

const smooth = (v: number) => {
  const x = Math.min(1, Math.max(0, v));
  return x * x * (3 - 2 * x);
};

export function sampleKeys(keys: ShotKey[], p: number): ShotKey {
  if (p <= keys[0].p) return { ...keys[0], p };
  for (let i = 0; i < keys.length - 1; i += 1) {
    const a = keys[i];
    const b = keys[i + 1];
    if (p <= b.p) {
      const t = smooth((p - a.p) / (b.p - a.p || 1));
      const mix = (k: keyof ShotKey) => a[k] + (b[k] - a[k]) * t;
      return {
        az: mix("az"),
        dist: mix("dist"),
        el: mix("el"),
        explode: mix("explode"),
        heat: mix("heat"),
        p,
        shift: mix("shift"),
        spin: mix("spin"),
        tx: mix("tx"),
        ty: mix("ty"),
      };
    }
  }
  return { ...keys[keys.length - 1], p };
}

export interface FrameState extends ShotKey {
  /** Light sweep position 0..1 across the raw casting (foundry chapter). */
  sweep: number;
  /** 0..1 load-in exposure ramp ("emerges from darkness"). */
  intro: number;
  /** Pointer parallax in -1..1. */
  px: number;
  py: number;
}

export interface ProjectedAnchor {
  id: CalloutId;
  x: number;
  y: number;
  visible: boolean;
}

export interface HubScene {
  renderer: THREE.WebGLRenderer;
  setSize: (width: number, height: number, pixelRatio: number) => void;
  apply: (state: FrameState) => void;
  render: () => void;
  project: () => ProjectedAnchor[];
  dispose: () => void;
}

export interface HubSceneOptions extends HubOptions {
  canvas: HTMLCanvasElement;
  preserveDrawingBuffer?: boolean;
}

export function journeyState(p: number, intro = 1, px = 0, py = 0): FrameState {
  const key = sampleKeys(JOURNEY_KEYS, p);
  const sweep = smooth((p - 0.08) / 0.24);
  return { ...key, intro, px, py, sweep };
}

export function createHubScene({ canvas, preserveDrawingBuffer = false, ...hubOptions }: HubSceneOptions): HubScene {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas,
    powerPreference: "high-performance",
    preserveDrawingBuffer,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envTarget = pmrem.fromScene(room, 0.04);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 0.42;
  room.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }
  });

  const camera = new THREE.PerspectiveCamera(26, 16 / 9, 1, 3000);
  const target = new THREE.Vector3();

  const rig = createHub(hubOptions);
  scene.add(rig.root);

  const key = new THREE.DirectionalLight(0xe4ecff, 3.1);
  key.position.set(-10, 95, 95);
  const rim = new THREE.DirectionalLight(0x8fb0ff, 3.6);
  rim.position.set(-90, 55, -80);
  const kicker = new THREE.DirectionalLight(0xc9d6ff, 1.2);
  kicker.position.set(110, -10, -40);
  const fill = new THREE.HemisphereLight(0x3d4f86, 0x05070d, 0.55);
  const sweepLight = new THREE.SpotLight(0xffffff, 0, 400, Math.PI / 9, 0.6, 1.2);
  sweepLight.position.set(80, 40, 120);
  sweepLight.target.position.set(0, 0, 0);
  const heat = new THREE.PointLight(0xff2418, 0, 0, 1.6);
  heat.position.set(-14, -26, 28);
  scene.add(key, rim, kicker, fill, sweepLight, sweepLight.target, heat);

  let width = 1;
  let height = 1;
  let roll = 0;

  const setSize = (w: number, h: number, pixelRatio: number) => {
    width = Math.max(1, w);
    height = Math.max(1, h);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const apply = (s: FrameState) => {
    const aspect = width / height;
    const portrait = aspect < 0.95;
    const explodeFrame = smooth((s.explode - 0.15) / 0.7);

    // Portrait screens bank the camera 90deg as the hub opens up, so the
    // exploded stack runs top to bottom and fills a tall phone screen.
    roll = portrait ? (-Math.PI / 2) * explodeFrame : 0;
    const shift = portrait ? s.shift * 0.35 : s.shift;
    let dist = s.dist;
    if (portrait) {
      dist *= 1.9 - 0.3 * explodeFrame;
    } else if (aspect < 1.5) {
      dist *= 1 + (1.5 - aspect) * 0.6;
    }

    const az = ((s.az + s.px * 4) * Math.PI) / 180;
    const el = ((s.el - s.py * 3) * Math.PI) / 180;
    target.set(s.tx, s.ty, 0);
    camera.position.set(
      target.x + dist * Math.cos(el) * Math.cos(az),
      target.y + dist * Math.sin(el),
      target.z + dist * Math.cos(el) * Math.sin(az)
    );
    camera.up.set(0, 1, 0);
    camera.lookAt(target);
    if (roll !== 0) camera.rotateZ(roll);

    // Lens shift: slide the subject sideways (away from the chapter copy) on
    // wide screens, and up into the top of the frame on portrait screens.
    const offsetX = (-shift * width) / 2;
    const offsetY = portrait ? height * 0.13 : 0;
    camera.setViewOffset(width, height, offsetX, offsetY, width, height);
    camera.updateProjectionMatrix();

    rig.setExplode(s.explode);
    rig.setSpin(s.spin);

    const sweepPower = Math.sin(Math.PI * Math.min(1, Math.max(0, s.sweep)));
    sweepLight.intensity = 3600 * sweepPower * s.intro;
    sweepLight.position.set(-120 + 240 * s.sweep, 50, 110);
    heat.intensity = (500 + 3400 * s.heat) * s.intro;
    key.intensity = 3.1 * s.intro;
    rim.intensity = 3.6 * (0.35 + 0.65 * s.intro);
    renderer.toneMappingExposure = 0.08 + 0.92 * s.intro;
  };

  const render = () => {
    renderer.render(scene, camera);
  };

  const vec = new THREE.Vector3();
  const project = (): ProjectedAnchor[] =>
    rig.anchors.map(({ id, object }) => {
      object.getWorldPosition(vec);
      vec.project(camera);
      return {
        id,
        visible: vec.z < 1 && Math.abs(vec.x) < 1.05 && Math.abs(vec.y) < 1.05,
        x: (vec.x * 0.5 + 0.5) * width,
        y: (-vec.y * 0.5 + 0.5) * height,
      };
    });

  const dispose = () => {
    rig.dispose();
    envTarget.dispose();
    pmrem.dispose();
    renderer.dispose();
  };

  return { apply, dispose, project, render, renderer, setSize };
}
