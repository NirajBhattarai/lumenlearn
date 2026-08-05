# ADR-007: Visualization Engine v1

**Status:** Accepted  
**Date:** 2026-08-04

## Context

Phase 4 requires a reusable visualization engine. Existing diagrams were one-off React/SVG trees; Motion also warned when animating `borderColor`/`backgroundColor` to CSS `transparent`.

## Decision

1. Introduce `src/lib/visualization` with pure `VizState` + `VizEvent` reducer.
2. Render via SVG `VizCanvas`; convenience views for array and linked list.
3. Migrate `PageLinkGraph` in `DiskOrientedScene` onto `layoutGraph` + `VizCanvas`.
4. Ship proof lesson `array-vs-linked-list` using engine views.
5. Use animatable RGBA tokens in `vizColor` (no `transparent` keyword).

## Consequences

New structure lessons should prefer engine layouts. Legacy buffer-pool scenes can migrate gradually. Cache/LRU will compose list + map layouts on this foundation.
