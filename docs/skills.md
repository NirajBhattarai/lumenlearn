# Skill Registry

Canonical skills live in `skills/<name>/SKILL.md` (Agent Skills standard).  
Discovery symlinks: `.claude/skills/`, `.agents/skills/`.

| Skill | Purpose | Trigger | Dependencies |
|-------|---------|---------|--------------|
| technical-education | Teaching progression | lesson creation / pedagogy | none |
| ui-ux-design | Product UI | UI / layout work | design system docs |
| design-taste | Anti-AI-slop iteration | any UI change | ui-ux-design |
| animation-engineering | Motion primitives | animation implementation | Motion |
| educational-animation | Learning transport & beats | lesson viz / player | animation-engineering |
| technical-visualization | Diagrams / simulations | viz work | viz engine docs |
| code-visualization | Code ↔ state sync | executable lessons | technical-visualization |
| lesson-authoring | Lesson structure & files | content authoring | technical-education |
| frontend-engineering | React/Next/TS | frontend code | official docs |
| performance | Perf optimization | heavy viz / load | measure first |
| accessibility | a11y requirements | UI / player | none |
| testing | Test strategy | feature completion | test runner |
| technical-research | Accuracy research | unfamiliar tech | network/docs |
| dependency-research | Package justification | adding deps | none |
| security | Threat hygiene | exec / deps / skills | none |
| animated-tech-edu | Orchestrator | platform-wide edu work | chains below |

## Loading strategy (progressive disclosure)

### UI
`ui-ux-design` → `design-taste` → `frontend-engineering` → `accessibility` → `performance`

### Lesson
`lesson-authoring` → `technical-education` → `technical-visualization` → `educational-animation` → `code-visualization`

### Debugging
`frontend-engineering` → `testing` → `performance`

### Research
`technical-research` → `dependency-research`

Do **not** load every skill into every task.

## Shared knowledge vs skills

| Location | Holds |
|----------|-------|
| `SKILL.md` | How the agent performs a task |
| `docs/` | What the project is / how it works |
| `docs/research/` | What was researched |
| `docs/decisions/` | Why architecture decisions were made |
| `scripts/` | Deterministic tooling |

## Sync

```bash
./scripts/sync-skills.sh
```
