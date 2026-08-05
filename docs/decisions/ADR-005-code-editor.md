# ADR-005: Code Editor Choice

**Status:** Accepted (provisional)  
**Date:** 2026-08-04

## Context

Need synchronized code ↔ visualization; eventual multi-language playground.

## Decision

Prefer **CodeMirror 6** when Phase 8 begins (modular, lighter). Defer Monaco unless IDE-parity is required. Sandbox all execution (never on app server as arbitrary shell).

## Consequences

No editor dependency installed until Phase 8. Design `ExecutionEvent` pipeline now in types/docs so lessons can grow into sync later.
