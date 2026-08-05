# ADR-003: Visualization Engine

**Status:** Accepted  
**Date:** 2026-08-04

## Context

One-off SVG components per lesson will not scale to DS/algorithms/systems/blockchain.

## Decision

Evolve toward a **data-driven visualization engine**:

```
VisualizationState → Nodes / Edges / Labels → Events → Timeline → Render
```

- Short term: keep typed diagram components (`BufferPoolScene`, etc.) as renderers.
- Medium term: shared primitives for arrays, lists, trees, graphs, hash maps, caches, memory.
- Lessons describe **state + events**; renderers are reusable.
- Use SVG first; Canvas/WebGL only when node counts demand it.
- D3 only for layout/scales when justified.

## Consequences

New lessons should prefer engine primitives over bespoke SVG when possible. Flagship LRU lesson validates cache + list + map visuals.
