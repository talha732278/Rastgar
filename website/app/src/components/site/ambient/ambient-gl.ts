/**
 * Ambient "molten light" background: one full-screen triangle and one
 * fragment shader. Domain-warped value-noise currents in cobalt and royal
 * blue with a cool steel sheen, sparse Rastgar-red embers kept apart from the
 * blue (each fades toward a dark char, never into the other, so the two never
 * blend into purple), a soft pointer light, a vignette and fine grain.
 *
 * Browser-only. Imported dynamically from an effect, never during SSR.
 */

export interface AmbientFrame {
  /** Flow clock in seconds (advances faster while the page is scrolled). */
  time: number;
  /** Wall clock in seconds, drives the grain. */
  clock: number;
  /** Smoothed scroll offset in viewport heights. */
  scroll: number;
  /** Smoothed signed scroll velocity in viewport heights per second. */
  velocity: number;
  /** Page progress, 0 at the top and 1 at the bottom. */
  progress: number;
  /** Ember intensity, 0 to 1 (foundry chapter and process section). */
  ember: number;
  /** Pointer position in 0..1 viewport units (y down) and light amount. */
  pointer: [number, number, number];
}

export interface AmbientRenderer {
  resize: (width: number, height: number) => void;
  render: (frame: AmbientFrame) => void;
  dispose: () => void;
  readonly lost: boolean;
}

