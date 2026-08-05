# ADR-004: Repo Structure (Monorepo Deferred)

**Status:** Accepted  
**Date:** 2026-08-04

## Context

Master prompt suggests `apps/web` + many packages. Current repo is a working Next.js App Router app under `src/`.

## Decision

**Do not rewrite into a monorepo yet.** Keep:

```
src/app/
src/components/
src/content/
src/lib/
src/types/
```

Introduce internal module boundaries via folders (e.g. `src/lib/visualization/`, `src/lib/animation/`) that can later become packages if needed.

## Consequences

Faster path to polished vertical slice. Revisit monorepo when multiple apps (docs site, playground worker, etc.) exist.
