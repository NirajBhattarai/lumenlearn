#!/usr/bin/env python3
"""Validate Agent Skills frontmatter (name + description) under skills/."""
from __future__ import annotations
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
skills_dir = ROOT / "skills"
errors = 0

for skill_md in sorted(skills_dir.glob("*/SKILL.md")):
    text = skill_md.read_text()
    if not text.startswith("---"):
        print(f"FAIL {skill_md}: missing YAML frontmatter")
        errors += 1
        continue
    end = text.find("\n---", 3)
    if end == -1:
        print(f"FAIL {skill_md}: unclosed frontmatter")
        errors += 1
        continue
    fm = text[3:end]
    name_m = re.search(r"^name:\s*(.+)$", fm, re.M)
    desc_m = re.search(r"^description:\s*", fm, re.M)
    folder = skill_md.parent.name
    if not name_m:
        print(f"FAIL {skill_md}: missing name")
        errors += 1
        continue
    name = name_m.group(1).strip().strip('"')
    if name != folder:
        print(f"FAIL {skill_md}: name '{name}' != folder '{folder}'")
        errors += 1
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", name):
        print(f"FAIL {skill_md}: invalid name format")
        errors += 1
    if not desc_m:
        print(f"FAIL {skill_md}: missing description")
        errors += 1
    if len(fm) > 2000 and "description" in fm:
        # soft check description length later via body
        pass
    print(f"OK   {folder}")

if errors:
    print(f"\n{errors} error(s)")
    sys.exit(1)
print("\nAll skills valid.")
