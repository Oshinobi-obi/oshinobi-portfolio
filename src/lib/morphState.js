export const morphState = {
  enabled: false,
  progress: 0,
  heroCrystal: null,
};

export const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
