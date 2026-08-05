# Research: Animation & Visualization Stack

**Date:** 2026-08-04  
**Question:** Which animation/visualization libraries should LumenLearn adopt now vs defer?

## Current project stack (inspected)

- Next.js 16.3 / React 19.2 / TypeScript / Tailwind 4
- `motion` ^12.43 (UI + scene choreography)
- `zustand` ^5 (available; player currently local state)
- Lucide icons
- Existing: typed lessons + `LessonPlayer` + SVG diagram scenes

## Library evaluation

| Library | Problem solved | Need now? | Bundle / cost | Verdict |
|---------|----------------|-----------|---------------|---------|
| **Motion** (`motion`) | React UI + scene transitions | Yes (installed) | Use LazyMotion when optimizing | **Keep — default** |
| **GSAP + ScrollTrigger** | Complex multi-element timelines, scroll essays | Later | ~67kb+ | **Defer** until long scroll lessons |
| **D3** | Scales, layouts, force graphs | Selective | Moderate | **Add when** graph/layout lessons need it |
| **SVG + custom engine** | Data-driven nodes/edges/timeline | Yes (core) | Low | **Build in-house** |
| **Canvas / WebGL** | High node counts | Later | Complexity | **Defer** until perf requires |
| **Three.js / R3F** | True 3D spatial concepts | Rare | Heavy | **Only if 3D is the lesson** |
| **React Flow** | Node editors | Maybe | Medium | **Defer**; not pedagogy-first |
| **Mermaid** | Static docs diagrams | No for core player | Low | Docs only |
| **Lottie** | Decorative vector clips | No | Medium | **Avoid** for pedagogy |
| **Rive** | Interactive vector state machines | Optional later | Medium | Defer |
| **CodeMirror 6** | Modular in-lesson editor | Phase 8 | Lighter, modular | **Prefer for playground** |
| **Monaco** | Full IDE experience | Only if needed | Heavy | **Defer** |

## Code editor decision (preview)

Prefer **CodeMirror 6** for in-lesson snippets (modular languages, smaller). Revisit Monaco only if users need VS Code-parity IntelliSense.

## Findings

1. Do **not** install every visualization library.
2. Build a **data-driven visualization engine** (state → nodes/edges → timeline) rather than one-off SVGs per lesson long-term.
3. Keep Motion for React-bound UI; add GSAP only when timeline/scroll complexity exceeds Motion.
4. Animations must encode **cause → transition → result**.

## Decision

See ADRs 002 (animation), 003 (visualization), 005 (code editor).
