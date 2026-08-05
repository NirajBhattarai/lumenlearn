import {
  applyVizEvent,
  applyVizEvents,
} from "../visualization/reduce.ts";
import type { VizState, VizTimelineStep } from "../visualization/types.ts";
import type { AnimBeat } from "./types.ts";
import { beatsToTimeline, expandBeatEvents } from "./types.ts";
import { scaleDurationMs } from "./presets.ts";
import type { PlaybackSpeed } from "./types.ts";

/** Apply all events in steps[0..index] inclusive onto initial state. */
export function stateAtTimelineIndex(
  initial: VizState,
  steps: VizTimelineStep[],
  index: number,
): VizState {
  if (index < 0) return initial;
  let state = initial;
  const end = Math.min(index, steps.length - 1);
  for (let i = 0; i <= end; i++) {
    state = applyVizEvents(state, steps[i]!.events);
  }
  return state;
}

/** Apply a single beat's events onto state. */
export function applyBeat(state: VizState, beat: AnimBeat): VizState {
  return applyVizEvents(state, expandBeatEvents(beat));
}

export function applyBeats(state: VizState, beats: AnimBeat[]): VizState {
  return beats.reduce(applyBeat, state);
}

export function timelineFromBeats(beats: AnimBeat[]): VizTimelineStep[] {
  return beatsToTimeline(beats);
}

export function stepDurationMs(
  step: VizTimelineStep,
  speed: PlaybackSpeed,
  fallback = 700,
): number {
  return scaleDurationMs(step.durationMs ?? fallback, speed);
}

/** Advance helper for autoplay loops. */
export function nextTimelineIndex(
  current: number,
  length: number,
): number | null {
  if (current >= length - 1) return null;
  return current + 1;
}

export { applyVizEvent, applyVizEvents };
