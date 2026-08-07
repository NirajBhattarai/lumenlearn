import type { Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import { GUARD_PAGE_IDS, pageAnatomy } from "@/lib/page-guard/story";
import type { StorySnap } from "@/lib/page-guard/story";
import { sceneCopy } from "@/lib/page-guard/copy";

export function buildGuardStoryGraph(snap: StorySnap): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const copy = sceneCopy(snap);
  const arrow = { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "var(--border-strong)" };

  const colDisk = 0;
  const colBpm = 316;
  const colFrame = 652;
  const top = 118;
  const pagesY = top + 36;

  nodes.push({
    id: "query",
    type: "query",
    position: { x: 0, y: 0 },
    data: {
      sql: snap.sql ?? "",
      kid: copy.sqlKid,
      why: copy.sqlWhy,
      beat: snap.beat,
    },
  });

  nodes.push({
    id: "label-disk",
    type: "label",
    position: { x: colDisk, y: top },
    data: {
      kicker: "Left · durable",
      text: "Disk page",
      hint: "Bytes survive restart. Edits wait for SAVE.",
    },
    selectable: false,
  });

  nodes.push({
    id: "label-bpm",
    type: "label",
    position: { x: colBpm, y: top },
    data: {
      kicker: "Middle · control plane",
      text: "Buffer pool manager",
      hint: "Short latch. Lookup, pin, I/O — never tuple edits.",
    },
    selectable: false,
  });

  nodes.push({
    id: "label-frame",
    type: "label",
    position: { x: colFrame, y: top },
    data: {
      kicker: "Right · RAM desk",
      text: "Pinned frame",
      hint: "Page lock lives here. UPDATE / INSERT happen here.",
    },
    selectable: false,
  });

  const hero = pageAnatomy(0, snap.diskRows, snap.focusRowId, snap.freshRowId);
  nodes.push({
    id: "disk-0",
    type: "verticalPage",
    position: { x: colDisk, y: pagesY },
    data: {
      kind: "disk",
      anatomy: hero,
      hot: snap.focusPage === 0,
      flow: snap.flow,
      roleTitle: copy.diskRole,
      roleBody: copy.diskWhy,
      headerNote: copy.headerNote,
      slotNote: copy.slotNote,
      freeNote: copy.freeNote,
      tupleNote: copy.tupleNote,
    },
  });

  nodes.push({
    id: "bpm",
    type: "bpmHub",
    position: { x: colBpm, y: pagesY },
    data: {
      locked: snap.bpmLocked,
      why: copy.bpmWhy,
      tech: copy.bpmTech,
      catalogLine: copy.catalogLine,
      pinLine: copy.pinLine,
      ioLine: copy.ioLine,
      ioKind: copy.ioKind,
      pageLockNote: copy.pageLockNote,
      threads: snap.threads,
    },
  });

  const f0 = snap.frames[0]!;
  nodes.push({
    id: "frame-0",
    type: "verticalPage",
    position: { x: colFrame, y: pagesY },
    data: {
      kind: "frame",
      frameId: 0,
      anatomy:
        f0.pageId == null
          ? pageAnatomy(0, [], null)
          : pageAnatomy(f0.pageId, f0.rows, snap.focusRowId, snap.freshRowId),
      hot: f0.pageId != null && snap.focusPage === f0.pageId,
      pin: f0.pin,
      locked: f0.locked,
      dirty: f0.dirty,
      empty: f0.pageId == null,
      flow: snap.flow,
      roleTitle: copy.frameRole,
      roleBody: copy.frameWhy,
      headerNote: copy.headerNote,
      slotNote: copy.slotNote,
      freeNote: copy.freeNote,
      tupleNote: copy.tupleNote,
    },
  });

  nodes.push({
    id: "label-shelf",
    type: "label",
    position: { x: 968, y: top },
    data: {
      kicker: "Rest of the shelf",
      text: "Pages 1 & 2",
      hint: "Same layout. Not in this write.",
    },
    selectable: false,
  });

  GUARD_PAGE_IDS.filter((id) => id !== 0).forEach((pageId, i) => {
    nodes.push({
      id: `disk-${pageId}`,
      type: "verticalPage",
      position: { x: 968, y: pagesY + i * 290 },
      data: {
        kind: "disk",
        anatomy: pageAnatomy(pageId, snap.diskRows, snap.focusRowId, snap.freshRowId),
        compact: true,
        hot: snap.focusPage === pageId,
        roleTitle: `Page ${pageId}`,
        roleBody: "Other heap page. Untouched by this guard.",
        headerNote: copy.headerNote,
        slotNote: copy.slotNote,
        freeNote: copy.freeNote,
        tupleNote: copy.tupleNote,
      },
    });
  });

  snap.frames.slice(1).forEach((frame, i) => {
    nodes.push({
      id: `frame-${frame.frameId}`,
      type: "verticalPage",
      position: { x: 1160, y: pagesY + i * 210 },
      data: {
        kind: "frame",
        frameId: frame.frameId,
        anatomy:
          frame.pageId == null
            ? pageAnatomy(frame.frameId, [], null)
            : pageAnatomy(frame.pageId, frame.rows, snap.focusRowId),
        compact: true,
        hot: false,
        pin: frame.pin,
        locked: frame.locked,
        dirty: frame.dirty,
        empty: frame.pageId == null,
        roleTitle: `Frame ${frame.frameId}`,
        roleBody: "Spare desk. Idle during this story.",
        headerNote: copy.headerNote,
        slotNote: copy.slotNote,
        freeNote: copy.freeNote,
        tupleNote: copy.tupleNote,
      },
    });
  });

  edges.push({
    id: "q-bpm",
    source: "query",
    target: "bpm",
    markerEnd: arrow,
    animated: snap.bpmLocked,
    style: { stroke: snap.bpmLocked ? "var(--danger)" : "var(--border-strong)", strokeWidth: 1.5 },
  });

  const loading = snap.flow === "load";
  const saving = snap.flow === "save";
  const activeIo = loading || saving;

  edges.push({
    id: "disk-bpm",
    source: saving ? "bpm" : "disk-0",
    sourceHandle: saving ? "out-left" : "out-right",
    target: saving ? "disk-0" : "bpm",
    targetHandle: saving ? "in-right" : "in-left",
    markerEnd: arrow,
    animated: activeIo,
    style: {
      stroke: saving ? "var(--warn)" : loading ? "var(--ok)" : "var(--border-strong)",
      strokeWidth: activeIo ? 2 : 1.25,
    },
  });

  edges.push({
    id: "bpm-frame",
    source: saving ? "frame-0" : "bpm",
    sourceHandle: saving ? "out-left" : "out-right",
    target: saving ? "bpm" : "frame-0",
    targetHandle: saving ? "in-right" : "in-left",
    markerEnd: arrow,
    animated: activeIo || (snap.frames[0]?.pin ?? 0) > 0,
    style: {
      stroke: saving ? "var(--warn)" : loading ? "var(--ok)" : "var(--accent)",
      strokeWidth: activeIo ? 2 : 1.25,
    },
  });

  return { nodes, edges };
}
