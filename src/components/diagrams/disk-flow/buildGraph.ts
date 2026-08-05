import type { Edge, Node } from "@xyflow/react";
import type { DiskOrientedVisualProps } from "@/types/lesson";
import type {
  BpmHowNodeData,
  DbFileNodeData,
  DirectoryNodeData,
  FolderTreeNodeData,
  FrameNodeData,
  LabelNodeData,
  PageAnatomyNodeData,
  PageArrayHeroNodeData,
  PageDossierNodeData,
  PageNodeData,
  PageTableNodeData,
  StudentsNodeData,
} from "./nodes";
import type { StudentRow } from "./sample";
import { bpmFetchSteps, frameFields } from "./frame-dossiers";

type Focus = DiskOrientedVisualProps["focus"];

export type DiskFlowExtras = {
  explorePageId?: number | null;
  exploreSlot?: number | null;
  folderEntryId?: string | null;
  onSelectPage?: (pageId: number) => void;
  onSelectRow?: (row: StudentRow) => void;
  onSelectSlot?: (slot: number) => void;
  onSelectFolderEntry?: (id: string) => void;
};

function accent(focus: Focus, matches: Focus[]): boolean {
  return matches.includes(focus);
}

/**
 * Build a minimal React Flow graph for the current teaching focus.
 * Only nodes needed for that beat are included — no clutter.
 */
