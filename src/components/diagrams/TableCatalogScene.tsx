"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Info,
  Pause,
  Play,
  RotateCcw,
  StepForward,
} from "lucide-react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeTypes,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import type { TableCatalogVisualProps } from "@/types/lesson";
import {
  TOUR,
  cloneEngine,
  emptyEngine,
  fileBytes,
  formatRid,
  runCommand,
  type AnimStep,
  type Beat,
  type Command,
  type Engine,
  type TableName,
} from "@/lib/table-catalog/engine";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MarkImage } from "@/components/ui/MarkImage";
import { buildCatalogFlowGraph } from "./catalog-flow/buildGraph";
import { CatalogSelectContext, catalogNodeTypes } from "./catalog-flow/nodes";

type Speed = 0.5 | 1 | 1.5 | 2;
const SPEEDS: Speed[] = [0.5, 1, 1.5, 2];

function beatMs(beat: Beat, speed: Speed, reduce: boolean): number {
  if (reduce) return 0;
  const base: Partial<Record<Beat, number>> = {
    sql: 700,
    catalog: 900,
    allocate: 1000,
    scheduler: 850,
    disk: 1100,
    bpm: 800,
    done: 500,
    error: 900,
    idle: 0,
  };
  return Math.round((base[beat] ?? 600) / speed);
}

function hasTable(engine: Engine, name: TableName) {
  return engine.catalog.some((r) => r.name === name);
}

