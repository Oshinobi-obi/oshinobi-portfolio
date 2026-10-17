// Hero: a low-poly crystal wrapped in wireframe + orbiting code cubes,
// inside a particle field that parallaxes with the mouse. A bloom pass makes
// the neon edges glow, and the crystal dissolves as the scroll morph starts.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { env } from '../lib/env.js';
import { morphState, smoothstep } from '../lib/morphState.js';
import { createSceneBase, softDotTexture } from './base.js';
import { HERO_CAMERA_Z, HERO_FOV, makeCrystalGeometry } from './shared.js';

const CYAN = new THREE.Color('#22d3ee');
const VIOLET = new THREE.Color('#a78bfa');
// Neon glow strength (UnrealBloomPass). Raise for more glow, lower for subtler.
const BLOOM_DESKTOP = 0.7;
const BLOOM_MOBILE = 0.55;

export function createScene(container) {
  const small = env.isSmallScreen();
  const BLOOM = small ? BLOOM_MOBILE : BLOOM_DESKTOP;
  const base = createSceneBase(container, { fov: HERO_FOV, z: HERO_CAMERA_Z });
  const { scene, camera, renderer } = base;

  // ── Lights ──
  scene.add(new THREE.AmbientLight('#4c5a9a', 0.6));
  const keyLight = new THREE.PointLight(CYAN, 60, 30);
  keyLight.position.set(4, 3, 5);
  const rimLight = new THREE.PointLight(VIOLET, 70, 30);
  rimLight.position.set(-5, -2, 3);
  scene.add(keyLight, rimLight);

  // ── Crystal cluster ──
  const cluster = new THREE.Group();
  scene.add(cluster);

  // Jittered icosahedron so it reads as a cut gem rather than a ball.
  const crystalGeo = makeCrystalGeometry();

  const crystal = new THREE.Mesh(
    crystalGeo,
    new THREE.MeshStandardMaterial({
      color: '#0d1433',
      emissive: '#1b1150',
      emissiveIntensity: 0.6,
      metalness: 0.65,
      roughness: 0.25,
      flatShading: true,
      transparent: true,
      opacity: 0.92,
    })
  );
  cluster.add(crystal);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(crystalGeo),
    new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.85 })
  );
  edges.scale.setScalar(1.002);
  cluster.add(edges);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 0),
    new THREE.MeshBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending })
  );
  cluster.add(core);

  // Outer wireframe shell
  const shell = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.45, 1)),
    new THREE.LineBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.12 })
  );
  cluster.add(shell);

  // Orbit rings
  const ringMat = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.22 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.008, 6, 160), ringMat);
  ring1.rotation.x = Math.PI / 2.4;
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(3.3, 0.006, 6, 160),
    ringMat.clone().setValues({ color: VIOLET, opacity: 0.2 })
  );
  ring2.rotation.set(Math.PI / 3, Math.PI / 5, 0);
  cluster.add(ring1, ring2);

  // Floating "code cubes" orbiting the crystal
  const cubes = [];
  const cubeGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
  const cubeEdges = new THREE.EdgesGeometry(cubeGeo);
  const cubeCount = small ? 8 : 14;
  for (let i = 0; i < cubeCount; i++) {
    const g = new THREE.Group();
    const color = i % 2 ? CYAN : VIOLET;
    g.add(
      new THREE.Mesh(cubeGeo, new THREE.MeshStandardMaterial({ color: '#0b1030', emissive: color, emissiveIntensity: 0.25, metalness: 0.5, roughness: 0.4, transparent: true })),
      new THREE.LineSegments(cubeEdges, new THREE.LineBasicMaterial({ color, transparent: true }))
    );
    const s = 0.6 + Math.random() * 0.9;
    g.scale.setScalar(s);
    g.userData = {
      radius: 2.6 + Math.random() * 1.0,
      speed: (0.12 + Math.random() * 0.18) * (Math.random() < 0.5 ? -1 : 1),
      angle: Math.random() * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 1.4,
      spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.02),
    };
    cubes.push(g);
    cluster.add(g);
  }

  // ── Particle field ──
  const count = small ? 900 : 2200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const tmp = new THREE.Color();
  for (let i = 0; i < count; i++) {
    // Spherical shell with denser distribution near the middle.
    const r = 6 + Math.pow(Math.random(), 0.6) * 18;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
    positions[i * 3 + 2] = r * Math.cos(phi) - 6;
    tmp.copy(CYAN).lerp(VIOLET, Math.random());
    colors.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({
      size: small ? 0.09 : 0.075,
      map: softDotTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
  );
  // Second, nearer layer moves more for stronger parallax depth.
  const nearParticles = particles.clone();
  nearParticles.scale.setScalar(0.45);
  nearParticles.position.z = 3;
  scene.add(particles, nearParticles);

  // Every material in the cluster, with its resting opacity, so the whole
  // thing can fade out as it "shatters" into the morph particles.
  const fadeables = [];
  cluster.traverse((o) => {
    if (o.material) fadeables.push({ m: o.material, base: o.material.opacity ?? 1 });
  });

  // ── Layout: crystal sits right of the headline on wide screens ──
  let baseScale = 1;
  const layout = () => {
    cluster.userData.bob = 0;
    const aspect = base.width / Math.max(1, base.height);
    if (aspect > 1.1) {
      cluster.position.set(Math.min(3.6, 1.9 * aspect), 0.1, 0);
      baseScale = 1;
    } else {
      cluster.position.set(0, 2.1, -1);
      baseScale = 0.62;
    }
    cluster.scale.setScalar(baseScale);
  };
  base.onResize(layout);
  layout();

  // ── Bloom (neon glow) ──
  // UnrealBloomPass keeps alpha, so the canvas stays transparent over the page.
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(base.width, base.height), BLOOM, 0.5, 0.14);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const sizeComposer = (w, h) => {
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
  };
  base.onResize(sizeComposer);
  sizeComposer(base.width, base.height);
  base.setRender(() => composer.render());

  // ── Tell the scroll morph where the crystal is on screen ──
  const worldPos = new THREE.Vector3();
  morphState.heroCrystal = () => {
    const rect = renderer.domElement.getBoundingClientRect();
    cluster.getWorldPosition(worldPos);
    const depth = camera.position.distanceTo(worldPos);
    worldPos.project(camera);
    const visibleH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * depth;
    return {
      x: rect.left + ((worldPos.x + 1) / 2) * rect.width,
      y: rect.top + ((1 - worldPos.y) / 2) * rect.height,
      pxPerUnit: (rect.height / visibleH) * baseScale,
      depth,
      rotY: crystal.rotation.y + cluster.rotation.y,
      rotX: crystal.rotation.x + cluster.rotation.x,
    };
  };

  // ── Pointer parallax ──
  const pointer = new THREE.Vector2();
  const smooth = new THREE.Vector2();
  const onMove = (e) => {
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    if (env.reducedMotion) base.renderOnce();
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  base.setUpdate((dt, t) => {
    const calm = env.reducedMotion;

    smooth.lerp(pointer, calm ? 1 : 0.05);

    // Scroll progress through the hero (0 → 1) pushes the cluster back.
    const scroll = Math.min(1, window.scrollY / Math.max(1, base.height));

    if (!calm) {
      crystal.rotation.y += dt * 0.25;
      crystal.rotation.x = Math.sin(t * 0.3) * 0.2;
      edges.rotation.copy(crystal.rotation);
      core.rotation.y -= dt * 0.8;
      core.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
      shell.rotation.y -= dt * 0.06;
      shell.rotation.z += dt * 0.03;
      ring1.rotation.z += dt * 0.15;
      ring2.rotation.z -= dt * 0.1;
      cluster.position.y += (Math.sin(t * 0.8) * 0.08 - (cluster.userData.bob || 0));
      cluster.userData.bob = Math.sin(t * 0.8) * 0.08;

      for (const c of cubes) {
        const d = c.userData;
        d.angle += d.speed * dt;
        c.position.set(Math.cos(d.angle) * d.radius, Math.sin(d.angle * 1.3) * d.tilt * 1.5, Math.sin(d.angle) * d.radius);
        c.rotation.x += d.spin.x;
        c.rotation.y += d.spin.y;
      }
      particles.rotation.y += dt * 0.012;
      nearParticles.rotation.y -= dt * 0.02;
    } else if (!cubes[0].userData.placed) {
      for (const c of cubes) {
        const d = c.userData;
        c.position.set(Math.cos(d.angle) * d.radius, Math.sin(d.angle * 1.3) * d.tilt * 1.5, Math.sin(d.angle) * d.radius);
        d.placed = true;
      }
    }

    // Mouse parallax: cluster tilts toward pointer, particle layers drift.
    cluster.rotation.x = smooth.y * 0.25;
    cluster.rotation.y = smooth.x * 0.35;
    particles.position.x = -smooth.x * 0.6;
    particles.position.y = smooth.y * 0.4;
    nearParticles.position.x = -smooth.x * 1.6;
    nearParticles.position.y = smooth.y * 1.1;
    camera.position.x = smooth.x * 0.4;
    camera.position.y = -smooth.y * 0.3;
    camera.position.z = 9 + scroll * 3;
    camera.lookAt(0, 0, 0);

    // Crystal dissolves (fades and swells) as the morph particles take over.
    const dissolve = morphState.enabled ? smoothstep(0.0, 0.14, morphState.progress) : 0;
    cluster.scale.setScalar(baseScale * (1 + dissolve * 0.25));
    for (const f of fadeables) f.m.opacity = f.base * (1 - dissolve);
    cluster.visible = dissolve < 0.999;
    bloom.strength = BLOOM + (calm ? 0 : Math.sin(t * 1.3) * 0.06);

    keyLight.position.x = 4 + Math.sin(t * 0.5) * 2;
    rimLight.position.y = -2 + Math.cos(t * 0.4) * 2;
  });

  const dispose = base.dispose;
  base.dispose = () => {
    window.removeEventListener('pointermove', onMove);
    composer.dispose();
    morphState.heroCrystal = null;
    dispose();
  };
  return base;
}
