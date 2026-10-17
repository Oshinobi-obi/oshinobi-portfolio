// Languages: an interactive 3D tag sphere. Each language is a label sprite
// on a Fibonacci sphere, tethered to a wireframe globe; label size scales
// with its share of bytes. Drag to spin (with inertia), hover for details.
import * as THREE from 'three';
import { env } from '../lib/env.js';
import { createSceneBase, softDotTexture } from './base.js';
import { langColor } from '../data/languageColors.js';
import { esc, fmtPct } from '../lib/util.js';
import { morphState, smoothstep } from '../lib/morphState.js';
import { GLOBE_RADIUS, LANG_FOV, languageCameraZ } from './shared.js';

const CYAN = new THREE.Color('#22d3ee');
const VIOLET = new THREE.Color('#a78bfa');
const RADIUS = 2.2;

export async function createScene(container, { data, tooltip }) {
  const base = createSceneBase(container, { fov: LANG_FOV, z: languageCameraZ(1) });
  const { scene, camera, renderer } = base;

  const world = new THREE.Group();
  world.rotation.set(0.35, 0.6, 0);
  scene.add(world);
  // The scroll morph aims its particles using this rotation.
  morphState.globeRotation = world.rotation;

  // Globe
  const globe = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(GLOBE_RADIUS, 2)),
    new THREE.LineBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.22 })
  );
  const globeCore = new THREE.Mesh(
    new THREE.SphereGeometry(1.0, 32, 32),
    new THREE.MeshBasicMaterial({ color: '#141a4a', transparent: true, opacity: 0.55 })
  );
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: softDotTexture(), color: CYAN, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  halo.scale.setScalar(5);
  world.add(globeCore, globe);
  scene.add(halo);

  const tags = [];
  const tethers = new THREE.Group();
  world.add(tethers);

  const fit = () => {
    // Pull the camera back on narrow canvases so labels never clip.
    camera.position.z = languageCameraZ(base.width / Math.max(1, base.height));
  };
  base.onResize(fit);
  fit();

  function buildTags(languages) {
    const list = languages.slice(0, 18);
    const maxPct = list[0]?.percent || 1;
    const n = list.length;
    const golden = Math.PI * (3 - Math.sqrt(5));

    list.forEach((lang, i) => {
      // Fibonacci sphere point
      const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      const p = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(RADIUS);

      const color = langColor(lang.name);
      const { texture, aspect } = labelTexture(lang, color);
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
      );
      const size = 0.24 + Math.sqrt(lang.percent / maxPct) * 0.24;
      sprite.scale.set(size * aspect, size, 1);
      sprite.position.copy(p);
      sprite.userData = { lang, baseScale: sprite.scale.clone(), hover: 0 };
      world.add(sprite);
      tags.push(sprite);

      // Tether from globe surface to label
      const from = p.clone().setLength(1.45);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([from, p.clone().multiplyScalar(0.94)]);
      const c = new THREE.Color(color).lerp(CYAN, 0.5);
      const tether = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.45 }));
      tether.userData.baseOpacity = 0.45;
      tethers.add(tether);
      const dot = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: softDotTexture(), color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      dot.position.copy(from);
      dot.scale.setScalar(0.18);
      dot.userData.baseOpacity = 1;
      tethers.add(dot);
    });
    base.renderOnce();
  }

  // ── Interaction: drag with inertia + hover raycast ──
  const el = renderer.domElement;
  el.style.touchAction = 'pan-y';
  el.style.cursor = 'grab';
  const vel = new THREE.Vector2(0, 0.004);
  let dragging = false;
  let last = null;
  let idleT = 0;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2(9, 9);
  let hovered = null;

  const toNdc = (e) => {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    return r;
  };

  el.addEventListener('pointerdown', (e) => {
    dragging = true;
    last = { x: e.clientX, y: e.clientY };
    el.style.cursor = 'grabbing';
    el.setPointerCapture?.(e.pointerId);
    toNdc(e);
    pick(e);
  });
  el.addEventListener('pointermove', (e) => {
    const rect = toNdc(e);
    if (dragging && last) {
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      // Horizontal drag only on touch, so vertical swipes still scroll the page.
      vel.set(dy * 0.005 * (e.pointerType === 'mouse' ? 1 : 0), dx * 0.005);
      world.rotation.y += vel.y;
      world.rotation.x += vel.x;
      last = { x: e.clientX, y: e.clientY };
      idleT = 0;
    }
    pick(e, rect);
    if (!base.running) base.renderOnce();
  });
  const end = () => {
    dragging = false;
    last = null;
    el.style.cursor = 'grab';
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('pointerleave', () => {
    end();
    ndc.set(9, 9);
    setHover(null);
    if (!base.running) base.renderOnce();
  });

  function pick(e, rect = el.getBoundingClientRect()) {
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(tags, false)[0];
    setHover(hit?.object || null, e, rect);
  }

  function setHover(obj, e, rect) {
    hovered = obj;
    if (!tooltip) return;
    if (!obj) {
      tooltip.classList.remove('is-visible');
      return;
    }
    const { lang } = obj.userData;
    tooltip.innerHTML = `<strong style="--c:${langColor(lang.name)}">${esc(lang.name)}</strong><span>${fmtPct(lang.percent)} · ${formatBytes(lang.bytes)}</span>`;
    const host = container.parentElement.getBoundingClientRect();
    tooltip.style.transform = `translate(${e.clientX - host.left + 14}px, ${e.clientY - host.top + 14}px)`;
    tooltip.classList.add('is-visible');
  }

  const tmp = new THREE.Vector3();
  base.setUpdate((dt) => {
    const calm = env.reducedMotion;
    if (!dragging && !calm) {
      idleT += dt;
      // Inertia decays toward a gentle auto-rotation.
      vel.x *= 0.94;
      vel.y += (0.0035 - vel.y) * (idleT > 1.2 ? 0.02 : 0.005);
      world.rotation.y += vel.y;
      world.rotation.x += vel.x;
      world.rotation.x += (0.35 - world.rotation.x) * 0.01;
    }
    globe.rotation.y -= calm ? 0 : dt * 0.1;

    // Re-form as the scroll-morph particles arrive: the globe grows into
    // place, then the language tags fade in.
    const p = morphState.enabled ? morphState.progress : 1;
    const formGlobe = smoothstep(0.7, 1, p);
    const formTags = smoothstep(0.86, 1, p);
    world.scale.setScalar(0.55 + 0.45 * formGlobe);
    globe.material.opacity = 0.22 * (0.25 + 0.75 * formGlobe);
    globeCore.material.opacity = 0.55 * formGlobe;
    halo.material.opacity = 0.25 * formGlobe;
    tethers.visible = formTags > 0.01;
    for (const t of tethers.children) t.material.opacity = t.userData.baseOpacity * formTags;

    // Depth cue: fade/shrink labels on the far side; grow hovered one.
    for (const s of tags) {
      s.getWorldPosition(tmp);
      const depth = (tmp.z + RADIUS) / (RADIUS * 2); // 0 back → 1 front
      const target = s === hovered ? 1 : 0;
      s.userData.hover += (target - s.userData.hover) * (calm ? 1 : 0.2);
      const k = 0.75 + depth * 0.25 + s.userData.hover * 0.25;
      s.scale.copy(s.userData.baseScale).multiplyScalar(k);
      s.material.opacity = (0.25 + depth * 0.75) * formTags;
      s.renderOrder = Math.round(depth * 100);
    }
  });

  // Build labels once data arrives (sphere already renders meanwhile).
  data
    ?.then(async (d) => {
      // Labels are drawn to canvas, so wait for the web fonts first.
      await document.fonts?.ready;
      buildTags(d.languages);
    })
    .catch(() => {
      /* list below shows the error; globe stays as decoration */
    });

  return base;
}

