"use client";

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
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeTypes,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import type { PageGuardVisualProps } from "@/types/lesson";
import {
  BEAT_ORDER,
  beatFromTime,
  snapshotAt,
  timeForBeat,
  type GuardBeat,
} from "@/lib/page-guard/story";
import {
  pauseStory,
  playStory,
  seekStory,
  subscribeStoryTime,
} from "@/lib/page-guard/theatre";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MarkImage } from "@/components/ui/MarkImage";
import { buildGuardStoryGraph } from "./page-guard-flow/buildGraph";
import { BEAT_LABEL, sceneCopy } from "@/lib/page-guard/copy";
import { guardStoryNodeTypes } from "./page-guard-flow/nodes";

type Speed = 0.5 | 1 | 1.5 | 2;
const SPEEDS: Speed[] = [0.5, 1, 1.5, 2];

function FlowInner({ snap }: { snap: ReturnType<typeof snapshotAt> }) {
  const { fitView } = useReactFlow();
  const reduce = prefersReducedMotion();
  const built = useMemo(() => buildGuardStoryGraph(snap), [snap]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(built.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(built.edges);

  useEffect(() => {
    setNodes(built.nodes);
    setEdges(built.edges);
  }, [built, setNodes, setEdges]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      fitView({ padding: 0.1, maxZoom: 0.95, duration: reduce ? 0 : 280 });
    }, 40);
    return () => window.clearTimeout(id);
  }, [fitView, reduce, snap.beat]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={guardStoryNodeTypes as NodeTypes}
      fitView
      fitViewOptions={{ padding: 0.1, maxZoom: 0.95, duration: 0 }}
      minZoom={0.25}
      maxZoom={1.6}
      proOptions={{ hideAttribution: true }}
      nodesDraggable
      nodesConnectable={false}
      panOnScroll
      className="disk-flow disk-flow--smooth"
      style={{ width: "100%", height: "100%" }}
    >
      <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="var(--border)" />
      <Controls
        position="top-right"
        showInteractive={false}
        className="!overflow-hidden !rounded-[var(--radius-md)] !border !border-border !bg-surface !shadow-none"
      />
    </ReactFlow>
  );
}

