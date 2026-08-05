# Research: Agent Skills Ecosystem

**Date:** 2026-08-04  
**Question:** How should LumenLearn structure portable AI-agent instructions so Claude Code, Cursor, Codex, Gemini, and compatible agents share one architecture?

## Sources

| Source | URL | Role |
|--------|-----|------|
| Agent Skills Specification | https://agentskills.io/specification | Canonical SKILL.md format |
| Anthropic engineering — Agent Skills | https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills | Progressive disclosure model |
| anthropics/skills | https://github.com/anthropics/skills | Official skill examples + skill-creator |
| Claude Code Skills docs | https://code.claude.com/docs/en/skills | `.claude/skills/`, CLAUDE.md vs skills |
| Cursor Rules | https://cursor.com/docs/rules.md | `.cursor/rules/*.mdc`, AGENTS.md |
| Cursor Skills | https://cursor.com/docs/skills.md | Discovery paths, frontmatter |
| Cursor agent best practices | https://cursor.com/blog/agent-best-practices | Rules (always-on) vs Skills (on-demand) |
| OpenSkills | https://github.com/numman-ali/openskills | Universal SKILL.md loader via AGENTS.md |
| Anthropic frontend-design skill | https://github.com/anthropics/claude-code (plugins/frontend-design) | Anti-AI-slop design principles |

## Findings

1. **SKILL.md is an open standard** (`agentskills.io`): directory + YAML frontmatter (`name`, `description` required) + markdown body.
2. **Progressive disclosure is mandatory:** metadata always loaded; body only when triggered; `references/` / `scripts/` on demand. Keep SKILL.md under ~500 lines.
3. **CLAUDE.md / AGENTS.md = always-on project facts.** Skills = task workflows. Do not dump procedures into CLAUDE.md.
4. **Cursor:** Rules (`.mdc`) for invariants; Skills for specialized workflows. Discovers `.agents/skills/`, `.cursor/skills/`, `.claude/skills/`, `.codex/skills/`.
5. **Claude Code:** Discovers `.claude/skills/` (project) and `~/.claude/skills/` (personal). Can `@AGENTS.md` from CLAUDE.md.
6. **OpenSkills:** Syncs `<available_skills>` into AGENTS.md; useful for agents that only read AGENTS.md. Prefer project-authored skills over blind marketplace installs.
7. **Security:** Treat third-party skills as untrusted — inspect scripts, network, install hooks before use.

## Decision

See `docs/decisions/ADR-001-agent-skills-layout.md`.

## Reason

Maximize portability (Agent Skills standard) while using each product’s native discovery paths without duplicating contradictory instructions.
