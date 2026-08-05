---
name: lesson-authoring
description: >
  Define and author LumenLearn lessons as structured data with overview, mental model,
  visualization, animation, examples, code, step execution, complexity, internals,
  experiment, mistakes, production usage, exercises, quiz, and references. Use when
  adding or editing lessons under src/content.
metadata:
  version: "1.0"
---

# Lesson Authoring

## Canonical sections

Overview · Mental model · Interactive visualization · Animation · Example · Code · Step execution · Complexity · Internals · Experiment · Common mistakes · Production usage · Exercises · Quiz · References · Further exploration

Support **beginner** and **advanced** explanations without conflating them.

## Repo workflow

1. Add `src/content/lessons/<slug>.ts` typed as `Lesson`
2. Register in `lessonsBySlug` (`src/content/lessons/index.ts`)
3. Add slug in `src/content/subjects.ts`
4. Reuse/extend diagram under `src/components/diagrams/`
5. Wire new visual component keys in `LessonPlayer`
6. Verify play/pause/step/scrub + reduced motion

## Step rules

- Caption ≤ ~2 sentences; names concrete IDs
- One idea per step
- `visual.props` fully describe the scene
- `durationMs` only for autoplay hints

## Do not

Hardcode multi-step narratives only in page components.
