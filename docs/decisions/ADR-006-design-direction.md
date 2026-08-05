# ADR-006: Design Direction

**Status:** Accepted  
**Date:** 2026-08-04

## Context

The initial UI used cyan→violet gradients, sparkle pills, glow orbs, and soft card grids — a generic AI-SaaS look that conflicts with the product goal (premium technical learning).

## Decision

Adopt a **precision instrument** visual language:

- IBM Plex Sans + IBM Plex Mono
- Ink grounds, hairline borders, tight radii
- Single **signal blue** accent used for teaching focus and primary actions only
- Dark mode default; light mode via `data-theme="light"`
- No gradient text, glassmorphism chrome, glow meshes, or decorative pills

## Consequences

Tokens live in `src/app/globals.css`. Primitives under `src/components/ui/`. Lesson stage chrome uses design-system components; diagram internal colors may still use local SVG fills but should migrate toward semantic tokens.
