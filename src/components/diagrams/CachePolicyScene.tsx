"use client";

/**
 * Next-level cache replacement animation.
 * Pedagogy (CMU buffer pool + OS clock demos + UMass policy simulators):
 * - Show DISK pages and RAM frames as separate worlds
 * - Each access is a multi-beat story: request → hit/miss → victim → land
 * - Policy structures animate (stack, clock hand, 2Q/ARC lists)
 * - Same students-page workload as lesson 1
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import {
  Pause,
  Play,
  RotateCcw,
  StepBack,
  StepForward,
} from "lucide-react";
import type { CachePolicyVisualProps } from "@/types/lesson";
import { simulatePolicy } from "@/lib/cache-policies/simulate";
import { POLICY_META, type PolicySnapshot } from "@/lib/cache-policies/types";
import {
  DEFAULT_CAPACITY,
  pageLabel,
  pageWho,
  STUDENTS_ACCESS_TRACE,
  WORKLOAD_PAGES,
} from "@/lib/cache-policies/sample";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Props = CachePolicyVisualProps;

/** Sub-beats within one access for cinematic pacing */
type Beat = "idle" | "request" | "decide" | "evict" | "load" | "done";

const SPEEDS = [0.5, 1, 1.5, 2] as const;
type Speed = (typeof SPEEDS)[number];

const ease = [0.16, 1, 0.3, 1] as const;

function beatMs(beat: Beat, speed: Speed, reduce: boolean): number {
  if (reduce) return 0;
  const base: Record<Beat, number> = {
    idle: 0,
    request: 520,
    decide: 380,
    evict: 620,
    load: 580,
    done: 280,
  };
  return Math.round(base[beat] / speed);
}

function PageChip({
  pageId,
  size = "md",
  ghost,
  pulse,
  dim,
  sharedLayout,
}: {
  pageId: number;
  size?: "sm" | "md" | "lg";
  ghost?: boolean;
  pulse?: boolean;
  dim?: boolean;
  /** Only frame residents share layout ids — lists/disk copies must not. */
  sharedLayout?: boolean;
}) {
  const sizes = {
    sm: "h-8 min-w-[2rem] px-1.5 text-[10px]",
    md: "h-11 min-w-[2.75rem] px-2 text-xs",
    lg: "h-14 min-w-[3.25rem] px-2.5 text-sm",
  };
  return (
    <motion.div
      layoutId={sharedLayout ? `cache-page-${pageId}` : undefined}
      layout={sharedLayout}
      className={cn(
        "inline-flex flex-col items-center justify-center rounded-[var(--radius-md)] border font-mono font-semibold",
        sizes[size],
        ghost
          ? "border-dashed border-border-strong bg-transparent text-subtle"
          : "border-border-strong bg-surface text-foreground shadow-[0_1px_0_color-mix(in_srgb,#fff_6%,transparent)]",
        pulse && "border-accent bg-accent-muted text-accent",
        dim && "opacity-35",
      )}
      transition={{ layout: { duration: 0.45, ease }, duration: 0.35, ease }}
    >
      <span>{pageLabel(pageId)}</span>
      {size !== "sm" ? (
        <span className="max-w-[4.5rem] truncate text-[8px] font-normal text-muted">
          {pageWho(pageId).split(",")[0]}
        </span>
      ) : null}
    </motion.div>
  );
}

