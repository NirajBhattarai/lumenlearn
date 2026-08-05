# ADR-002: Animation Engine

**Status:** Accepted  
**Date:** 2026-08-04

## Context

Lessons need purposeful, scrubbable motion that teaches cause → transition → result.

## Decision

- **Default:** Motion (`motion/react`) for UI chrome and lesson scene transitions.
- **Primitives layer:** project-owned animation helpers (`move`, `fade`, `highlight`, `insert`, `remove`, `swap`, `connect`, `timeline`, `state-transition`) wrapping Motion (and later GSAP if needed).
- **Defer GSAP** until scroll-driven or multi-element timelines exceed Motion comfortably.
- Always honor `prefers-reduced-motion`: jump to end state; captions remain authoritative.
- Prefer animating `transform` and `opacity`.

## Consequences

No GSAP install in Phase 1–5. Educational transport (play/pause/step/scrub/speed) lives in lesson/player layer, not ad-hoc setTimeout chains.
