---
name: dependency-research
description: >
  Before adding a dependency: research the library, official repo, latest stable
  version, maintenance, bundle impact, compatibility, security, and alternatives.
  Install only what is justified. Use whenever proposing npm/yarn packages.
metadata:
  version: "1.0"
---

# Dependency Research

## Sequence

```
research current library → official repository → latest stable version
→ maintenance → bundle impact → compatibility → security → compare alternatives
→ decision → install
```

## Require a short written justification

What problem? Why this library? Alternatives? Cost? Security notes?

## Do not

Install popular libraries “just in case.” Prefer platform primitives and existing stack (`motion`, SVG, Next).
