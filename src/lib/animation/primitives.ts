import type { VizEdge, VizEvent, VizNode } from "../visualization/types.ts";
import type { AnimBeat } from "./types.ts";

/** Highlight a node (cause optional via prior clear). */
export function highlightNode(nodeId: string): VizEvent[] {
  return [{ type: "highlight", nodeIds: [nodeId] }];
}

export function highlightEdge(edgeId: string): VizEvent[] {
  return [{ type: "highlight", edgeIds: [edgeId] }];
}

export function highlightNodes(nodeIds: string[]): VizEvent[] {
  return [{ type: "highlight", nodeIds }];
}

export function clearHighlight(): VizEvent[] {
  return [{ type: "clear-highlight" }];
}

export function moveNode(
  nodeId: string,
  x: number,
  y: number,
): VizEvent[] {
  return [{ type: "move-node", nodeId, x, y }];
}

export function connectNodes(edge: VizEdge): VizEvent[] {
  return [
    { type: "connect", edge: { ...edge, status: edge.status ?? "inserting" } },
    {
      type: "set-status",
      nodeId: edge.to,
      status: "highlight",
    },
  ];
}

export function disconnectNodes(edgeId: string): VizEvent[] {
  return [{ type: "disconnect", edgeId }];
}

/** Insert with inserting → idle status transition. */
export function insertNode(node: VizNode): VizEvent[] {
  const withStatus: VizNode = {
    ...node,
    status: node.status ?? "inserting",
  };
  return [
    { type: "insert-node", node: withStatus },
    { type: "set-status", nodeId: node.id, status: "idle" },
    { type: "focus", focusId: node.id },
  ];
}

/** Mark removing, then delete. */
export function removeNode(nodeId: string): VizEvent[] {
  return [
    { type: "set-status", nodeId, status: "removing" },
    { type: "remove-node", nodeId },
    { type: "focus", focusId: null },
  ];
}

/** Swap two node positions (and optional labels stay with nodes). */
export function swapNodes(
  a: { id: string; x: number; y: number },
  b: { id: string; x: number; y: number },
): VizEvent[] {
  return [
    { type: "set-status", nodeId: a.id, status: "active" },
    { type: "set-status", nodeId: b.id, status: "active" },
    { type: "move-node", nodeId: a.id, x: b.x, y: b.y },
    { type: "move-node", nodeId: b.id, x: a.x, y: a.y },
    { type: "set-status", nodeId: a.id, status: "idle" },
    { type: "set-status", nodeId: b.id, status: "idle" },
  ];
}

export function changeValue(
  nodeId: string,
  label: string,
  sublabel?: string,
): VizEvent[] {
  return [{ type: "change-value", nodeId, label, sublabel }];
}

export function changePointer(edgeId: string, to: string): VizEvent[] {
  return [{ type: "retarget-edge", edgeId, to }];
}

export function pulse(nodeId: string): VizEvent[] {
  return [
    { type: "set-status", nodeId, status: "active" },
    { type: "set-status", nodeId, status: "highlight" },
  ];
}

export function stateTransition(
  id: string,
  teaches: string,
  events: VizEvent[],
  durationMs = 700,
): AnimBeat {
  return {
    id,
    teaches,
    transition: events,
    durationMs,
  };
}

/**
 * Full insert beat: highlight neighbor (cause) → insert + connect (transition) → settle (result).
 */
export function insertAfterBeat(options: {
  id: string;
  teaches: string;
  afterId: string;
  node: VizNode;
  edge: VizEdge;
  durationMs?: number;
}): AnimBeat {
  return {
    id: options.id,
    teaches: options.teaches,
    durationMs: options.durationMs ?? 900,
    cause: highlightNode(options.afterId),
    transition: [
      ...insertNode(options.node),
      { type: "connect", edge: options.edge },
    ],
    result: [
      { type: "set-status", nodeId: options.node.id, status: "highlight" },
      { type: "annotate", annotation: { id: "hint", text: options.teaches, x: 4, y: 8 } },
    ],
  };
}

export function showStateTransition(
  id: string,
  teaches: string,
  fromEvents: VizEvent[],
  toEvents: VizEvent[],
): AnimBeat {
  return {
    id,
    teaches,
    cause: fromEvents,
    transition: toEvents,
    durationMs: 800,
  };
}
