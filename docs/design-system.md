# Design System — LumenLearn

## Direction

**Precision instrument** — calm, precise, dense-but-clear. Closer to Linear than edtech cartoon or AI dashboard.

See [ADR-006](./decisions/ADR-006-design-direction.md).

## Principles

- Brand name is the hero on the home page (not a gradient slogan)
- Strong typography hierarchy (IBM Plex Sans + Mono)
- Single signal-blue accent for teaching focus + primary actions
- Hairline structure; list/divide layouts over card grids
- Dark mode default; light via `data-theme="light"`
- Minimal chrome around the lesson stage
- No decorative glassmorphism, glow meshes, gradient text, or sparkle pills

## Tokens (`src/app/globals.css`)

| Token | Role |
|-------|------|
| `--background` | Page ground |
| `--foreground` | Primary text |
| `--muted` / `--subtle` | Secondary / tertiary text |
| `--surface` / `--surface-raised` | Panels |
| `--stage` | Diagram stage surface |
| `--border` / `--border-strong` | Hairlines |
| `--accent` / `--accent-hover` / `--accent-muted` / `--accent-fg` | Teaching + CTA |
| `--ok` / `--warn` / `--danger` | Semantic lesson states |
| `--radius-sm/md/lg/stage` | 4 / 6 / 10 / 12px |

Tailwind v4 maps these via `@theme inline` (e.g. `bg-accent`, `text-muted`, `border-border`).

## Typography

| Role | Face |
|------|------|
| UI / body | IBM Plex Sans |
| Code / eyebrows / meta | IBM Plex Mono |

Utility: `.text-eyebrow` for mono uppercase labels.

## Components (`src/components/ui/`)

| Component | Use |
|-----------|-----|
| `Button` | Actions (primary / secondary / ghost) |
| `ButtonLink` | Navigating CTAs |
| `IconButton` | Transport icon controls |
| `Panel` | Caption / callout / control surfaces |
| `Stage` | Lesson diagram frame |
| `SiteHeader` | Global nav |
| `ThemeToggle` | Dark / light |

## Anti-patterns

Generic dashboards · cyan–violet gradients · glassmorphism · glow orbs · card spam · oversized radii · decorative animation · Inter/Geist-as-hero AI defaults
