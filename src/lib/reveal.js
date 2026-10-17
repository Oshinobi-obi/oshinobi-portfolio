// Scroll-triggered reveals with GSAP + ScrollTrigger.
// With prefers-reduced-motion everything is simply shown, no animation.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env } from './env.js';

gsap.registerPlugin(ScrollTrigger);

export function initReveals() {
  if (env.reducedMotion) return;

  // Hero intro
  gsap.from('[data-hero-item]', {
    y: 40,
    opacity: 0,
    duration: 1.1,
    ease: 'power3.out',
    stagger: 0.12,
    delay: 0.15,
  });

  // Hero content drifts up and fades as you scroll away
  gsap.to('[data-hero-content]', {
    yPercent: -18,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // Generic fade / rise
  revealBatch('[data-reveal]', { y: 48, opacity: 0, duration: 0.9, ease: 'power3.out' });

  // Project cards flip in with 3D perspective
  revealBatch('[data-flip]', {
    opacity: 0,
    rotationX: -65,
    rotationY: 12,
    y: 80,
    z: -120,
    transformPerspective: 1100,
    transformOrigin: '50% 100%',
    duration: 1.2,
    ease: 'expo.out',
    stagger: 0.12,
  });

  // Section numbers parallax
  gsap.utils.toArray('.section__num').forEach((el) => {
    gsap.fromTo(
      el,
      { yPercent: 40 },
      { yPercent: -40, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } }
    );
  });
}

/**
 * Reveal elements as they enter the viewport. Safe to call for late-added
 * content. The observer's top margin is huge, so anything already scrolled
 * past (deep links, restored scroll on reload) counts as "in view" and is
 * revealed immediately instead of staying hidden.
 */
export function revealBatch(selector, from = { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out' }) {
  if (env.reducedMotion) return;
  const { duration = 0.8, ease = 'power3.out', stagger = 0.08, ...fromProps } = from;
  const els = gsap.utils.toArray(selector).filter((el) => !el.dataset.revealed);
  if (!els.length) return;
  els.forEach((el) => (el.dataset.revealed = '1'));
  gsap.set(els, fromProps);

  const io = new IntersectionObserver(
    (entries) => {
      const batch = entries.filter((e) => e.isIntersecting).map((e) => e.target);
      if (!batch.length) return;
      batch.forEach((el) => io.unobserve(el));
      gsap.to(batch, {
        x: 0,
        y: 0,
        z: 0,
        rotationX: 0,
        rotationY: 0,
        opacity: 1,
        duration,
        ease,
        stagger,
        overwrite: true,
        clearProps: 'transform',
      });
    },
    { rootMargin: '100000px 0px -10% 0px' }
  );
  els.forEach((el) => io.observe(el));
}

export function refreshScroll() {
  ScrollTrigger.refresh();
}
