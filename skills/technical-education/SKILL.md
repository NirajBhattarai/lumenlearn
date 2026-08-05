---
name: technical-education
description: >
  Transform difficult technical concepts into intuition, visual models, animation,
  interaction, code, experiments, complexity, internals, and production usage.
  Use when creating or revising lessons, explainers, teaching flows, or any
  educational content for LumenLearn. Prevents documentation-style walls of text.
metadata:
  version: "1.0"
  audience: "agents"
---

# Technical Education

Teach by **seeing and doing**, not by essay.

## Required progression

```
intuition → visual model → animation → interaction → code
→ experiment → complexity → internals → production usage
```

Skip stages only with explicit reason. Never ship prose-only lessons.

## Rules

1. One misconception or idea per beat.
2. Name concrete objects (`frame 2`, `node B`, `page 7`) in captions.
3. Prefer worked examples before formal definitions.
4. Text supports the visualization; visualization is not decoration for text.
5. Offer beginner and advanced paths without mixing them in one wall.
6. End major sections with a check: predict next state, or mini quiz.
7. Cite authoritative sources for internals (use `technical-research`).

## Anti-patterns

- Documentation pages with a static diagram
- Bullet farms instead of state transitions
- Jargon before intuition
- Animations that do not change understanding

## Output shape

For each concept: mental model → interactive visual → optional code → complexity → production note.