function PageGuardInner({ teach }: PageGuardVisualProps) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [infoOpen, setInfoOpen] = useState(false);
  const playGen = useRef(0);
  const reduce = prefersReducedMotion();
  const beat = beatFromTime(time);
  const snap = useMemo(() => snapshotAt(beat), [beat]);
  const copy = useMemo(() => sceneCopy(snap), [snap]);

  useEffect(() => subscribeStoryTime(setTime), []);

  const jump = useCallback((next: GuardBeat) => {
    playGen.current += 1;
    setPlaying(false);
    pauseStory();
    seekStory(timeForBeat(next));
    setTime(timeForBeat(next));
  }, []);

  const onReset = useCallback(() => jump("idle"), [jump]);

  const onStep = useCallback(() => {
    const i = BEAT_ORDER.indexOf(beat);
    const next = BEAT_ORDER[Math.min(BEAT_ORDER.length - 1, i + 1)]!;
    jump(next);
  }, [beat, jump]);

  const onBack = useCallback(() => {
    const i = BEAT_ORDER.indexOf(beat);
    const prev = BEAT_ORDER[Math.max(0, i - 1)]!;
    jump(prev);
  }, [beat, jump]);

  const onPlay = useCallback(async () => {
    if (playing) {
      playGen.current += 1;
      setPlaying(false);
      pauseStory();
      return;
    }
    if (reduce) {
      onStep();
      return;
    }
    const gen = ++playGen.current;
    setPlaying(true);
    if (beat === "done") seekStory(0);
    await playStory(speed);
    if (playGen.current === gen) setPlaying(false);
  }, [playing, reduce, onStep, beat, speed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        void onPlay();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPlay, onStep, onBack]);

  return (
    <div className="absolute inset-0 h-full w-full bg-stage">
      <ReactFlowProvider>
        <FlowInner snap={snap} />
      </ReactFlowProvider>

      <div className="pointer-events-none absolute left-3 top-14 z-10 flex max-w-[min(92vw,26rem)] items-start gap-2 sm:left-4">
        <MarkImage
          src="/marks/mark-guard.jpg"
          size={48}
          className="rounded-[var(--radius-md)] shadow-[var(--shadow-stage)]"
        />
        {teach ? (
          <div className="rounded-[var(--radius-md)] border border-border bg-surface/95 px-2.5 py-2 shadow-[var(--shadow-stage)] backdrop-blur-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-eyebrow">{teach.title}</p>
                <p className="mt-1 text-[11px] leading-snug text-muted">{teach.body}</p>
              </div>
              <button
                type="button"
                className="pointer-events-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border text-muted hover:text-foreground"
                onClick={() => setInfoOpen(true)}
                aria-label="About this story"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
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
              aria-label="Restart"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onBack}
              disabled={beat === "idle"}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-border disabled:opacity-30"
              aria-label="Previous state"
            >
              <StepBack className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void onPlay()}
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-2.5 font-mono text-[11px] font-semibold text-accent-fg"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pause" : "Run"}
            </button>
            <button
              type="button"
              onClick={onStep}
              disabled={beat === "done"}
              className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] border border-border px-2 font-mono text-[11px] disabled:opacity-30"
            >
              <StepForward className="h-3.5 w-3.5" />
              Step
            </button>
            <div className="flex gap-0.5" role="group" aria-label="Speed">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSpeed(s);
                    if (playing) {
                      pauseStory();
                      void playStory(s);
                    }
                  }}
                  className={cn(
                    "rounded px-1 py-0.5 font-mono text-[10px]",
                    speed === s ? "bg-accent text-accent-fg" : "text-subtle hover:text-foreground",
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-subtle">
              {beat} · t {time.toFixed(1)}s
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={snap.beat}
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-0.5"
            >
              <p className="text-[13px] font-medium text-foreground">{snap.kid}</p>
              <p className="text-[12px] leading-relaxed text-muted">{copy.bpmWhy}</p>
              <p className="font-mono text-[11px] text-subtle">{snap.tech}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-2 flex flex-wrap gap-1" role="list" aria-label="Story states">
            {BEAT_ORDER.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => jump(b)}
                className={cn(
                  "rounded-[var(--radius-sm)] border px-1.5 py-0.5 font-mono text-[9px]",
                  b === beat
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border text-subtle hover:text-foreground",
                )}
              >
                {BEAT_LABEL[b]}
              </button>
            ))}
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-subtle">Space / ← → · Theatre.js clock</p>
        </div>
      </div>

      <Modal open={infoOpen} onClose={() => setInfoOpen(false)} title="Vertical page story">
        <div className="mb-3 flex items-center gap-3">
          <MarkImage src="/marks/mark-guard.jpg" size={56} className="rounded-[var(--radius-md)]" />
          <p className="text-sm font-medium text-foreground">BPM lock · pin · page lock · SAVE</p>
        </div>
        <ol className="list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-muted">
          <li>Three columns: disk page (left), BPM in the middle, pinned frame (right).</li>
          <li>BPM only owns the catalog map and pins. It never edits Ava or Ivy’s bytes.</li>
          <li>Each page band is labeled: header, slots down, free middle, tuples up from 0x2000.</li>
          <li>UPDATE Ava: BPM lock → LOAD+pin → BPM open → page lock on the frame → 91→99 → SAVE.</li>
          <li>INSERT Ivy: BPM lock (cache hit) → pin++ → page lock → new slot [3] → SAVE the taller page.</li>
        </ol>
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => setInfoOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function PageGuardScene(props: PageGuardVisualProps) {
  return <PageGuardInner {...props} />;
}
