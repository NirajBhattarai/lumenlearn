export const durations = {
  hover: 0.15,
  ui: 0.25,
  scene: 0.45,
  slow: 0.7,
} as const;

export const easings = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  snappy: [0.22, 1, 0.36, 1] as const,
};

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
