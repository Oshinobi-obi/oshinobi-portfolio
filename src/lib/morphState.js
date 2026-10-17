// Tiny shared store for the crystal → sphere scroll morph.
// The morph overlay writes `progress`; the hero and language scenes read it
// to dissolve the crystal and re-form the globe in sync.
export const morphState = {
  /** False when the morph is off (reduced motion, no WebGL, not loaded yet). */
  enabled: false,
  /** 0 = crystal intact in the hero, 1 = particles have formed the globe. */
  progress: 0,
  /** Set by the hero scene: crystal center/scale/rotation in viewport px. */
  heroCrystal: null,
};

export const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
