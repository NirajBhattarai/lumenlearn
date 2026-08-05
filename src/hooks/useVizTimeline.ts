"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VizState, VizTimelineStep } from "@/lib/visualization/types";
import {
  nextTimelineIndex,
  stateAtTimelineIndex,
  stepDurationMs,
  type PlaybackSpeed,
} from "@/lib/animation";
import { prefersReducedMotion } from "@/lib/motion";

type Options = {
  initial: VizState;
  steps: VizTimelineStep[];
  speed?: PlaybackSpeed;
  playing?: boolean;
  onComplete?: () => void;
};

export function useVizTimeline({
  initial,
  steps,
  speed = 1,
  playing = false,
  onComplete,
}: Options) {
  const [index, setIndex] = useState(-1);

  const state = useMemo(
    () => stateAtTimelineIndex(initial, steps, index),
    [initial, steps, index],
  );

  const goTo = useCallback(
    (i: number) => {
      setIndex(Math.max(-1, Math.min(steps.length - 1, i)));
    },
    [steps.length],
  );

  const reset = useCallback(() => setIndex(-1), []);

  const stepForward = useCallback(() => {
    setIndex((i) => {
      const next = nextTimelineIndex(i, steps.length);
      if (next === null) {
        onComplete?.();
        return i;
      }
      return next;
    });
  }, [steps.length, onComplete]);

  const stepBack = useCallback(() => {
    setIndex((i) => Math.max(-1, i - 1));
  }, []);

  useEffect(() => {
    setIndex(-1);
  }, [initial, steps]);

  useEffect(() => {
    if (!playing) return;
    if (prefersReducedMotion()) {
      setIndex(Math.max(0, steps.length - 1));
      onComplete?.();
      return;
    }
    if (steps.length === 0) {
      onComplete?.();
      return;
    }
    const upcoming = index + 1;
    if (upcoming >= steps.length) {
      onComplete?.();
      return;
    }
    const ms = stepDurationMs(steps[upcoming]!, speed);
    const id = window.setTimeout(() => stepForward(), ms);
    return () => window.clearTimeout(id);
  }, [playing, index, steps, speed, stepForward, onComplete]);

  return {
    state,
    index,
    total: steps.length,
    goTo,
    reset,
    stepForward,
    stepBack,
    isComplete: steps.length > 0 && index >= steps.length - 1,
  };
}