function FrameSlot({
  frameId,
  pageId,
  refBit,
  list,
  isTarget,
  isVictimFrame,
  hand,
}: {
  frameId: number;
  pageId: number | null;
  refBit?: boolean;
  list?: string;
  isTarget?: boolean;
  isVictimFrame?: boolean;
  hand?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-[100px] flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 bg-stage p-2 transition-colors",
        isTarget && "border-accent bg-accent-muted/40",
        isVictimFrame && "border-danger bg-danger/10",
        !isTarget && !isVictimFrame && "border-border",
        hand && "ring-2 ring-accent ring-offset-2 ring-offset-stage",
      )}
    >
      <span className="absolute left-2 top-1.5 font-mono text-[9px] uppercase tracking-wider text-subtle">
        frame {frameId}
      </span>
      {hand ? (
        <span className="absolute right-2 top-1.5 font-mono text-[9px] font-semibold text-accent">
          hand
        </span>
      ) : null}
      <div className="mt-3 flex flex-1 items-center justify-center">
        <AnimatePresence mode="popLayout">
          {pageId != null ? (
            <PageChip
              key={pageId}
              pageId={pageId}
              size="lg"
              pulse={isTarget}
              dim={isVictimFrame}
              sharedLayout
            />
          ) : (
            <motion.span
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono text-sm text-subtle"
            >
              empty
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-1 flex min-h-[16px] flex-wrap justify-center gap-1">
        {refBit != null && pageId != null ? (
          <span
            className={cn(
              "rounded px-1 font-mono text-[8px]",
              refBit ? "bg-ok/20 text-ok" : "bg-surface text-subtle",
            )}
          >
            ref={refBit ? 1 : 0}
          </span>
        ) : null}
        {list ? (
          <span className="rounded bg-accent-muted px-1 font-mono text-[8px] text-accent">
            {list}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function StructureLane({
  title,
  pages,
  active,
  ghost,
  mruHint,
}: {
  title: string;
  pages: number[];
  active?: number | null;
  ghost?: boolean;
  mruHint?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-stage/60 p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="font-mono text-[10px] font-medium text-muted">{title}</p>
        {mruHint ? (
          <p className="font-mono text-[8px] text-subtle">← LRU · MRU →</p>
        ) : null}
      </div>
      <div className="flex min-h-[44px] flex-wrap items-center gap-1.5">
        <AnimatePresence mode="popLayout">
          {pages.length === 0 ? (
            <motion.span
              key="empty"
              className="font-mono text-[10px] text-subtle"
            >
              ∅
            </motion.span>
          ) : (
            pages.map((pid) => (
              <PageChip
                key={`${title}-${pid}`}
                pageId={pid}
                size="sm"
                ghost={ghost}
                pulse={active === pid}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ClockFace({
  frames,
  hand,
  victimPage,
  targetPage,
  beat,
}: {
  frames: PolicySnapshot["frames"];
  hand: number;
  victimPage: number | null;
  targetPage: number | null;
  beat: Beat;
}) {
  const n = frames.length;
  const r = 88;
  return (
    <div className="relative mx-auto h-[220px] w-[220px]">
      <div className="absolute inset-4 rounded-full border border-border-strong" />
      {/* hand */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[2px] w-[78px] origin-left bg-accent"
        style={{ marginLeft: 0 }}
        animate={{ rotate: (hand / n) * 360 - 90 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
      />
      <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
      {frames.map((f, i) => {
        const ang = ((i / n) * 360 - 90) * (Math.PI / 180);
        const x = Math.cos(ang) * r;
        const y = Math.sin(ang) * r;
        return (
          <div
            key={f.frameId}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
          >
            <div
              className={cn(
                "flex h-12 w-12 flex-col items-center justify-center rounded-full border bg-surface font-mono text-[10px]",
                hand === i && "border-accent shadow-[0_0_0_2px_var(--accent)]",
                f.pageId === victimPage &&
                  beat === "evict" &&
                  "border-danger bg-danger/15",
                f.pageId === targetPage &&
                  (beat === "load" || beat === "done") &&
                  "border-accent bg-accent-muted",
                hand !== i &&
                  f.pageId !== victimPage &&
                  f.pageId !== targetPage &&
                  "border-border",
              )}
            >
              <span className="text-[8px] text-subtle">F{f.frameId}</span>
              <span className="font-semibold text-foreground">
                {f.pageId == null ? "·" : pageLabel(f.pageId)}
              </span>
              {f.ref != null && f.pageId != null ? (
                <span className="text-[7px] text-muted">r{f.ref ? 1 : 0}</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CachePolicyScene({
  policy,
  capacity = DEFAULT_CAPACITY,
  trace = STUDENTS_ACCESS_TRACE,
  annotation,
}: Props) {
  const run = useMemo(
    () => simulatePolicy(policy, trace, capacity),
    [policy, trace, capacity],
  );
  const [step, setStep] = useState(0);
  const [beat, setBeat] = useState<Beat>("idle");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const reduce = prefersReducedMotion();
  const timers = useRef<number[]>([]);
  const meta = POLICY_META[policy];
  const maxStep = run.snapshots.length - 1;
  const snap = run.snapshots[step] ?? run.snapshots[0]!;

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => {
    setStep(0);
    setBeat("idle");
    setPlaying(false);
    clearTimers();
  }, [policy, capacity, trace]);

  useEffect(() => () => clearTimers(), []);

  /** Run cinematic beats for advancing to `toStep` */
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

      if (reduce) {
        setStep(toStep);
        setBeat("done");
        if (autoContinue && toStep < maxStep) {
          const id = window.setTimeout(
            () => playAccessTo(toStep + 1, true),
            200,
          );
          timers.current.push(id);
        } else if (autoContinue) setPlaying(false);
        return;
      }

      // Start from previous settled state, animate into target
      setStep(toStep - 1);
      setBeat("request");

      let t = 0;
      const schedule = (fn: () => void, ms: number) => {
        t += ms;
        timers.current.push(window.setTimeout(fn, t));
      };

      schedule(() => setBeat("decide"), beatMs("request", speed, reduce));

      if (miss && hasVictim) {
        schedule(() => {
          setBeat("evict");
        }, beatMs("decide", speed, reduce));
        schedule(() => {
          setStep(toStep);
          setBeat("load");
        }, beatMs("evict", speed, reduce));
        schedule(() => {
          setBeat("done");
        }, beatMs("load", speed, reduce));
        schedule(() => {
          if (autoContinue && toStep < maxStep) {
            playAccessTo(toStep + 1, true);
          } else {
            setPlaying(false);
          }
        }, beatMs("done", speed, reduce));
      } else if (miss) {
        schedule(() => {
          setStep(toStep);
          setBeat("load");
        }, beatMs("decide", speed, reduce));
        schedule(() => setBeat("done"), beatMs("load", speed, reduce));
        schedule(() => {
          if (autoContinue && toStep < maxStep) playAccessTo(toStep + 1, true);
          else setPlaying(false);
        }, beatMs("done", speed, reduce));
      } else {
        // hit
        schedule(() => {
          setStep(toStep);
          setBeat("done");
        }, beatMs("decide", speed, reduce));
        schedule(() => {
          if (autoContinue && toStep < maxStep) playAccessTo(toStep + 1, true);
          else setPlaying(false);
        }, beatMs("done", speed, reduce) + beatMs("load", speed, reduce) * 0.4);
      }
    },
    [run.snapshots, maxStep, reduce, speed],
  );

  const onPlay = () => {
    if (playing) {
      setPlaying(false);
      clearTimers();
      setBeat("done");
      return;
    }
    setPlaying(true);
    const next = step >= maxStep ? 1 : step + 1;
    if (step >= maxStep) {
      setStep(0);
      playAccessTo(1, true);
    } else {
      playAccessTo(next, true);
    }
  };

  const onStep = () => {
    setPlaying(false);
    clearTimers();
    if (step >= maxStep) return;
    playAccessTo(step + 1, false);
  };

  const onBack = () => {
    setPlaying(false);
    clearTimers();
    setBeat("idle");
    setStep((s) => Math.max(0, s - 1));
  };

  const onReset = () => {
    setPlaying(false);
    clearTimers();
    setStep(0);
    setBeat("idle");
  };

  // During request/decide/evict, `step` is still the previous settled snapshot.
  const displaySnap = snap;

  /** Access currently being animated (next snap while stepping into it). */
  const incoming =
    beat === "request" || beat === "decide" || beat === "evict"
      ? (run.snapshots[step + 1] ?? snap)
      : snap;

  const showRequest =
    beat === "request" ||
    beat === "decide" ||
    beat === "evict" ||
    beat === "load";

  const pendingAccess = beat === "idle" ? null : incoming.access;
  const decideHit = incoming.hit;
  const victimPage =
    beat === "evict"
      ? incoming.victim
      : beat === "load" || beat === "done"
        ? snap.victim
        : null;

  const hand =
    policy === "clock" ? (displaySnap.structures.hand?.[0] ?? 0) : -1;

  const structureEntries = Object.entries(
    beat === "done" || beat === "load" || beat === "idle"
      ? snap.structures
      : displaySnap.structures,
  ).filter(
    ([k]) => !["ref_bits", "hand", "target_p", "kth_oldest_first"].includes(k),
  );

  const statusLabel = (() => {
    if (beat === "idle") return "Ready — press Play or Step";
    if (pendingAccess == null) return "…";
    if (beat === "request")
      return `Executor requests ${pageLabel(pendingAccess)}…`;
    if (beat === "decide")
      return decideHit
        ? `Page table HIT — ${pageLabel(pendingAccess)} already in a frame`
        : `Page table MISS — ${pageLabel(pendingAccess)} not in RAM`;
    if (beat === "evict")
      return `Policy picks victim ${victimPage != null ? pageLabel(victimPage) : "?"} · free a frame`;
    if (beat === "load")
      return `DiskManager reads ${pageLabel(pendingAccess)} → install into frame`;
    if (snap.hit)
      return `HIT ${pageLabel(snap.access!)} — policy metadata updated`;
    return `MISS ${pageLabel(snap.access!)} done · hits ${snap.hits} · misses ${snap.misses}`;
  })();

  return (
    <LayoutGroup>
      <div className="flex h-full min-h-0 w-full flex-col gap-0 overflow-hidden bg-stage">
        {/* Title bar */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-surface/90 px-3 py-2 sm:px-4">
          <div className="min-w-0">
            <p className="text-eyebrow text-accent">{meta.name}</p>
            <p className="truncate text-sm font-semibold text-foreground">
              {meta.short}
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-ok">hits {snap.hits}</span>
            <span className="text-danger">misses {snap.misses}</span>
            <span className="text-muted">
              {step}/{trace.length}
            </span>
          </div>
        </div>

        {/* Status ticker */}
        <div className="shrink-0 border-b border-border bg-surface px-3 py-2 sm:px-4">
          <AnimatePresence mode="wait">
            <motion.p
              key={statusLabel}
              initial={reduce ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: 8 }}
              transition={{ duration: 0.25, ease }}
              className="font-mono text-[12px] text-foreground sm:text-[13px]"
              aria-live="polite"
            >
              {statusLabel}
            </motion.p>
          </AnimatePresence>
          <p className="mt-0.5 text-[11px] text-muted">{meta.rule}</p>
          {annotation ? (
            <p className="mt-0.5 font-mono text-[10px] text-subtle">
              {annotation}
            </p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[0.9fr_1.3fr]">
            {/* LEFT: disk + request flight */}
            <div className="flex flex-col gap-3">
              <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-eyebrow">Disk · students pages</h3>
                  <span className="font-mono text-[9px] text-subtle">
                    bustub.db
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {WORKLOAD_PAGES.map((p) => {
                    const resident = displaySnap.frames.some(
                      (f) => f.pageId === p.id,
                    );
                    const requesting = pendingAccess === p.id && showRequest;
                    return (
                      <div key={p.id} className="flex flex-col items-center gap-1">
                        <div
                          className={cn(
                            "rounded-[var(--radius-md)] border p-1",
                            requesting && "border-accent bg-accent-muted",
                            resident && !requesting && "border-ok/40",
                            !resident && !requesting && "border-border",
                          )}
                        >
                          {/* Don't use layoutId on disk copy when also in frame — only flying chip uses layoutId */}
                          <div
                            className={cn(
                              "flex h-12 w-12 flex-col items-center justify-center rounded-[var(--radius-sm)] border font-mono text-[11px] font-semibold",
                              resident
                                ? "border-ok/30 bg-ok/10 text-foreground"
                                : "border-border bg-stage text-muted",
                            )}
                          >
                            {p.label}
                          </div>
                        </div>
                        <span className="max-w-[4rem] truncate text-center font-mono text-[8px] text-subtle">
                          {p.who.split(",")[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Flying request */}
              <section className="relative flex min-h-[72px] items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface/50 p-3">
                <p className="absolute left-3 top-2 font-mono text-[9px] text-subtle">
                  request path
                </p>
                <AnimatePresence>
                  {pendingAccess != null &&
                  beat !== "idle" &&
                  beat !== "done" ? (
                    <motion.div
                      key={`fly-${pendingAccess}-${step}-${beat}`}
                      initial={
                        reduce
                          ? false
                          : { opacity: 0, y: -24, scale: 0.8 }
                      }
                      animate={{
                        opacity: 1,
                        y: beat === "evict" ? 10 : beat === "load" ? 16 : 0,
                        scale: beat === "load" ? 1.12 : 1,
                      }}
                      exit={{ opacity: 0, y: 20, scale: 0.85 }}
                      transition={{ duration: 0.42, ease }}
                      className="flex flex-col items-center gap-1"
                    >
                      <PageChip pageId={pendingAccess} size="md" pulse />
                      <span className="font-mono text-[10px] text-accent">
                        {decideHit && beat !== "load" && beat !== "evict"
                          ? "→ hit: touch frame / policy list"
                          : beat === "evict"
                            ? "miss: wait for eviction…"
                            : beat === "load"
                              ? "→ copy 8 KB into frame"
                              : "→ probe page table"}
                      </span>
                    </motion.div>
                  ) : snap.access != null && beat === "done" ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-mono text-[11px] text-muted"
                    >
                      last: {pageLabel(snap.access)} ·{" "}
                      {snap.hit ? (
                        <span className="text-ok">hit</span>
                      ) : (
                        <span className="text-danger">miss</span>
                      )}
                    </motion.div>
                  ) : (
                    <span className="font-mono text-[11px] text-subtle">
                      executor waits…
                    </span>
                  )}
                </AnimatePresence>
              </section>

              {/* Trace */}
              <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
                <p className="text-eyebrow">Access trace</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {trace.map((pid, i) => {
                    const done = i < step;
                    const current =
                      (beat !== "idle" && i === step) ||
                      (beat === "done" && i === step - 1);
                    return (
                      <button
                        key={`${pid}-${i}`}
                        type="button"
                        onClick={() => {
                          setPlaying(false);
                          clearTimers();
                          setStep(i + 1);
                          setBeat("done");
                        }}
                        className={cn(
                          "rounded-[var(--radius-sm)] border px-1.5 py-1 font-mono text-[10px] transition-colors",
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
              </section>
            </div>

            {/* RIGHT: frames + policy */}
            <div className="flex flex-col gap-3">
              <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-eyebrow">RAM · buffer frames</h3>
                  <span className="font-mono text-[9px] text-subtle">
                    capacity {capacity}
                  </span>
                </div>

                {policy === "clock" ? (
                  <ClockFace
                    frames={displaySnap.frames}
                    hand={hand}
                    victimPage={beat === "evict" ? victimPage : null}
                    targetPage={
                      beat === "load" || beat === "done"
                        ? (snap.access ?? null)
                        : null
                    }
                    beat={beat}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {displaySnap.frames.map((f) => {
                      const isVictimFrame =
                        beat === "evict" &&
                        f.pageId != null &&
                        f.pageId === victimPage;
                      const settled = beat === "load" || beat === "done";
                      const isTarget =
                        settled &&
                        snap.access != null &&
                        f.pageId === snap.access;
                      return (
                        <FrameSlot
                          key={f.frameId}
                          frameId={f.frameId}
                          pageId={f.pageId}
                          refBit={f.ref}
                          list={f.list}
                          isTarget={Boolean(isTarget)}
                          isVictimFrame={Boolean(isVictimFrame)}
                        />
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
                <h3 className="text-eyebrow mb-2">Policy structure</h3>
                <div className="space-y-2">
                  {structureEntries.map(([name, pages]) => (
                    <StructureLane
                      key={name}
                      title={name.replace(/_/g, " ")}
                      pages={pages}
                      active={snap.access}
                      ghost={name.includes("ghost") || name.includes("B1") || name.includes("B2")}
                      mruHint={
                        name.includes("recency") ||
                        name.includes("Am") ||
                        name.includes("T1") ||
                        name.includes("T2")
                      }
                    />
                  ))}
                  {policy === "arc" && displaySnap.structures.target_p ? (
                    <div className="rounded-[var(--radius-md)] border border-accent/30 bg-accent-muted/30 px-2 py-1.5 font-mono text-[11px] text-accent">
                      adaptive target p = {displaySnap.structures.target_p[0]}
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Transport */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border bg-surface px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border text-muted hover:text-foreground"
            aria-label="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={step <= 0}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border text-foreground disabled:opacity-30"
            aria-label="Previous access"
          >
            <StepBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onPlay}
            className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] bg-accent px-4 font-mono text-[12px] font-semibold text-accent-fg"
          >
            {playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={onStep}
            disabled={step >= maxStep && beat === "done"}
            className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] border border-border px-3 font-mono text-[12px] text-foreground disabled:opacity-30"
          >
            <StepForward className="h-4 w-4" />
            Step
          </button>

          <div
            className="ml-1 flex items-center gap-0.5 border-l border-border pl-2"
            role="group"
            aria-label="Speed"
          >
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={cn(
                  "rounded px-1.5 py-1 font-mono text-[10px]",
                  speed === s
                    ? "bg-accent text-accent-fg"
                    : "text-subtle hover:text-foreground",
                )}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="ml-auto h-1.5 w-28 overflow-hidden rounded-full bg-border sm:w-40">
            <motion.div
              className="h-full bg-accent"
              animate={{
                width: `${maxStep === 0 ? 0 : (step / maxStep) * 100}%`,
              }}
              transition={{ duration: 0.3, ease }}
            />
          </div>
        </div>
      </div>
    </LayoutGroup>
  );
}
