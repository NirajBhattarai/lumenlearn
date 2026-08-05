---
name: testing
description: >
  Define unit, integration, E2E, visual regression, interaction, and animation-state
  tests. Use when completing features or adding engines. A feature is not done merely
  because TypeScript compiles. Prefer modern tooling (Vitest/Jest + Playwright).
metadata:
  version: "1.0"
---

# Testing

## Layers

| Layer | Targets |
|-------|---------|
| Unit | algorithms, viz reducers, animation state, lesson helpers |
| Integration | lesson navigation, code↔visual sync, simulations |
| E2E | Playwright: open → play → pause → step → reset → experiment |
| Visual regression | critical stage frames (when harness exists) |
| Interaction | keyboard transport, focus |
| Animation state | given event stream → expected state |

## Definition reminder

`tsc` / `next build` success is necessary, not sufficient. Add tests for new engine logic.
