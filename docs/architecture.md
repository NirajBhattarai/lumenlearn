# Architecture — LumenLearn

## Product

Interactive technical knowledge engine: concepts are learned by **seeing, interacting, experimenting, and coding** — not by reading documentation walls.

## Current shape (Phase 0–2)

```
src/
  app/                 # Next.js App Router pages
  components/
    diagrams/          # Pure visual components f(props)
    lesson/            # LessonPlayer transport shell
  content/
    lessons/           # Typed lesson scripts
    subjects.ts        # Catalog
  lib/                 # cn, motion helpers → growing engines
  types/lesson.ts      # Canonical lesson types
```

## Target module boundaries (evolve in place)

```
content/          → lesson data (data-driven)
lesson-engine/    → step index, seek, autoplay, levels
visualization/    → nodes, edges, state, events
animation/        → primitives + timeline
code-sync/        → execution events ↔ highlights
ui/design-system/ → tokens + primitives
```

## Non-negotiables

1. Content is data; UI is a renderer.
2. One teaching idea per step.
3. Learner transport: play / pause / step / scrub / speed / reset.
4. Captions teach even if motion is off.
5. Research before inventing internals.
6. Progressive skill loading for agents — see `docs/skills.md`.

## Phased delivery

See master plan: agent system → design system → visualization → animation → lesson engine → first 10 DS lessons → code playground → experiments → AI tutor → knowledge graph → search.

## Related

- `docs/learning-system.md`
- `docs/animation-system.md`
- `docs/visualization-system.md`
- `docs/design-system.md`
- `docs/decisions/`
