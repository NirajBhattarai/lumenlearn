# CLAUDE.md — LumenLearn

Claude-specific project guide. Universal rules live in `@AGENTS.md` — follow both.

## Architecture (inspect before changing)

```
src/app/                 # routes
src/content/lessons/     # lesson scripts
src/components/diagrams/ # visuals
src/components/lesson/   # LessonPlayer
src/types/lesson.ts      # types
docs/                    # architecture, research, ADRs
skills/                  # portable skills (canonical)
.claude/skills/          # symlinks → skills/ (auto-discovery)
.claude/rules/           # always-on modular rules
```

## How skills are organized

| Path | Role |
|------|------|
| `skills/<name>/SKILL.md` | Source of truth (Agent Skills standard) |
| `.claude/skills/<name>` | Claude Code discovery (symlink) |
| `docs/skills.md` | Registry + loading chains |
| `docs/` | Project knowledge (what/why) |
| Skill `references/` | Deep detail on demand |

## How to use skills

1. Read skill **descriptions** and activate only relevant ones.
2. For lessons: `lesson-authoring` → `technical-education` → `technical-visualization` → `educational-animation`.
3. For UI: `ui-ux-design` → `design-taste` → `frontend-engineering` → `accessibility`.
4. For unfamiliar tech: `technical-research` **before** coding explanations.
5. Orchestrator: `animated-tech-edu` for platform-wide work.

## Workflow

1. **Inspect** — read existing player, types, similar lessons; run `npm run dev` if needed.
2. **Research** — official docs/specs; log important findings in `docs/research/`.
3. **Plan** — prefer extending content/diagrams over rewrites; ADR if architectural.
4. **Implement** — small diffs; match style.
5. **Run / test** — `npm run build` / lint / tests as appropriate.
6. **Visual QA** — actually view the page; desktop + mobile; reduced motion.
7. **Review** — accuracy, a11y, perf; iterate (`design-taste`).

## Avoid unnecessary rewrites

- Do not convert to monorepo without revisiting ADR-004.
- Do not replace Motion with GSAP casually (ADR-002).
- Do not invent a second lesson format — extend `Lesson` types deliberately.
- Preserve LessonPlayer keyboard + transport behavior.

## Testing & review

- New reducers/engines need unit tests when harness exists.
- E2E for player flows when Playwright is added.
- Never claim done on compile alone.

## Security

Do not execute untrusted skill scripts. Sandbox user code. No secrets in client.
