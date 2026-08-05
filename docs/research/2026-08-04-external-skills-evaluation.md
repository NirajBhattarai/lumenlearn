# Research: External Skills Evaluation

**Date:** 2026-08-04  
**Question:** Which public skills should we adapt vs ignore?

## Evaluation criteria

Relevance · Quality · Maintainability · Compatibility · Duplication · Freshness · Security · Token cost · Usefulness to LumenLearn

## Evaluated skills / sources

| Skill / repo | Verdict | Action |
|--------------|---------|--------|
| **agentskills.io specification** | Authoritative format | Follow strictly |
| **anthropics/skills (skill-creator)** | High quality authoring guidance | Adapt principles (pushy descriptions, progressive disclosure) |
| **anthropics/claude-code frontend-design** | Strong anti-slop + aesthetic direction | Adapt into `ui-ux-design` + `design-taste` — **do not copy wholesale** (marketing-maximalist bias conflicts with our calm technical product) |
| **OpenSkills (numman-ali/openskills)** | Useful loader pattern | Document as optional; we author skills in-repo |
| Community frontend-design forks (various) | Mixed quality; some encourage glassmorphism / aesthetic menus | **Do not install**; extract only anti-pattern lists |
| james-design / claude-design-skill (HTML artifact designers) | Oriented to decks/prototypes, not Next app architecture | **Skip install**; note iteration + variations idea |
| Existing project `animated-tech-edu` | High relevance, but monolithic | **Split** into modular skills; keep thin orchestrator |

## Security notes

- No third-party skill install scripts were executed.
- No marketplace skills copied into the repo.
- Future installs require file/script/network review per `security` skill.

## Decision

Author first-party skills tailored to LumenLearn. Adapt principles from Anthropic frontend-design and skill-creator. Do not vendor large external skill trees.
