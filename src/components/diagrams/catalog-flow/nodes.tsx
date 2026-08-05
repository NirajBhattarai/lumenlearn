"use client";

import { createContext, memo, useContext, type ReactNode } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/cn";
import {
  HEADER_BYTES,
  PAGE_CAP,
  PAGE_SIZE,
  formatRid,
  pageHeaderHex,
  pageHexLines,
  pageLayout,
  type HeapPage,
} from "@/lib/table-catalog/engine";
import type {
  AnatomyNodeData,
  BpmNodeData,
  CatalogNodeData,
  CompareNodeData,
  DbFileNodeData,
  DiskMapNodeData,
  HeapNodeData,
  LabelNodeData,
  SchedulerNodeData,
  SqlNodeData,
} from "./types";

export const CatalogSelectContext = createContext<(pageId: number | null) => void>(
  () => undefined,
);

function Card({
  children,
  active,
  className,
  width,
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
  width: number;
}) {
  return (
    <div
      style={{ width }}
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border bg-surface shadow-[var(--shadow-stage)]",
        active ? "border-accent ring-1 ring-accent/40" : "border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Head({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="border-b border-border px-2.5 py-2">
      <p className="text-eyebrow text-subtle">{kicker}</p>
      <p className="font-mono text-sm font-semibold text-foreground">{title}</p>
    </div>
  );
}

function PageStrip({
  page,
  compact,
}: {
  page: HeapPage;
  compact?: boolean;
}) {
  const layout = pageLayout(page);
  const total = PAGE_SIZE;
  const w = (n: number) => `${Math.max(2.2, (n / total) * 100)}%`;
  return (
    <div className={cn("overflow-hidden rounded-sm border border-border", compact ? "h-2.5" : "h-4")}>
      <div className="flex h-full w-full">
        <div className="bg-accent" style={{ width: w(layout.header) }} title={`header ${HEADER_BYTES}B`} />
        <div className="bg-ok" style={{ width: w(Math.max(layout.slots, 1)) }} title="slot directory" />
        <div className="bg-border-strong/80" style={{ width: w(layout.free) }} title={`free ${layout.free}B`} />
        <div className="bg-warn" style={{ width: w(Math.max(layout.tuples, 1)) }} title="tuples from the end" />
      </div>
    </div>
  );
}

