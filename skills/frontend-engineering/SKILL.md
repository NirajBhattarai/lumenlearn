---
name: frontend-engineering
description: >
  Standards for React, Next.js App Router, TypeScript, component architecture, state,
  server/client boundaries, hooks, data fetching, error handling, performance, and
  maintainability in LumenLearn. Use for any frontend implementation. Verify current
  official docs when API behavior may have changed.
metadata:
  version: "1.0"
---

# Frontend Engineering

## Stack

Next.js App Router · React 19 · TypeScript · Tailwind 4 · Motion · Zustand (when needed)

## Rules

1. Prefer Server Components by default; `"use client"` only for interactivity (player, diagrams with Motion).
2. Keep diagrams pure: props in → SVG/DOM out.
3. Colocate types; avoid `any`; extend `src/types/lesson.ts` carefully.
4. Shared utils in `src/lib/`; no circular imports.
5. Error and empty states are part of the UI contract.
6. When unsure about Next/React APIs, use `technical-research` + official docs.

## Component architecture

- `components/lesson/` — transport shell
- `components/diagrams/` — visuals
- Future `components/ui/` — design-system primitives

## Anti-patterns

Giant page files with embedded lesson narratives · remounting whole trees on step change · ignoring RSC/client boundaries
