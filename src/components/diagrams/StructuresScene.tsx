"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import {
  ArrayView,
  LinkedListView,
  VizTimelineStage,
} from "@/components/visualization";
import {
  animPresets,
  highlightNode,
  insertAfterBeat,
  stateTransition,
  timelineFromBeats,
} from "@/lib/animation";
import { layoutLinkedList } from "@/lib/visualization";
import { MarkImage } from "@/components/ui/MarkImage";
import { cn } from "@/lib/cn";

export type StructuresVisualProps = {
  mode:
    | "array"
    | "list"
    | "both"
    | "compare-access"
    | "animate-insert";
  arrayValues: Array<string | number | null>;
  listValues: Array<string | number>;
  highlightIndex?: number | null;
  highlightNodeId?: string | null;
  annotation?: string;
};

export function StructuresScene({
  mode,
  arrayValues,
  listValues,
  highlightIndex = null,
  highlightNodeId = null,
  annotation,
}: StructuresVisualProps) {
  const showArray =
    mode === "array" || mode === "both" || mode === "compare-access";
  const showList =
    mode === "list" || mode === "both" || mode === "compare-access";
  const showInsertAnim = mode === "animate-insert";

  const insertTimeline = useMemo(() => {
    const initial = layoutLinkedList({ values: ["A", "B", "D"] });
    const b = initial.nodes.find((n) => n.id === "n-1")!;
    const d = initial.nodes.find((n) => n.id === "n-2")!;
    const cNode = {
      id: "n-c",
      kind: "list-node" as const,
      label: "C",
      sublabel: "new",
      x: (b.x + d.x) / 2,
      y: b.y + 22,
      width: 36,
      height: 28,
    };
    const beats = [
      insertAfterBeat({
        id: "insert-c",
        teaches: "Cause: insert after B",
        afterId: "n-1",
        node: cNode,
        edge: {
          id: "n-1->n-c",
          from: "n-1",
          to: "n-c",
          label: "next",
        },
        durationMs: 1000,
      }),
      stateTransition(
        "relink",
        "Transition: B→D becomes B→C→D",
        [
          { type: "disconnect", edgeId: "n-1->n-2" },
          {
            type: "connect",
            edge: {
              id: "n-c->n-2",
              from: "n-c",
              to: "n-2",
              label: "next",
            },
          },
          ...highlightNode("n-c"),
        ],
        900,
      ),
      stateTransition(
        "settle",
        "Result: A → B → C → D",
        [
          {
            type: "replace",
            state: layoutLinkedList({
              values: ["A", "B", "C", "D"],
              highlightId: "n-2",
            }),
          },
        ],
        800,
      ),
    ];
    return { initial, steps: timelineFromBeats(beats) };
  }, []);

  return (
    <div className="flex h-full min-h-[320px] w-full flex-col gap-3 p-3 sm:p-4">
      <div className="flex items-start gap-2.5">
        <MarkImage src="/marks/mark-linear.jpg" size={40} className="rounded-[var(--radius-md)]" />
        {annotation ? (
          <motion.p
            key={annotation}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={animPresets.fade(1)}
            className="pt-1 text-sm font-medium text-accent"
          >
            {annotation}
          </motion.p>
        ) : (
          <div className="h-5" />
        )}
      </div>

      {showInsertAnim ? (
        <section className="flex min-h-[200px] flex-1 flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-3">
          <h3 className="text-eyebrow mb-2">Insert into list</h3>
          <VizTimelineStage
            initial={insertTimeline.initial}
            steps={insertTimeline.steps}
            className="flex-1"
            ariaLabel="Animated linked list insertion"
          />
        </section>
      ) : (
        <div
          className={cn(
            "grid flex-1 gap-3",
            showArray && showList ? "lg:grid-cols-2" : "grid-cols-1",
          )}
        >
          {showArray ? (
            <section className="flex min-h-[140px] flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-3">
              <h3 className="text-eyebrow mb-2">Array</h3>
              <div className="flex flex-1 items-center">
                <ArrayView
                  values={arrayValues}
                  highlightIndex={highlightIndex}
                  className="h-24"
                />
              </div>
              {mode === "compare-access" ? (
                <p className="mt-2 font-mono text-[11px] text-muted">
                  index {highlightIndex ?? "i"} → O(1) address
                </p>
              ) : null}
            </section>
          ) : null}

          {showList ? (
            <section className="flex min-h-[140px] flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-3">
              <h3 className="text-eyebrow mb-2">Linked list</h3>
              <div className="flex flex-1 items-center">
                <LinkedListView
                  values={listValues}
                  highlightId={highlightNodeId}
                  className="h-24"
                />
              </div>
              {mode === "compare-access" ? (
                <p className="mt-2 font-mono text-[11px] text-muted">
                  k-th node → follow next pointers
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
