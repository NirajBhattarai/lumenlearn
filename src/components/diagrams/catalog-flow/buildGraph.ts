import type { Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import { fileBytes } from "@/lib/table-catalog/engine";
import type { CatalogGraphInput } from "./types";

const arrow = {
  type: MarkerType.ArrowClosed,
  width: 14,
  height: 14,
  color: "var(--accent)",
};

function edge(
  id: string,
  source: string,
  target: string,
  active: boolean,
  label?: string,
  sourceHandle?: string,
  targetHandle?: string,
): Edge {
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    label,
    animated: active,
    markerEnd: active ? arrow : { ...arrow, color: "var(--border-strong)" },
    style: {
      stroke: active ? "var(--accent)" : "var(--border-strong)",
      strokeWidth: active ? 2 : 1.25,
    },
    labelStyle: { fill: "var(--muted)", fontSize: 10, fontFamily: "ui-monospace, monospace" },
    labelBgStyle: { fill: "var(--surface)", fillOpacity: 0.9 },
  };
}

export function buildCatalogFlowGraph(input: CatalogGraphInput): {
  nodes: Node[];
  edges: Edge[];
} {
  const {
    beat,
    engine,
    sql,
    packet,
    highlightTable,
    highlightPageId,
    scheduler,
    inspectPageId,
    rid,
    scanNames,
    cacheHit,
  } = input;

  const inspect =
    inspectPageId != null
      ? engine.heaps[inspectPageId]
      : highlightPageId != null
        ? engine.heaps[highlightPageId]
        : undefined;
  const inspectExtent =
    inspect != null ? engine.extents.find((e) => e.pageId === inspect.pageId) : undefined;

  const nodes: Node[] = [
    {
      id: "sql",
      type: "sql",
      position: { x: 0, y: 0 },
      data: { sql, packet, beat, rid, scanNames, cacheHit },
    },
    {
      id: "catalog",
      type: "catalog",
      position: { x: 0, y: 168 },
      data: {
        rows: engine.catalog,
        highlightTable,
        beat,
        orphaned: engine.orphaned,
      },
    },
    {
      id: "heap",
      type: "heap",
      position: { x: 0, y: 430 },
      data: {
        catalog: engine.catalog,
        heaps: engine.heaps,
        highlightTable,
        highlightPageId,
      },
    },
    {
      id: "compare",
      type: "compare",
      position: { x: 0, y: 680 },
      data: { orphaned: engine.orphaned },
    },
    {
      id: "scheduler",
      type: "scheduler",
      position: { x: 520, y: 168 },
      data: {
        queue: scheduler,
        active: beat === "scheduler" || beat === "allocate",
      },
    },
    {
      id: "bpm",
      type: "bpm",
      position: { x: 520, y: 430 },
      data: {
        frames: engine.frames,
        highlightPageId,
        active: beat === "bpm",
      },
    },
    {
      id: "diskMap",
      type: "diskMap",
      position: { x: 880, y: 0 },
      data: {
        extents: engine.extents,
        highlightPageId,
        active: beat === "disk" || beat === "allocate",
        fileBytes: fileBytes(engine),
      },
    },
    {
      id: "dbFile",
      type: "dbFile",
      position: { x: 880, y: 280 },
      data: {
        extents: engine.extents,
        heaps: engine.heaps,
        highlightPageId,
        inspectPageId: inspect?.pageId ?? null,
        orphaned: engine.orphaned,
        active: beat === "disk",
      },
    },
  ];

  if (inspect && inspectExtent) {
    nodes.push({
      id: "anatomy",
      type: "anatomy",
      position: { x: 880, y: 620 },
      data: { page: inspect, offset: inspectExtent.offset },
    });
  }

  const lookup = beat === "catalog" || beat === "sql";
  const toSched = beat === "scheduler" || beat === "allocate";
  const toDisk = beat === "disk" || beat === "scheduler" || beat === "allocate";
  const toBpm = beat === "bpm" || beat === "disk";

  const edges: Edge[] = [
    edge("e-sql-cat", "sql", "catalog", lookup, "register / lookup"),
    edge(
      "e-cat-heap",
      "catalog",
      "heap",
      Boolean(highlightTable) && beat !== "sql",
      "first_page_id",
      "bottom",
    ),
    edge("e-cat-sched", "catalog", "scheduler", toSched, "I/O", "right"),
    edge("e-sched-map", "scheduler", "diskMap", toDisk, "worker"),
    edge("e-map-file", "diskMap", "dbFile", beat === "disk", "seek + 8 KB"),
    edge("e-sched-bpm", "scheduler", "bpm", toBpm, "frame", "bottom"),
    edge("e-bpm-file", "bpm", "dbFile", beat === "disk" || beat === "bpm", "flush", undefined, "left"),
    edge(
      "e-heap-file",
      "heap",
      "dbFile",
      Boolean(highlightPageId != null && (beat === "disk" || beat === "allocate" || beat === "bpm")),
      "page bytes",
    ),
  ];

  if (inspect) {
    edges.push(edge("e-file-anatomy", "dbFile", "anatomy", true, "inspect"));
  }

  return { nodes, edges };
}
