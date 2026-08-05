# ADR-001: Agent Skills Layout

**Status:** Accepted  
**Date:** 2026-08-04

## Context

Multiple coding agents (Claude Code, Cursor, Codex, Gemini, others) must share one project philosophy without contradictory instructions.

## Decision

1. **`AGENTS.md`** — universal always-on entry point (concise).
2. **`CLAUDE.md`** — Claude-specific workflow; imports/points to `AGENTS.md` + skills.
3. **`skills/<name>/SKILL.md`** — canonical portable Agent Skills (source of truth).
4. **`.claude/skills/<name>`** and **`.agents/skills/<name>`** — discovery symlinks to `skills/<name>`.
5. **`.cursor/rules/*.mdc`** — focused always/intelligent rules (not giant monoliths).
6. **`.claude/rules/`** — Claude-native modular project rules mirroring core invariants.
7. **`docs/`** — what/why (architecture, research, ADRs); skills hold how-to workflows.
8. Do **not** install OpenSkills marketplace packages by default; optional later.

## Consequences

- Edit skills once under `skills/`; run `scripts/sync-skills.sh` if links break.
- Progressive disclosure: agents load only relevant skills.
- Legacy `.claude/animated-tech-edu.SKILL.md` and monolithic Cursor rule are retired in favor of modular skills + thin `animated-tech-edu` orchestrator.
