import type { VizEvent, VizNode, VizTimelineStep } from "../visualization/types.ts";

export type PlaybackSpeed = 0.25 | 0.5 | 1 | 2 | 4;

export const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.25, 0.5, 1, 2, 4];

/** One teaching beat: cause → transition → result as ordered VizEvents. */
export type AnimBeat = {
  id: string;
  /** What the learner should understand from this beat */
  teaches: string;
  cause?: VizEvent[];
  transition: VizEvent[];
  result?: VizEvent[];
  durationMs?: number;
};

export function beatToTimelineStep(beat: AnimBeat): VizTimelineStep {
  return {
    id: beat.id,
    label: beat.teaches,
    durationMs: beat.durationMs ?? 700,
    events: [
      ...(beat.cause ?? []),
      ...beat.transition,
      ...(beat.result ?? []),
    ],
  };
}

export function beatsToTimeline(beats: AnimBeat[]): VizTimelineStep[] {
  return beats.map(beatToTimelineStep);
}

/** Flatten a beat's events in pedagogical order. */
export function expandBeatEvents(beat: AnimBeat): VizEvent[] {
  return [
    ...(beat.cause ?? []),
    ...beat.transition,
    ...(beat.result ?? []),
  ];
}

export type { VizEvent, VizNode, VizTimelineStep };
