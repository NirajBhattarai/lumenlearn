"use client";

import { motion } from "motion/react";
import type { BufferPoolVisualProps } from "@/types/lesson";
import { MarkImage } from "@/components/ui/MarkImage";
import { durations, easings } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Props = BufferPoolVisualProps;

export function BufferPoolScene({
  frames,
  diskPages,
  pageTable,
  focus = "all",
  annotation,
}: Props) {
  const dimDisk = focus === "frames" || focus === "page-table";
  const dimFrames = focus === "disk" || focus === "page-table";
  const dimTable = focus === "disk" || focus === "frames";

  return (
    <div className="flex h-full min-h-[320px] w-full flex-col gap-4 p-2 sm:p-4">
      <div className="flex items-start gap-2.5">
        <MarkImage src="/marks/mark-pages.jpg" size={40} className="rounded-[var(--radius-md)]" />
        {annotation ? (
          <motion.p
            key={annotation}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: durations.ui, ease: easings.out }}
            className="pt-1 text-sm font-medium text-cyan-200/90"
          >
            {annotation}
          </motion.p>
        ) : (
          <div className="h-5" />
        )}
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1.2fr_0.9fr]">
        {/* Disk */}
        <section
          className={cn(
            "rounded-2xl border border-white/10 bg-slate-950/60 p-3 transition-opacity",
            dimDisk && "opacity-40",
          )}
        >
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Disk (pages)
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {diskPages.map((pid) => {
              const resident = pageTable.some((e) => e.pageId === pid);
              return (
                <motion.div
                  key={pid}
                  layout
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-lg border text-sm font-semibold",
                    resident
                      ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-100"
                      : "border-white/10 bg-slate-900 text-slate-300",
                  )}
                >
                  P{pid}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Frames */}
        <section
          className={cn(
            "rounded-2xl border border-white/10 bg-slate-950/60 p-3 transition-opacity",
            dimFrames && "opacity-40",
          )}
        >
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Buffer pool (frames)
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {frames.map((frame) => (
              <motion.div
                key={frame.frameId}
                layout
                animate={{
                  scale: frame.highlight ? 1.04 : 1,
                  borderColor: frame.highlight
                    ? "rgba(34,211,238,0.8)"
                    : "rgba(255,255,255,0.1)",
                }}
                transition={{ duration: durations.scene, ease: easings.out }}
                className={cn(
                  "relative flex min-h-[88px] flex-col items-center justify-center rounded-xl border bg-slate-900/80 p-2",
                )}
              >
                <span className="absolute left-2 top-1.5 text-[10px] uppercase tracking-wider text-slate-500">
                  F{frame.frameId}
                </span>
                {frame.pageId === null ? (
                  <span className="text-sm text-slate-500">empty</span>
                ) : (
                  <motion.span
                    key={`p-${frame.pageId}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: durations.ui, ease: easings.out }}
                    className="text-lg font-bold text-white"
                  >
                    P{frame.pageId}
                  </motion.span>
                )}
                <div className="mt-2 flex gap-1">
                  {frame.pinned && (
                    <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                      pin
                    </span>
                  )}
                  {frame.dirty && (
                    <span className="rounded-full bg-rose-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose-200">
                      dirty
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Page table */}
        <section
          className={cn(
            "rounded-2xl border border-white/10 bg-slate-950/60 p-3 transition-opacity",
            dimTable && "opacity-40",
          )}
        >
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Page table
          </h3>
          {pageTable.length === 0 ? (
            <p className="text-sm text-slate-500">No resident pages yet</p>
          ) : (
            <ul className="space-y-2">
              {pageTable.map((entry) => (
                <motion.li
                  key={`${entry.pageId}-${entry.frameId}`}
                  layout
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-cyan-100">P{entry.pageId}</span>
                  <span className="text-slate-500">→</span>
                  <span className="font-medium text-white">F{entry.frameId}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
