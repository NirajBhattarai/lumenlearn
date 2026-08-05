# AGENTS.md — LumenLearn

Universal instructions for Claude Code, Cursor, Codex, Gemini, and compatible agents.

## Product

**LumenLearn** is an interactive technical knowledge engine. Learners understand concepts by seeing, interacting, experimenting, and coding — not by reading documentation walls.

## Architecture

```
src/content/          # Typed lessons & subjects (data)
src/components/diagrams/  # Pure visuals f(props)
src/components/lesson/    # LessonPlayer transport
src/lib/              # Shared helpers → engines
src/types/            # Canonical types
docs/                 # Architecture, research, ADRs
skills/               # Portable Agent Skills (source of truth)
```

Details: `docs/architecture.md`

## Stack

Next.js App Router · React 19 · TypeScript · Tailwind CSS 4 · Motion · Zustand · Lucide

## Commands

```bash
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

## Design philosophy

Premium, calm, precise technical product (Linear/Vercel restraint). Strong typography and hierarchy. No AI-dashboard chrome, glow soup, glassmorphism spam, or decorative motion.

## Animation & visualization

Motion teaches **cause → transition → result**. Data-driven viz over one-off SVGs as the system matures. Honor `prefers-reduced-motion`. See `docs/animation-system.md`, `docs/visualization-system.md`.

## Coding standards

- Content/data separate from UI renderer
- Prefer small, typed modules; match existing style
- Server Components default; client only when needed
- Do not rewrite architecture without an ADR

## Testing

Unit / integration / E2E as appropriate. `tsc` success ≠ done. See skill `testing`.

## Security

Sandbox user code; protect secrets; treat third-party skills as untrusted. See skill `security`.

## Research & dependencies

Unfamiliar internals → skill `technical-research` + log under `docs/research/`.  
New packages → skill `dependency-research`. Install only justified deps.

## Skills (progressive disclosure)

Canonical: `skills/*/SKILL.md`  
Discovered via: `.claude/skills/`, `.agents/skills/` (symlinks)  
Registry: `docs/skills.md`  
Do **not** load every skill every time.

## Workflow

`Understand → Inspect → Research → Plan → Implement → Run → Test → Visual QA → Review → Improve`

## Definition of done

Works in the running app · teaches clearly · visually inspected · a11y basics · tests for new logic · no invented internals · relevant skills followed
