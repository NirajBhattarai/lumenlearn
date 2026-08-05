import type { VizEvent, VizNode, VizState } from "./types.ts";

function mapNodes(
  nodes: VizNode[],
  fn: (n: VizNode) => VizNode,
): VizNode[] {
  return nodes.map(fn);
}

/** Pure reducer: VisualizationState + Event → VisualizationState */
export function applyVizEvent(state: VizState, event: VizEvent): VizState {
  switch (event.type) {
    case "replace":
      return event.state;

    case "highlight": {
      const nodeSet = new Set(event.nodeIds ?? []);
      const edgeSet = new Set(event.edgeIds ?? []);
      return {
        ...state,
        nodes: mapNodes(state.nodes, (n) => ({
          ...n,
          status: nodeSet.has(n.id)
            ? "highlight"
            : n.status === "highlight"
              ? "idle"
              : n.status,
        })),
        edges: state.edges.map((e) => ({
          ...e,
          status: edgeSet.has(e.id)
            ? "highlight"
            : e.status === "highlight"
              ? "idle"
              : e.status,
        })),
      };
    }

    case "clear-highlight":
      return {
        ...state,
        nodes: mapNodes(state.nodes, (n) =>
          n.status === "highlight" ? { ...n, status: "idle" } : n,
        ),
        edges: state.edges.map((e) =>
          e.status === "highlight" ? { ...e, status: "idle" } : e,
        ),
        focusId: null,
      };

    case "set-status":
      return {
        ...state,
        nodes: mapNodes(state.nodes, (n) =>
          n.id === event.nodeId ? { ...n, status: event.status } : n,
        ),
      };

    case "move-node":
      return {
        ...state,
        nodes: mapNodes(state.nodes, (n) =>
          n.id === event.nodeId ? { ...n, x: event.x, y: event.y } : n,
        ),
      };

    case "insert-node":
      if (state.nodes.some((n) => n.id === event.node.id)) return state;
      return { ...state, nodes: [...state.nodes, event.node] };

    case "remove-node":
      return {
        ...state,
        nodes: state.nodes.filter((n) => n.id !== event.nodeId),
        edges: state.edges.filter(
          (e) => e.from !== event.nodeId && e.to !== event.nodeId,
        ),
      };

    case "connect":
      if (state.edges.some((e) => e.id === event.edge.id)) return state;
      return { ...state, edges: [...state.edges, event.edge] };

    case "disconnect":
      return {
        ...state,
        edges: state.edges.filter((e) => e.id !== event.edgeId),
      };

    case "change-value":
      return {
        ...state,
        nodes: mapNodes(state.nodes, (n) =>
          n.id === event.nodeId
            ? {
                ...n,
                label: event.label,
                sublabel:
                  event.sublabel !== undefined ? event.sublabel : n.sublabel,
              }
            : n,
        ),
      };

    case "retarget-edge":
      return {
        ...state,
        edges: state.edges.map((e) =>
          e.id === event.edgeId ? { ...e, to: event.to, status: "active" } : e,
        ),
      };

    case "annotate": {
      const rest = (state.annotations ?? []).filter(
        (a) => a.id !== event.annotation.id,
      );
      return { ...state, annotations: [...rest, event.annotation] };
    }

    case "focus":
      return { ...state, focusId: event.focusId };

    default:
      return state;
  }
}

export function applyVizEvents(
  state: VizState,
  events: VizEvent[],
): VizState {
  return events.reduce(applyVizEvent, state);
}