function labelTexture(lang, color) {
  const dpr = 2;
  const font = `600 ${26 * dpr}px "Space Grotesk", system-ui, sans-serif`;
  const sub = `500 ${18 * dpr}px "JetBrains Mono", ui-monospace, monospace`;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = font;
  const nameW = ctx.measureText(lang.name).width;
  ctx.font = sub;
  const pct = fmtPct(lang.percent);
  const pctW = ctx.measureText(pct).width;
  const padX = 20 * dpr;
  const dotR = 7 * dpr;
  const h = 56 * dpr;
  const w = Math.ceil(padX + dotR * 2 + 12 * dpr + nameW + 12 * dpr + pctW + padX);
  c.width = w;
  c.height = h;

  // Pill background
  const r = h / 2;
  ctx.beginPath();
  ctx.roundRect(2, 2, w - 4, h - 4, r - 2);
  ctx.fillStyle = 'rgba(10, 14, 38, 0.82)';
  ctx.fill();
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, 'rgba(34, 211, 238, 0.9)');
  grad.addColorStop(1, 'rgba(167, 139, 250, 0.9)');
  ctx.lineWidth = 2.5 * dpr;
  ctx.strokeStyle = grad;
  ctx.stroke();

  // Language color dot
  let x = padX + dotR;
  ctx.beginPath();
  ctx.arc(x, h / 2, dotR, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 1.5 * dpr;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.stroke();

  x += dotR + 12 * dpr;
  ctx.textBaseline = 'middle';
  ctx.font = font;
  ctx.fillStyle = '#eef2ff';
  ctx.fillText(lang.name, x, h / 2 + 1);
  x += nameW + 12 * dpr;
  ctx.font = sub;
  ctx.fillStyle = '#67e8f9';
  ctx.fillText(pct, x, h / 2 + 1);

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, aspect: w / h };
}

function formatBytes(b) {
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`;
  return `${b} B`;
}
