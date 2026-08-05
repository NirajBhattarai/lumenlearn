---
name: code-visualization
description: >
  Synchronize source code with visualization via Code → Execution → Execution Events
  → Visualization State → Animation Timeline. Use when wiring runnable examples,
  line highlighting, or step-through code that drives diagrams.
metadata:
  version: "1.0"
---

# Code Visualization

## Pipeline

```
Code → Execution → ExecutionEvents → VisualizationState → Animation Timeline
```

Example: `cache.get(10)` emits lookup → found → unlink → move-to-front events while highlighting the corresponding source lines.

## Requirements

- Event schema is reusable across lessons
- Highlights track the active event
- Learner can step events, not only lines
- Execution sandboxing via `security` skill — never trust user code on the server
- Editor choice: CodeMirror 6 preferred (ADR-005) when implemented

## Anti-patterns

- Fake “sync” that only scrolls code while unrelated animation plays
- Language-specific one-offs with no shared event types
