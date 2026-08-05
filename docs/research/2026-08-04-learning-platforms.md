# Research: Learning Platforms & Design References

**Date:** 2026-08-04  
**Question:** What UX/pedagogy patterns should LumenLearn extract (not copy) from best-in-class learning and developer products?

## Learning products studied

| Product | Extracted principle |
|---------|---------------------|
| Brilliant | Active problem-solving; short interactive beats; minimal passive reading |
| Khan Academy | Mastery paths; clear prerequisites; calm instructional voice |
| 3Blue1Brown | One visual metaphor per idea; reveal structure via motion |
| PhET | Parameter knobs + immediate visual feedback = experiment mode |
| Educative / Codecademy | Inline runnable code next to explanation |
| NeetCode / LeetCode | Pattern recognition; progressive difficulty; worked examples |
| Roadmap.sh | Knowledge-graph style navigation between concepts |
| Frontend Masters | Deep intermediate→advanced tracks for practitioners |
| DeepLearning.AI | Short video + notebook lab loop |
| freeCodeCamp | Project-based checkpoints |

## Documentation UX studied

MDN, React, TypeScript, Rust, Go, Solidity/Ethereum, PostgreSQL, Redis, Kubernetes, Uniswap, Aave:

- Prefer **canonical examples** over prose walls
- Deep-links to specs / source
- Progressive disclosure (overview → details → internals)
- Consistent terminology

## Developer product UX studied

| Product | Extracted principle |
|---------|---------------------|
| Linear | Density without clutter; keyboard-first; restrained chrome |
| Vercel | Fast perceived performance; clear hierarchy; calm dark UI |
| GitHub | Information architecture for technical work |
| Figma | Spatial canvas + precise selection/inspector patterns |
| Excalidraw | Low-friction diagramming affordances |
| Observable | Reactive notebooks: code ↔ visual coupling |

## Findings for LumenLearn

1. Learning loop: **See → Interact → Experiment → Code → Understand → Go deeper**.
2. Flagship lessons need **transport controls** (play/pause/step/scrub/speed), not autoplay-only.
3. Avoid documentation-site patterns as the primary surface.
4. Design should feel **premium technical product** (Linear/Vercel restraint), not edtech cartoon or AI-dashboard chrome.
5. Knowledge graph + search are phase-later foundations; first ship exceptional vertical-slice lessons.

## Decision

Adopt Brilliant/PhET interaction depth + 3Blue1Brown metaphor clarity + Linear/Vercel visual restraint. Defer full knowledge graph / AI tutor to later phases after visualization + lesson engines exist.