export function buildDiskFlowGraph(
  props: DiskOrientedVisualProps,
  extras: DiskFlowExtras = {},
): { nodes: Node[]; edges: Edge[] } {
  const focus = props.focus;
  const highlightPageId = props.highlightPageId ?? null;
  const folderHighlight = props.folderHighlight ?? null;
  const activeLink = props.activeLink ?? null;
  const frames = props.frames ?? [];

  const explorePage = extras.explorePageId;
  const selectedPage =
    explorePage != null
      ? explorePage
      : highlightPageId != null && highlightPageId >= 0
        ? highlightPageId
        : 1;

  const anatomyPage =
    selectedPage >= 1 && selectedPage <= 3
      ? selectedPage
      : selectedPage === 0
        ? 1
        : selectedPage === 4
          ? 2
          : 1;

  const selectedSlot = extras.exploreSlot ?? null;
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  /** Rich Finder-style tree on first slides */
  const showFolderTree = focus === "overview" || focus === "folder";
  /** Slide 3–4: film-strip page array + address + DiskManager */
  const showPageArrayHero = focus === "db-file" || focus === "page-header";
  /** Field inspector card (meta / heap / index) — slides 3 and 4 */
  const showPageDossier = focus === "db-file" || focus === "page-header";
  /** Compact path card only when tree is not the hero */
  const showDir =
    !showFolderTree &&
    ["full-stack", "request-path"].includes(focus);
  const showFile =
    !showPageArrayHero &&
    ["overview", "folder", "request-path", "full-stack"].includes(focus);
  const showAnatomy = focus === "page-header" || focus === "full-stack";
  const showStudents = ["db-file", "page-header"].includes(focus);
  const showHeap = ["page-links", "full-stack", "buffer-pool", "request-path"].includes(
    focus,
  );
  const showFrames = [
    "buffer-pool",
    "request-path",
    "full-stack",
    "overview",
  ].includes(focus);

  // Zone labels
  if (showFolderTree || showDir || showFile || showPageArrayHero) {
    nodes.push({
      id: "zone-disk",
      type: "label",
      position: { x: 0, y: -48 },
      data: {
        text: showPageArrayHero ? "BUSTUB.DB" : "DISK",
        sub: showPageArrayHero
          ? "fixed-size page array on disk"
          : "what lives on the machine",
      } satisfies LabelNodeData,
      draggable: false,
      selectable: false,
    });
  }

  if (showPageArrayHero) {
    nodes.push({
      id: "pageArrayHero",
      type: "pageArrayHero",
      position: { x: 0, y: 0 },
      data: {
        selectedPageId: selectedPage,
        onSelectPage: extras.onSelectPage,
        active: true,
      } satisfies PageArrayHeroNodeData,
    });
  }

  if (showPageDossier) {
    // Slide 3: beside hero · Slide 4: right of anatomy stack
    const dossierPos =
      focus === "page-header"
        ? { x: 680, y: 0 }
        : { x: 640, y: 0 };

    nodes.push({
      id: "pageDossier",
      type: "pageDossier",
      position: dossierPos,
      data: {
        pageId: selectedPage,
        active: true,
      } satisfies PageDossierNodeData,
    });

    if (showPageArrayHero) {
      edges.push({
        id: "hero-dossier",
        source: "pageArrayHero",
        target: "pageDossier",
        label: "inspect fields",
        animated: true,
        style: { stroke: "var(--accent)" },
      });
    }
  }
  if (showFrames) {
    nodes.push({
      id: "zone-ram",
      type: "label",
      position: { x: showFolderTree ? 560 : 920, y: -48 },
      data: {
        text: "RAM",
        sub: "buffer pool cache",
      } satisfies LabelNodeData,
      draggable: false,
      selectable: false,
    });
  }

  if (showFolderTree) {
    const treeHighlight: FolderTreeNodeData["highlight"] =
      folderHighlight === "wal"
        ? "wal"
        : folderHighlight === "catalog"
          ? "catalog"
          : folderHighlight === "root"
            ? "root"
            : folderHighlight === "data" || focus === "folder"
              ? "data"
              : "data";

    nodes.push({
      id: "folderTree",
      type: "folderTree",
      position: { x: 0, y: 0 },
      data: {
        highlight: treeHighlight,
        selectedId: extras.folderEntryId ?? null,
        onSelect: extras.onSelectFolderEntry,
        active: true,
        compact: false,
      } satisfies FolderTreeNodeData,
    });
  }

  if (showDir) {
    nodes.push({
      id: "directory",
      type: "directory",
      position: { x: 0, y: 20 },
      data: {
        title: "data/",
        fields: [
          {
            name: "bustub.db",
            value: "pages @ 8 KB",
            highlight: folderHighlight === "data",
          },
          {
            name: "bustub.wal",
            value: "write-ahead log",
            highlight: folderHighlight === "wal",
          },
          {
            name: "catalog/",
            value: "schema meta",
            highlight: folderHighlight === "catalog",
          },
          { name: "tmp/", value: "spill files" },
        ],
        active: accent(focus, ["full-stack"]),
      } satisfies DirectoryNodeData,
    });
  }

  if (showFile) {
    // On overview/folder: file sits right of tree; otherwise normal layout
    const fileX = showFolderTree ? 480 : showDir ? 280 : 40;
    const fileY = showFolderTree ? 40 : 0;

    nodes.push({
      id: "dbfile",
      type: "dbFile",
      position: { x: fileX, y: fileY },
      data: {
        selectedPageId: selectedPage,
        onSelectPage: extras.onSelectPage,
        active: accent(focus, ["folder", "overview"]),
        showFormula: false,
      } satisfies DbFileNodeData,
    });

    if (showFolderTree) {
      edges.push({
        id: "tree-db",
        source: "folderTree",
        target: "dbfile",
        label: "opens as pages",
        animated: focus === "folder" || focus === "overview",
        style: { stroke: "var(--accent)" },
      });
    } else if (showDir) {
      edges.push({
        id: "dir-db",
        source: "directory",
        target: "dbfile",
        label: "owns",
        animated: false,
        style: { stroke: "var(--accent)" },
      });
    }
  }

  if (showAnatomy) {
    // Slide 4: anatomy under the film strip so dossier stays on the right
    const anatomyPos =
      focus === "page-header"
        ? { x: 40, y: 460 }
        : { x: showDir ? 760 : 520, y: -20 };

    nodes.push({
      id: "anatomy",
      type: "pageAnatomy",
      position: anatomyPos,
      data: {
        // Visual layout is TablePage; for meta/index still show nearest heap layout
        // while dossier shows the true page type fields.
        pageId: anatomyPage,
        selectedSlot,
        highlightBand:
          focus === "page-header"
            ? selectedSlot != null
              ? "tuples"
              : "header"
            : "tuples",
        onSelectSlot: extras.onSelectSlot,
        active: accent(focus, ["page-header", "full-stack"]),
      } satisfies PageAnatomyNodeData,
    });

    if (showPageArrayHero && focus === "page-header") {
      edges.push({
        id: "hero-anatomy",
        source: "pageArrayHero",
        sourceHandle: "down",
        target: "anatomy",
        targetHandle: "top",
        label:
          selectedPage >= 1 && selectedPage <= 3
            ? "TablePage layout"
            : "heap layout (ref)",
        animated: true,
        style: { stroke: "var(--accent)" },
      });
    }

    if (showPageDossier && focus === "page-header") {
      edges.push({
        id: "anatomy-dossier",
        source: "anatomy",
        target: "pageDossier",
        label: "field details",
        style: { stroke: "var(--border-strong)", strokeDasharray: "4 3" },
      });
    }

    if (showFile) {
      edges.push({
        id: "file-anatomy",
        source: "dbfile",
        target: "anatomy",
        label: "open page",
        animated: false,
        style: { stroke: "var(--accent)" },
      });
    }
  }

  if (showStudents) {
    const studentsPos =
      focus === "page-header"
        ? { x: 360, y: 460 }
        : showPageArrayHero
          ? { x: 640, y: 380 }
          : { x: showDir ? 760 : 520, y: 340 };

    nodes.push({
      id: "students",
      type: "students",
      position: studentsPos,
      data: {
        selectedPageId: anatomyPage,
        selectedSlot,
        onSelectRow: extras.onSelectRow,
        active: true,
      } satisfies StudentsNodeData,
    });

    if (showPageArrayHero) {
      edges.push({
        id: "students-hero",
        source: "students",
        sourceHandle: "left",
        target: "pageArrayHero",
        label: "row → page_id",
        animated: true,
        style: { stroke: "var(--accent)" },
      });
    }

    if (showPageDossier) {
      edges.push({
        id: "students-dossier",
        source: "students",
        target: "pageDossier",
        targetHandle: focus === "page-header" ? undefined : "top",
        label: "same page",
        style: { stroke: "var(--border-strong)", strokeDasharray: "4 3" },
      });
    }

    if (showAnatomy) {
      edges.push({
        id: "students-anatomy",
        source: "students",
        target: "anatomy",
        targetHandle: undefined,
        label: "RID → slot",
        style: { stroke: "var(--border-strong)", strokeDasharray: "4 3" },
      });
    }
    if (showFile) {
      edges.push({
        id: "students-file",
        source: "students",
        sourceHandle: "left",
        target: "dbfile",
        label: "lives on",
        style: { stroke: "var(--muted)", strokeDasharray: "3 2" },
      });
    }
  }

  if (showHeap) {
    const heapY = focus === "page-links" ? 80 : 420;
    const heapX0 = focus === "page-links" ? 80 : 40;

    nodes.push({
      id: "page-0",
      type: "page",
      position: { x: heapX0, y: heapY },
      data: {
        pageId: 0,
        kind: "directory",
        label: "meta",
        fields: [
          { name: "root_heap", value: "P1", highlight: true },
          { name: "root_index", value: "P4" },
        ],
        active: focus === "page-links",
      } satisfies PageNodeData,
    });

    for (const pid of [1, 2, 3] as const) {
      const next = pid < 3 ? pid + 1 : null;
      nodes.push({
        id: `page-${pid}`,
        type: "page",
        position: { x: heapX0 + 240 + (pid - 1) * 230, y: heapY + 40 },
        data: {
          pageId: pid,
          kind: "heap",
          label: "TablePage",
          fields: [
            {
              name: "next_page_id",
              value: next == null ? "INVALID" : String(next),
              highlight: activeLink === `${pid}-${next}` || focus === "page-links",
            },
            {
              name: "rows",
              value:
                pid === 1
                  ? "Ada,Bob,Cara"
                  : pid === 2
                    ? "Dan,Eve"
                    : "(empty)",
            },
          ],
          active:
            selectedPage === pid ||
            highlightPageId === pid ||
            focus === "page-links",
        } satisfies PageNodeData,
      });
    }

    nodes.push({
      id: "page-4",
      type: "page",
      position: { x: heapX0 + 240 + 230, y: heapY + 280 },
      data: {
        pageId: 4,
        kind: "index",
        label: "B+ leaf",
        fields: [
          { name: "key→rid", value: "1 → (1,0)" },
          { name: "key→rid", value: "4 → (2,0)" },
        ],
        active: selectedPage === 4 || focus === "page-links",
      } satisfies PageNodeData,
    });

    edges.push(
      {
        id: "0-1",
        source: "page-0",
        target: "page-1",
        label: "root_heap",
        animated: focus === "page-links",
        style: {
          stroke:
            focus === "page-links" ? "var(--accent)" : "var(--border-strong)",
        },
      },
      {
        id: "1-2",
        source: "page-1",
        target: "page-2",
        label: "next",
        animated: activeLink === "1-2" || focus === "page-links",
        style: {
          stroke:
            activeLink === "1-2" || focus === "page-links"
              ? "var(--accent)"
              : "var(--border-strong)",
        },
      },
      {
        id: "2-3",
        source: "page-2",
        target: "page-3",
        label: "next",
        animated: focus === "page-links",
        style: {
          stroke:
            focus === "page-links" ? "var(--accent)" : "var(--border-strong)",
        },
      },
      {
        id: "1-4",
        source: "page-1",
        target: "page-4",
        label: "index",
        style: { stroke: "var(--muted)", strokeDasharray: "4 3" },
      },
    );

    if (showFile && focus === "full-stack") {
      edges.push({
        id: "db-heap",
        source: "dbfile",
        sourceHandle: "down",
        target: "page-1",
        targetHandle: "top",
        label: "pages",
        style: { stroke: "var(--border-strong)", strokeDasharray: "3 2" },
      });
    }
  }

  if (showFrames && frames.length > 0) {
    // Keep RAM frames clear of the Finder tree + bustub.db card
    const baseX = focus === "overview" ? 1000 : 980;
    const baseY = focus === "overview" ? 40 : 60;

    if (props.requestLabel && focus === "request-path") {
      nodes.push({
        id: "req-label",
        type: "label",
        position: { x: baseX - 40, y: baseY - 60 },
        data: {
          text: props.requestLabel,
          sub: "executor request",
        } satisfies LabelNodeData,
        draggable: false,
      });
    }

    const pageTable = props.pageTable ?? [];
    const mappedFrameIds = new Set(pageTable.map((e) => e.frameId));
    const freeIds = frames
      .filter((f) => f.pageId == null)
      .map((f) => f.frameId);

    const showHow = focus === "buffer-pool" || focus === "request-path";
    const showTable = focus !== "overview";
    const framesOriginX = showTable ? baseX + 268 : baseX;
    const framesOriginY = baseY;

    if (focus !== "overview") {
      nodes.push({
        id: "pageTable",
        type: "pageTable",
        position: { x: baseX, y: baseY },
        data: {
          entries: pageTable.map((e) => ({
            name: `page_table_[${e.pageId}]`,
            value: `frame ${e.frameId}`,
            highlight: highlightPageId === e.pageId,
          })),
          freeFrames:
            freeIds.length === 0 ? "∅" : `[${freeIds.join(", ")}]`,
          active: focus === "buffer-pool" || focus === "request-path",
        } satisfies PageTableNodeData,
      });
    }

    if (showHow) {
      const hit = pageTable.find(
        (e) => e.pageId === (highlightPageId ?? 1),
      );
      nodes.push({
        id: "bpmHow",
        type: "bpmHow",
        position: { x: baseX, y: baseY + 280 },
        data: {
          title:
            focus === "request-path"
              ? props.requestLabel ?? "CheckedReadPage"
              : "BufferPoolManager",
          steps: bpmFetchSteps({
            requestPageId: highlightPageId ?? 1,
            hitFrameId: hit?.frameId ?? null,
            miss: hit == null,
          }),
          active: true,
        } satisfies BpmHowNodeData,
      });

      edges.push({
        id: "pt-how",
        source: "pageTable",
        sourceHandle: "down",
        target: "bpmHow",
        label: "lookup",
        animated: focus === "request-path",
        style: { stroke: "var(--accent)" },
      });
    }

    frames.forEach((frame, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = framesOriginX + col * 256;
      const y = framesOriginY + row * 292;

      const inPageTable =
        frame.pageId != null && mappedFrameIds.has(frame.frameId);
      const inFreeList = frame.pageId == null;

      nodes.push({
        id: `frame-${frame.frameId}`,
        type: "frame",
        position: { x, y },
        data: {
          frameId: frame.frameId,
          pageId: frame.pageId,
          fields: frameFields({
            frameId: frame.frameId,
            pageId: frame.pageId,
            pinned: frame.pinned,
            dirty: frame.dirty,
            inPageTable,
            inFreeList,
            highlight: frame.highlight
              ? frame.pinned
                ? "pin"
                : frame.dirty
                  ? "dirty"
                  : frame.pageId == null
                    ? "free"
                    : "page"
              : null,
          }),
          active: Boolean(frame.highlight),
        } satisfies FrameNodeData,
      });

      if (focus !== "overview") {
        edges.push({
          id: `pt-f-${frame.frameId}`,
          source: "pageTable",
          target: `frame-${frame.frameId}`,
          label: inPageTable ? "maps" : inFreeList ? "free" : undefined,
          style: {
            stroke: frame.highlight ? "var(--accent)" : "var(--border-strong)",
            strokeDasharray: inFreeList ? "4 3" : undefined,
          },
        });
      }

      if (
        frame.pageId != null &&
        showHeap &&
        nodes.some((n) => n.id === `page-${frame.pageId}`)
      ) {
        edges.push({
          id: `cache-${frame.pageId}-${frame.frameId}`,
          source: `page-${frame.pageId}`,
          target: `frame-${frame.frameId}`,
          label: "cached",
          style: {
            stroke: frame.highlight ? "var(--accent)" : "var(--muted)",
            strokeDasharray: "4 3",
          },
        });
      }
    });
  }

  return { nodes, edges };
}
