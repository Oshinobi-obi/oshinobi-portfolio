// Scroll morph: the hero crystal bursts into particles that swirl down the
// page and re-form as the wireframe globe in "Languages & Tech".
//
// It's a fixed, click-through overlay canvas. Each particle has a point on
// the crystal (shape A) and a point on the globe (shape B). Every frame we
// work out where both objects currently sit on screen, and the vertex shader
// blends between them by scroll progress, adding a swirl mid-flight.
import * as THREE from 'three';
import { env, onReducedMotionChange } from '../lib/env.js';
import { morphState } from '../lib/morphState.js';
import {
  GLOBE_RADIUS,
  LANG_FOV,
  languageCameraZ,
  makeCrystalGeometry,
  samplePointsOnEdges,
  samplePointsOnFaces,
} from './shared.js';

const vertexShader = /* glsl */ `
  attribute vec3 aA;
  attribute vec3 aB;
  attribute float aRand;
  uniform vec2 uRes;       // viewport size in CSS px
  uniform vec4 uA;         // crystal: center x, y (px), px per unit, camera depth
  uniform vec4 uB;         // globe:   center x, y (px), px per unit, camera depth
  uniform vec2 uRotA;      // crystal rotation (y, x)
  uniform vec2 uRotB;      // globe rotation (y, x)
  uniform float uP;        // scroll progress 0..1
  uniform float uT;        // time
  uniform float uSwirl;    // swirl radius in px
  uniform float uDpr;
  uniform float uMidAlpha; // dimmer mid-flight so text underneath stays readable
  varying float vAlpha;
  varying vec3 vColor;

  mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0., -s, 0., 1., 0., s, 0., c); }
  mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1., 0., 0., 0., c, s, 0., -s, c); }

  // Simple perspective projection of a local point onto the screen.
  vec2 toScreen(vec3 p, vec4 o, out float persp) {
    persp = o.w / max(o.w - p.z, 0.1);
    return o.xy + vec2(p.x, -p.y) * o.z * persp;
  }

  void main() {
    // Stagger each particle's departure so they peel off, not jump at once.
    float t = clamp((uP - aRand * 0.22) / 0.78, 0.0, 1.0);
    float e = t * t * (3.0 - 2.0 * t);

    float pa, pb;
    vec2 sa = toScreen(rotX(uRotA.y) * rotY(uRotA.x + e * 2.5) * aA, uA, pa);
    vec2 sb = toScreen(rotX(uRotB.y) * rotY(uRotB.x - (1.0 - e) * 2.0) * aB, uB, pb);
    vec2 s = mix(sa, sb, e);

    // Swirl outward mid-flight, like a galaxy arm.
    float mid = sin(e * 3.14159);
    float ang = aRand * 6.2831 + uT * (0.4 + aRand * 0.6) + e * 6.0;
    s += vec2(cos(ang), sin(ang) * 0.6) * mid * uSwirl * (0.35 + aRand);

    vec2 clip = s / uRes * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);

    float persp = mix(pa, pb, e);
    gl_PointSize = (1.4 + aRand * 2.4) * persp * (1.0 + mid * 0.8) * uDpr;

    // Fade in as the crystal dissolves; fade out as the globe takes over.
    vAlpha = smoothstep(0.0, 0.1, uP) * (1.0 - smoothstep(0.9, 1.0, uP)) * (0.55 + 0.45 * persp) * mix(1.0, uMidAlpha, mid);
    vColor = mix(vec3(0.133, 0.827, 0.933), vec3(0.655, 0.545, 0.98), fract(aRand * 7.31));
    vColor = mix(vColor, vec3(1.0), mid * 0.25 * step(0.85, aRand));
  }
`;

const fragmentShader = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