export const SqlNode = memo(function SqlNode({ data }: NodeProps<Node<SqlNodeData, "sql">>) {
  return (
    <Card active={data.beat === "sql"} width={440}>
      <Handle type="source" position={Position.Bottom} className="!bg-accent !border-border" />
      <Head kicker="SQL · executor" title="command" />
      <div className="space-y-2 px-2.5 py-2">
        <p className="font-mono text-[12px] leading-snug text-foreground">{data.sql || "—"}</p>
        {data.packet ? (
          <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent-muted px-2 py-1 font-mono text-[10px] text-accent">
            {data.packet}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          {data.rid ? (
            <span className="rounded-[var(--radius-sm)] border border-ok/40 bg-stage px-1.5 py-0.5 font-mono text-[10px] text-ok">
              RID {formatRid(data.rid)}
            </span>
          ) : null}
          {data.cacheHit === true ? (
            <span className="rounded-[var(--radius-sm)] border border-ok/40 px-1.5 py-0.5 font-mono text-[10px] text-ok">
              cache HIT
            </span>
          ) : null}
          {data.cacheHit === false ? (
            <span className="rounded-[var(--radius-sm)] border border-danger/40 px-1.5 py-0.5 font-mono text-[10px] text-danger">
              cache MISS
            </span>
          ) : null}
          {data.scanNames && data.scanNames.length > 0 ? (
            <span className="rounded-[var(--radius-sm)] border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted">
              {data.scanNames.join(" · ")}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );
});

export const CatalogNode = memo(function CatalogNode({
  data,
}: NodeProps<Node<CatalogNodeData, "catalog">>) {
  return (
    <Card active={data.beat === "catalog"} width={440}>
      <Handle type="target" position={Position.Top} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-accent !border-border" />
      <Head kicker="Catalog · RAM only" title="table_names_ → TableInfo" />
      <div className="px-2 py-2">
        {data.orphaned ? (
          <p className="mb-2 rounded-[var(--radius-sm)] border border-warn/40 bg-warn/10 px-2 py-1 text-[10px] text-warn">
            Restart wiped this map. File bytes are orphaned — Postgres would reload pg_class.
          </p>
        ) : null}
        {data.rows.length === 0 ? (
          <p className="py-4 text-center text-xs text-subtle">empty — click Create users</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-subtle">
                {["name", "oid", "first", "last", "schema"].map((h) => (
                  <th key={h} className="px-1 py-1 font-mono text-[9px] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const hot = data.highlightTable === r.name;
                return (
                  <tr
                    key={r.name}
                    className={cn("border-b border-border/70 last:border-0", hot && "bg-accent-muted")}
                  >
                    <td className="px-1 py-1.5 font-mono text-[11px] font-semibold">{r.name}</td>
                    <td className="px-1 py-1.5 font-mono text-[11px]">{r.oid}</td>
                    <td className="px-1 py-1.5 font-mono text-[11px]">
                      {r.firstPageId < 0 ? "—" : `P${r.firstPageId}`}
                    </td>
                    <td className="px-1 py-1.5 font-mono text-[11px]">
                      {r.lastPageId < 0 ? "—" : `P${r.lastPageId}`}
                    </td>
                    <td className="px-1 py-1.5 font-mono text-[9px] text-muted">{r.schema}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
});

export const HeapNode = memo(function HeapNode({ data }: NodeProps<Node<HeapNodeData, "heap">>) {
  const onSelect = useContext(CatalogSelectContext);
  const tables = data.catalog.filter((r) => r.firstPageId >= 0);
  return (
    <Card active={Boolean(data.highlightTable)} width={440}>
      <Handle type="target" position={Position.Top} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Right} className="!bg-accent !border-border" />
      <Head kicker="TableHeap" title="first_page → next_page_id → INVALID" />
      <div className="space-y-2 px-2.5 py-2">
        {tables.length === 0 ? (
          <p className="py-3 text-center text-xs text-subtle">no heaps yet</p>
        ) : (
          tables.map((row) => {
            const hot = data.highlightTable === row.name;
            const chain: number[] = [];
            let pid: number | null = row.firstPageId;
            const seen = new Set<number>();
            while (pid != null && !seen.has(pid)) {
              seen.add(pid);
              chain.push(pid);
              pid = data.heaps[pid]?.nextPageId ?? null;
            }
            return (
              <div
                key={row.name}
                className={cn(
                  "rounded-[var(--radius-sm)] border p-2",
                  hot ? "border-accent/50 bg-accent-muted/40" : "border-border",
                )}
              >
                <p className="mb-1.5 font-mono text-[10px] text-muted">{row.name}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {chain.map((id, i) => {
                    const page = data.heaps[id];
                    const pageHot = data.highlightPageId === id;
                    return (
                      <span key={id} className="flex items-center gap-1.5">
                        {i > 0 ? <span className="text-[10px] text-subtle">→</span> : null}
                        <button
                          type="button"
                          onClick={() => onSelect(id)}
                          className={cn(
                            "nodrag nopan rounded-[var(--radius-sm)] border px-1.5 py-1 font-mono text-[10px]",
                            pageHot
                              ? "border-accent bg-accent text-accent-fg"
                              : "border-border bg-stage text-foreground hover:border-accent",
                          )}
                        >
                          P{id}
                          <span className="ml-1 opacity-70">
                            {page?.tuples.length ?? 0}/{PAGE_CAP}
                          </span>
                        </button>
                      </span>
                    );
                  })}
                  <span className="font-mono text-[10px] text-subtle">→ INVALID</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
});

export const SchedulerNode = memo(function SchedulerNode({
  data,
}: NodeProps<Node<SchedulerNodeData, "scheduler">>) {
  return (
    <Card active={data.active} width={280}>
      <Handle type="target" position={Position.Left} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Right} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-accent !border-border" />
      <Head kicker="DiskScheduler" title="FIFO + promise" />
      <div className="space-y-1.5 px-2.5 py-2">
        {data.queue.length === 0 ? (
          <p className="py-3 text-center text-xs text-subtle">idle — channel empty</p>
        ) : (
          data.queue.map((r, i) => (
            <div
              key={`${r.kind}-${r.pageId}-${i}`}
              className={cn(
                "flex items-center justify-between rounded-[var(--radius-sm)] border px-2 py-1.5 font-mono text-[11px]",
                r.status === "io"
                  ? "border-accent bg-accent-muted text-accent"
                  : r.status === "done"
                    ? "border-ok/40 text-muted"
                    : "border-border",
              )}
            >
              <span>
                {r.kind.toUpperCase()} P{r.pageId}
              </span>
              <span className="text-[10px] text-subtle">
                {r.status === "io" ? "future…" : r.status}
              </span>
            </div>
          ))
        )}
        <p className="pt-1 text-[10px] leading-snug text-muted">
          one worker: dequeue → DiskManager 8 KB r/w → set_value
        </p>
      </div>
    </Card>
  );
});

export const DiskMapNode = memo(function DiskMapNode({
  data,
}: NodeProps<Node<DiskMapNodeData, "diskMap">>) {
  return (
    <Card active={data.active} width={250}>
      <Handle type="target" position={Position.Left} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Bottom} className="!bg-accent !border-border" />
      <Head kicker="DiskManager" title="pages_ → offset" />
      <div className="px-2.5 py-2">
        <p className="mb-2 font-mono text-[10px] text-muted">
          datadb.db · {data.fileBytes.toLocaleString()} B
        </p>
        {data.extents.length === 0 ? (
          <p className="py-3 text-center text-xs text-subtle">empty map</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-subtle">
                <th className="py-1 font-mono text-[9px] uppercase">page_id</th>
                <th className="py-1 font-mono text-[9px] uppercase">offset</th>
              </tr>
            </thead>
            <tbody>
              {data.extents.map((e) => (
                <tr
                  key={e.pageId}
                  className={cn(
                    "border-b border-border/60 last:border-0 font-mono text-[11px]",
                    data.highlightPageId === e.pageId && "bg-accent-muted text-accent",
                  )}
                >
                  <td className="py-1">P{e.pageId}</td>
                  <td className="py-1">{e.offset}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-2 text-[10px] text-muted">not always page_id × 8192 — allocation order</p>
      </div>
    </Card>
  );
});

export const DbFileNode = memo(function DbFileNode({
  data,
}: NodeProps<Node<DbFileNodeData, "dbFile">>) {
  const onSelect = useContext(CatalogSelectContext);
  const slots = Array.from({ length: 4 }, (_, i) => {
    const extent = data.extents[i];
    return {
      index: i,
      offset: i * PAGE_SIZE,
      extent,
      page: extent ? data.heaps[extent.pageId] : undefined,
    };
  });

  return (
    <Card active={data.active} width={580}>
      <Handle type="target" position={Position.Top} className="!bg-accent !border-border" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-accent !border-border" />
      <Head kicker="datadb.db · raw file" title="8 KB slotted pages" />
      <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-4">
        {slots.map((slot) => {
          const hot = slot.extent != null && data.highlightPageId === slot.extent.pageId;
          const inspecting = slot.extent != null && data.inspectPageId === slot.extent.pageId;
          const lines = slot.page ? pageHexLines(slot.page) : ["00 00 00 00  00 00 00 00"];
          return (
            <button
              key={slot.index}
              type="button"
              onClick={() => onSelect(slot.extent ? slot.extent.pageId : null)}
              className={cn(
                "nodrag nopan min-h-[168px] rounded-[var(--radius-md)] border p-1.5 text-left",
                hot || inspecting
                  ? "border-accent bg-accent-muted"
                  : slot.page
                    ? "border-border bg-stage hover:border-border-strong"
                    : "border-dashed border-border bg-stage/50",
              )}
            >
              <p className="font-mono text-[9px] text-subtle">off {slot.offset}</p>
              {slot.page ? (
                <>
                  <p className="mt-0.5 font-mono text-[12px] font-semibold">
                    P{slot.page.pageId}
                    <span className="ml-1 text-[10px] font-normal text-muted">
                      {data.orphaned ? "orphan" : slot.page.table}
                    </span>
                  </p>
                  <p className="mb-1 font-mono text-[9px] text-subtle">
                    next={slot.page.nextPageId == null ? "INV" : `P${slot.page.nextPageId}`}
                  </p>
                  <PageStrip page={slot.page} compact />
                  <div className="mt-1 space-y-0.5 font-mono text-[8px] leading-tight text-muted">
                    {lines.slice(0, 3).map((line) => (
                      <p key={line} className="truncate">
                        {line}
                      </p>
                    ))}
                  </div>
                  <p className="mt-1 truncate font-mono text-[9px] text-foreground">
                    {slot.page.tuples.length > 0
                      ? slot.page.tuples.map((t) => `${t.name}@${t.slot}`).join(" · ")
                      : "empty heap page"}
                  </p>
                </>
              ) : (
                <p className="mt-10 text-center text-[10px] text-subtle">free / zeros</p>
              )}
            </button>
          );
        })}
      </div>
      <p className="border-t border-border px-2.5 py-1.5 font-mono text-[9px] text-subtle">
        click a slot → slotted-page inspector · header / slots / free / tuples
      </p>
    </Card>
  );
});

export const BpmNode = memo(function BpmNode({ data }: NodeProps<Node<BpmNodeData, "bpm">>) {
  return (
    <Card active={data.active} width={280}>
      <Handle type="target" position={Position.Top} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Right} className="!bg-accent !border-border" />
      <Head kicker="Buffer pool" title="BPM frames" />
      <div className="grid grid-cols-2 gap-1.5 p-2">
        {data.frames.map((f) => {
          const hot = f.pageId != null && f.pageId === data.highlightPageId;
          return (
            <div
              key={f.frameId}
              className={cn(
                "flex min-h-[64px] flex-col items-center justify-center rounded-[var(--radius-sm)] border",
                hot ? "border-accent bg-accent-muted" : "border-border bg-stage",
              )}
            >
              <span className="font-mono text-[9px] text-subtle">F{f.frameId}</span>
              <span className="font-mono text-[12px] font-semibold">
                {f.pageId == null ? "empty" : `P${f.pageId}`}
              </span>
              <span className="mt-0.5 flex gap-1 font-mono text-[8px]">
                {f.pinned ? <span className="text-ok">pin</span> : null}
                {f.dirty ? <span className="text-warn">dirty</span> : null}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
});

export const AnatomyNode = memo(function AnatomyNode({
  data,
}: NodeProps<Node<AnatomyNodeData, "anatomy">>) {
  const onSelect = useContext(CatalogSelectContext);
  const layout = pageLayout(data.page);
  return (
    <Card active width={580}>
      <Handle type="target" position={Position.Top} className="!bg-accent !border-border" />
      <div className="flex items-start justify-between border-b border-border px-2.5 py-2">
        <div>
          <p className="text-eyebrow text-subtle">TablePage · BusTub header</p>
          <p className="font-mono text-sm font-semibold">
            P{data.page.pageId} @ byte {data.offset}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="nodrag nopan rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted hover:text-foreground"
        >
          close
        </button>
      </div>
      <div className="space-y-2 p-2.5">
        <PageStrip page={data.page} />
        <div className="grid grid-cols-4 gap-1 font-mono text-[9px]">
          <span className="text-accent">hdr {layout.header}B</span>
          <span className="text-ok">slots {layout.slots}B</span>
          <span className="text-muted">free {layout.free}B</span>
          <span className="text-warn">tuples {layout.tuples}B</span>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-border bg-stage px-2 py-1.5 font-mono text-[10px] text-muted">
          next_page_id(4) · num_tuples(2) · num_deleted(2) = {pageHeaderHex(data.page)}
        </div>
        {data.page.tuples.length === 0 ? (
          <p className="text-[11px] text-subtle">No tuples. Slot directory is empty; free space is almost the whole page.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-subtle">
                {["slot", "RID", "off", "size", "row"].map((h) => (
                  <th key={h} className="py-1 font-mono text-[9px] uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.page.tuples.map((t) => (
                <tr key={t.slot} className="border-b border-border/60 font-mono text-[11px] last:border-0">
                  <td className="py-1">{t.slot}</td>
                  <td className="py-1 text-ok">{formatRid({ pageId: data.page.pageId, slot: t.slot })}</td>
                  <td className="py-1">{t.offset}</td>
                  <td className="py-1">{t.size}</td>
                  <td className="py-1">
                    {t.name}{" "}
                    <span className="text-[9px] text-muted">{t.hex}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-[10px] leading-snug text-muted">
          Same idea as Postgres 8 KB pages: header + line pointers grow down, tuples grow up, free space in the middle.
          BusTub&apos;s TablePage is the teaching-sized version.
        </p>
      </div>
    </Card>
  );
});

export const CompareNode = memo(function CompareNode({
  data,
}: NodeProps<Node<CompareNodeData, "compare">>) {
  return (
    <Card width={440} active={data.orphaned}>
      <Head kicker="Why restart hurts here" title="BusTub vs Postgres catalog" />
      <div className="p-2">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-border text-subtle">
              <th className="py-1 pr-2 font-mono text-[9px] uppercase"> </th>
              <th className="py-1 pr-2 font-mono text-[9px] uppercase">BusTub</th>
              <th className="py-1 font-mono text-[9px] uppercase">Postgres</th>
            </tr>
          </thead>
          <tbody className="text-muted">
            <tr className="border-b border-border/70">
              <td className="py-1.5 pr-2 font-mono text-foreground">catalog</td>
              <td className="py-1.5 pr-2">RAM table_names_</td>
              <td className="py-1.5">pg_class on disk</td>
            </tr>
            <tr className="border-b border-border/70">
              <td className="py-1.5 pr-2 font-mono text-foreground">file</td>
              <td className="py-1.5 pr-2">one datadb.db</td>
              <td className="py-1.5">base/OID/relfilenode</td>
            </tr>
            <tr className="border-b border-border/70">
              <td className="py-1.5 pr-2 font-mono text-foreground">page id</td>
              <td className="py-1.5 pr-2">pages_ map (RAM)</td>
              <td className="py-1.5">block # in that file</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-2 font-mono text-foreground">restart</td>
              <td className="py-1.5 pr-2 text-warn">names forgotten</td>
              <td className="py-1.5 text-ok">survives</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
});

export const LabelNode = memo(function LabelNode({
  data,
}: NodeProps<Node<LabelNodeData, "label">>) {
  return (
    <div className="pointer-events-none w-[200px]">
      <p className="text-eyebrow text-subtle">{data.text}</p>
      {data.hint ? <p className="mt-0.5 text-[10px] text-muted">{data.hint}</p> : null}
    </div>
  );
});

export const catalogNodeTypes = {
  sql: SqlNode,
  catalog: CatalogNode,
  heap: HeapNode,
  scheduler: SchedulerNode,
  diskMap: DiskMapNode,
  dbFile: DbFileNode,
  bpm: BpmNode,
  anatomy: AnatomyNode,
  compare: CompareNode,
  label: LabelNode,
};
