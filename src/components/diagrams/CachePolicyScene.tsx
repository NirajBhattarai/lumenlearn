"use client";

/**
 * Cache replacement lab — React Flow playground.
 * SQL → table → disk pages → frames, with live attach / detach edges.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Info,
  Pause,
  Play,
  RotateCcw,
  StepBack,
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
import type { CachePolicyVisualProps } from "@/types/lesson";
import { simulatePolicy } from "@/lib/cache-policies/simulate";
import { POLICY_MARK, POLICY_META } from "@/lib/cache-policies/types";
import { MarkImage } from "@/components/ui/MarkImage";
import {
  DEFAULT_CAPACITY,
  intentAt,
  pageLabel,
  STUDENTS_ACCESS_TRACE,
} from "@/lib/cache-policies/sample";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { buildCacheFlowGraph } from "./cache-flow/buildGraph";
import { CacheSelectContext, cacheNodeTypes } from "./cache-flow/nodes";
import type { CacheBeat } from "./cache-flow/types";

type Props = CachePolicyVisualProps;
type Speed = 0.5 | 1 | 1.5 | 2;
const SPEEDS: Speed[] = [0.5, 1, 1.5, 2];

function beatMs(beat: CacheBeat, speed: Speed, reduce: boolean): number {
  if (reduce) return 0;
  const base: Record<CacheBeat, number> = {
    idle: 0,
    request: 560,
    decide: 420,
    evict: 680,
    load: 640,
    done: 280,
  };
  return Math.round(base[beat] / speed);
}

function CacheFlowInner({
  policy,
  capacity = DEFAULT_CAPACITY,
  trace = STUDENTS_ACCESS_TRACE,
}: Props) {
  const run = useMemo(
    () => simulatePolicy(policy, trace, capacity),
    [policy, trace, capacity],
  );
  const [step, setStep] = useState(0);
  const [beat, setBeat] = useState<CacheBeat>("idle");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [infoOpen, setInfoOpen] = useState(false);
  const reduce = prefersReducedMotion();
  const timers = useRef<number[]>([]);
  const playAccessToRef = useRef<(toStep: number, autoContinue: boolean) => void>(
    () => undefined,
  );
  const { fitView } = useReactFlow();
  const meta = POLICY_META[policy];
  const maxStep = run.snapshots.length - 1;
  const snap = run.snapshots[step] ?? run.snapshots[0]!;

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const playAccessTo = useCallback(
    (toStep: number, autoContinue: boolean) => {
      clearTimers();
      if (toStep <= 0) {
        setStep(0);
        setBeat("idle");
        if (autoContinue) setPlaying(false);
        return;
      }
      const target = run.snapshots[toStep];
      if (!target) return;
      const miss = target.hit === false;
      const hasVictim = target.victim != null;
      const next = (n: number) => playAccessToRef.current(n, true);

      if (reduce) {
        setStep(toStep);
        setBeat("done");
        if (autoContinue && toStep < maxStep) {
          timers.current.push(window.setTimeout(() => next(toStep + 1), 200));
        } else if (autoContinue) setPlaying(false);
        return;
      }

      setStep(toStep - 1);
      setBeat("request");
      let t = 0;
      const schedule = (fn: () => void, ms: number) => {
        t += ms;
        timers.current.push(window.setTimeout(fn, t));
      };
      schedule(() => setBeat("decide"), beatMs("request", speed, reduce));
      if (miss && hasVictim) {
        schedule(() => setBeat("evict"), beatMs("decide", speed, reduce));
        schedule(() => {
          setStep(toStep);
          setBeat("load");
        }, beatMs("evict", speed, reduce));
        schedule(() => setBeat("done"), beatMs("load", speed, reduce));
        schedule(() => {
          if (autoContinue && toStep < maxStep) next(toStep + 1);
          else setPlaying(false);
        }, beatMs("done", speed, reduce));
      } else if (miss) {
        schedule(() => {
          setStep(toStep);
          setBeat("load");
        }, beatMs("decide", speed, reduce));
        schedule(() => setBeat("done"), beatMs("load", speed, reduce));
        schedule(() => {
          if (autoContinue && toStep < maxStep) next(toStep + 1);
          else setPlaying(false);
        }, beatMs("done", speed, reduce));
      } else {
        schedule(() => {
          setStep(toStep);
          setBeat("done");
        }, beatMs("decide", speed, reduce));
        schedule(() => {
          if (autoContinue && toStep < maxStep) next(toStep + 1);
          else setPlaying(false);
        }, beatMs("done", speed, reduce) + beatMs("load", speed, reduce) * 0.35);
      }
    },
    [run.snapshots, maxStep, reduce, speed, clearTimers],
  );

  useEffect(() => {
    playAccessToRef.current = playAccessTo;
  }, [playAccessTo]);

  const onPlay = useCallback(() => {
    if (playing) {
      setPlaying(false);
      clearTimers();
      setBeat("done");
      return;
    }
    setPlaying(true);
    if (step >= maxStep) {
      setStep(0);
      playAccessTo(1, true);
    } else {
      playAccessTo(step + 1, true);
    }
  }, [playing, clearTimers, maxStep, playAccessTo, step]);

  const onStep = useCallback(() => {
    setPlaying(false);
    clearTimers();
    if (step >= maxStep) return;
    playAccessTo(step + 1, false);
  }, [clearTimers, maxStep, playAccessTo, step]);

  const onBack = useCallback(() => {
    setPlaying(false);
    clearTimers();
    setBeat("idle");
    setStep((s) => Math.max(0, s - 1));
  }, [clearTimers]);

  const onReset = useCallback(() => {
    setPlaying(false);
    clearTimers();
    setStep(0);
    setBeat("idle");
  }, [clearTimers]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        onPlay();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onBack();
      } else if (e.key === "Home") {
        e.preventDefault();
        onReset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPlay, onStep, onBack, onReset]);

  const incoming =
    beat === "request" || beat === "decide" || beat === "evict"
      ? (run.snapshots[step + 1] ?? snap)
      : snap;
  const pendingAccess = beat === "idle" ? null : incoming.access;
  const decideHit = incoming.hit;
  const victimPage =
    beat === "evict"
      ? incoming.victim
      : beat === "load" || beat === "done"
        ? snap.victim
        : null;
  const traceIndex =
    beat === "idle"
      ? -1
      : beat === "request" || beat === "decide" || beat === "evict"
        ? step
        : step - 1;
  const intent = traceIndex >= 0 ? intentAt(traceIndex) : null;
  const hand = policy === "clock" ? (snap.structures.hand?.[0] ?? 0) : -1;

  const seekPage = useCallback(
    (pageId: number) => {
      const from = Math.max(0, step);
      const nextIdx = trace.findIndex((pid, i) => i >= from && pid === pageId);
      const idx = nextIdx >= 0 ? nextIdx : trace.findIndex((pid) => pid === pageId);
      if (idx < 0) return;
      setPlaying(false);
      clearTimers();
      setStep(idx + 1);
      setBeat("done");
    },
    [step, trace, clearTimers],
  );

  const built = useMemo(
    () =>
      buildCacheFlowGraph({
        policy,
        beat,
        frames: snap.frames,
        structures: snap.structures,
        hand,
        focusRowIds: intent?.focusRowIds ?? [],
        pendingAccess,
        victimPage,
        accessPage: snap.access,
        hit: decideHit,
        intent,
      }),
    [policy, beat, snap, hand, pendingAccess, victimPage, decideHit, intent],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(built.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(built.edges);

  useEffect(() => {
    setNodes(built.nodes);
    setEdges(built.edges);
  }, [built, setNodes, setEdges]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      fitView({ padding: 0.18, maxZoom: 1, duration: reduce ? 0 : 280 });
    }, 40);
    return () => window.clearTimeout(id);
  }, [policy, fitView, reduce]);

  useEffect(() => {
    const onResize = () => {
      fitView({ padding: 0.18, maxZoom: 1, duration: reduce ? 0 : 200 });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fitView, reduce]);

  const action = (() => {
    if (beat === "idle") return { tone: "muted" as const, label: "Idle", detail: "Step a query" };
    if (beat === "request")
      return { tone: "accent" as const, label: "Query", detail: `Need ${pageLabel(pendingAccess!)}` };
    if (beat === "decide" && decideHit)
      return { tone: "ok" as const, label: "HIT", detail: "Already attached" };
    if (beat === "decide")
      return { tone: "danger" as const, label: "MISS", detail: "No page-table edge" };
    if (beat === "evict")
      return {
        tone: "danger" as const,
        label: "Detach",
        detail: victimPage != null ? pageLabel(victimPage) : "victim",
      };
    if (beat === "load")
      return { tone: "accent" as const, label: "Load 8 KB", detail: pageLabel(pendingAccess!) };
    if (snap.hit) return { tone: "ok" as const, label: "HIT", detail: pageLabel(snap.access!) };
    return { tone: "danger" as const, label: "Installed", detail: pageLabel(snap.access!) };
  })();

  return (
    <CacheSelectContext.Provider value={seekPage}>
    <div className="absolute inset-0 h-full w-full bg-stage">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={cacheNodeTypes as NodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18, maxZoom: 1, duration: 0 }}
        minZoom={0.22}
        maxZoom={1.7}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        panOnScroll
        zoomOnScroll
        className="disk-flow disk-flow--smooth"
        style={{ width: "100%", height: "100%" }}
        defaultEdgeOptions={{
          animated: false,
          style: { transition: reduce ? undefined : "stroke 0.35s ease" },
        }}
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
          className="!hidden !overflow-hidden !rounded-[var(--radius-md)] !border !border-border !bg-surface/95 !shadow-none sm:!block"
          maskColor="color-mix(in oklab, var(--stage) 72%, transparent)"
          nodeColor={(n) => {
            if (n.type === "frame") return "var(--ok)";
            if (n.type === "page") return "var(--accent)";
            if (n.type === "policy") return "var(--border-strong)";
            return "var(--muted)";
          }}
        />
      </ReactFlow>

      <div className="absolute left-3 top-14 z-10 flex max-w-[min(92vw,22rem)] items-start gap-2 sm:left-4 sm:top-[3.25rem]">
        <MarkImage src={POLICY_MARK[policy]} size={48} className="rounded-[var(--radius-md)] shadow-[var(--shadow-stage)]" />
        <div className="rounded-[var(--radius-md)] border border-border bg-surface/95 px-2.5 py-2 shadow-[var(--shadow-stage)] backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-eyebrow">{meta.name}</p>
              <p className="mt-0.5 text-[12px] font-medium text-foreground">{meta.short}</p>
            </div>
            <button
              type="button"
              title={`About ${meta.short}`}
              aria-label={`About ${meta.short}`}
              aria-haspopup="dialog"
              aria-expanded={infoOpen}
              onClick={() => {
                setPlaying(false);
                setInfoOpen(true);
              }}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border text-muted hover:text-foreground"
            >
              <Info className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-muted">{meta.rule}</p>
        </div>
      </div>

      <Modal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title={`${meta.name} · ${meta.short}`}
      >
        <div className="mb-3 flex items-center gap-3">
          <MarkImage src={POLICY_MARK[policy]} size={56} className="rounded-[var(--radius-md)]" />
          <p className="text-sm font-medium text-foreground">{meta.short}</p>
        </div>
        <p className="text-sm leading-relaxed text-muted">{meta.rule}</p>
        <p className="mt-3 text-[12px] leading-relaxed text-subtle">
          This lab shows the victim rule on a 4-frame pool. Wikipedia has the
          broader algorithm history and variants.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setInfoOpen(false)}>
            Close
          </Button>
          <a
            href={meta.wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center justify-center rounded-[var(--radius-md)] bg-accent px-3 text-xs font-medium text-accent-fg hover:bg-accent-hover"
          >
            Learn more
          </a>
        </div>
      </Modal>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 sm:right-auto sm:max-w-[min(100%,38rem)]">
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
              onClick={onBack}
              disabled={step <= 0}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-border disabled:opacity-30"
              aria-label="Previous access"
            >
              <StepBack className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onPlay}
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-2.5 font-mono text-[11px] font-semibold text-accent-fg"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pause" : "Run"}
            </button>
            <button
              type="button"
              onClick={onStep}
              disabled={step >= maxStep && beat === "done"}
              className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] border border-border px-2 font-mono text-[11px] disabled:opacity-30"
            >
              <StepForward className="h-3.5 w-3.5" />
              Step
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
            <AnimatePresence mode="wait">
              <motion.span
                key={action.label + action.detail}
                initial={reduce ? false : { opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "ml-auto font-mono text-[11px] font-semibold",
                  action.tone === "ok" && "text-ok",
                  action.tone === "danger" && "text-danger",
                  action.tone === "accent" && "text-accent",
                  action.tone === "muted" && "text-muted",
                )}
                aria-live="polite"
              >
                {action.label}
                <span className="ml-1.5 font-normal text-muted">{action.detail}</span>
              </motion.span>
            </AnimatePresence>
          </div>
          <p className="mb-1 truncate text-[11px] text-foreground">{snap.note}</p>
          <div className="flex flex-wrap gap-1" role="list" aria-label="Access trace">
            {trace.map((pid, i) => {
              const done = i < step;
              const current =
                (beat !== "idle" && beat !== "done" && i === step) ||
                (beat === "done" && i === step - 1);
              return (
                <button
                  key={`${pid}-${i}`}
                  type="button"
                  title={intentAt(i)?.sql}
                  onClick={() => {
                    setPlaying(false);
                    clearTimers();
                    setStep(i + 1);
                    setBeat("done");
                  }}
                  className={cn(
                    "rounded-[var(--radius-sm)] border px-1 py-0.5 font-mono text-[9px]",
                    current
                      ? "border-accent bg-accent text-accent-fg"
                      : done
                        ? "border-border bg-stage text-muted"
                        : "border-border text-subtle hover:text-foreground",
                  )}
                >
                  {pageLabel(pid)}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-subtle">
            hits {snap.hits} · misses {snap.misses} · Space / ← →
          </p>
        </div>
      </div>
    </div>
    </CacheSelectContext.Provider>
  );
}

export function CachePolicyScene(props: Props) {
  return (
    <ReactFlowProvider>
      <CacheFlowInner
        key={`${props.policy}-${props.capacity ?? DEFAULT_CAPACITY}-${props.trace?.join(",") ?? "default"}`}
        {...props}
      />
    </ReactFlowProvider>
  );
}
