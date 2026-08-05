# LumenLearn

Interactive **technical knowledge engine** — learn systems, algorithms, databases, and more by seeing, interacting, experimenting, and coding.

Not a documentation website.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub Pages

This repo deploys a **static export** (not Jekyll). Push to `main` runs `.github/workflows/deploy-github-pages.yml`.

Public URL: `https://nirajbhattarai.github.io/lumenlearn/`

```bash
npm test
GITHUB_PAGES=true npm run build   # writes out/ with basePath /lumenlearn
```

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Motion · Zustand · Lucide

## Agent system

Universal instructions for Claude Code, Cursor, Codex, Gemini, and compatible agents:

| Entry | Path |
|-------|------|
| Universal | [`AGENTS.md`](./AGENTS.md) |
| Claude | [`CLAUDE.md`](./CLAUDE.md) |
| Cursor rules | [`.cursor/rules/`](./.cursor/rules/) |
| Portable skills | [`skills/`](./skills/) |
| Skill registry | [`docs/skills.md`](./docs/skills.md) |
| Architecture | [`docs/architecture.md`](./docs/architecture.md) |
| Research | [`docs/research/`](./docs/research/) |
| ADRs | [`docs/decisions/`](./docs/decisions/) |

```bash
./scripts/sync-skills.sh      # link skills into .claude + .agents
python3 scripts/validate-skills.py
```

## Add a lesson

Follow skill `lesson-authoring`: typed content → register → diagram → player wire-up → transport + reduced-motion check.

## Philosophy

10 exceptional interactive lessons beat 100 mediocre doc pages.
