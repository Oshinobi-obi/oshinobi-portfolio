// Runtime capability checks shared by every module.

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

// Testing switches: add ?nowebgl or ?reducedmotion to the URL to preview fallbacks.
const params = new URLSearchParams(window.location.search);
const forceReduced = params.has('reducedmotion');

export const env = {
  get reducedMotion() {
    return forceReduced || motionQuery.matches;
  },
  /** True on devices with a precise hovering pointer (mouse / trackpad). */
  finePointer: window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  isSmallScreen: () => window.innerWidth < 768,
  webgl: !params.has('nowebgl') && detectWebGL(),
};

export function onReducedMotionChange(cb) {
  motionQuery.addEventListener?.('change', () => cb(motionQuery.matches));
}

function detectWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
