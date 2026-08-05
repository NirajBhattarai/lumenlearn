"use client";

import { Fragment, createContext, memo, useContext } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/cn";
import {
  CACHE_STUDENTS,
  HEAP_PAGE_IDS,
  INDEX_LEAF,
  STUDENTS_DDL,
  cacheRowsOnPage,
  formatRid,
  pageKind,
  pageLabel,
  pageWho,
  WORKLOAD_PAGES,
} from "@/lib/cache-policies/sample";
import type {
  CacheFrameData,
  CacheLabelData,
  CachePageData,
  CachePolicyRailData,
  CacheQueryData,
  CacheStudentsData,
} from "./types";

export const CacheSelectContext = createContext<(pageId: number) => void>(() => undefined);

function Tuple({
  name,
  detail,
  hot,
}: {
  name: string;
  detail?: string;
  hot?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] border px-1.5 py-0.5 font-mono leading-tight",
        hot
          ? "border-accent bg-accent-muted text-accent"
          : "border-border bg-stage text-foreground",
      )}
    >
      <p className="truncate text-[10px] font-semibold">{name}</p>
      {detail ? <p className="truncate text-[8px] text-muted">{detail}</p> : null}
    </div>
  );
}

export const CacheStudentsNode = memo(function CacheStudentsNode({
  data,
}: NodeProps<Node<CacheStudentsData, "students">>) {
  const onSelectPage = useContext(CacheSelectContext);
  const focus = new Set(data.focusRowIds);
  return (
    <div className="w-[460px] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-stage)]">
      <Handle type="target" position={Position.Top} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Right} className="!bg-accent !border-border" />
      <div className="border-b border-border px-2.5 py-2">
        <p className="text-eyebrow">Heap table · {CACHE_STUDENTS.length} rows</p>
        <p className="font-mono text-sm font-semibold text-foreground">students</p>
        <p className="truncate font-mono text-[9px] text-muted">{STUDENTS_DDL}</p>
      </div>
      <div className="max-h-[340px] overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-[1] bg-surface-raised">
            <tr className="border-b border-border">
              {["id", "name", "major", "yr", "RID = (page, slot)", "cache"].map((h) => (
                <th
                  key={h}
                  className="px-1.5 py-1 font-mono text-[8px] uppercase tracking-wider text-subtle"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HEAP_PAGE_IDS.map((pid) => {
              const rows = cacheRowsOnPage(pid);
              const fid = data.frameOf[pid];
              const leaving = data.victimPage === pid;
              const arriving = data.loadingPage === pid;
              const pageHot = data.focusPageId === pid;
              return (
                <Fragment key={pid}>
                  <tr className="border-b border-border bg-stage/90">
                    <td colSpan={6} className="px-1.5 py-1">
                      <button
                        type="button"
                        onClick={() => onSelectPage(pid)}
                        className={cn(
                          "nodrag nopan inline-flex items-center gap-2 rounded-[var(--radius-sm)] border px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                          arriving && "border-accent bg-accent text-accent-fg",
                          leaving && "border-danger text-danger",
                          pageHot && !arriving && !leaving && "border-accent text-accent",
                          !pageHot && !arriving && !leaving && "border-border text-muted",
                        )}
                      >
                        {pageLabel(pid)} heap
                        <span className="font-normal text-subtle">
                          {rows.length} rows
                          {fid != null ? ` · frame ${fid}` : " · on disk"}
                          {leaving ? " · detaching" : ""}
                          {arriving ? " · loading" : ""}
                        </span>
                      </button>
                    </td>
                  </tr>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className={cn(
                        "border-b border-border last:border-0",
                        focus.has(r.id) && "bg-accent-muted",
                        !focus.has(r.id) && pageHot && "bg-accent-muted/25",
                        leaving && "bg-danger/10",
                      )}
                    >
                      <td className="px-1.5 py-1 font-mono text-[10px] font-semibold text-foreground">
                        {r.id}
                      </td>
                      <td className="px-1.5 py-1 font-mono text-[10px] text-foreground">{r.name}</td>
                      <td className="px-1.5 py-1 font-mono text-[10px] text-muted">{r.major}</td>
                      <td className="px-1.5 py-1 font-mono text-[10px] text-subtle">{r.year}</td>
                      <td className="px-1.5 py-1 font-mono text-[10px] text-accent">
                        {formatRid(r.pageId, r.slot)}
                      </td>
                      <td className="px-1.5 py-1 font-mono text-[10px]">
                        {leaving ? (
                          <span className="text-danger">out</span>
                        ) : arriving ? (
                          <span className="text-accent">in</span>
                        ) : fid != null ? (
                          <span className="text-ok">F{fid}</span>
                        ) : (
                          <span className="text-subtle">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="space-y-1 border-t border-border px-2.5 py-2 text-[10px] leading-snug text-muted">
        <p>
          <span className="font-mono text-foreground">id</span> is the student key.{" "}
          <span className="font-mono text-accent">RID (P1, slot 0)</span> is where that row
          lives: page 1, first slot — Ada.
        </p>
        <p>
          Index page P4 only stores <span className="font-mono">id → RID</span>. The heap page
          holds name / major / GPA.
        </p>
        <div className="flex flex-wrap gap-1 pt-0.5">
          {WORKLOAD_PAGES.filter((p) => p.id >= 4).map((p) => {
            const fid = data.frameOf[p.id];
            const hot = data.focusPageId === p.id;
            const leaving = data.victimPage === p.id;
            const arriving = data.loadingPage === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPage(p.id)}
                className={cn(
                  "nodrag nopan rounded-[var(--radius-sm)] border px-1.5 py-0.5 text-left font-mono text-[9px]",
                  arriving && "border-accent bg-accent text-accent-fg",
                  leaving && "border-danger text-danger",
                  hot && !arriving && !leaving && "border-accent text-accent",
                  !hot && !arriving && !leaving && "border-border text-muted",
                )}
              >
                {p.label} {p.who}
                <span className="ml-1 text-subtle">{fid != null ? `F${fid}` : ""}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export const CachePageNode = memo(function CachePageNode({
  data,
}: NodeProps<Node<CachePageData, "page">>) {
  const onSelect = useContext(CacheSelectContext);
  const kind = pageKind(data.pageId);
  const rows = cacheRowsOnPage(data.pageId);
  const hot = new Set(data.hotRowIds);
  return (
    <div
      className={cn(
        "w-[200px] rounded-[var(--radius-lg)] border bg-surface p-2 shadow-[var(--shadow-stage)]",
        data.loading && "border-accent",
        data.leaving && "border-danger",
        data.requesting && !data.loading && !data.leaving && "border-accent",
        data.resident && !data.requesting && !data.leaving && "border-ok/50",
        !data.resident && !data.requesting && !data.leaving && !data.loading && "border-border",
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Right} className="!bg-accent !border-border" />
      <button
        type="button"
        onClick={() => onSelect(data.pageId)}
        className="nodrag nopan w-full text-left"
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold text-foreground">
            {pageLabel(data.pageId)}
          </span>
          <span className="font-mono text-[8px] uppercase text-subtle">
            {kind === "index" ? "index leaf" : kind === "heap" ? "heap" : "scan"}
          </span>
        </div>
        {kind === "index" ? (
          <>
            <p className="mb-1 text-[9px] leading-snug text-muted">
              id → RID. Example: 1 → (P1, slot 0) is Ada.
            </p>
            <div className="max-h-[148px] space-y-0.5 overflow-auto">
              {INDEX_LEAF.map((e) => (
                <Tuple
                  key={e.key}
                  name={`${e.key} → ${e.name}`}
                  detail={`RID ${formatRid(e.pageId, e.slot)}`}
                  hot={hot.has(e.key)}
                />
              ))}
            </div>
          </>
        ) : rows.length > 0 ? (
          <div className="space-y-0.5">
            {rows.map((r) => (
              <Tuple
                key={r.id}
                name={`${r.name}  id=${r.id}`}
                detail={`${r.major} · slot ${r.slot} · gpa ${r.gpa}`}
                hot={hot.has(r.id)}
              />
            ))}
          </div>
        ) : (
          <p className="py-2 text-center font-mono text-[9px] text-subtle">scan leftover</p>
        )}
        <p className="mt-1 font-mono text-[8px] text-muted">
          {data.resident ? "8 KB copy in pool" : "on disk"}
        </p>
      </button>
    </div>
  );
});

export const CacheFrameNode = memo(function CacheFrameNode({
  data,
}: NodeProps<Node<CacheFrameData, "frame">>) {
  const { frame } = data;
  const rows = frame.pageId != null ? cacheRowsOnPage(frame.pageId) : [];
  const kind = frame.pageId != null ? pageKind(frame.pageId) : null;
  const hot = new Set(data.hotRowIds);
  return (
    <div
      className={cn(
        "w-[168px] min-h-[118px] rounded-[var(--radius-lg)] border-2 bg-stage p-2",
        data.isTarget && "border-accent bg-accent-muted/30",
        data.isVictim && "border-danger bg-danger/10",
        data.hand && "ring-2 ring-accent ring-offset-2 ring-offset-stage",
        !data.isTarget && !data.isVictim && "border-border",
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-accent !border-border" />
      <Handle type="source" position={Position.Bottom} className="!bg-border !border-border" />
      <div className="mb-1 flex items-center justify-between font-mono text-[8px] uppercase tracking-wider text-subtle">
        <span>frame {frame.frameId}</span>
        <span className="normal-case text-muted">
          {data.hand ? "hand " : ""}
          {frame.list ?? ""}
          {frame.ref != null && frame.pageId != null ? ` r${frame.ref ? 1 : 0}` : ""}
        </span>
      </div>
      {frame.pageId == null ? (
        <p className="flex h-16 items-center justify-center font-mono text-[11px] text-subtle">
          empty
        </p>
      ) : (
        <div className="space-y-0.5">
          <p className="font-mono text-[11px] font-semibold text-foreground">
            {pageLabel(frame.pageId)}
          </p>
          {kind === "index"
            ? INDEX_LEAF.slice(0, 3).map((e) => (
                <Tuple
                  key={e.key}
                  name={`${e.key} → ${e.name}`}
                  detail={formatRid(e.pageId, e.slot)}
                  hot={hot.has(e.key)}
                />
              ))
            : rows.slice(0, 4).map((r) => (
                <Tuple
                  key={r.id}
                  name={r.name}
                  detail={`id ${r.id} · slot ${r.slot}`}
                  hot={hot.has(r.id)}
                />
              ))}
        </div>
      )}
    </div>
  );
});

export const CacheQueryNode = memo(function CacheQueryNode({
  data,
}: NodeProps<Node<CacheQueryData, "query">>) {
  const tone =
    data.beat === "decide" && data.hit
      ? "ok"
      : data.beat === "decide" || data.beat === "evict"
        ? "danger"
        : "accent";
  return (
    <div className="w-[460px] rounded-[var(--radius-lg)] border border-border bg-surface p-2.5 shadow-[var(--shadow-stage)]">
      <Handle type="source" position={Position.Bottom} className="!bg-accent !border-border" />
      <p className="text-eyebrow">Executor query</p>
      <p className="mt-1 font-mono text-[11px] leading-snug text-foreground">{data.sql}</p>
      <p className="mt-1 text-[10px] text-muted">{data.why}</p>
      {data.ridNote ? (
        <p className="mt-1.5 rounded-[var(--radius-sm)] border border-border bg-stage px-2 py-1.5 text-[10px] leading-snug text-foreground">
          {data.ridNote}
        </p>
      ) : null}
      <p
        className={cn(
          "mt-1.5 font-mono text-[10px] font-semibold",
          tone === "ok" && "text-ok",
          tone === "danger" && "text-danger",
          tone === "accent" && "text-accent",
        )}
      >
        fetch {pageLabel(data.pageId)}
      </p>
    </div>
  );
});

export const CacheLabelNode = memo(function CacheLabelNode({
  data,
}: NodeProps<Node<CacheLabelData, "label">>) {
  return (
    <div className="pointer-events-none w-[240px]">
      <p className="text-eyebrow">{data.text}</p>
      {data.hint ? <p className="mt-0.5 text-[10px] text-muted">{data.hint}</p> : null}
    </div>
  );
});

function shortWho(pageId: number): string {
  const who = pageWho(pageId);
  if (who.includes("index") || who.includes("RID")) return "index";
  if (who.includes("scan")) return "scan";
  return who.split(",")[0]?.trim() ?? "";
}

export const CachePolicyRailNode = memo(function CachePolicyRailNode({
  data,
}: NodeProps<Node<CachePolicyRailData, "policy">>) {
  const onSelectPage = useContext(CacheSelectContext);
  return (
    <div className="w-[420px] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-stage)]">
      <Handle type="target" position={Position.Top} className="!bg-accent !border-border" />
      <div className="border-b border-border px-3 py-2.5">
        <p className="text-eyebrow">Replacement structure</p>
        <p className="font-mono text-sm font-semibold text-foreground">{data.title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-muted">{data.subtitle}</p>
      </div>

      {data.lanes.map((lane) => (
        <div key={lane.id} className="border-b border-border px-3 py-2.5 last:border-b-0">
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-subtle">
              {lane.title}
            </p>
            {lane.ghost ? (
              <p className="font-mono text-[9px] text-subtle">ghost · no frame</p>
            ) : null}
          </div>

          <div className="flex items-stretch gap-2">
            <p className="w-11 shrink-0 self-center text-[9px] leading-tight text-muted">
              {lane.leftLabel}
            </p>
            <div
              className={cn(
                "flex min-h-[58px] min-w-0 flex-1 items-center gap-1 rounded-[var(--radius-md)] border bg-stage px-1.5 py-1.5",
                lane.ghost ? "border-dashed border-border-strong" : "border-border",
              )}
            >
              {lane.kind === "clock" && lane.clockSlots ? (
                lane.clockSlots.map((slot) => (
                  <button
                    key={slot.frameId}
                    type="button"
                    disabled={slot.pageId == null}
                    onClick={() => {
                      if (slot.pageId != null) onSelectPage(slot.pageId);
                    }}
                    className={cn(
                      "nodrag nopan flex h-[46px] min-w-0 flex-1 flex-col items-center justify-center rounded-[var(--radius-sm)] border font-mono",
                      slot.hand && "ring-2 ring-accent ring-offset-1 ring-offset-stage",
                      slot.pageId != null && data.victimPage === slot.pageId && "border-danger text-danger",
                      slot.pageId != null &&
                        data.activePage === slot.pageId &&
                        data.victimPage !== slot.pageId &&
                        "border-accent bg-accent-muted text-accent",
                      slot.pageId != null &&
                        data.activePage !== slot.pageId &&
                        data.victimPage !== slot.pageId &&
                        "border-border text-foreground",
                      slot.pageId == null && "border-border text-subtle",
                    )}
                  >
                    <span className="text-[10px] font-semibold">
                      {slot.pageId == null ? "·" : pageLabel(slot.pageId)}
                    </span>
                    <span className="text-[8px] text-muted">
                      F{slot.frameId} r{slot.ref ? 1 : 0}
                      {slot.hand ? " hand" : ""}
                    </span>
                  </button>
                ))
              ) : lane.pages.length === 0 ? (
                <p className="w-full px-1 text-center text-[10px] leading-snug text-subtle">
                  {lane.emptyHint}
                </p>
              ) : (
                lane.pages.map((pid, i) => {
                  const last = i === lane.pages.length - 1;
                  const first = i === 0;
                  const victim = data.victimPage === pid;
                  const active = data.activePage === pid;
                  return (
                    <div key={`${lane.id}-${pid}`} className="flex min-w-0 flex-1 items-center gap-1">
                      {i > 0 ? (
                        <span className="shrink-0 font-mono text-[10px] text-subtle" aria-hidden>
                          →
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onSelectPage(pid)}
                        className={cn(
                          "nodrag nopan flex h-[46px] w-full min-w-[48px] flex-col items-center justify-center rounded-[var(--radius-sm)] border px-1 font-mono",
                          lane.ghost && "border-dashed border-border-strong text-subtle",
                          !lane.ghost && victim && "border-danger bg-danger/10 text-danger",
                          !lane.ghost && active && !victim && "border-accent bg-accent-muted text-accent",
                          !lane.ghost && !active && !victim && "border-border bg-surface text-foreground",
                        )}
                      >
                        <span className="text-[11px] font-semibold">{pageLabel(pid)}</span>
                        <span className="truncate text-[8px] text-muted">{shortWho(pid)}</span>
                        {first && last && (lane.leftTag || lane.rightTag) ? (
                          <span className="text-[8px] uppercase tracking-wide text-subtle">
                            {[lane.leftTag, lane.rightTag].filter(Boolean).join(" · ")}
                          </span>
                        ) : first && lane.leftTag ? (
                          <span className="text-[8px] uppercase tracking-wide text-subtle">
                            {lane.leftTag}
                          </span>
                        ) : last && lane.rightTag ? (
                          <span className="text-[8px] uppercase tracking-wide text-subtle">
                            {lane.rightTag}
                          </span>
                        ) : (
                          <span className="h-[10px]" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <p className="w-11 shrink-0 self-center text-right text-[9px] leading-tight text-muted">
              {lane.rightLabel}
            </p>
          </div>
        </div>
      ))}

      {data.targetP != null ? (
        <p className="border-b border-border px-3 py-2 font-mono text-[11px] text-accent">
          target p = {data.targetP}
        </p>
      ) : null}

      {data.note ? (
        <p className="px-3 py-2 text-[10px] leading-snug text-muted">{data.note}</p>
      ) : null}
    </div>
  );
});

export const cacheNodeTypes = {
  students: CacheStudentsNode,
  page: CachePageNode,
  frame: CacheFrameNode,
  query: CacheQueryNode,
  label: CacheLabelNode,
  policy: CachePolicyRailNode,
};
