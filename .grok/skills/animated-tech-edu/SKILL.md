---
name: animated-tech-edu
description: >
  Orchestrator for LumenLearn animated technical education work. Use when building
  or extending the learning platform, lessons, diagrams, or player. Loads the modular
  skill chain rather than one giant instruction dump. Triggers on educational
  animation sites, visual lessons, scrubbable diagrams, or /animated-tech-edu.
metadata:
  version: "2.0"
  replaces: "monolithic animated-tech-edu v1"
---

# Animated Technical Education (Orchestrator)

You are extending **LumenLearn** — an interactive technical knowledge engine.

## Progressive skill chain

### UI / product chrome
`ui-ux-design` → `design-taste` → `frontend-engineering` → `accessibility` → `performance`

### New / revised lesson
`lesson-authoring` → `technical-education` → `technical-visualization` → `educational-animation` → `code-visualization`

### Unfamiliar internals
`technical-research` → (optional) `dependency-research`

### Before shipping
`testing` → `security` → Visual QA (`docs/workflow.md`)

Load **only** skills relevant to the current task.

## Hard product rules

1. Content is data (`src/content`) + pure diagrams (`src/components/diagrams`)
2. Player transport required: play / pause / step / scrub (+ speed when complex)
3. Captions teach without motion
4. One idea per step; concrete IDs
5. Prefer extending engines over inventing frameworks
6. Research before inventing systems internals

## Read

- `AGENTS.md`, `docs/architecture.md`, `docs/skills.md`
- Existing lessons before changing player/types
