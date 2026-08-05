# ADR-008: Animation Engine v1

**Status:** Accepted  
**Date:** 2026-08-04

## Context

Phase 5 needs reusable educational animation primitives and transport speeds, wired to the Phase 4 viz event model.

## Decision

1. Animation primitives live in `src/lib/animation` and emit `VizEvent` / `AnimBeat` (cause → transition → result).
2. Timeline reduction uses pure `stateAtTimelineIndex` / `applyBeat`.
3. `useVizTimeline` + `VizTimelineStage` provide in-scene play/step/speed.
4. `LessonPlayer` gains global speed `0.25x…4x` (buttons + `[` `]`).
5. Motion remains the renderer; GSAP still deferred (ADR-002).
6. Extend viz events with `change-value` and `retarget-edge`.

## Consequences

New lesson animations should compose primitives into beats/timelines instead of ad-hoc Motion color tweens. Captions remain authoritative under reduced motion.
