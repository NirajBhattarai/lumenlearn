---
name: educational-animation
description: >
  Specialize animation for learning. Every animation must answer what the learner
  understands from it. Supports step execution, pause, play, reset, speed control,
  timeline, inspection, highlighting, and state transitions. Use for lesson visuals
  and LessonPlayer transport behavior.
metadata:
  version: "1.0"
---

# Educational Animation

## Gate question

> What does this animation help the learner understand?

If you cannot answer in one sentence, delete the animation.

## Required controls (complex viz)

Play · Pause · Step · Reset · Speed (`0.25x`–`4x`) · Timeline scrub · Inspection · Highlighting · Replay

## Pedagogy patterns

- Concrete example before abstraction
- State machine: name states; animate transitions; show invariant after
- Predict-then-reveal beats
- Compare mode: same workload, two policies
- Captions remain valid with reduced motion

## Implementation notes

- Diagram = pure `f(props)` or `f(state)`
- Player owns step index / time
- Stable stage height across steps
- Keyboard: Space, arrows, Home/End

## Pair with

`animation-engineering`, `technical-visualization`, `lesson-authoring`
