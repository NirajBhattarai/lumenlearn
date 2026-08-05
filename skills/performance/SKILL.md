---
name: performance
description: >
  Optimize initial load, bundle size, animation FPS, React rendering, code splitting,
  lazy loading, workers, Canvas/WebGL, visualization performance, and mobile.
  Measure before optimizing when practical. Use for perf work or heavy viz features.
metadata:
  version: "1.0"
---

# Performance

## Priorities

1. Initial load / LCP
2. Interaction readiness / INP
3. Animation smoothness (FPS)
4. Mobile CPU/GPU cost

## Practices

- `next/dynamic` for heavy diagrams (`ssr: false` when needed)
- LazyMotion / feature splitting for Motion when bundle matters
- Animate compositor props only
- Cap simultaneous animated nodes; virtualize large lists
- Pause offscreen animations
- Workers for heavy simulation math
- Canvas/WebGL when SVG node counts collapse FPS

## Rule

Measure (devtools, profiling) before large rewrites. TypeScript compiling ≠ performant.
