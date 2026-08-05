---
name: animation-engineering
description: >
  Create purposeful animations with reusable primitives (move, fade, scale, highlight,
  connect, disconnect, insert, remove, swap, rotate, transform, pulse, trace, timeline,
  state-transition). Use for motion implementation, Motion/GSAP work, or transitions.
  Animations must communicate cause → transition → result.
metadata:
  version: "1.0"
---

# Animation Engineering

## Law

Never animate merely because animation is possible. Every motion answers: **what changed and why?**

## Communication model

```
cause → transition → result
```

## Primitives

`move` · `fade` · `scale` · `highlight` · `connect` · `disconnect` · `insert` · `remove` · `swap` · `rotate` · `transform` · `pulse` · `trace` · `timeline` · `state-transition`

Implement as reusable helpers; do not copy-paste ad-hoc tweens per lesson.

## Stack (this repo)

- Default: Motion (`motion/react`) — see ADR-002, ADR-008
- Primitives: `src/lib/animation` → `VizEvent` / `AnimBeat`
- Timeline UI: `VizTimelineStage` + `useVizTimeline`
- Prefer `transform` / `opacity`
- GSAP only when justified (complex timelines/scroll)
- Honor `prefers-reduced-motion`

## Timing heuristics

- UI hover: 120–180ms
- Scene morph: 300–600ms
- Stagger: 30–60ms unless intentional
- Enter snappy (`easeOut`); exits softer

## Anti-patterns

Infinite decorative loops · layout thrash (`top`/`left`/`width`) · motion as only information channel
