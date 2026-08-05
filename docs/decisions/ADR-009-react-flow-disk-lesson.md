# ADR-009: React Flow for disk-oriented lesson

**Status:** Accepted  
**Date:** 2026-08-04

## Context

The disk-oriented DBMS lesson felt flat (static panels). Learners need to inspect page header fields and directory entries interactively. User requested React Flow.

## Decision

- Add `@xyflow/react` ^12.11 (researched: maintained, MIT, React 19 OK).
- Rebuild `DiskOrientedScene` as a React Flow graph with custom nodes (directory, db file, page, frame) + field inspector.
- Import `@xyflow/react/dist/style.css` after Tailwind in `globals.css`.
- Keep `VizCanvas` for array/list lessons (ADR-003 still holds for structure primitives).

## Consequences

Heavier client bundle on this lesson route; acceptable with client-only scene. Future lessons may reuse custom node patterns.
