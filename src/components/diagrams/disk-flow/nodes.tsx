"use client";

import { memo, useEffect, useState } from "react";
import {
  Handle,
  Position,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  Database,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { FILE_PAGES, STUDENTS, rowsOnPage, type StudentRow } from "./sample";
import { getPageDossier } from "./page-dossiers";

export type FieldRow = {
  name: string;
  value: string;
  highlight?: boolean;
};

export type DirectoryNodeData = {
  title: string;
  fields: FieldRow[];
  active?: boolean;
};

/** Visual OS-style tree: SSD → data/ → files (first-slide teaching surface). */
export type FolderTreeNodeData = {
  /** Which entry is emphasized by the lesson step */
  highlight?: "root" | "data" | "db" | "wal" | "catalog" | "tmp" | null;
  /** Learner-selected entry id */
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  active?: boolean;
  /** Compact for later steps */
  compact?: boolean;
};

export type DbFileNodeData = {
  selectedPageId: number;
  onSelectPage?: (id: number) => void;
  active?: boolean;
  showFormula?: boolean;
};

/** Hero for slide 3: file as fixed page array + address + DiskManager I/O. */
export type PageArrayHeroNodeData = {
  selectedPageId: number;
  onSelectPage?: (id: number) => void;
  active?: boolean;
};

/** Detail card for the selected page (meta / heap / index fields + tips). */
export type PageDossierNodeData = {
  pageId: number;
  active?: boolean;
};

export type PageAnatomyNodeData = {
  pageId: number;
  selectedSlot?: number | null;
  highlightBand?: "header" | "slots" | "free" | "tuples" | null;
  onSelectSlot?: (slot: number) => void;
  active?: boolean;
};

export type StudentsNodeData = {
  selectedPageId: number;
  selectedSlot?: number | null;
  onSelectRow?: (row: StudentRow) => void;
  active?: boolean;
};

export type PageNodeData = {
  pageId: number;
  kind: "directory" | "heap" | "index";
  label: string;
  fields: FieldRow[];
  active?: boolean;
};

export type FrameNodeData = {
  frameId: number;
  pageId: number | null;
  fields: FieldRow[];
  active?: boolean;
};

export type PageTableNodeData = {
  entries: FieldRow[];
  freeFrames: string;
  active?: boolean;
};

export type BpmHowNodeData = {
  title: string;
  steps: Array<{ n: string; text: string; hot?: boolean }>;
  active?: boolean;
};

export type LabelNodeData = {
  text: string;
  sub?: string;
};

export type DirectoryNode = Node<DirectoryNodeData, "directory">;
export type FolderTreeNode = Node<FolderTreeNodeData, "folderTree">;
export type DbFileNode = Node<DbFileNodeData, "dbFile">;
export type PageArrayHeroNode = Node<PageArrayHeroNodeData, "pageArrayHero">;
export type PageDossierNode = Node<PageDossierNodeData, "pageDossier">;
export type PageAnatomyNode = Node<PageAnatomyNodeData, "pageAnatomy">;
export type StudentsNode = Node<StudentsNodeData, "students">;
export type PageNode = Node<PageNodeData, "page">;
export type FrameNode = Node<FrameNodeData, "frame">;
export type PageTableNode = Node<PageTableNodeData, "pageTable">;
export type BpmHowNode = Node<BpmHowNodeData, "bpmHow">;
export type LabelNode = Node<LabelNodeData, "label">;

const PAGE_META: Record<
  number,
  { kind: string; color: string; title: string; blurb: string }
> = {
  0: {
    kind: "meta",
    color: "accent",
    title: "Directory / meta",
    blurb: "Catalog roots & free-space map — not student rows.",
  },
  1: {
    kind: "heap",
    color: "warn",
    title: "TablePage (heap)",
    blurb: "Ada, Bob, Cara — first heap page of students.",
  },
  2: {
    kind: "heap",
    color: "warn",
    title: "TablePage (heap)",
    blurb: "Dan, Eve — next page in the heap chain.",
  },
  3: {
    kind: "heap",
    color: "warn",
    title: "TablePage (heap)",
    blurb: "Empty / free heap page in this sample.",
  },
  4: {
    kind: "index",
    color: "ok",
    title: "B+ leaf",
    blurb: "Index keys → RIDs pointing into heap pages.",
  },
};

const TREE_ENTRIES = [
  {
    id: "db",
    name: "bustub.db",
    kind: "file" as const,
    role: "Main database",
    detail: "Array of 8 KB pages — heap, index, meta. Source of truth for table data.",
    icon: "db" as const,
    size: "~ pages × 8192 B",
  },
  {
    id: "wal",
    name: "bustub.log",
    kind: "file" as const,
    role: "Write-ahead log",
    detail:
      "BusTub DiskManager names this <db>.log next to the .db file (not .wal). Logged before durable page flush.",
    icon: "log" as const,
    size: "append-only",
  },
  {
    id: "catalog",
    name: "catalog (in memory)",
    kind: "folder" as const,
    role: "Metadata · not a disk folder",
    detail:
      "In BusTub, Catalog is a C++ object (table/index names → schema + first_page_id). It is not a catalog/ directory on disk.",
    icon: "folder" as const,
    size: "RAM",
  },
  {
    id: "tmp",
    name: "tmp/",
    kind: "folder" as const,
    role: "Spill files (engines in general)",
    detail:
      "Sort/hash spill files exist in many production engines. BusTub student projects usually skip a tmp/ tree.",
    icon: "folder" as const,
    size: "optional",
  },
] as const;

function TreeIcon({
  kind,
  open,
  className,
}: {
  kind: "disk" | "folder" | "db" | "log" | "file";
  open?: boolean;
  className?: string;
}) {
  const cls = cn("h-3.5 w-3.5 shrink-0", className);
  if (kind === "disk") return <HardDrive className={cls} aria-hidden />;
  if (kind === "db") return <Database className={cls} aria-hidden />;
  if (kind === "log") return <FileText className={cls} aria-hidden />;
  if (kind === "folder")
    return open ? (
      <FolderOpen className={cls} aria-hidden />
    ) : (
      <Folder className={cls} aria-hidden />
    );
  return <Layers className={cls} aria-hidden />;
}

function FieldTable({ fields }: { fields: FieldRow[] }) {
  return (
    <div className="w-full overflow-hidden rounded-[var(--radius-sm)] border border-border">
      <table className="w-full border-collapse text-left">
        <tbody>
          {fields.map((f) => (
            <tr
              key={f.name}
              className={cn(
                "border-b border-border last:border-0",
                f.highlight && "bg-accent-muted",
              )}
            >
              <td className="px-2 py-1 font-mono text-[10px] text-muted">
                {f.name}
              </td>
              <td className="px-2 py-1 font-mono text-[10px] font-medium text-foreground">
                {f.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const DirectoryCardNode = memo(function DirectoryCardNode({
  data,
}: NodeProps<DirectoryNode>) {
  return (
    <div
      className={cn(
        "w-[220px] rounded-[var(--radius-lg)] border bg-surface p-3",
        data.active ? "border-accent" : "border-border",
      )}
    >
      <Handle type="source" position={Position.Right} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Bottom} id="down" className="!bg-accent !border-border" />
      <p className="text-eyebrow">On disk</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{data.title}</p>
      <div className="mt-2">
        <FieldTable fields={data.fields} />
      </div>
    </div>
  );
});

/**
 * Finder/Explorer-style tree: how the instance looks on a real system.
 * Click a file/folder → detail panel explains its role.
 */
export const FolderTreeCardNode = memo(function FolderTreeCardNode({
  data,
}: NodeProps<FolderTreeNode>) {
  const stepHint = data.highlight ?? "data";
  const defaultId =
    stepHint === "wal"
      ? "wal"
      : stepHint === "catalog"
        ? "catalog"
        : stepHint === "tmp"
          ? "tmp"
          : stepHint === "db" || stepHint === "data"
            ? "db"
            : "db";

  const [selected, setSelected] = useState(data.selectedId ?? defaultId);

  useEffect(() => {
    if (data.selectedId) setSelected(data.selectedId);
    else setSelected(defaultId);
  }, [data.selectedId, defaultId]);

  const entry = TREE_ENTRIES.find((e) => e.id === selected) ?? TREE_ENTRIES[0]!;
  const compact = data.compact;

  const pick = (id: string) => {
    setSelected(id);
    data.onSelect?.(id);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border bg-surface",
        compact ? "w-[min(300px,88vw)] sm:w-[320px]" : "w-[min(380px,90vw)] sm:w-[420px]",
        data.active ? "border-accent" : "border-border",
      )}
    >
      <Handle type="source" position={Position.Right} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Bottom} id="down" className="!bg-accent !border-border" />
      <Handle type="target" position={Position.Left} className="!bg-accent !border-border" />

      {/* Window chrome — like a real file manager */}
      <div className="flex items-center gap-2 border-b border-border bg-stage px-3 py-2">
        <div className="flex gap-1" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-danger/50" />
          <span className="h-2 w-2 rounded-full bg-warn/50" />
          <span className="h-2 w-2 rounded-full bg-ok/50" />
        </div>
        <p className="min-w-0 flex-1 truncate font-mono text-[10px] text-muted">
          Finder · database instance
        </p>
      </div>

      {/* Breadcrumb path */}
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-1.5 font-mono text-[10px] text-subtle">
        <TreeIcon kind="disk" className="text-muted" />
        <span className="text-muted">SSD</span>
        <span className="text-border-strong">/</span>
        <span className="text-muted">var</span>
        <span className="text-border-strong">/</span>
        <span className="text-muted">lib</span>
        <span className="text-border-strong">/</span>
        <span className="font-medium text-accent">bustub</span>
        <span className="text-border-strong">/</span>
        <span className="font-medium text-foreground">data</span>
        <span className="text-border-strong">/</span>
      </div>

      <div className={cn("grid", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-[1.05fr_0.95fr]")}>
        {/* Tree */}
        <div className="border-b border-border bg-stage/50 p-2.5 sm:border-b-0 sm:border-r">
          {/* Disk root */}
          <div className="mb-1 flex items-center gap-2 rounded-[var(--radius-sm)] px-1.5 py-1 font-mono text-[11px] text-muted">
            <TreeIcon kind="disk" className="text-muted" />
            <span>Local Disk (SSD)</span>
          </div>

          {/* data/ folder open */}
          <div className="ml-2 border-l border-border pl-2">
            <div
              className={cn(
                "mb-1 flex items-center gap-2 rounded-[var(--radius-sm)] px-1.5 py-1 font-mono text-[11px]",
                stepHint === "root" || stepHint === "data"
                  ? "bg-accent-muted text-accent"
                  : "text-foreground",
              )}
            >
              <TreeIcon kind="folder" open className="text-accent" />
              <span className="font-semibold">data/</span>
              <span className="ml-auto text-[9px] text-subtle">instance</span>
            </div>

            <ul className="ml-2 space-y-0.5 border-l border-border pl-2" role="listbox" aria-label="Files in data/">
              {TREE_ENTRIES.map((e) => {
                const on = selected === e.id;
                const stepOn =
                  (e.id === "db" && (stepHint === "data" || stepHint === "db")) ||
                  (e.id === "wal" && stepHint === "wal") ||
                  (e.id === "catalog" && stepHint === "catalog") ||
                  (e.id === "tmp" && stepHint === "tmp");
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={on}
                      className={cn(
                        "nodrag nopan flex w-full items-center gap-2 rounded-[var(--radius-sm)] border px-1.5 py-1.5 text-left font-mono text-[11px] transition-colors",
                        on
                          ? "border-accent bg-accent-muted text-accent"
                          : stepOn
                            ? "border-border-strong bg-surface text-foreground"
                            : "border-transparent text-muted hover:border-border hover:bg-surface hover:text-foreground",
                      )}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        pick(e.id);
                      }}
                    >
                      <TreeIcon
                        kind={e.icon}
                        className={on ? "text-accent" : "text-muted"}
                      />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {e.name}
                      </span>
                      <span className="shrink-0 text-[8px] text-subtle">
                        {e.size}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Mini preview strip of bustub.db pages */}
          {selected === "db" && !compact ? (
            <div className="mt-3 rounded-[var(--radius-md)] border border-border bg-surface p-2">
              <p className="mb-1.5 font-mono text-[9px] text-subtle">
                bustub.db · page array
              </p>
              <div className="flex gap-0.5">
                {FILE_PAGES.map((p) => (
                  <div
                    key={p.id}
                    className="flex h-8 flex-1 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-stage font-mono text-[8px] text-muted"
                  >
                    P{p.id}
                  </div>
                ))}
                <div className="flex h-8 w-5 items-center justify-center font-mono text-[8px] text-subtle">
                  …
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Detail inspector */}
        {!compact ? (
          <div className="flex flex-col p-3">
            <p className="text-eyebrow">Selected</p>
            <div className="mt-2 flex items-start gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border bg-stage">
                <TreeIcon
                  kind={entry.icon}
                  className="h-4 w-4 text-accent"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-semibold text-foreground">
                  {entry.name}
                </p>
                <p className="text-[11px] text-muted">{entry.role}</p>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              {entry.detail}
            </p>
            <div className="mt-auto border-t border-border pt-2">
              <p className="font-mono text-[9px] leading-snug text-subtle">
                path: {entry.id === "catalog"
                  ? "Catalog catalog_ (in-process, not a folder)"
                  : entry.id === "tmp"
                    ? "(optional spill dir — not in BusTub DiskManager)"
                    : `./${entry.name}`}
              </p>
              <p className="mt-1 text-[10px] text-muted">
                BusTub: one .db + one .log. Catalog is not a disk folder.
              </p>
            </div>
          </div>
        ) : (
          <div className="border-t border-border px-2.5 py-2">
            <p className="font-mono text-[10px] text-foreground">
              {entry.name}{" "}
              <span className="text-muted">· {entry.role}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export const DbFileCardNode = memo(function DbFileCardNode({
  data,
}: NodeProps<DbFileNode>) {
  const selected = data.selectedPageId;
  const offset = selected * 8192;
  const who = rowsOnPage(selected);

  return (
    <div
      className={cn(
        "w-[min(420px,85vw)] rounded-[var(--radius-lg)] border bg-surface sm:w-[440px]",
        data.active ? "border-accent" : "border-border",
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Right} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Bottom} id="down" className="!bg-accent !border-border" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-accent !border-border" />

      <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2.5">
        <div>
          <p className="text-eyebrow">Database file</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
            bustub.db
          </p>
        </div>
        <p className="rounded-[var(--radius-sm)] border border-border bg-stage px-2 py-1 font-mono text-[10px] text-accent">
          8192 B
        </p>
      </div>

      <div className="bg-stage p-2.5">
        <div className="flex gap-1" role="list">
          {FILE_PAGES.map((p) => {
            const on = p.id === selected;
            return (
              <button
                key={p.id}
                type="button"
                role="listitem"
                className={cn(
                  "nodrag nopan flex h-14 flex-1 flex-col items-center justify-center rounded-[var(--radius-md)] border transition-colors",
                  on
                    ? "border-accent bg-accent-muted"
                    : "border-border bg-surface hover:border-border-strong",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  data.onSelectPage?.(p.id);
                }}
                aria-pressed={on}
              >
                <span
                  className={cn(
                    "font-mono text-xs font-semibold",
                    on ? "text-accent" : "text-foreground",
                  )}
                >
                  P{p.id}
                </span>
                <span className="font-mono text-[8px] text-subtle">{p.short}</span>
              </button>
            );
          })}
        </div>

        {data.showFormula !== false ? (
          <div
            className={cn(
              "mt-2 rounded-[var(--radius-md)] border px-2 py-1.5 font-mono text-[11px]",
              "border-accent/40 bg-accent-muted/50",
            )}
          >
            <span className="text-muted">offset</span> ={" "}
            <span className="text-accent">{selected}</span> × 8192 ={" "}
            <span className="font-semibold text-accent">
              {offset.toLocaleString()} B
            </span>
          </div>
        ) : null}

        <p className="mt-1.5 text-[10px] text-muted">
          {who.length > 0
            ? `students: ${who.map((r) => r.name).join(", ")}`
            : selected === 0
              ? "meta / directory page"
              : selected === 4
                ? "index leaf"
                : "no sample rows"}
        </p>
      </div>
    </div>
  );
});

/**
 * Innovative slide-3 hero: bustub.db as a film-strip of 8 KB pages
 * with seek needle, address math, and DiskManager I/O semantics.
 */
export const PageArrayHeroNode = memo(function PageArrayHeroNode({
  data,
}: NodeProps<PageArrayHeroNode>) {
  const selected = data.selectedPageId;
  const start = selected * 8192;
  const end = start + 8191;
  // Needle position under selected cell (5 pages + ellipsis ≈ 5.4 slots)
  const needlePct = ((selected + 0.5) / 5.4) * 100;

  return (
    <div
      className={cn(
        "w-[min(560px,92vw)] overflow-hidden rounded-[var(--radius-lg)] border bg-surface sm:w-[600px]",
        data.active ? "border-accent" : "border-border",
      )}
    >
      <Handle type="source" position={Position.Right} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Bottom} id="down" className="!bg-accent !border-border" />
      <Handle type="target" position={Position.Left} className="!bg-accent !border-border" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-accent !border-border" />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-3 py-2.5 sm:px-4">
        <div>
          <p className="text-eyebrow">File layout · bustub.db</p>
          <p className="mt-1 font-mono text-base font-semibold text-foreground sm:text-lg">
            One file · many fixed pages
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            Not a blob of rows — a contiguous array of 8&nbsp;KB blocks
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border bg-stage px-2.5 py-1.5 text-right">
          <p className="font-mono text-[9px] uppercase tracking-wider text-subtle">
            BUSTUB_PAGE_SIZE
          </p>
          <p className="font-mono text-sm font-semibold text-accent">8192 B</p>
        </div>
      </div>

      <div className="bg-stage p-3 sm:p-4">
        {/* Film-strip page array */}
        <div className="relative">
          {/* Top sprocket / file spine */}
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-[var(--radius-sm)] border border-border bg-surface px-1.5 py-0.5 font-mono text-[9px] text-muted">
              byte 0
            </span>
            <div className="h-px flex-1 bg-border-strong" />
            <span className="font-mono text-[9px] text-subtle">
              file grows →
            </span>
          </div>

          <div
            className="relative flex gap-1.5 sm:gap-2"
            role="list"
            aria-label="Pages in bustub.db"
          >
            {FILE_PAGES.map((p) => {
              const on = p.id === selected;
              const info = PAGE_META[p.id]!;
              const tint =
                info.color === "ok"
                  ? on
                    ? "border-ok bg-ok/15 shadow-[0_0_0_1px_var(--ok)]"
                    : "border-border bg-surface hover:border-ok/50"
                  : info.color === "warn"
                    ? on
                      ? "border-warn bg-warn/15 shadow-[0_0_0_1px_var(--warn)]"
                      : "border-border bg-surface hover:border-warn/40"
                    : on
                      ? "border-accent bg-accent-muted shadow-[0_0_0_1px_var(--accent)]"
                      : "border-border bg-surface hover:border-border-strong";
              return (
                <button
                  key={p.id}
                  type="button"
                  role="listitem"
                  aria-pressed={on}
                  aria-label={`Page ${p.id}, ${info.title}, offset ${p.id * 8192}`}
                  className={cn(
                    "nodrag nopan group relative flex h-[5.5rem] flex-1 flex-col items-center justify-center rounded-[var(--radius-md)] border transition-all sm:h-28",
                    tint,
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onSelectPage?.(p.id);
                  }}
                >
                  {/* Stacked depth cue */}
                  <span
                    className="pointer-events-none absolute inset-x-1 -bottom-1 h-1 rounded-b-[var(--radius-sm)] border border-t-0 border-border bg-surface/80 opacity-70"
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "font-mono text-lg font-semibold sm:text-xl",
                      on
                        ? info.color === "ok"
                          ? "text-ok"
                          : info.color === "warn"
                            ? "text-warn"
                            : "text-accent"
                        : "text-foreground",
                    )}
                  >
                    P{p.id}
                  </span>
                  <span className="mt-0.5 font-mono text-[9px] uppercase tracking-wide text-subtle">
                    {info.kind}
                  </span>
                  <span className="mt-1 font-mono text-[8px] text-muted sm:text-[9px]">
                    {p.id === 0 ? "0 B" : `${p.id * 8} KB`}
                  </span>
                  {on ? (
                    <span
                      className={cn(
                        "absolute -bottom-1.5 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r",
                        info.color === "ok"
                          ? "border-ok bg-ok/20"
                          : info.color === "warn"
                            ? "border-warn bg-warn/20"
                            : "border-accent bg-accent-muted",
                      )}
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
            <div
              className="flex h-[5.5rem] w-9 shrink-0 flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-border font-mono text-[10px] text-subtle sm:h-28 sm:w-11"
              aria-hidden
            >
              …
            </div>
          </div>

          {/* Byte ruler + seek needle */}
          <div className="relative mt-4 h-8">
            <div className="absolute inset-x-0 top-2 border-t border-border-strong" />
            {FILE_PAGES.map((p) => (
              <div
                key={p.id}
                className="absolute top-0 -translate-x-1/2"
                style={{ left: `${((p.id + 0.5) / 5.4) * 100}%` }}
              >
                <div
                  className={cn(
                    "mx-auto h-2 w-px",
                    p.id === selected ? "bg-accent" : "bg-border-strong",
                  )}
                />
                <p
                  className={cn(
                    "mt-0.5 whitespace-nowrap text-center font-mono text-[8px] sm:text-[9px]",
                    p.id === selected ? "font-semibold text-accent" : "text-subtle",
                  )}
                >
                  {p.id === 0 ? "0" : `${p.id * 8}KB`}
                </p>
              </div>
            ))}
            {/* Seek needle */}
            <div
              className="pointer-events-none absolute top-0 -translate-x-1/2 transition-[left] duration-300 ease-out"
              style={{ left: `${needlePct}%` }}
              aria-hidden
            >
              <div className="flex flex-col items-center">
                <div className="h-3 w-0.5 bg-accent" />
                <div className="rounded-full bg-accent px-1.5 py-0.5 font-mono text-[8px] font-semibold text-accent-fg shadow-sm">
                  seek
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formula + DiskManager panels */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-accent/40 bg-accent-muted/40 p-2.5 sm:p-3">
            <p className="font-mono text-[9px] uppercase tracking-wider text-subtle">
              Address formula
            </p>
            <p className="mt-1.5 font-mono text-[12px] leading-relaxed text-foreground sm:text-[13px]">
              <span className="text-muted">offset</span>
              <span className="text-subtle"> = </span>
              <span className="text-accent">page_id</span>
              <span className="text-subtle"> × </span>
              <span className="text-muted">8192</span>
            </p>
            <p className="mt-2 font-mono text-sm font-semibold text-accent sm:text-base">
              {selected} × 8192 = {start.toLocaleString()} B
            </p>
            <p className="mt-1 font-mono text-[10px] text-muted">
              bytes [{start.toLocaleString()} … {end.toLocaleString()}]
            </p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-surface p-2.5 sm:p-3">
            <p className="font-mono text-[9px] uppercase tracking-wider text-subtle">
              DiskManager · I/O unit
            </p>
            <p className="mt-1.5 font-mono text-[11px] leading-snug text-foreground sm:text-[12px]">
              ReadPage(
              <span className="text-accent">{selected}</span>)
            </p>
            <p className="mt-1 font-mono text-[10px] text-muted">
              → load whole page · never a half page / single column
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="rounded-[var(--radius-sm)] border border-ok/40 bg-ok/10 px-1.5 py-0.5 font-mono text-[9px] text-ok">
                ✓ full 8 KB
              </span>
              <span className="rounded-[var(--radius-sm)] border border-danger/30 bg-danger/10 px-1.5 py-0.5 font-mono text-[9px] text-danger">
                ✗ random byte range
              </span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center font-mono text-[9px] text-subtle">
          click P0 meta · P1–P3 heap · P4 index → open full field card →
        </p>
      </div>
    </div>
  );
});

/**
 * Full field inspector for the selected page type.
 * Swaps content for meta vs heap vs index when the learner clicks a cell.
 */
export const PageDossierCardNode = memo(function PageDossierCardNode({
  data,
}: NodeProps<PageDossierNode>) {
  const dossier = getPageDossier(data.pageId);
  const [openId, setOpenId] = useState<string | null>(
    dossier.sections[0]?.id ?? null,
  );

  // When page changes, open the first section of the new dossier.
  useEffect(() => {
    const next = getPageDossier(data.pageId);
    setOpenId(next.sections[0]?.id ?? null);
  }, [data.pageId]);

  const kindTint =
    dossier.kind === "meta"
      ? "text-accent"
      : dossier.kind === "index"
        ? "text-ok"
        : "text-warn";

  return (
    <div
      className={cn(
        "flex w-[min(340px,90vw)] flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-surface sm:w-[360px]",
        data.active ? "border-accent" : "border-border",
      )}
      style={{ maxHeight: 520 }}
    >
      <Handle type="target" position={Position.Left} className="!bg-accent !border-border" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Bottom} id="down" className="!bg-accent !border-border" />

      <div className="shrink-0 border-b border-border px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-eyebrow">Page inspector</p>
            <p className="mt-1 font-mono text-sm font-semibold text-foreground">
              P{dossier.pageId}{" "}
              <span className={cn("font-normal", kindTint)}>
                · {dossier.typeName}
              </span>
            </p>
            <p className="mt-0.5 text-[10px] text-muted">{dossier.subtitle}</p>
          </div>
          <div className="shrink-0 rounded-[var(--radius-sm)] border border-border bg-stage px-2 py-1 text-right">
            <p className="font-mono text-[8px] text-subtle">file @</p>
            <p className="font-mono text-[10px] font-semibold text-foreground">
              {dossier.fileOffset.toLocaleString()} B
            </p>
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-muted">{dossier.role}</p>
      </div>

      {/* Section chips */}
      <div className="flex shrink-0 flex-wrap gap-1 border-b border-border bg-stage px-2 py-1.5">
        {dossier.sections.map((s) => {
          const on = openId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              className={cn(
                "nodrag nopan rounded-[var(--radius-sm)] border px-1.5 py-0.5 font-mono text-[9px] transition-colors",
                on
                  ? "border-accent bg-accent-muted text-accent"
                  : "border-border text-muted hover:text-foreground",
              )}
              onClick={(e) => {
                e.stopPropagation();
                setOpenId(s.id);
              }}
            >
              {s.title}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
        {dossier.sections.map((section) => {
          const open = openId === section.id;
          if (!open) return null;
          return (
            <div key={section.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-mono text-[11px] font-semibold text-foreground">
                  {section.title}
                </p>
                {section.tag ? (
                  <span className="font-mono text-[9px] text-subtle">
                    {section.tag}
                  </span>
                ) : null}
              </div>
              <p className="text-[10px] leading-relaxed text-muted">
                {section.about}
              </p>

              <div className="overflow-hidden rounded-[var(--radius-md)] border border-border">
                {section.fields.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="border-b border-border bg-stage/40 px-2 py-1.5 last:border-0"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-[10px] text-muted">
                        {f.name}
                      </span>
                      <span className="max-w-[55%] text-right font-mono text-[10px] font-medium text-foreground">
                        {f.value}
                      </span>
                    </div>
                    <p className="mt-1 text-[9px] leading-snug text-subtle">
                      {f.why}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-border bg-accent-muted/30 px-2.5 py-2">
        <p className="font-mono text-[9px] uppercase tracking-wider text-accent">
          Remember
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-muted">
          {dossier.remember}
        </p>
      </div>
    </div>
  );
});

type Band = "header" | "slots" | "free" | "tuples";

export const PageAnatomyCardNode = memo(function PageAnatomyCardNode({
  data,
}: NodeProps<PageAnatomyNode>) {
  const pageId =
    data.pageId >= 1 && data.pageId <= 3 ? data.pageId : 1;
  const pageRows = rowsOnPage(pageId);
  const [band, setBand] = useState<Band>(data.highlightBand ?? "tuples");

  useEffect(() => {
    if (data.highlightBand) setBand(data.highlightBand);
  }, [data.highlightBand]);

  useEffect(() => {
    if (data.selectedSlot != null) setBand("tuples");
  }, [data.selectedSlot]);

  const bands: { id: Band; label: string; hint: string }[] = [
    { id: "header", label: "HEADER", hint: "8 B" },
    { id: "slots", label: "SLOTS", hint: "↓" },
    { id: "free", label: "FREE", hint: "shrink" },
    { id: "tuples", label: "TUPLES", hint: "↑" },
  ];

  const detail =
    band === "header"
      ? [
          ["next_page_id", pageId < 3 ? String(pageId + 1) : "INVALID"],
          ["num_tuples", String(Math.max(pageRows.length, 0))],
          ["num_deleted", "0"],
        ]
      : band === "slots"
        ? pageRows.map((r) => [
            `slot[${r.slot}]`,
            `off=${r.offset} · ${r.name}`,
          ])
        : band === "free"
          ? [
              ["gap", "after slots · before tuples"],
              ["INSERT", "shrinks both ways"],
            ]
          : pageRows.map((r) => [
              `T${r.slot}`,
              `(${r.id}, "${r.name}", "${r.major}")`,
            ]);

  return (
    <div
      className={cn(
        "w-[min(300px,80vw)] rounded-[var(--radius-lg)] border bg-surface sm:w-[320px]",
        data.active ? "border-accent" : "border-border",
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-accent !border-border" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Right} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Bottom} id="down" className="!bg-accent !border-border" />

      <div className="border-b border-border px-3 py-2">
        <p className="text-eyebrow">Page anatomy</p>
        <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
          P{pageId}{" "}
          <span className="font-normal text-muted">TablePage</span>
        </p>
      </div>

      <div className="grid grid-cols-[1fr_1.1fr] gap-0">
        <div className="space-y-1 border-r border-border bg-stage p-2">
          {bands.map((b) => {
            const on = band === b.id;
            return (
              <button
                key={b.id}
                type="button"
                className={cn(
                  "nodrag nopan flex w-full items-center justify-between rounded-[var(--radius-sm)] border px-2 py-1.5 font-mono text-[10px] transition-colors",
                  on
                    ? "border-accent bg-accent-muted text-accent"
                    : "border-border text-muted hover:text-foreground",
                  b.id === "free" && !on && "border-dashed",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setBand(b.id);
                }}
              >
                <span>{b.label}</span>
                <span className="text-subtle">{b.hint}</span>
              </button>
            );
          })}
        </div>
        <div className="p-2">
          <p className="font-mono text-[9px] uppercase tracking-wider text-subtle">
            {band}
          </p>
          <div className="mt-1 space-y-0.5">
            {detail.map(([k, v]) => (
              <div
                key={k}
                className={cn(
                  "rounded-[var(--radius-sm)] px-1.5 py-0.5 font-mono text-[9px]",
                  data.selectedSlot != null &&
                    (k.includes(String(data.selectedSlot)) ||
                      v.includes(
                        pageRows.find((r) => r.slot === data.selectedSlot)
                          ?.name ?? "__",
                      ))
                    ? "bg-accent-muted text-accent"
                    : "text-foreground",
                )}
              >
                <span className="text-muted">{k}</span> {v}
              </div>
            ))}
          </div>
          {pageRows.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {pageRows.map((r) => (
                <button
                  key={r.slot}
                  type="button"
                  className={cn(
                    "nodrag nopan rounded-[var(--radius-sm)] border px-1.5 py-0.5 font-mono text-[9px]",
                    data.selectedSlot === r.slot
                      ? "border-accent bg-accent-muted text-accent"
                      : "border-border text-muted",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onSelectSlot?.(r.slot);
                    setBand("tuples");
                  }}
                >
                  [{r.slot}] {r.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

export const StudentsCardNode = memo(function StudentsCardNode({
  data,
}: NodeProps<StudentsNode>) {
  return (
    <div
      className={cn(
        "w-[min(280px,80vw)] overflow-hidden rounded-[var(--radius-lg)] border bg-surface sm:w-[300px]",
        data.active ? "border-accent" : "border-border",
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-accent !border-border" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Bottom} id="down" className="!bg-accent !border-border" />

      <div className="border-b border-border px-3 py-2">
        <p className="text-eyebrow">Example table</p>
        <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
          {STUDENTS.name}
        </p>
        <p className="mt-0.5 truncate font-mono text-[9px] text-muted">
          {STUDENTS.ddl}
        </p>
      </div>
      <div className="max-h-[200px] overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-surface-raised">
            <tr className="border-b border-border">
              {["RID", "name", "P"].map((h) => (
                <th
                  key={h}
                  className="px-2 py-1 font-mono text-[8px] uppercase text-subtle"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STUDENTS.rows.map((r) => {
              const hot =
                r.pageId === data.selectedPageId &&
                (data.selectedSlot == null || data.selectedSlot === r.slot);
              const exact =
                r.pageId === data.selectedPageId &&
                data.selectedSlot === r.slot;
              return (
                <tr
                  key={r.id}
                  className={cn(
                    "nodrag nopan cursor-pointer border-b border-border last:border-0",
                    exact
                      ? "bg-accent-muted"
                      : hot
                        ? "bg-accent-muted/40"
                        : "hover:bg-stage",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onSelectRow?.(r);
                  }}
                >
                  <td className="px-2 py-1 font-mono text-[10px] text-accent">
                    ({r.pageId},{r.slot})
                  </td>
                  <td className="px-2 py-1 font-mono text-[10px] text-foreground">
                    {r.name}
                  </td>
                  <td className="px-2 py-1 font-mono text-[10px] text-muted">
                    {r.pageId}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border px-2 py-1.5 text-[9px] text-muted">
        Click row → page + slot
      </p>
    </div>
  );
});

export const PageCardNode = memo(function PageCardNode({
  data,
}: NodeProps<PageNode>) {
  return (
    <div
      className={cn(
        "w-[200px] rounded-[var(--radius-lg)] border bg-surface p-2.5",
        data.active
          ? "border-accent shadow-[0_0_0_1px_var(--accent)]"
          : "border-border",
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !bg-accent" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !bg-accent" />
      <Handle type="target" position={Position.Top} id="top" className="!h-2 !w-2 !bg-accent" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!h-2 !w-2 !bg-accent" />
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-sm font-semibold text-foreground">
          P{data.pageId}
        </p>
        <p className="text-eyebrow !normal-case !tracking-normal">{data.kind}</p>
      </div>
      <p className="mt-0.5 font-mono text-[10px] text-accent">{data.label}</p>
      <div className="mt-2">
        <FieldTable fields={data.fields} />
      </div>
    </div>
  );
});

export const FrameCardNode = memo(function FrameCardNode({
  data,
}: NodeProps<FrameNode>) {
  return (
    <div
      className={cn(
        "w-[240px] rounded-[var(--radius-lg)] border bg-surface p-2.5",
        data.active ? "border-accent shadow-[0_0_0_1px_var(--accent)]" : "border-border",
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !bg-accent" />
      <Handle type="target" position={Position.Top} id="top" className="!h-2 !w-2 !bg-accent" />
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-sm font-semibold text-foreground">
          F{data.frameId}
        </p>
        <p className="text-eyebrow !normal-case !tracking-normal">
          {data.pageId == null ? "empty frame" : `holds P${data.pageId}`}
        </p>
      </div>
      <p className="mt-0.5 font-mono text-[10px] text-accent">FrameHeader</p>
      <p className="mt-0.5 text-[10px] leading-snug text-muted">
        RAM slot in <span className="font-mono">frames_[]</span> — not a disk page.
      </p>
      <div className="mt-2">
        <FieldTable fields={data.fields} />
      </div>
    </div>
  );
});

export const PageTableCardNode = memo(function PageTableCardNode({
  data,
}: NodeProps<PageTableNode>) {
  return (
    <div
      className={cn(
        "w-[240px] rounded-[var(--radius-lg)] border bg-surface p-2.5",
        data.active ? "border-accent" : "border-border",
      )}
    >
      <Handle type="source" position={Position.Right} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Bottom} id="down" className="!bg-accent !border-border" />
      <p className="text-eyebrow">Page table</p>
      <p className="mt-0.5 font-mono text-[11px] text-foreground">
        unordered_map&lt;page_id_t, frame_id_t&gt;
      </p>
      <p className="mt-1 text-[10px] leading-snug text-muted">
        How we find a cached page: look up page_id, get frame_id.
      </p>
      <div className="mt-2">
        {data.entries.length === 0 ? (
          <p className="rounded-[var(--radius-sm)] border border-border px-2 py-1.5 font-mono text-[10px] text-subtle">
            empty · nothing resident
          </p>
        ) : (
          <FieldTable fields={data.entries} />
        )}
      </div>
      <p className="mt-2 font-mono text-[10px] text-muted">
        free_frames_ · {data.freeFrames}
      </p>
    </div>
  );
});

export const BpmHowCardNode = memo(function BpmHowCardNode({
  data,
}: NodeProps<BpmHowNode>) {
  return (
    <div
      className={cn(
        "w-[280px] rounded-[var(--radius-lg)] border bg-surface p-2.5",
        data.active ? "border-accent" : "border-border",
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-accent !border-border" />
      <p className="text-eyebrow">How a request works</p>
      <p className="mt-0.5 font-mono text-[11px] font-semibold text-foreground">
        {data.title}
      </p>
      <ol className="mt-2 space-y-1.5">
        {data.steps.map((s) => (
          <li
            key={s.n}
            className={cn(
              "flex gap-2 rounded-[var(--radius-sm)] border px-2 py-1.5",
              s.hot
                ? "border-accent/40 bg-accent-muted"
                : "border-border bg-stage",
            )}
          >
            <span className="font-mono text-[10px] text-accent">{s.n}</span>
            <span className="font-mono text-[10px] leading-snug text-foreground">
              {s.text}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[10px] leading-snug text-muted">
        Dirty eviction writes <span className="font-mono">data_</span> back first.
        Pin &gt; 0 blocks the replacer.
      </p>
    </div>
  );
});

export const LabelCardNode = memo(function LabelCardNode({
  data,
}: NodeProps<LabelNode>) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface/90 px-3 py-2 backdrop-blur-sm">
      <p className="font-mono text-[11px] font-medium text-foreground">
        {data.text}
      </p>
      {data.sub ? (
        <p className="mt-0.5 font-mono text-[9px] text-muted">{data.sub}</p>
      ) : null}
    </div>
  );
});

export const diskNodeTypes = {
  directory: DirectoryCardNode,
  folderTree: FolderTreeCardNode,
  dbFile: DbFileCardNode,
  pageArrayHero: PageArrayHeroNode,
  pageDossier: PageDossierCardNode,
  pageAnatomy: PageAnatomyCardNode,
  students: StudentsCardNode,
  page: PageCardNode,
  frame: FrameCardNode,
  pageTable: PageTableCardNode,
  bpmHow: BpmHowCardNode,
  label: LabelCardNode,
};
