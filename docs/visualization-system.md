# Visualization System

## Model

```
Lesson / Experiment
        ↓
 VisualizationState
        ↓
 Nodes · Edges · Labels · Annotations
        ↓
 Events (insert, move, highlight, evict, …)
        ↓
 Animation Timeline
        ↓
 Renderer (SVG first) — VizCanvas
```

## Code layout

```
src/lib/visualization/
  types.ts      # VizNode, VizEdge, VizState, VizEvent
  reduce.ts     # pure applyVizEvent / applyVizEvents
  colors.ts     # animatable RGBA (never CSS "transparent")
  layout.ts     # layoutArray, layoutLinkedList, layoutGraph
  index.ts

src/components/visualization/
  VizCanvas.tsx
  ArrayView.tsx
  LinkedListView.tsx
```

## Domains (road map)

| Domain | Layout helper | Status |
|--------|---------------|--------|
| Arrays | `layoutArray` | ✅ |
| Linked lists | `layoutLinkedList` | ✅ |
| Graphs | `layoutGraph` | ✅ (page-link graph migrated) |
| Trees / heaps | TBD | Phase 7 |
| Hash maps / caches | TBD | LRU flagship |
| Memory / CPU / net / DB / chain | TBD | later |

## Usage

```ts
const state = layoutLinkedList({ values: ["A", "B", "C"], highlightId: "n-1" });
// <VizCanvas state={state} />
```

Mutations:

```ts
applyVizEvent(state, { type: "highlight", nodeIds: ["n-2"] });
```

## Motion rule

Never animate to/from CSS keyword `transparent`. Use `rgba(0,0,0,0)` (`vizColor.none`).

## Code sync (later)

```
Code → Execution → ExecutionEvents → VisualizationState → Timeline
```

## Proof lesson

`/lessons/array-vs-linked-list` — `StructuresScene` built on ArrayView + LinkedListView.
