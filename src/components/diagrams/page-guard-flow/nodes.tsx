"use client";

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/cn";
import { hexOff, TUPLE_BYTES, type PageSlot } from "@/lib/page-guard/story";
import type {
  BpmHubNodeData,
  FlowBadgeNodeData,
  LabelNodeData,
  QueryNodeData,
  ThreadNodeData,
  VerticalPageNodeData,
} from "./types";

function tupleHex(slot: PageSlot): string {
  const id = slot.row.id.toString(16).padStart(2, "0");
  const nlen = slot.row.name.length.toString(16).padStart(2, "0");
  const name = [...slot.row.name]
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join(" ");
  const score = slot.row.score.toString(16).padStart(2, "0");
  return `${id} 00 00 00  ${nlen} ${name}  ${score} 00 00 00`.toUpperCase();
}

function SlotRow({ slot, compact }: { slot: PageSlot; compact?: boolean }) {
  return (
    <div
      className={cn(
        "grid items-center gap-1 rounded-[3px] border px-1.5 py-0.5 font-mono",
        compact ? "grid-cols-[18px_1fr] text-[8px]" : "grid-cols-[22px_56px_1fr] text-[10px]",
        slot.fresh
          ? "border-ok/60 bg-ok/15 text-ok"
          : slot.hot
            ? "border-accent bg-accent-muted text-accent"
            : "border-border/80 bg-stage text-foreground",
      )}
    >
      <span className="text-subtle">[{slot.slot}]</span>
      {compact ? null : <span className="text-muted">{hexOff(slot.offset)}</span>}
      <span className="truncate font-semibold">
        {slot.row.name}
        {slot.fresh ? " +" : ""}
      </span>
    </div>
  );
}

function TupleCard({ slot, compact }: { slot: PageSlot; compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[4px] border px-1.5 py-1 font-mono",
        slot.fresh
          ? "border-ok/70 bg-ok/15"
          : slot.hot
            ? "border-accent bg-accent-muted"
            : "border-border bg-stage",
      )}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span
          className={cn(
            "font-semibold",
            compact ? "text-[10px]" : "text-[12px]",
            slot.fresh ? "text-ok" : slot.hot ? "text-accent" : "text-foreground",
          )}
        >
          {slot.row.name}
        </span>
        <span className={cn("tabular-nums", compact ? "text-[10px]" : "text-[12px]")}>
          {slot.row.score}
        </span>
      </div>
      {compact ? null : (
        <>
          <p className="mt-0.5 text-[9px] text-muted">
            RID({slot.row.pageId},{slot.slot}) · off {hexOff(slot.offset)} · {TUPLE_BYTES}B
          </p>
          <p className="mt-0.5 truncate text-[8px] leading-tight text-subtle">{tupleHex(slot)}</p>
        </>
      )}
    </div>
  );
}

export const QueryNode = memo(function QueryNode({
  data,
}: NodeProps<Node<QueryNodeData, "query">>) {
  return (
    <div className="w-[900px] rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-3 shadow-[var(--shadow-stage)]">
      <Handle type="source" position={Position.Bottom} className="!border-border !bg-accent" />
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-eyebrow">01 · SQL arrives</p>
          <p className="mt-1 text-[15px] font-medium tracking-tight text-foreground">{data.kid}</p>
          <p className="mt-1 max-w-[40rem] text-[12px] leading-relaxed text-muted">{data.why}</p>
        </div>
        {data.sql ? (
          <p className="max-w-[22rem] shrink-0 rounded-[var(--radius-sm)] border border-border bg-stage px-2.5 py-2 font-mono text-[11px] leading-snug text-foreground">
            {data.sql}
          </p>
        ) : null}
      </div>
    </div>
  );
});

