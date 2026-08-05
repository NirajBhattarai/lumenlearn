"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import type { Lesson } from "@/types/lesson";
import { BufferPoolScene } from "@/components/diagrams/BufferPoolScene";
import { CachePolicyScene } from "@/components/diagrams/CachePolicyScene";
import { DiskOrientedScene } from "@/components/diagrams/DiskOrientedScene";
import { StructuresScene } from "@/components/diagrams/StructuresScene";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Panel } from "@/components/ui/Panel";
import { Stage } from "@/components/ui/Stage";
import {
  PLAYBACK_SPEEDS,
  animPresets,
  scaleDurationMs,
  type PlaybackSpeed,
} from "@/lib/animation";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Props = {
  lesson: Lesson;
};

export function LessonPlayer({ lesson }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  /** Direction of last step change — used for caption slide. */
  const [navDir, setNavDir] = useState<1 | -1>(1);
  const immersive = lesson.presentation === "immersive";
  const step = lesson.steps[stepIndex];
  const stageOwnsChrome = step.visual.component === "CachePolicyScene";
  const total = lesson.steps.length;
  const progress = ((stepIndex + 1) / total) * 100;
  const reduceMotion = prefersReducedMotion();

  const goTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(total - 1, index));
      setNavDir(next >= stepIndex ? 1 : -1);
      setStepIndex(next);
    },
    [total, stepIndex],
  );

  const next = useCallback(() => {
    setNavDir(1);
    setStepIndex((i) => {
      if (i >= total - 1) {
        setPlaying(false);
        return i;
      }
      return i + 1;
    });
  }, [total]);

  const prev = useCallback(() => {
    setNavDir(-1);
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    if (!playing) return;
    // Cache scene owns its own play/step over the access trace.
    if (step.visual.component === "CachePolicyScene") {
      setPlaying(false);
      return;
    }
    if (prefersReducedMotion()) {
      setPlaying(false);
      return;
    }
    const ms = scaleDurationMs(step.durationMs ?? 5000, speed);
    const id = window.setTimeout(() => next(), ms);
    return () => window.clearTimeout(id);
  }, [playing, step, next, speed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stageOwnsChrome) return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPlaying(false);
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPlaying(false);
        prev();
      } else if (e.key === "Home") {
        e.preventDefault();
        setPlaying(false);
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setPlaying(false);
        goTo(total - 1);
      } else if (e.key === "]" || e.key === "[") {
        e.preventDefault();
        setSpeed((current) => {
          const i = PLAYBACK_SPEEDS.indexOf(current);
          if (e.key === "]" && i < PLAYBACK_SPEEDS.length - 1) {
            return PLAYBACK_SPEEDS[i + 1]!;
          }
          if (e.key === "[" && i > 0) {
            return PLAYBACK_SPEEDS[i - 1]!;
          }
          return current;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, goTo, total, stageOwnsChrome]);

  useEffect(() => {
    if (!immersive) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [immersive]);

  /** Same component type stays mounted across steps (smooth graph morph). */
  const visual = useMemo(() => {
    if (step.visual.component === "BufferPoolScene") {
      return <BufferPoolScene {...step.visual.props} />;
    }
    if (step.visual.component === "DiskOrientedScene") {
      return <DiskOrientedScene {...step.visual.props} />;
    }
    if (step.visual.component === "StructuresScene") {
      return <StructuresScene {...step.visual.props} />;
    }
    if (step.visual.component === "CachePolicyScene") {
      return <CachePolicyScene {...step.visual.props} />;
    }
    return null;
  }, [step.visual]);

  const sceneTransition = reduceMotion
    ? { duration: 0.01 }
    : animPresets.scene(speed);

  const captionTransition = reduceMotion
    ? { duration: 0.01 }
    : {
        duration: 0.38 / speed,
        ease: [0.16, 1, 0.3, 1] as const,
      };

  const captionOffset = reduceMotion ? 0 : 10 * navDir;

  const transport = (
    <div className="flex flex-wrap items-center gap-2">
      <IconButton
        label="Restart lesson"
        onClick={() => {
          setPlaying(false);
          goTo(0);
        }}
      >
        <RotateCcw className="h-4 w-4" />
      </IconButton>
      <IconButton
        label="Previous step"
        onClick={prev}
        disabled={stepIndex === 0}
      >
        <ChevronLeft className="h-5 w-5" />
      </IconButton>
      <Button
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {playing ? "Pause" : "Play"}
      </Button>
      <IconButton
        label="Next step"
        onClick={() => {
          setPlaying(false);
          next();
        }}
        disabled={stepIndex === total - 1}
      >
        <ChevronRight className="h-5 w-5" />
      </IconButton>

      <div
        className="ml-1 flex items-center gap-0.5 border-l border-border pl-2"
        role="group"
        aria-label="Playback speed"
      >
        {PLAYBACK_SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            className={cn(
              "rounded-[var(--radius-sm)] px-1.5 py-1 font-mono text-[10px] transition-colors",
              speed === s
                ? "bg-accent text-accent-fg"
                : "text-subtle hover:bg-surface-raised hover:text-foreground",
            )}
            aria-pressed={speed === s}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );

  const stepDots = (
    <div className="flex flex-1 flex-wrap items-center justify-end gap-1.5">
      {lesson.steps.map((s, i) => (
        <button
          key={s.id}
          type="button"
          onClick={() => {
            setPlaying(false);
            goTo(i);
          }}
          title={s.title}
          className={cn(
            "h-2 rounded-full transition-all",
            i === stepIndex
              ? "w-7 bg-accent"
              : i < stepIndex
                ? "w-2 bg-accent/40"
                : "w-2 bg-border-strong hover:bg-muted",
          )}
          aria-label={`Go to step ${i + 1}: ${s.title}`}
          aria-current={i === stepIndex ? "step" : undefined}
        />
      ))}
    </div>
  );

  if (immersive) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {/* Stage stays mounted when component type is unchanged (e.g. all DiskOriented steps). */}
        <div
          className="relative min-h-0 flex-1"
          aria-live="polite"
          aria-label={step.title}
        >
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={step.visual.component}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={sceneTransition}
              className="absolute inset-0"
            >
              {visual}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <Link
            href={`/subjects/${lesson.subjectSlug}`}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border bg-surface/90 px-2.5 py-1.5 text-xs text-muted backdrop-blur-sm transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {lesson.subject}
          </Link>
          <p className="pointer-events-none font-mono text-[11px] text-subtle">
            {stageOwnsChrome
              ? lesson.title
              : `${String(stepIndex + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}
          </p>
        </div>

        {stageOwnsChrome ? null : (
          <>
            <div
              className="h-0.5 shrink-0 bg-border"
              role="progressbar"
              aria-valuenow={stepIndex + 1}
              aria-valuemin={1}
              aria-valuemax={total}
              aria-label="Lesson progress"
            >
              <motion.div
                className="h-full bg-accent"
                animate={{ width: `${progress}%` }}
                transition={
                  reduceMotion
                    ? { duration: 0.01 }
                    : { duration: 0.45 / speed, ease: [0.16, 1, 0.3, 1] }
                }
              />
            </div>

            <div className="relative shrink-0 overflow-hidden border-t border-border bg-surface/95 px-3 py-2 backdrop-blur-sm sm:px-4">
              <AnimatePresence mode="wait" initial={false} custom={navDir}>
                <motion.div
                  key={step.id}
                  custom={navDir}
                  initial={
                    reduceMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: captionOffset }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -captionOffset * 0.6 }
                  }
                  transition={captionTransition}
                >
                  <p className="text-eyebrow">{step.title}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-muted sm:text-[13px]">
                    {step.caption}
                  </p>
                  {step.callouts && step.callouts.length > 0 ? (
                    <div className="mt-2 hidden gap-2 overflow-x-auto pb-0.5 md:flex">
                      {step.callouts.map((c) => (
                        <div
                          key={c.label}
                          className="min-w-[10rem] max-w-[16rem] shrink-0 rounded-[var(--radius-md)] border border-border bg-stage px-2 py-1.5"
                        >
                          <p className="font-mono text-[9px] uppercase tracking-wider text-subtle">
                            {c.label}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-snug text-muted">
                            {c.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="pointer-events-auto flex shrink-0 flex-col gap-2 border-t border-border bg-surface/95 px-3 py-2.5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
              {transport}
              {stepDots}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[var(--max-width)] flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-eyebrow">
            {lesson.subject} · {lesson.level}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {lesson.title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{lesson.summary}</p>
        </div>
        <p className="font-mono text-xs text-subtle">
          {String(stepIndex + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </p>
      </header>

      <div
        className="h-0.5 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={stepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label="Lesson progress"
      >
        <motion.div
          className="h-full bg-accent"
          animate={{ width: `${progress}%` }}
          transition={animPresets.fade(speed)}
        />
      </div>

      <Stage aria-live="polite">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={step.visual.component}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={sceneTransition}
            className="h-full w-full"
          >
            {visual}
          </motion.div>
        </AnimatePresence>
      </Stage>

      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step.id} transition={captionTransition}>
            <Panel>
              <motion.div
                initial={
                  reduceMotion ? false : { opacity: 0, y: captionOffset }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={captionTransition}
              >
                <p className="text-eyebrow">{step.title}</p>
                <p className="mt-2 text-base leading-relaxed text-foreground">
                  {step.caption}
                </p>
              </motion.div>
            </Panel>
          </motion.div>
        </AnimatePresence>
        <div className="space-y-2">
          {(step.callouts ?? []).map((c) => (
            <Panel key={c.label} className="border-accent/25 bg-accent-muted">
              <p className="font-mono text-[11px] font-medium text-accent">
                {c.label}
              </p>
              <p className="mt-1 text-sm text-foreground/90">{c.text}</p>
            </Panel>
          ))}
        </div>
      </div>

      <Panel
        padded={false}
        className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
      >
        {transport}
        {stepDots}
      </Panel>

      <p className="text-center font-mono text-[11px] text-subtle">
        Space play/pause · ← → step · [ ] speed · Home/End jump
      </p>
    </div>
  );
}