const VERTEX = /* glsl */ `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uTime;
uniform float uClock;
uniform float uScroll;
uniform float uVel;
uniform float uProgress;
uniform float uEmber;
uniform vec3 uPointer;

const vec3 ABYSS = vec3(0.010, 0.032, 0.110);
const vec3 NAVY = vec3(0.027, 0.086, 0.251);
const vec3 COBALT = vec3(0.086, 0.247, 0.690);
const vec3 ROYAL = vec3(0.184, 0.420, 1.000);
const vec3 STEEL = vec3(0.660, 0.760, 0.900);
const vec3 CHAR = vec3(0.036, 0.019, 0.021);
const vec3 EMBER = vec3(0.890, 0.024, 0.075);
const vec3 HOT = vec3(1.000, 0.330, 0.150);

// Cheap lattice hash: two fract folds, no trig.
float lattice(vec2 cell) {
  vec2 k = fract(cell * vec2(0.1031, 0.1173) + vec2(0.317, 0.611));
  k += dot(k, k.yx + 27.41);
  return fract((k.x + k.y) * k.y * 1.913 + k.x);
}

// Value noise with a smooth (C1) fade.
float vnoise(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec2 s = f * f * (3.0 - 2.0 * f);
  float a = lattice(cell);
  float b = lattice(cell + vec2(1.0, 0.0));
  float c = lattice(cell + vec2(0.0, 1.0));
  float d = lattice(cell + vec2(1.0, 1.0));
  return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
}

// Five octaves, each turned about 37 degrees and shifted so the lattice
// never lines up between octaves.
float layered(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    sum += amp * vnoise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p + vec2(3.1, 1.7);
    amp *= 0.5;
  }
  return sum * 1.0323;
}

// Three octaves for the inner warp layers.
float layered3(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    sum += amp * vnoise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p + vec2(5.3, 2.9);
    amp *= 0.5;
  }
  return sum * 1.1429;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  // Normalised to the short side so currents keep their size on phones.
  vec2 frame = aspect > 1.0 ? vec2(aspect, 1.0) : vec2(1.0, 1.0 / aspect);
  vec2 base = (uv - 0.5) * frame;
  float t = uTime;

  // Pointer: a soft light that also bends the currents a little.
  vec2 pointer = (vec2(uPointer.x, 1.0 - uPointer.y) - 0.5) * frame;
  vec2 toPointer = base - pointer;
  float halo = exp(-dot(toPointer, toPointer) * 6.0) * uPointer.z;

  // Scroll carries the field upward with the page; velocity leans on it.
  vec2 p = base;
  p.y -= uScroll * 0.17;
  vec2 w = p * 1.15 + toPointer * halo * 0.22;
  vec2 lean = vec2(uVel * 0.035, uVel * 0.11);

  vec2 q = vec2(
    layered3(w + vec2(0.0, t * 0.036)),
    layered3(w + vec2(5.2, 1.3) + vec2(t * 0.027, -t * 0.013))
  );
  vec2 r = vec2(
    layered3(w + 2.9 * q + vec2(1.7, 9.2) + vec2(t * 0.047, 0.0) + lean),
    layered3(w + 2.9 * q + vec2(8.3, 2.8) - vec2(0.0, t * 0.041) - lean)
  );
  float f = layered(w + 2.5 * r + vec2(-t * 0.021, t * 0.016));

  // Light pools drift slowly and re-compose as the page progresses.
  float turn = uProgress * 6.2832;
  vec2 poolA = vec2(0.34 + 0.26 * sin(turn * 0.85 + t * 0.021), 0.10 + 0.20 * cos(turn * 1.25 + t * 0.017));
  vec2 poolB = vec2(-0.42 + 0.22 * cos(turn * 0.65 - t * 0.019), -0.18 + 0.20 * sin(turn * 1.05 + t * 0.024));
  vec2 da = base - poolA;
  vec2 db = base - poolB;
  float light = 0.30 + 0.95 * exp(-dot(da, da) * 2.1) + 0.60 * exp(-dot(db, db) * 2.6);

  // Ember zones sit low on opposite sides, away from the main blue pool.
  vec2 e1 = vec2(-0.62 + 0.07 * sin(t * 0.051), -0.46 + 0.05 * cos(t * 0.043));
  vec2 e2 = vec2(0.70 + 0.06 * cos(t * 0.037), -0.36 + 0.06 * sin(t * 0.029));
  // The currents warp the zones too, so they never read as circles.
  vec2 drift = (r - 0.5) * 0.7;
  vec2 d1 = (base - e1 + drift) * vec2(1.0, 1.4);
  vec2 d2 = (base - e2 - drift.yx) * vec2(1.0, 1.3);
  float reach = 0.5 + 0.32 * uEmber;
  float zone = clamp(exp(-dot(d1, d1) * 6.0 / reach) + 0.85 * exp(-dot(d2, d2) * 7.0 / reach), 0.0, 1.0);

  // Red first: ember glow, its bloom and rising sparks. Everything blue is
  // then cleared, and the ground pulled to char, wherever any red will show,
  // so red only ever lands on char and never blends into blue (no purple).
  float heat = layered3(base * 3.1 + vec2(0.0, -t * 0.085) + 1.1 * q);
  float flicker = 0.78 + 0.22 * vnoise(vec2(t * 1.4, base.x * 2.5 + base.y));
  float ember = smoothstep(0.5 - 0.04 * uEmber, 0.8, heat) * smoothstep(0.42, 0.95, zone) * (0.1 + 0.9 * uEmber) * flicker;
  float bloom = smoothstep(0.42, 0.95, zone) * (0.05 + 0.45 * uEmber) * (0.55 + 0.8 * heat);

  vec2 sp = base * vec2(8.0, 5.5) + vec2(0.0, -t * 0.75);
  vec2 cell = floor(sp);
  vec2 off = vec2(lattice(cell + 3.1), lattice(cell + 7.7)) - 0.5;
  float dist = length(fract(sp) - 0.5 - off * 0.55);
  float spark = smoothstep(0.11, 0.0, dist) * step(0.84, lattice(cell + 17.0));
  spark *= smoothstep(0.45, 0.7, zone) * uEmber * (0.6 + 0.4 * sin(t * 3.1 + lattice(cell) * 6.28));

  float red = max(max(ember * 1.3, bloom), spark);
  float redGate = smoothstep(0.0, 0.06, red);
  // A dark moat: blue is gone well before red begins, wide enough that a
  // blurred glass panel over the edge still cannot mix the two.
  float hush = max(smoothstep(0.12, 0.42, zone) * (0.3 + 0.45 * uEmber), redGate);
  float clearing = (1.0 - smoothstep(0.1, 0.3, zone)) * (1.0 - redGate);

  // Ground: abyss in the troughs, navy on the swells.
  vec3 col = mix(ABYSS, NAVY, smoothstep(0.22, 0.64, f));

  // Blue currents. Royal only in the cores.
  float mass = smoothstep(0.42, 0.86, f);
  float core = smoothstep(0.58, 0.92, f);
  float tint = clamp((q.x * 0.7 + r.y * 0.6) * 1.4 - 0.55, 0.0, 1.0);
  vec3 current = mix(COBALT, ROYAL, tint * core);
  float blue = clamp(mass * light, 0.0, 1.0) * clearing;
  col = mix(col, current, blue * 0.86);

  // Steel sheen rides thin contours of the warped field.
  float edge = f - 0.66 - 0.08 * (r.x - 0.5);
  float vein = exp(-edge * edge * 1500.0);
  float edge2 = f - 0.5 - 0.06 * (q.y - 0.5);
  float vein2 = exp(-edge2 * edge2 * 2200.0);
  col = mix(col, STEEL, (vein * 0.42 + vein2 * 0.16) * clamp(light, 0.0, 1.0) * clearing);

  // Pointer light: cool and soft, kept off the embers.
  col += (STEEL * 0.05 + ROYAL * 0.07) * halo * clearing;

  // Embers on char: deep red bloom, the glow, a hot core, then sparks.
  col = mix(col, CHAR, hush);
  col = mix(col, EMBER * 0.42, bloom);
  col = mix(col, EMBER, clamp(ember * 1.3, 0.0, 0.94));
  col = mix(col, HOT, smoothstep(0.62, 1.0, ember) * 0.5);
  col = mix(col, HOT, clamp(spark, 0.0, 1.0) * 0.85);

  // Vignette toward the abyss (toward char around the embers).
  vec2 v = (uv - 0.5) * vec2(1.0, 1.1);
  col = mix(mix(ABYSS, CHAR, hush), col, 0.62 + 0.38 * smoothstep(0.9, 0.2, length(v)));

  // Fine grain doubles as dither against banding.
  float grain = lattice(floor(gl_FragCoord.xy) + floor(fract(uClock * 0.73) * 997.0)) - 0.5;
  col += grain * 0.026;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    console.warn("ambient shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const UNIFORMS = ["uRes", "uTime", "uClock", "uScroll", "uVel", "uProgress", "uEmber", "uPointer"] as const;
type UniformName = (typeof UNIFORMS)[number];

/** Returns null when WebGL is unavailable, so the CSS fallback stays. */
export function createAmbientRenderer(canvas: HTMLCanvasElement): AmbientRenderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let uniforms: Record<UniformName, WebGLUniformLocation | null> | null = null;
  let lost = false;
  let width = 1;
  let height = 1;

  const build = (): boolean => {
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return false;
    const prog = gl.createProgram();
    if (!prog) return false;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteProgram(prog);
      return false;
    }
    program = prog;
    gl.useProgram(prog);
    // One oversized triangle covers the viewport with no diagonal seam.
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const found = {} as Record<UniformName, WebGLUniformLocation | null>;
    for (const name of UNIFORMS) found[name] = gl.getUniformLocation(prog, name);
    uniforms = found;
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    return true;
  };

  if (!build()) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }

  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    program = null;
    buffer = null;
    uniforms = null;
  };
  const onRestored = () => {
    lost = !build();
    canvas.width = width;
    canvas.height = height;
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  return {
    get lost() {
      return lost;
    },
    resize(nextWidth, nextHeight) {
      width = Math.max(1, Math.round(nextWidth));
      height = Math.max(1, Math.round(nextHeight));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
    },
    render(frame) {
      if (lost || !program || !uniforms) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, frame.time);
      gl.uniform1f(uniforms.uClock, frame.clock);
      gl.uniform1f(uniforms.uScroll, frame.scroll);
      gl.uniform1f(uniforms.uVel, frame.velocity);
      gl.uniform1f(uniforms.uProgress, frame.progress);
      gl.uniform1f(uniforms.uEmber, frame.ember);
      gl.uniform3f(uniforms.uPointer, frame.pointer[0], frame.pointer[1], frame.pointer[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      if (!gl.isContextLost()) {
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
      }
      program = null;
      buffer = null;
      uniforms = null;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
