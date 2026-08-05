# Research: Repository Audit

**Date:** 2026-08-04

## Question

What exists today, what is good, and what must improve before scaling to a knowledge engine?

## Findings — structure

Working Next.js 16 app with:

- Typed `Lesson` / visual union types
- `LessonPlayer` with play/pause/step/scrub + keyboard
- Two lessons: `disk-oriented-dbms`, `pages-vs-frames`
- Diagram components: `BufferPoolScene`, `DiskOrientedScene`
- Motion + reduced-motion CSS
- Existing agent files were monolithic and needed modularization

## What is good

- Correct content/renderer separation already started
- Scrubbable step player exists (foundation for educational animation)
- Captions + visual props per step
- Agent awareness was present (but monolithic)

## What is poor / incomplete

- Home UI leans generic dark/cyan “AI SaaS” (pills, gradient headline, card grid)
- No reusable visualization engine yet (one-off scenes)
- No speed control, Why/Compare/Experiment modes
- No code↔visual sync, playground, tests, or formal design tokens
- Lesson schema lacks levels/sections/experiments from the target learning model
- Monolithic agent skill needed modularization (completed in Phase 1)

## Decision

Phase 1 completes the agent system without rewriting UI yet (per master prompt). Phase 3+ redesigns UI with `design-taste` + design system, then viz/animation engines, then LRU flagship + DS lessons.
