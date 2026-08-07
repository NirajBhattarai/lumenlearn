"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
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
import type { DiskOrientedVisualProps } from "@/types/lesson";
import { MarkImage } from "@/components/ui/MarkImage";
import { buildDiskFlowGraph } from "./disk-flow/buildGraph";
import { diskNodeTypes } from "./disk-flow/nodes";
import type { StudentRow } from "./disk-flow/sample";
import { prefersReducedMotion } from "@/lib/motion";

type Props = DiskOrientedVisualProps;

const FIT_MS = 480;
const FIT_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function DiskFlowInner(props: Props) {
  const [explorePageId, setExplorePageId] = useState<number | null>(null);
  const [exploreSlot, setExploreSlot] = useState<number | null>(null);
  const [folderEntryId, setFolderEntryId] = useState<string | null>(null);
  const { fitView } = useReactFlow();
  const reduce = prefersReducedMotion();
  const fitTimer = useRef<number | null>(null);
  const prevFocus = useRef(props.focus);

  useEffect(() => {
    setExplorePageId(null);
    setExploreSlot(null);
    setFolderEntryId(null);
  }, [props.focus, props.highlightPageId]);

  const onSelectPage = useCallback((pageId: number) => {
    setExplorePageId(pageId);
    setExploreSlot(null);
  }, []);

  const onSelectRow = useCallback((row: StudentRow) => {
    setExplorePageId(row.pageId);
    setExploreSlot(row.slot);
  }, []);

  const onSelectSlot = useCallback((slot: number) => {
    setExploreSlot(slot);
  }, []);

  const onSelectFolderEntry = useCallback((id: string) => {
    setFolderEntryId(id);
    if (id === "db") setExplorePageId(1);
  }, []);

  const built = useMemo(
    () =>
      buildDiskFlowGraph(props, {
        explorePageId,
        exploreSlot,
        folderEntryId,
        onSelectPage,
        onSelectRow,
        onSelectSlot,
        onSelectFolderEntry,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      props.focus,
      props.highlightPageId,
      props.activeLink,
      props.folderHighlight,
      props.frames,
      props.pageTable,
      props.requestLabel,
      props.annotation,
      explorePageId,
      exploreSlot,
      folderEntryId,
      onSelectPage,
      onSelectRow,
      onSelectSlot,
      onSelectFolderEntry,
    ],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(built.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(built.edges);

  // Morph graph: keep shared node ids so React Flow can interpolate positions.
  useEffect(() => {
    setNodes(built.nodes);
    setEdges(built.edges);
  }, [built, setNodes, setEdges]);

  // Smooth camera after graph settles (step change or local explore).
  useEffect(() => {
    if (fitTimer.current != null) window.clearTimeout(fitTimer.current);

    const focusChanged = prevFocus.current !== props.focus;
    prevFocus.current = props.focus;

    const delay = focusChanged ? 40 : 0;
    const duration = reduce ? 0 : focusChanged ? FIT_MS : 280;

    fitTimer.current = window.setTimeout(() => {
      fitView({
        padding: 0.14,
        maxZoom: 1.05,
        minZoom: 0.25,
        duration,
        // @xyflow uses number ms for duration
      });
    }, delay);

    return () => {
      if (fitTimer.current != null) window.clearTimeout(fitTimer.current);
    };
  }, [built, fitView, props.focus, reduce]);

  useEffect(() => {
    const onResize = () => {
      fitView({
        padding: 0.14,
        maxZoom: 1.05,
        duration: reduce ? 0 : 200,
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fitView, reduce]);

  return (
    <div className="absolute inset-0 h-full w-full bg-stage">
      <div className="pointer-events-none absolute left-3 top-14 z-10 flex max-w-[min(90vw,28rem)] items-start gap-2 sm:left-4">
        <MarkImage
          src="/marks/mark-disk.jpg"
          size={44}
          className="rounded-[var(--radius-md)] shadow-[var(--shadow-stage)]"
        />
        <AnimatePresence mode="wait" initial={false}>
          {props.annotation ? (
            <motion.div
              key={props.annotation}
              initial={reduce ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: reduce ? 0.01 : 0.32, ease: FIT_EASE }}
              className="rounded-[var(--radius-md)] border border-border bg-surface/90 px-2.5 py-1.5 backdrop-blur-sm"
            >
              <p className="font-mono text-[10px] text-muted sm:text-[11px]">
                {props.annotation}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={diskNodeTypes as NodeTypes}
        fitView
        fitViewOptions={{ padding: 0.14, maxZoom: 1.05, duration: 0 }}
        minZoom={0.2}
        maxZoom={1.5}
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
          showInteractive={false}
          className="!overflow-hidden !rounded-[var(--radius-md)] !border !border-border !bg-surface !shadow-none"
        />
      </ReactFlow>
    </div>
  );
}

export function DiskOrientedScene(props: Props) {
  return (
    <ReactFlowProvider>
      <DiskFlowInner {...props} />
    </ReactFlowProvider>
  );
}