function CatalogFlowInner({ teach }: TableCatalogVisualProps) {
  const [engine, setEngine] = useState<Engine>(() => emptyEngine());
  const [view, setView] = useState<AnimStep | null>(null);
  const [playingTour, setPlayingTour] = useState(false);
  const [busy, setBusy] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [infoOpen, setInfoOpen] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [inspectPageId, setInspectPageId] = useState<number | null>(null);
  const tourIndex = useRef(0);
  const timers = useRef<number[]>([]);
  const engineRef = useRef(engine);
  const playingTourRef = useRef(false);
  const playCmdRef = useRef<(cmd: Command, then?: () => void) => void>(() => undefined);
  const { fitView } = useReactFlow();
  const reduce = prefersReducedMotion();

  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const playCommand = useCallback(
    (cmd: Command, then?: () => void) => {
      clearTimers();
      const steps = runCommand(engineRef.current, cmd);
      if (steps.length === 0) {
        then?.();
        return;
      }
      const err = steps[0]?.beat === "error";
      if (err) {
        setView(steps[0]!);
        setBusy(false);
        then?.();
        return;
      }

      setBusy(true);
      const apply = (step: AnimStep, last: boolean) => {
        setView(step);
        if (last) {
          const next = cloneEngine(step.engine);
          engineRef.current = next;
          setEngine(next);
          setLog((prev) => [step.sql, ...prev].slice(0, 8));
          setBusy(false);
          then?.();
        }
      };

      if (reduce) {
        apply(steps[steps.length - 1]!, true);
        return;
      }

      let t = 0;
      steps.forEach((step, i) => {
        const last = i === steps.length - 1;
        timers.current.push(
          window.setTimeout(() => apply(step, last), t),
        );
        t += beatMs(step.beat, speed, reduce);
      });
    },
    [clearTimers, reduce, speed],
  );

  useEffect(() => {
    playCmdRef.current = playCommand;
  }, [playCommand]);

  const onAction = useCallback(
    (cmd: Command) => {
      if (busy) return;
      playingTourRef.current = false;
      setPlayingTour(false);
      tourIndex.current = 0;
      playCommand(cmd);
    },
    [busy, playCommand],
  );

  const continueTour = useCallback(() => {
    if (!playingTourRef.current) return;
    if (tourIndex.current >= TOUR.length) {
      playingTourRef.current = false;
      setPlayingTour(false);
      return;
    }
    const cmd = TOUR[tourIndex.current]!;
    tourIndex.current += 1;
    playCmdRef.current(cmd, () => {
      if (!playingTourRef.current) return;
      timers.current.push(
        window.setTimeout(() => {
          if (!playingTourRef.current) return;
          if (tourIndex.current < TOUR.length) continueTour();
          else {
            playingTourRef.current = false;
            setPlayingTour(false);
          }
        }, reduce ? 120 : 420 / speed),
      );
    });
  }, [reduce, speed]);

  const onTour = useCallback(() => {
    if (playingTour) {
      playingTourRef.current = false;
      setPlayingTour(false);
      clearTimers();
      setBusy(false);
      return;
    }
    playingTourRef.current = true;
    setPlayingTour(true);
    const fresh = emptyEngine();
    setEngine(fresh);
    engineRef.current = fresh;
    setView(null);
    setLog([]);
    setInspectPageId(null);
    tourIndex.current = 0;
    continueTour();
  }, [playingTour, clearTimers, continueTour]);

  const onReset = useCallback(() => {
    playingTourRef.current = false;
    setPlayingTour(false);
    clearTimers();
    setBusy(false);
    const fresh = emptyEngine();
    engineRef.current = fresh;
    setEngine(fresh);
    setView(null);
    setLog([]);
    setInspectPageId(null);
    tourIndex.current = 0;
  }, [clearTimers]);

  const live = view?.engine ?? engine;
  const beat: Beat = view?.beat ?? "idle";
  const sql = view?.sql ?? "-- datadb.db is empty · catalog is empty --";
  const packet = view?.packet ?? "Click Create users to start";
  const note =
    view?.note ??
    "Create a table → catalog stores first_page_id → 8 KB slot appears in datadb.db. Insert writes a RID. Select follows the catalog (HIT skips disk). Click a page for the slotted layout.";

  const built = useMemo(
    () =>
      buildCatalogFlowGraph({
        beat,
        engine: live,
        sql,
        note,
        packet,
        highlightTable: view?.highlightTable,
        highlightPageId: view?.highlightPageId,
        scheduler: view?.scheduler ?? [],
        inspectPageId,
        rid: view?.rid ?? live.lastRid,
        scanNames: view?.scanNames,
        cacheHit: view?.cacheHit,
      }),
    [beat, live, sql, note, packet, view, inspectPageId],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(built.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(built.edges);

  useEffect(() => {
    setNodes(built.nodes);
    setEdges(built.edges);
  }, [built, setNodes, setEdges]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      fitView({ padding: 0.12, maxZoom: 0.95, duration: reduce ? 0 : 280 });
    }, 40);
    return () => window.clearTimeout(id);
  }, [fitView, reduce, inspectPageId, live.extents.length, live.orphaned]);

  useEffect(() => {
    const onResize = () => {
      fitView({ padding: 0.12, maxZoom: 0.95, duration: reduce ? 0 : 200 });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fitView, reduce]);

  const usersReady = hasTable(engine, "users");
  const ordersReady = hasTable(engine, "orders");

  return (
    <CatalogSelectContext.Provider value={setInspectPageId}>
    <div className="absolute inset-0 h-full w-full bg-stage">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={catalogNodeTypes as NodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12, maxZoom: 0.95, duration: 0 }}
        minZoom={0.18}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        panOnScroll
        zoomOnScroll
        className="disk-flow disk-flow--smooth"
        style={{ width: "100%", height: "100%" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1}
          color="var(--border)"
        />
        <Controls
          position="top-right"
          showInteractive={false}
          className="!overflow-hidden !rounded-[var(--radius-md)] !border !border-border !bg-surface !shadow-none"
        />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          className="!mb-36 !hidden !overflow-hidden !rounded-[var(--radius-md)] !border !border-border !bg-surface/95 !shadow-none lg:!block"
          maskColor="color-mix(in oklab, var(--stage) 72%, transparent)"
          nodeColor={(n) => {
            if (n.type === "dbFile") return "var(--accent)";
            if (n.type === "catalog") return "var(--ok)";
            if (n.type === "bpm") return "var(--warn)";
            return "var(--border-strong)";
          }}
        />
      </ReactFlow>

      <button
        type="button"
        title="How this lab works"
        aria-label="How this lab works"
        onClick={() => setInfoOpen(true)}
        className="absolute left-3 top-14 z-10 inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-surface/95 text-muted shadow-[var(--shadow-stage)] backdrop-blur-sm hover:text-foreground"
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>

      <Modal open={infoOpen} onClose={() => setInfoOpen(false)} title="What this lab is teaching">
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            BusTub&apos;s catalog is an in-memory map: name → oid → TableHeap with{" "}
            <span className="font-mono text-foreground">first_page_id_</span>. That
            matches <span className="font-mono">catalog.h</span> /{" "}
            <span className="font-mono">table_heap.h</span> from CMU 15-445.
          </p>
          <p>
            Each heap page is a slotted 8 KB TablePage:{" "}
            <span className="font-mono text-foreground">next_page_id | num_tuples | num_deleted</span>{" "}
            then a slot directory, free space, and tuples packed from the end — the same
            shape Postgres uses (see boringSQL&apos;s 8 KB page visualizer). Insert returns a{" "}
            <span className="font-mono text-foreground">RID (page_id, slot)</span>.
          </p>
          <p>
            SELECT looks up the catalog, then SeqScan follows{" "}
            <span className="font-mono">next_page_id</span>. If the page is already in a
            BPM frame it is a HIT (no disk). Otherwise DiskScheduler does a FIFO READ and
            DiskManager seeks via the RAM <span className="font-mono">pages_</span> map.
          </p>
          <p>
            Postgres persists this metadata in{" "}
            <span className="font-mono text-foreground">pg_class.relfilenode</span> under
            PGDATA, so a restart still knows which file is <span className="font-mono">users</span>.
            BusTub does not — that is intentional for the course.
          </p>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setInfoOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>

      <div className="pointer-events-none absolute left-3 top-14 z-10 flex max-w-[min(92vw,26rem)] items-start gap-2 sm:left-4">
        <MarkImage
          src="/marks/mark-catalog.jpg"
          size={48}
          className="pointer-events-none rounded-[var(--radius-md)] shadow-[var(--shadow-stage)]"
        />
        {teach ? (
          <div className="rounded-[var(--radius-md)] border border-border bg-surface/90 px-2.5 py-2 backdrop-blur-sm">
            <p className="text-eyebrow">{teach.title}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted">{teach.body}</p>
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 sm:max-w-[min(100%,52rem)]">
        <div className="pointer-events-auto rounded-[var(--radius-lg)] border border-border bg-surface/95 p-2.5 shadow-[var(--shadow-stage)] backdrop-blur-sm">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-border text-muted hover:text-foreground"
              aria-label="Reset"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onTour}
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-2.5 font-mono text-[11px] font-semibold text-accent-fg"
            >
              {playingTour ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playingTour ? "Pause tour" : "Play tour"}
            </button>
            <div className="flex gap-0.5" role="group" aria-label="Playback speed">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={cn(
                    "rounded px-1 py-0.5 font-mono text-[10px]",
                    speed === s ? "bg-accent text-accent-fg" : "text-subtle hover:text-foreground",
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
            <span className="hidden font-mono text-[10px] text-subtle sm:inline">
              {fileBytes(live).toLocaleString()} B · {live.extents.length} pg · cat {live.catalog.length} · RID{" "}
              {formatRid(live.lastRid)}
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={beat + packet}
                initial={reduce ? false : { opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "ml-auto font-mono text-[11px] font-semibold",
                  beat === "error" && "text-danger",
                  beat === "disk" && "text-accent",
                  beat === "catalog" && "text-ok",
                  beat === "done" && "text-ok",
                  (beat === "idle" || beat === "sql") && "text-muted",
                )}
              >
                {beat === "idle" ? "ready" : beat}
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="mb-2 flex flex-wrap gap-1.5">
            <span className="self-center font-mono text-[9px] uppercase tracking-wider text-subtle">
              create
            </span>
            <button
              type="button"
              disabled={busy || usersReady}
              onClick={() => onAction({ kind: "create", table: "users" })}
              className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-border px-2 font-mono text-[11px] hover:border-accent disabled:opacity-35"
            >
              users
            </button>
            <button
              type="button"
              disabled={busy || ordersReady}
              onClick={() => onAction({ kind: "create", table: "orders" })}
              className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-border px-2 font-mono text-[11px] hover:border-accent disabled:opacity-35"
            >
              orders
            </button>
            <span className="self-center font-mono text-[9px] uppercase tracking-wider text-subtle">
              insert
            </span>
            <button
              type="button"
              disabled={busy || !usersReady}
              onClick={() => onAction({ kind: "insert", table: "users" })}
              className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] border border-border px-2 font-mono text-[11px] hover:border-accent disabled:opacity-35"
            >
              <StepForward className="h-3 w-3" />
              users
            </button>
            <button
              type="button"
              disabled={busy || !ordersReady}
              onClick={() => onAction({ kind: "insert", table: "orders" })}
              className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] border border-border px-2 font-mono text-[11px] hover:border-accent disabled:opacity-35"
            >
              <StepForward className="h-3 w-3" />
              orders
            </button>
            <span className="self-center font-mono text-[9px] uppercase tracking-wider text-subtle">
              select
            </span>
            <button
              type="button"
              disabled={busy || !usersReady}
              onClick={() => onAction({ kind: "select", table: "users" })}
              className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-border px-2 font-mono text-[11px] hover:border-accent disabled:opacity-35"
            >
              users
            </button>
            <button
              type="button"
              disabled={busy || !ordersReady}
              onClick={() => onAction({ kind: "select", table: "orders" })}
              className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-border px-2 font-mono text-[11px] hover:border-accent disabled:opacity-35"
            >
              orders
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction({ kind: "restart" })}
              className="ml-auto inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-warn/40 px-2 font-mono text-[11px] text-warn hover:bg-warn/10 disabled:opacity-35"
            >
              restart
            </button>
          </div>

          <div className="mb-2 flex flex-wrap gap-2 font-mono text-[9px] text-subtle">
            <span className="inline-flex items-center gap-1">
              <i className="inline-block h-2 w-2 rounded-sm bg-accent" /> header
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="inline-block h-2 w-2 rounded-sm bg-ok" /> slots
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="inline-block h-2 w-2 rounded-sm bg-border-strong" /> free
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="inline-block h-2 w-2 rounded-sm bg-warn" /> tuples
            </span>
          </div>

          <p className="text-[12px] leading-snug text-foreground">{note}</p>
          {log.length > 0 ? (
            <p className="mt-1.5 truncate font-mono text-[10px] text-subtle">
              history: {log.join("  ·  ")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
    </CatalogSelectContext.Provider>
  );
}

export function TableCatalogScene(props: TableCatalogVisualProps) {
  return (
    <ReactFlowProvider>
      <CatalogFlowInner {...props} />
    </ReactFlowProvider>
  );
}