export const BpmHubNode = memo(function BpmHubNode({
  data,
}: NodeProps<Node<BpmHubNodeData, "bpmHub">>) {
  return (
    <div
      className={cn(
        "w-[300px] rounded-[var(--radius-lg)] border bg-surface shadow-[var(--shadow-stage)]",
        data.locked
          ? "border-[color-mix(in_oklab,var(--danger)_55%,var(--border))]"
          : "border-[color-mix(in_oklab,var(--ok)_40%,var(--border))]",
      )}
    >
      <Handle type="target" position={Position.Top} className="!border-border !bg-muted" />
      <Handle type="target" position={Position.Left} id="in-left" className="!border-border !bg-muted" />
      <Handle type="source" position={Position.Left} id="out-left" className="!border-border !bg-muted" />
      <Handle type="target" position={Position.Right} id="in-right" className="!border-border !bg-muted" />
      <Handle type="source" position={Position.Right} id="out-right" className="!border-border !bg-muted" />

      <div className="border-b border-border px-3 py-2.5">
        <p className="text-eyebrow">02 · Buffer pool · middle</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-[15px] font-medium tracking-tight text-foreground">BPM</p>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
              data.locked ? "bg-danger/20 text-danger" : "bg-ok/15 text-ok",
            )}
          >
            {data.locked ? "bpm_latch LOCKED" : "bpm_latch OPEN"}
          </span>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">{data.why}</p>
        <p className="mt-1.5 font-mono text-[10px] text-subtle">{data.tech}</p>
      </div>

      <div className="space-y-2.5 px-3 py-2.5">
        <div>
          <p className="text-eyebrow">Catalog map</p>
          <p className="mt-1 rounded-[var(--radius-sm)] border border-border bg-stage px-2 py-1.5 font-mono text-[11px] text-foreground">
            {data.catalogLine}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted">
            Maps durable page_id to a RAM desk. BPM lock exists so this map does not tear.
          </p>
        </div>

        <div>
          <p className="text-eyebrow">Pin</p>
          <p className="mt-1 rounded-[var(--radius-sm)] border border-border bg-stage px-2 py-1.5 font-mono text-[11px] text-foreground">
            {data.pinLine}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted">
            Pin ≠ lock. Pin only says “keep this frame.” Writers still need rwlatch_.
          </p>
        </div>

        <div>
          <p className="text-eyebrow">Disk I/O</p>
          <p
            className={cn(
              "mt-1 rounded-[var(--radius-sm)] border px-2 py-1.5 font-mono text-[11px]",
              data.ioKind === "read" && "border-ok/40 bg-ok/10 text-ok",
              data.ioKind === "write" && "border-warn/40 bg-warn/10 text-warn",
              data.ioKind === "idle" && "border-border bg-stage text-muted",
            )}
          >
            {data.ioLine}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted">
            LOAD copies shelf → desk. SAVE writes the whole vertical page back.
          </p>
        </div>

        <div>
          <p className="text-eyebrow">Page lock reminder</p>
          <p className="mt-1 text-[12px] leading-relaxed text-foreground">{data.pageLockNote}</p>
        </div>

        <div>
          <p className="text-eyebrow">Threads</p>
          <div className="mt-1.5 space-y-1.5">
            {data.threads.map((th) => (
              <div key={th.id} className="rounded-[var(--radius-sm)] border border-border bg-stage px-2 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium text-foreground">{th.title}</p>
                  <p
                    className={cn(
                      "font-mono text-[9px] uppercase",
                      th.phase === "hold" && "text-accent",
                      th.phase === "wait" && "text-danger",
                      th.phase === "bpm" && "text-danger",
                      th.phase === "done" && "text-ok",
                      th.phase === "idle" && "text-subtle",
                    )}
                  >
                    {th.phase}
                  </p>
                </div>
                <p className="mt-0.5 text-[11px] text-muted">{th.kid}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export const VerticalPageNode = memo(function VerticalPageNode({
  data,
}: NodeProps<Node<VerticalPageNodeData, "verticalPage">>) {
  const { anatomy, compact, hot, empty, kind } = data;
  const width = compact ? 176 : 280;
  const tuplesTopDown = [...anatomy.slots].sort((a, b) => a.offset - b.offset);
  const freeH = compact
    ? Math.max(28, Math.min(52, Math.round(anatomy.freeBytes / 180)))
    : Math.max(44, Math.min(88, Math.round(anatomy.freeBytes / 100)));

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border bg-surface shadow-[var(--shadow-stage)]",
        hot
          ? "border-accent"
          : data.locked
            ? "border-[color-mix(in_oklab,var(--danger)_55%,var(--border))]"
            : data.pin && data.pin > 0
              ? "border-[color-mix(in_oklab,var(--ok)_45%,var(--border))]"
              : "border-border",
      )}
      style={{ width }}
    >
      <Handle type="target" position={Position.Left} id="in-left" className="!border-border !bg-muted" />
      <Handle type="source" position={Position.Left} id="out-left" className="!border-border !bg-muted" />
      <Handle type="target" position={Position.Right} id="in-right" className="!border-border !bg-muted" />
      <Handle type="source" position={Position.Right} id="out-right" className="!border-border !bg-muted" />
      <Handle type="target" position={Position.Top} id="top" className="!border-border !bg-muted" />

      <div
        className={cn(
          "border-b border-border px-2.5 py-2",
          kind === "frame" ? "bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]" : "bg-stage/50",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-eyebrow">{kind === "disk" ? "03 · Disk page" : `04 · Frame ${data.frameId ?? 0}`}</p>
            <p className={cn("mt-0.5 font-medium tracking-tight text-foreground", compact ? "text-[13px]" : "text-[15px]")}>
              {empty ? "Empty desk" : data.roleTitle}
            </p>
            <p className={cn("font-mono text-muted", compact ? "text-[10px]" : "text-[11px]")}>
              {empty ? "no page_id" : `page_id ${anatomy.pageId} · 8192 B`}
            </p>
          </div>
          {kind === "frame" ? (
            <div className="flex flex-col items-end gap-0.5 font-mono text-[9px] uppercase">
              <span className={data.pin && data.pin > 0 ? "text-ok" : "text-subtle"}>PIN {data.pin ?? 0}</span>
              <span className={data.locked ? "text-danger" : "text-subtle"}>
                {data.locked ? "PAGE LOCK" : "unlocked"}
              </span>
              {data.dirty ? <span className="text-warn">dirty</span> : null}
            </div>
          ) : null}
        </div>
        {compact ? null : <p className="mt-2 text-[11px] leading-relaxed text-muted">{data.roleBody}</p>}
      </div>

      {empty ? (
        <div className="space-y-1 px-2.5 py-6 text-center">
          <p className="font-mono text-[11px] text-subtle">no notebook on this desk</p>
          <p className="text-[11px] leading-snug text-muted">
            BPM will pick a free frame, then LOAD a vertical page into it.
          </p>
        </div>
      ) : (
        <>
          <div className="border-b border-accent/30 bg-accent/10 px-2.5 py-2">
            <p className="font-mono text-[8px] uppercase tracking-wider text-accent">header · 8 B · offset 0</p>
            <p className={cn("mt-0.5 font-mono text-foreground", compact ? "text-[9px]" : "text-[11px]")}>
              next={anatomy.nextPageId ?? "INV"} · ntup={anatomy.numTuples} · ndel={anatomy.numDeleted}
            </p>
            {compact ? null : (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{data.headerNote}</p>
            )}
          </div>

          <div className="border-b border-ok/25 bg-ok/10 px-2.5 py-2">
            <p className="mb-1 font-mono text-[8px] uppercase tracking-wider text-ok">
              slot directory ↓ · {anatomy.slots.length} × 24 B
            </p>
            <div className="space-y-0.5">
              {anatomy.slots.length === 0 ? (
                <p className="text-[10px] text-subtle">empty directory</p>
              ) : (
                anatomy.slots.map((s) => <SlotRow key={s.slot} slot={s} compact={compact} />)
              )}
            </div>
            {compact ? null : (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{data.slotNote}</p>
            )}
          </div>

          <div
            className="flex flex-col items-center justify-center border-b border-dashed border-border bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,color-mix(in_oklab,var(--border)_55%,transparent)_6px,color-mix(in_oklab,var(--border)_55%,transparent)_7px)] px-2"
            style={{ minHeight: freeH }}
          >
            <p className="rounded bg-surface/90 px-1.5 py-0.5 font-mono text-[9px] text-muted">
              free {anatomy.freeBytes.toLocaleString()} B
            </p>
            {compact ? null : (
              <p className="mt-1 max-w-[16rem] text-center text-[10px] leading-snug text-muted">{data.freeNote}</p>
            )}
          </div>

          <div className="bg-warn/10 px-2.5 py-2">
            <p className="mb-1 font-mono text-[8px] uppercase tracking-wider text-warn">
              tuples ↑ · packed from 0x2000
            </p>
            <div className="space-y-1">
              {tuplesTopDown.length === 0 ? (
                <p className="py-2 text-center text-[10px] text-subtle">no tuples</p>
              ) : (
                tuplesTopDown.map((s) => <TupleCard key={s.slot} slot={s} compact={compact} />)
              )}
            </div>
            {compact ? null : (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{data.tupleNote}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
});

export const ThreadNode = memo(function ThreadNode({
  data,
}: NodeProps<Node<ThreadNodeData, "thread">>) {
  return (
    <div className="w-[200px] rounded-[var(--radius-md)] border border-border bg-surface px-2.5 py-2 shadow-[var(--shadow-stage)]">
      <Handle type="target" position={Position.Left} className="!border-border !bg-muted" />
      <p className="text-eyebrow">{data.title}</p>
      <p className="mt-0.5 text-[12px] font-medium text-foreground">{data.kid}</p>
      <p
        className={cn(
          "mt-1 font-mono text-[10px] uppercase",
          data.phase === "hold" && "text-accent",
          data.phase === "wait" && "text-danger",
          data.phase === "bpm" && "text-danger",
          data.phase === "done" && "text-ok",
          data.phase === "idle" && "text-subtle",
        )}
      >
        {data.phase}
        {data.pageId != null ? ` · P${data.pageId}` : ""}
      </p>
      <p className="mt-1.5 text-[11px] leading-snug text-muted">{data.why}</p>
    </div>
  );
});

export const LabelNode = memo(function LabelNode({
  data,
}: NodeProps<Node<LabelNodeData, "label">>) {
  return (
    <div className="pointer-events-none w-[280px]">
      <p className="text-eyebrow">{data.kicker}</p>
      <p className="mt-0.5 text-[13px] font-medium text-foreground">{data.text}</p>
      {data.hint ? <p className="mt-0.5 text-[11px] leading-snug text-muted">{data.hint}</p> : null}
    </div>
  );
});

export const FlowBadgeNode = memo(function FlowBadgeNode({
  data,
}: NodeProps<Node<FlowBadgeNodeData, "flowBadge">>) {
  return (
    <div
      className={cn(
        "w-[132px] rounded-[var(--radius-md)] border px-2 py-1.5 text-center shadow-[var(--shadow-stage)]",
        data.flow === "load" && "border-ok bg-ok/15",
        data.flow === "save" && "border-warn bg-warn/15",
        data.flow === "idle" && "border-border bg-surface",
      )}
    >
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <Handle type="source" position={Position.Right} className="!opacity-0" />
      <p
        className={cn(
          "font-mono text-[10px] font-semibold uppercase tracking-wider",
          data.flow === "load" && "text-ok",
          data.flow === "save" && "text-warn",
          data.flow === "idle" && "text-subtle",
        )}
      >
        {data.label}
      </p>
      <p className="mt-1 text-[10px] leading-snug text-muted">{data.why}</p>
    </div>
  );
});

export const guardStoryNodeTypes = {
  query: QueryNode,
  bpmHub: BpmHubNode,
  verticalPage: VerticalPageNode,
  thread: ThreadNode,
  label: LabelNode,
  flowBadge: FlowBadgeNode,
};
