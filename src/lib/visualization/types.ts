/**
 * Data-driven visualization engine types.
 * Lessons / simulations produce VizState (+ optional VizEvents); renderers consume state.
 */

export type VizNodeKind =
  | "default"
  | "array-cell"
  | "list-node"
  | "hash-bucket"
  | "cache-slot"
  | "memory-block"
  | "tree-node"
  | "graph-node";

export type VizNodeStatus =
  | "idle"
  | "highlight"
  | "active"
  | "inserting"
  | "removing"
  | "dimmed"
  | "ghost";

export type VizNode = {
  id: string;
  kind?: VizNodeKind;
  label: string;
  sublabel?: string;
  /** SVG / layout coordinates (engine units) */
  x: number;
  y: number;
  width?: number;
  height?: number;
  status?: VizNodeStatus;
  /** Opaque payload for inspectors / WHY mode later */
  data?: Record<string, unknown>;
};

export type VizEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  status?: VizNodeStatus;
  /** curved | straight — renderer hint */
  route?: "straight" | "elbow";
};

export type VizAnnotation = {
  id: string;
  text: string;
  x?: number;
  y?: number;
  anchor?: "start" | "middle" | "end";
};

export type VizState = {
  nodes: VizNode[];
  edges: VizEdge[];
  annotations?: VizAnnotation[];
  /** viewBox: "minX minY width height" */
  viewBox: string;
  focusId?: string | null;
};

export type VizEvent =
  | { type: "highlight"; nodeIds?: string[]; edgeIds?: string[] }
  | { type: "clear-highlight" }
  | { type: "set-status"; nodeId: string; status: VizNodeStatus }
  | { type: "move-node"; nodeId: string; x: number; y: number }
  | { type: "insert-node"; node: VizNode }
  | { type: "remove-node"; nodeId: string }
  | { type: "connect"; edge: VizEdge }
  | { type: "disconnect"; edgeId: string }
  | { type: "change-value"; nodeId: string; label: string; sublabel?: string }
  | { type: "retarget-edge"; edgeId: string; to: string }
  | { type: "replace"; state: VizState }
  | { type: "annotate"; annotation: VizAnnotation }
  | { type: "focus"; focusId: string | null };

export type VizTimelineStep = {
  id: string;
  label?: string;
  events: VizEvent[];
  durationMs?: number;
};
