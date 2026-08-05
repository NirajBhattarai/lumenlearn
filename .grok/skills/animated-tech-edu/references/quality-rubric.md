# Quality rubric — ship / no-ship

## Ship only if

| Area | Bar |
|------|-----|
| Pedagogy | A newcomer can restate the idea after the lesson |
| Control | Play, pause, step ±1, scrub or jump to step |
| Continuity | Same object keeps visual identity across steps |
| Labels | Every box/arrow that matters is labeled |
| Motion | Serves meaning; reduced-motion still teaches |
| Performance | No jank on step change; reserved stage height |
| Mobile | Usable at 375px width |
| Content | Lesson data not trapped only in one giant component |

## No-ship signals

- Animation without captions
- Autoplay only, no step control
- Flashy particles on a static explanation
- Unreadable low-contrast stage
- Hydration errors / layout jump
- Lesson cannot be extended without rewriting the player

## Visual QA pass (2 minutes)

1. Step through entire lesson on keyboard only
2. Toggle OS reduced motion and re-run
3. Throttle CPU 4x in DevTools; confirm still usable
4. Read captions alone (cover the stage) — still coherent?
5. Read stage alone (cover captions) — still mostly coherent?
