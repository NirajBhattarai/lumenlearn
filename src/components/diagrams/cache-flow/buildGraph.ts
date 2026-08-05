import type { Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import { WORKLOAD_PAGES } from "@/lib/cache-policies/sample";
import type { CacheGraphInput } from "./types";
import { buildPolicyRailData } from "./policyRail";

export function buildCacheFlowGraph(input: CacheGraphInput): {
  nodes: Node[];
  edges: Edge[];
} {
  const {
    policy,
    beat,
    frames,
    structures,
    hand,
    focusRowIds,
    pendingAccess,
    victimPage,
    accessPage,
    hit,
    intent,
  } = input;

  const frameOf: Record<number, number> = {};
  for (const f of frames) {
    if (f.pageId != null) frameOf[f.pageId] = f.frameId;
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (intent && pendingAccess != null && beat !== "idle") {
    nodes.push({
      id: "query",
      type: "query",
      position: { x: 0, y: 0 },
      data: {
        sql: intent.sql,
        why: intent.why,
        ridNote: intent.ridNote,
        pageId: pendingAccess,
        beat,
        hit,
      },
      draggable: true,
    });
  }

  nodes.push({
    id: "students",
    type: "students",
    position: { x: 0, y: intent && beat !== "idle" ? 168 : 36 },
    data: {
      focusRowIds,
      focusPageId: pendingAccess,
      victimPage: beat === "evict" ? victimPage : null,
      loadingPage: beat === "load" ? pendingAccess : null,
      frameOf,
    },
    draggable: true,
  });

  nodes.push({
    id: "label-pages",
    type: "label",
      position: { x: 520, y: -8 },
      data: {
        text: "Disk pages",
        hint: "Heap holds rows · P4 is id → RID",
      },
    draggable: false,
    selectable: false,
  });

  WORKLOAD_PAGES.forEach((p, i) => {
    const resident = frames.some((f) => f.pageId === p.id);
    const requesting = pendingAccess === p.id && beat !== "idle";
    nodes.push({
      id: `page-${p.id}`,
      type: "page",
      position: { x: 520, y: 28 + i * 168 },
      data: {
        pageId: p.id,
        resident,
        requesting,
        leaving: victimPage === p.id && beat === "evict",
        loading: requesting && beat === "load",
        hotRowIds: requesting ? focusRowIds : [],
      },
      draggable: true,
    });
  });

  nodes.push({
    id: "label-frames",
    type: "label",
    position: { x: 790, y: -8 },
    data: {
      text: policy === "clock" ? "Clock buffer pool" : "Buffer pool frames",
      hint:
        policy === "clock"
          ? "Hand skips ref=1, evicts first ref=0"
          : "Edges are the page table",
    },
    draggable: false,
    selectable: false,
  });

  const n = Math.max(frames.length, 1);
  frames.forEach((f, i) => {
    const isVictim =
      beat === "evict" && f.pageId != null && f.pageId === victimPage;
    const settled = beat === "load" || beat === "done";
    let position: { x: number; y: number };
    if (policy === "clock") {
      const cx = 980;
      const cy = 280;
      const r = 188;
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      position = {
        x: cx + r * Math.cos(angle) - 84,
        y: cy + r * Math.sin(angle) - 64,
      };
    } else {
      const col = i % 2;
      const row = Math.floor(i / 2);
      position = { x: 790 + col * 188, y: 28 + row * 176 };
    }

    nodes.push({
      id: `frame-${f.frameId}`,
      type: "frame",
      position,
      data: {
        frame: f,
        isTarget: settled && accessPage != null && f.pageId === accessPage,
        isVictim,
        hand: policy === "clock" && hand === f.frameId,
        hotRowIds:
          f.pageId != null && (pendingAccess === f.pageId || accessPage === f.pageId)
            ? focusRowIds
            : [],
      },
      draggable: true,
    });
  });

  const policyY = policy === "clock" ? 540 : 392;
  nodes.push({
    id: "policy",
    type: "policy",
    position: { x: 790, y: policyY },
    data: buildPolicyRailData({
      policy,
      structures,
      frames,
      hand,
      beat,
      accessPage,
      pendingAccess,
      victimPage,
    }),
    draggable: true,
  });

  if (pendingAccess != null && beat !== "idle") {
    const fromQuery = nodes.some((n) => n.id === "query");
    if (fromQuery) {
      edges.push({
        id: "exec-table",
        source: "query",
        target: "students",
        animated: beat === "request",
        label: "read row",
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
        style: { stroke: "var(--accent)", strokeWidth: 1.3 },
      });
    }
    edges.push({
      id: `query-${pendingAccess}`,
      source: "students",
      target: `page-${pendingAccess}`,
      animated: beat === "request" || beat === "decide" || beat === "load",
      label:
        beat === "decide" && hit
          ? "HIT probe"
          : beat === "decide"
            ? "MISS — no frame"
            : "needs page",
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
      style: {
        stroke: hit && beat !== "load" && beat !== "evict" ? "var(--ok)" : "var(--accent)",
        strokeWidth: 1.6,
      },
    });
  }

  for (const f of frames) {
    if (f.pageId == null) continue;
    const detaching = beat === "evict" && f.pageId === victimPage;
    edges.push({
      id: `attach-${f.pageId}-${f.frameId}`,
      source: `page-${f.pageId}`,
      target: `frame-${f.frameId}`,
      animated: detaching || (beat === "load" && f.pageId === pendingAccess),
      label: detaching ? "detach" : "attach",
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
      style: {
        stroke: detaching ? "var(--danger)" : "var(--ok)",
        strokeWidth: 1.6,
        strokeDasharray: detaching ? "4 3" : undefined,
      },
    });
  }

  return { nodes, edges };
}
