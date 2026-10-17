import * as THREE from 'three';
import { env, onReducedMotionChange } from '../lib/env.js';

export function createSceneBase(container, { fov = 45, z = 8 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, env.isSmallScreen() ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.z = z;

  const resizeCbs = [];
  let update = () => {};
  let draw = () => renderer.render(scene, camera);
  let running = false;
  let raf = 0;
  let last = performance.now();
  let elapsed = 0;

  const api = {
    scene,
    camera,
    renderer,
    width: 1,
    height: 1,
    onResize: (cb) => resizeCbs.push(cb),
    setUpdate: (fn) => (update = fn),
    setRender: (fn) => (draw = fn),
    renderOnce() {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      update(dt, elapsed);
      draw();
    },
    start() {
      if (running) return;
      if (env.reducedMotion) return api.renderOnce();
      running = true;
      last = performance.now();
      const tick = () => {
        if (!running) return;
        api.renderOnce();
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    get running() {
      return running;
    },
    dispose() {
      api.stop();
      ro.disconnect();
      scene.traverse((o) => {
        o.geometry?.dispose();
        [].concat(o.material || []).forEach((m) => {
          m.map?.dispose();
          m.dispose();
        });
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };

  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    api.width = w;
    api.height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    resizeCbs.forEach((cb) => cb(w, h));
    if (!running) draw();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  onReducedMotionChange((reduced) => {
    if (reduced && running) {
      api.stop();
      api.renderOnce();
    }
  });

  return api;
}

let dotTexture = null;

export function softDotTexture() {
  if (dotTexture) return dotTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  dotTexture = new THREE.CanvasTexture(c);
  return dotTexture;
}
