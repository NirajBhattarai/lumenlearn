#!/usr/bin/env bash
# Sync canonical skills/ into agent discovery directories via relative symlinks.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

sync_dir() {
  local dest="$1"
  mkdir -p "$dest"
  for existing in "$dest"/*; do
    [ -e "$existing" ] || continue
    rm -rf "$existing"
  done
  for skill in skills/*; do
    [ -d "$skill" ] || continue
    name="$(basename "$skill")"
    ln -s "../../skills/$name" "$dest/$name"
    echo "linked $dest/$name -> skills/$name"
  done
}

sync_dir ".claude/skills"
sync_dir ".agents/skills"

if [ -f ".claude/animated-tech-edu.SKILL.md" ]; then
  mv ".claude/animated-tech-edu.SKILL.md" ".claude/animated-tech-edu.SKILL.md.legacy"
  echo "retired .claude/animated-tech-edu.SKILL.md -> .legacy"
fi

echo "Skill sync complete."
