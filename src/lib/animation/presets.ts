import { durations, easings, prefersReducedMotion } from "../motion.ts";
import type { PlaybackSpeed } from "./types.ts";

export function scaleDurationSeconds(
  baseSeconds: number,
  speed: PlaybackSpeed,
): number {
  if (prefersReducedMotion()) return 0.01;
  return baseSeconds / speed;
}

export function scaleDurationMs(baseMs: number, speed: PlaybackSpeed): number {
  if (prefersReducedMotion()) return 1;
  return Math.max(1, Math.round(baseMs / speed));
}

/** Motion transition presets — prefer transform/opacity. */
export const animPresets = {
  fade: (speed: PlaybackSpeed = 1) => ({
    duration: scaleDurationSeconds(durations.ui, speed),
    ease: easings.out,
  }),
  scene: (speed: PlaybackSpeed = 1) => ({
    duration: scaleDurationSeconds(durations.scene, speed),
    ease: easings.out,
  }),
  snappy: (speed: PlaybackSpeed = 1) => ({
    duration: scaleDurationSeconds(durations.hover, speed),
    ease: easings.snappy,
  }),
  softExit: (speed: PlaybackSpeed = 1) => ({
    duration: scaleDurationSeconds(durations.ui * 1.2, speed),
    ease: easings.inOut,
  }),
} as const;

export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

export const popVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
} as const;
