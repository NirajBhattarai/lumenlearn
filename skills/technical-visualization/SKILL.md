---
name: technical-visualization
description: >
  Build data-driven technical visualizations for arrays, lists, trees, graphs, hash
  tables, caches, memory, CPU, networking, databases, distributed systems, blockchain,
  EVM, and smart contracts. Prefer reusable state/events over one-off SVGs. Use when
  creating diagrams, simulations, or visualization architecture.
metadata:
  version: "1.0"
---

# Technical Visualization

## Architecture

```
VisualizationState → Nodes / Edges / Labels → Events → Timeline → Renderer
```

Lessons describe state + events; the engine renders them.

## Domains

arrays · linked lists · trees · graphs · hash tables · caches · memory · CPU · networking · databases · distributed systems · blockchain · EVM · smart contracts

## Rules

1. Data-driven > bespoke SVG per lesson (as system matures).
2. Limited palette (3–5 teaching colors); label arrows and nodes.
3. Highlight cause objects before/during transition.
4. Support inspection (select node → show fields).
5. SVG first; Canvas/WebGL when scale requires.
6. Keep stage readable on tablet; degrade gracefully on mobile.

## See also

`docs/visualization-system.md`, ADR-003, ADR-007

## Repo map (Phase 4)

- `src/lib/visualization/` — types, reduce, colors, layouts
- `src/components/visualization/VizCanvas` — SVG renderer
- Prefer `layoutArray` / `layoutLinkedList` / `layoutGraph` for new structure lessons
- Never animate Motion colors to CSS `transparent` — use `vizColor.none`
