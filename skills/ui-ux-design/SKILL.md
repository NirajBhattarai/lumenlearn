---
name: ui-ux-design
description: >
  Create premium technical-learning interfaces with strong typography, hierarchy,
  spacing, intentional layouts, restrained effects, excellent dark mode, responsive
  design, and meaningful interaction. Use for any UI, page, layout, or component work.
  Pair with design-taste for visual QA iteration.
metadata:
  version: "1.0"
---

# UI/UX Design

Build a **serious premium technical product** UI — not an AI dashboard template.

## Do

- Strong type hierarchy; expressive but purposeful fonts
- Clear primary action; quiet secondary chrome
- High information density without clutter
- Excellent dark mode; support light mode
- Responsive: desktop / tablet / mobile with graceful viz degradation
- Meaningful interaction (hover/focus that teach or confirm)

## Explicitly prohibit

- Generic AI dashboards
- Excessive gradients
- Excessive glassmorphism
- Meaningless glowing effects
- Random cards
- Unnecessary rounded containers
- Decorative animation with no purpose

## Layout

- One job per section
- Stage is the hero of lesson pages — chrome stays subordinate
- Prefer panels/rails over card grids for learning surfaces

## Process

1. Inspect existing UI and design tokens (`docs/design-system.md`, `globals.css`).
2. State the page's single job.
3. Design hierarchy before pixels.
4. Implement with existing components when possible.
5. Run `design-taste` for critique + iteration.
