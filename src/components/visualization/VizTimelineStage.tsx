"use client";

import { useMemo, useState } from "react";
import type { VizState, VizTimelineStep } from "@/lib/visualization/types";
import { useVizTimeline } from "@/hooks/useVizTimeline";
import { VizCanvas } from "./VizCanvas";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import {
  PLAYBACK_SPEEDS,
  type PlaybackSpeed,
} from "@/lib/animation";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  initial: VizState;
  steps: VizTimelineStep[];
  className?: string;
  ariaLabel?: string;
  /** Show micro transport under the canvas */
  showControls?: boolean;
};

/**
 * Renders a VizState timeline with play / step / speed — for in-scene demos.
 * Lesson-level transport remains in LessonPlayer; this is the sub-timeline.
 */
export function VizTimelineStage({
  initial,
  steps,
  className,
  ariaLabel,
  showControls = true,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);

  const timeline = useVizTimeline({
    initial,
    steps,
    speed,
    playing,
    onComplete: () => setPlaying(false),
  });

  const teaches = useMemo(() => {
    if (timeline.index < 0) return "Ready — press play or step";
    return steps[timeline.index]?.label ?? "";
  }, [timeline.index, steps]);

  return (
    <div className={cn("flex h-full w-full flex-col gap-2", className)}>
      <div className="min-h-[120px] flex-1">
        <VizCanvas state={timeline.state} ariaLabel={ariaLabel} />
      </div>
      <p className="text-center font-mono text-[11px] text-muted" aria-live="polite">
        {teaches}
      </p>
      {showControls ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <IconButton
              label="Reset timeline"
              className="h-8 w-8"
              onClick={() => {
                setPlaying(false);
                timeline.reset();
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              label="Previous beat"
              className="h-8 w-8"
              onClick={() => {
                setPlaying(false);
                timeline.stepBack();
              }}
              disabled={timeline.index < 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <Button
              size="sm"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause timeline" : "Play timeline"}
            >
              {playing ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {playing ? "Pause" : "Play"}
            </Button>
            <IconButton
              label="Next beat"
              className="h-8 w-8"
              onClick={() => {
                setPlaying(false);
                timeline.stepForward();
              }}
              disabled={timeline.isComplete}
            >
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          </div>
          <div className="flex items-center gap-1" role="group" aria-label="Timeline speed">
            {PLAYBACK_SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={cn(
                  "rounded-[var(--radius-sm)] px-1.5 py-0.5 font-mono text-[10px] transition-colors",
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
      ) : null}
    </div>
  );
}