export function createMorph({ heroEl, sphereEl, canvasEl }) {
  const small = env.isSmallScreen();
  const count = small ? 2200 : 5000;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
  const dpr = Math.min(window.devicePixelRatio, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'morph-layer';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  // Shape A: the crystal — mostly along its edges, some across its faces.
  const crystal = makeCrystalGeometry();
  const nEdges = Math.floor(count * 0.6);
  const a = new Float32Array(count * 3);
  a.set(samplePointsOnEdges(new THREE.EdgesGeometry(crystal), nEdges, 0.03), 0);
  a.set(samplePointsOnFaces(crystal, count - nEdges), nEdges * 3);

  // Shape B: the globe's wireframe (matches the language sphere).
  const globe = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(GLOBE_RADIUS, 2));
  const b = samplePointsOnEdges(globe, count, 0.04);

  const rand = new Float32Array(count).map(() => Math.random());
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('aA', new THREE.BufferAttribute(a, 3));
  geo.setAttribute('aB', new THREE.BufferAttribute(b, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  // Three needs a `position` attribute to draw; the shader ignores it.
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));

  const uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uA: { value: new THREE.Vector4() },
    uB: { value: new THREE.Vector4() },
    uRotA: { value: new THREE.Vector2() },
    uRotB: { value: new THREE.Vector2(0.6, 0.35) },
    uP: { value: 0 },
    uT: { value: 0 },
    uSwirl: { value: 120 },
    uDpr: { value: dpr },
    uMidAlpha: { value: small ? 0.3 : 0.55 },
  };
  const points = new THREE.Points(
    geo,
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
    })
  );
  points.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(points);
  const camera = new THREE.Camera();

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
    uniforms.uSwirl.value = Math.min(160, window.innerWidth * 0.12);
  };
  resize();

  /** Scroll progress: starts as you leave the hero, ends when the globe is in view. */
  function progress() {
    const vh = window.innerHeight;
    const start = heroEl.offsetTop + vh * 0.12;
    const r = sphereEl.getBoundingClientRect();
    const end = r.top + window.scrollY + r.height / 2 - vh * 0.55;
    if (end <= start) return 1;
    return Math.min(1, Math.max(0, (window.scrollY - start) / (end - start)));
  }

  function updateTargets() {
    // Crystal: ask the hero scene; fall back to the hero's right side.
    const c = morphState.heroCrystal?.();
    if (c) {
      uniforms.uA.value.set(c.x, c.y, c.pxPerUnit, c.depth);
      uniforms.uRotA.value.set(c.rotY, c.rotX);
    } else {
      const hr = heroEl.getBoundingClientRect();
      uniforms.uA.value.set(hr.left + hr.width * 0.72, hr.top + hr.height * 0.5, hr.height / 8, 9);
    }
    // Globe: same camera math as the language scene.
    const r = canvasEl.getBoundingClientRect();
    const camZ = languageCameraZ(r.width / Math.max(1, r.height));
    const visibleH = 2 * Math.tan(THREE.MathUtils.degToRad(LANG_FOV / 2)) * camZ;
    uniforms.uB.value.set(r.left + r.width / 2, r.top + r.height / 2, r.height / visibleH, camZ);
    if (morphState.globeRotation) uniforms.uRotB.value.set(morphState.globeRotation.y, morphState.globeRotation.x);
  }

  // Render only while the morph is mid-flight; otherwise sit idle.
  let raf = 0;
  let shown = false;
  let last = performance.now();
  const tick = () => {
    raf = 0;
    const p = progress();
    morphState.progress = p;
    const active = p > 0 && p < 1 && !document.hidden;
    if (active) {
      const now = performance.now();
      uniforms.uT.value += Math.min((now - last) / 1000, 0.05);
      last = now;
      uniforms.uP.value = p;
      updateTargets();
      renderer.render(scene, camera);
      shown = true;
      raf = requestAnimationFrame(tick);
    } else if (shown) {
      renderer.clear();
      shown = false;
    }
  };
  const wake = () => {
    if (!raf && morphState.enabled) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };

  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', () => {
    resize();
    wake();
  });
  document.addEventListener('visibilitychange', wake);

  const disable = () => {
    morphState.enabled = false;
    morphState.progress = 0;
    cancelAnimationFrame(raf);
    raf = 0;
    renderer.clear();
  };
  onReducedMotionChange((reduced) => (reduced ? disable() : ((morphState.enabled = true), wake())));

  morphState.enabled = true;
  wake();
  return { dispose: () => (disable(), renderer.dispose(), canvas.remove()) };
}
