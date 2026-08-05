import type { VizEdge, VizNode, VizState } from "./types.ts";

export type ArrayLayoutOptions = {
  values: Array<string | number | null>;
  /** Starting origin */
  originX?: number;
  originY?: number;
  cellWidth?: number;
  cellHeight?: number;
  gap?: number;
  highlightIndex?: number | null;
  idPrefix?: string;
  viewPad?: number;
};

/** Layout a 1D array as cells along X. */
export function layoutArray(options: ArrayLayoutOptions): VizState {
  const {
    values,
    originX = 12,
    originY = 28,
    cellWidth = 28,
    cellHeight = 28,
    gap = 4,
    highlightIndex = null,
    idPrefix = "a",
    viewPad = 8,
  } = options;

  const nodes: VizNode[] = values.map((v, i) => {
    const id = `${idPrefix}-${i}`;
    return {
      id,
      kind: "array-cell",
      label: v === null || v === undefined ? "·" : String(v),
      sublabel: String(i),
      x: originX + i * (cellWidth + gap) + cellWidth / 2,
      y: originY + cellHeight / 2,
      width: cellWidth,
      height: cellHeight,
      status: highlightIndex === i ? "highlight" : "idle",
      data: { index: i, value: v },
    };
  });

  const width =
    originX +
    Math.max(values.length, 1) * (cellWidth + gap) -
    gap +
    viewPad;
  const height = originY + cellHeight + viewPad + 12;

  return {
    nodes,
    edges: [],
    viewBox: `0 0 ${width} ${height}`,
    focusId: highlightIndex != null ? `${idPrefix}-${highlightIndex}` : null,
  };
}

export type LinkedListLayoutOptions = {
  values: Array<string | number>;
  originX?: number;
  originY?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  gap?: number;
  highlightId?: string | null;
  idPrefix?: string;
};

/** Horizontal singly-linked list with next edges. */
export function layoutLinkedList(options: LinkedListLayoutOptions): VizState {
  const {
    values,
    originX = 16,
    originY = 36,
    nodeWidth = 36,
    nodeHeight = 28,
    gap = 28,
    highlightId = null,
    idPrefix = "n",
  } = options;

  const nodes: VizNode[] = values.map((v, i) => {
    const id = `${idPrefix}-${i}`;
    return {
      id,
      kind: "list-node",
      label: String(v),
      sublabel: i === values.length - 1 ? "tail" : i === 0 ? "head" : undefined,
      x: originX + i * (nodeWidth + gap) + nodeWidth / 2,
      y: originY,
      width: nodeWidth,
      height: nodeHeight,
      status: highlightId === id ? "highlight" : "idle",
      data: { index: i, value: v },
    };
  });

  const edges: VizEdge[] = [];
  for (let i = 0; i < values.length - 1; i++) {
    edges.push({
      id: `${idPrefix}-${i}->${idPrefix}-${i + 1}`,
      from: `${idPrefix}-${i}`,
      to: `${idPrefix}-${i + 1}`,
      label: "next",
      status: "idle",
    });
  }

  const width =
    originX + Math.max(values.length, 1) * (nodeWidth + gap) - gap + 24;
  const height = originY + nodeHeight / 2 + 28;

  return {
    nodes,
    edges,
    viewBox: `0 0 ${width} ${height}`,
    focusId: highlightId,
  };
}

export type GraphLayoutOptions = {
  nodes: Array<{
    id: string;
    label: string;
    sublabel?: string;
    x: number;
    y: number;
  }>;
  edges: Array<{
    id: string;
    from: string;
    to: string;
    label?: string;
  }>;
  activeEdgeId?: string | null;
  viewBox?: string;
};

/** Pass-through graph layout with optional edge highlight. */
export function layoutGraph(options: GraphLayoutOptions): VizState {
  const { nodes, edges, activeEdgeId = null, viewBox = "0 0 100 100" } =
    options;

  const activeNodes = new Set<string>();
  if (activeEdgeId) {
    const e = edges.find((edge) => edge.id === activeEdgeId);
    if (e) {
      activeNodes.add(e.from);
      activeNodes.add(e.to);
    }
  }

  return {
    viewBox,
    nodes: nodes.map((n) => ({
      id: n.id,
      kind: "graph-node",
      label: n.label,
      sublabel: n.sublabel,
      x: n.x,
      y: n.y,
      width: 12,
      height: 12,
      status: activeNodes.has(n.id) ? "highlight" : "idle",
    })),
    edges: edges.map((e) => ({
      ...e,
      status: e.id === activeEdgeId ? "highlight" : "idle",
    })),
    focusId: activeEdgeId,
  };
}
