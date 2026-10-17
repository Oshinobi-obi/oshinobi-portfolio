import { env } from './env.js';

export function initCursorGlow() {
  const glow = document.querySelector('.cursor-glow');
  if (!glow || !env.finePointer) {
    glow?.remove();
    return;
  }
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let cx = x;
  let cy = y;
  let raf = 0;

  const loop = () => {
    const k = env.reducedMotion ? 1 : 0.18;
    cx += (x - cx) * k;
    cy += (y - cy) * k;
    glow.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.5 ? requestAnimationFrame(loop) : 0;
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      glow.classList.add('is-active');
      if (!raf) raf = requestAnimationFrame(loop);
    },
    { passive: true }
  );
  document.addEventListener('pointerleave', () => glow.classList.remove('is-active'));

  document.addEventListener('pointerover', (e) => {
    glow.classList.toggle('is-hover', !!e.target.closest('a, button, [data-tilt]'));
  });
}
