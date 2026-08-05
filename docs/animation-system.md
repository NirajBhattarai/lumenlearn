# Animation System

## Goal

Motion communicates **cause → transition → result**. Never animate because animation is possible.

## Transport (lesson + in-scene)

| Control | LessonPlayer | VizTimelineStage |
|---------|--------------|------------------|
| Play / Pause | ✅ | ✅ |
| Step | ✅ | ✅ |
| Reset | ✅ | ✅ |
| Speeds 0.25x–4x | ✅ (`[` `]`) | ✅ |
| Scrub (step rail) | ✅ | index via step |
| Reduced motion | snap / disable autoplay | jump to end |

## Primitives (`src/lib/animation/primitives.ts`)

Event emitters (→ `VizEvent[]` / `AnimBeat`):

`highlightNode` · `highlightEdge` · `moveNode` · `connectNodes` · `disconnectNodes` · `insertNode` · `removeNode` · `swapNodes` · `changeValue` · `changePointer` · `pulse` · `stateTransition` · `insertAfterBeat` · `showStateTransition`

## Layers

```
src/lib/motion.ts          # base durations / easings / reduced-motion
src/lib/animation/         # primitives, presets, timeline helpers
src/hooks/useVizTimeline.ts
src/components/visualization/VizTimelineStage.tsx
```

## Pedagogical beat shape

```ts
{
  id, teaches,
  cause?: VizEvent[],
  transition: VizEvent[],
  result?: VizEvent[],
  durationMs?
}
```

## Motion presets

`animPresets.fade|scene|snappy|softExit(speed)` — scale by playback speed; prefer opacity/transform.

## Proof

Last step of `/lessons/array-vs-linked-list` (`animate-insert`) runs an in-scene timeline driven by primitives.
