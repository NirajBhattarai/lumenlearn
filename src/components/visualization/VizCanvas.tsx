"use client";

import { motion } from "motion/react";
import type { VizEdge, VizNode, VizState } from "@/lib/visualization/types";
import {
  edgeStrokeForStatus,
  fillForStatus,
  strokeForStatus,
  vizColor,
} from "@/lib/visualization/colors";
import { durations, easings } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Props = {
  state: VizState;
  className?: string;
  /** Accessible description of the current visual */
  ariaLabel?: string;
};

function nodeBox(n: VizNode) {
  const w = n.width ?? 24;
  const h = n.height ?? 24;
  return { x: n.x - w / 2, y: n.y - h / 2, w, h };
}

function VizEdgeLine({
  edge,
  from,
  to,
}: {
  edge: VizEdge;
  from: VizNode;
  to: VizNode;
}) {
  const active =
    edge.status === "highlight" || edge.status === "active";
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  return (
    <g>
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={edgeStrokeForStatus(edge.status)}
        strokeWidth={active ? 1.4 : 0.7}
        initial={false}
        animate={{ opacity: active ? 1 : 0.75 }}
        transition={{ duration: durations.ui, ease: easings.out }}
      />
      {edge.label ? (
        <text
          x={midX}
          y={midY - 3}
          fill={active ? vizColor.annotation : vizColor.sublabel}
          fontSize="3.2"
          textAnchor="middle"
        >
          {edge.label}
        </text>
      ) : null}
    </g>
  );
}

function VizNodeShape({ node }: { node: VizNode }) {
  const { x, y, w, h } = nodeBox(node);
  const active =
    node.status === "highlight" ||
    node.status === "active" ||
    node.status === "inserting";

  return (
    <g>
      <motion.rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={2}
        initial={false}
        animate={{
          fill: fillForStatus(node.status),
          stroke: strokeForStatus(node.status),
          scale: active ? 1.04 : 1,
        }}
        style={{ transformOrigin: `${node.x}px ${node.y}px` }}
        strokeWidth={0.8}
        transition={{ duration: durations.scene, ease: easings.out }}
      />
      <text
        x={node.x}
        y={node.y - (node.sublabel ? 1 : 0)}
        fill={vizColor.label}
        fontSize={Math.min(5.5, w * 0.35)}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {node.label}
      </text>
      {node.sublabel ? (
        <text
          x={node.x}
          y={node.y + h * 0.28}
          fill={vizColor.sublabel}
          fontSize={Math.min(3.2, w * 0.22)}
          textAnchor="middle"
        >
          {node.sublabel}
        </text>
      ) : null}
    </g>
  );
}

/** SVG renderer for a VizState snapshot. */
export function VizCanvas({ state, className, ariaLabel }: Props) {
  const byId = Object.fromEntries(state.nodes.map((n) => [n.id, n]));

  return (
    <svg
      viewBox={state.viewBox}
      className={cn("h-full w-full", className)}
      role="img"
      aria-label={ariaLabel ?? "Technical diagram"}
    >
      {state.edges.map((edge) => {
        const from = byId[edge.from];
        const to = byId[edge.to];
        if (!from || !to) return null;
        return (
          <VizEdgeLine key={edge.id} edge={edge} from={from} to={to} />
        );
      })}
      {state.nodes.map((node) => (
        <VizNodeShape key={node.id} node={node} />
      ))}
      {(state.annotations ?? []).map((a) => (
        <text
          key={a.id}
          x={a.x ?? 4}
          y={a.y ?? 8}
          fill={vizColor.annotation}
          fontSize="4"
          textAnchor={a.anchor ?? "start"}
        >
          {a.text}
        </text>
      ))}
    </svg>
  );
}
