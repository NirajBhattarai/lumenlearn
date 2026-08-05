---
name: accessibility
description: >
  Require semantic HTML, keyboard navigation, screen readers, focus states, contrast,
  prefers-reduced-motion, accessible interactive diagrams, and text alternatives.
  Animations must never be the only source of information. Use for UI and lesson work.
metadata:
  version: "1.0"
---

# Accessibility

## Requirements

- Semantic HTML landmarks and labels
- Full keyboard access to player + experiments
- Visible focus states
- WCAG AA contrast for text/diagram labels
- `prefers-reduced-motion`: snap visuals; keep captions
- `aria-live` for caption/step changes where helpful
- Text alternatives for visual-only explanations

## Diagram accessibility

- Captions explain the state transition
- Do not rely on color alone (pair with labels/patterns)
- Controls have accessible names

## Done when

A keyboard-only user can complete the lesson learning loop.
