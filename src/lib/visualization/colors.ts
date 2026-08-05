/** Animatable RGBA colors for Motion (never use CSS "transparent"). */

export const vizColor = {
  nodeFill: "rgba(17, 19, 22, 1)",
  nodeStroke: "rgba(53, 59, 68, 1)",
  nodeStrokeHighlight: "rgba(76, 139, 245, 1)",
  nodeFillHighlight: "rgba(76, 139, 245, 0.16)",
  nodeFillActive: "rgba(76, 139, 245, 0.28)",
  nodeFillGhost: "rgba(17, 19, 22, 0.45)",
  nodeStrokeGhost: "rgba(53, 59, 68, 0.55)",
  nodeFillDimmed: "rgba(17, 19, 22, 0.7)",
  label: "rgba(232, 234, 237, 1)",
  sublabel: "rgba(139, 146, 154, 1)",
  edge: "rgba(92, 99, 107, 1)",
  edgeHighlight: "rgba(76, 139, 245, 1)",
  edgeDimmed: "rgba(92, 99, 107, 0.45)",
  annotation: "rgba(76, 139, 245, 0.95)",
  /** DOM highlight surfaces — use rgba(0,0,0,0) not transparent */
  none: "rgba(0, 0, 0, 0)",
  surfaceHighlight: "rgba(76, 139, 245, 0.14)",
  borderHighlight: "rgba(76, 139, 245, 0.45)",
  borderIdle: "rgba(0, 0, 0, 0)",
} as const;

export function strokeForStatus(
  status: string | undefined,
): string {
  switch (status) {
    case "highlight":
    case "active":
    case "inserting":
      return vizColor.nodeStrokeHighlight;
    case "ghost":
      return vizColor.nodeStrokeGhost;
    case "dimmed":
    case "removing":
      return vizColor.nodeStroke;
    default:
      return vizColor.nodeStroke;
  }
}

export function fillForStatus(status: string | undefined): string {
  switch (status) {
    case "highlight":
      return vizColor.nodeFillHighlight;
    case "active":
    case "inserting":
      return vizColor.nodeFillActive;
    case "ghost":
      return vizColor.nodeFillGhost;
    case "dimmed":
    case "removing":
      return vizColor.nodeFillDimmed;
    default:
      return vizColor.nodeFill;
  }
}

export function edgeStrokeForStatus(status: string | undefined): string {
  switch (status) {
    case "highlight":
    case "active":
      return vizColor.edgeHighlight;
    case "dimmed":
      return vizColor.edgeDimmed;
    default:
      return vizColor.edge;
  }
}
