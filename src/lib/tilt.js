import { env } from './env.js';

export function initTilt(root = document) {
  root.querySelectorAll('[data-tilt]').forEach((card) => {
    if (card.dataset.tiltReady) return;
    card.dataset.tiltReady = '1';
    const max = Number(card.dataset.tiltMax || 12);
    let raf = 0;
    let rect = null;

    const set = (rx, ry, gx, gy, active) => {
      card.style.setProperty('--rx', `${rx}deg`);
      card.style.setProperty('--ry', `${ry}deg`);
      card.style.setProperty('--gx', `${gx}%`);
      card.style.setProperty('--gy', `${gy}%`);
      card.classList.toggle('is-tilting', active);
    };

    card.addEventListener('pointerenter', () => {
      rect = card.getBoundingClientRect();
    });

    card.addEventListener('pointermove', (e) => {
      if (env.reducedMotion || e.pointerType !== 'mouse') return;
      rect ||= card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        set((0.5 - py) * max * 2, (px - 0.5) * max * 2, px * 100, py * 100, true)
      );
    });

    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      rect = null;
      set(0, 0, 50, 50, false);
    });
  });
}
