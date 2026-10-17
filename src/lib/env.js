const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const params = new URLSearchParams(window.location.search);
const forceReduced = params.has('reducedmotion');

export const env = {
  get reducedMotion() {
    return forceReduced || motionQuery.matches;
  },
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
