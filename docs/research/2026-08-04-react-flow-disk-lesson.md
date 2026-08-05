# Research: React Flow for disk-oriented lesson

**Date:** 2026-08-04  
**Question:** Should we add `@xyflow/react` to visualize DBMS directory + page field structure?

## Sources

- https://www.npmjs.com/package/@xyflow/react (v12.11.x, MIT, actively maintained)
- https://reactflow.dev/learn
- ADR-003 (deferred React Flow earlier for pedagogy-first SVG)

## Findings

| Criterion | Result |
|-----------|--------|
| Problem | Need interactive node graph for pages, directory, field inspectors |
| Why this lib | Custom nodes, edges, pan/zoom, selection — fits “inspect fields” UX |
| Alternatives | Pure SVG/VizCanvas (we have) — weaker interaction for field panels; React Flow UI kits — heavier |
| Bundle | Moderate; dynamic-import + client-only acceptable for lesson stage |
| Compatibility | React 19 / Next App Router with `"use client"` + CSS after Tailwind |
| Security | MIT, no install scripts of concern |

## Decision

Install `@xyflow/react`. Use for DiskOrientedScene redesign. Keep VizCanvas for array/list lessons. Document in ADR-009.
