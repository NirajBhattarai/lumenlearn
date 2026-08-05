import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyVizEvent, applyVizEvents } from "./reduce.ts";
import { layoutArray, layoutLinkedList } from "./layout.ts";

describe("applyVizEvent", () => {
  it("highlights nodes and clears previous highlight", () => {
    const base = layoutArray({ values: ["A", "B", "C"], highlightIndex: 0 });
    const next = applyVizEvent(base, {
      type: "highlight",
      nodeIds: ["a-2"],
    });
    assert.equal(next.nodes.find((n) => n.id === "a-0")?.status, "idle");
    assert.equal(next.nodes.find((n) => n.id === "a-2")?.status, "highlight");
  });

  it("inserts and removes nodes with dangling edges cleaned", () => {
    let state = layoutLinkedList({ values: ["A", "B"] });
    state = applyVizEvent(state, {
      type: "insert-node",
      node: {
        id: "n-2",
        label: "C",
        x: 100,
        y: 36,
        kind: "list-node",
        status: "inserting",
      },
    });
    assert.equal(state.nodes.length, 3);
    state = applyVizEvent(state, {
      type: "connect",
      edge: { id: "n-1->n-2", from: "n-1", to: "n-2", label: "next" },
    });
    assert.equal(state.edges.length, 2);
    state = applyVizEvent(state, { type: "remove-node", nodeId: "n-1" });
    assert.equal(state.nodes.some((n) => n.id === "n-1"), false);
    assert.equal(
      state.edges.some((e) => e.from === "n-1" || e.to === "n-1"),
      false,
    );
  });

  it("applies event batches", () => {
    const base = layoutArray({ values: [1, 2, 3] });
    const next = applyVizEvents(base, [
      { type: "set-status", nodeId: "a-1", status: "active" },
      { type: "focus", focusId: "a-1" },
    ]);
    assert.equal(next.focusId, "a-1");
    assert.equal(next.nodes.find((n) => n.id === "a-1")?.status, "active");
  });
});

describe("layouts", () => {
  it("layoutArray sets contiguous x positions", () => {
    const state = layoutArray({
      values: ["A", "B"],
      cellWidth: 20,
      gap: 4,
      originX: 0,
    });
    const a = state.nodes[0];
    const b = state.nodes[1];
    assert.equal(b.x - a.x, 24);
  });

  it("layoutLinkedList creates next edges", () => {
    const state = layoutLinkedList({ values: ["A", "B", "C"] });
    assert.equal(state.edges.length, 2);
    assert.equal(state.edges[0]?.from, "n-0");
    assert.equal(state.edges[0]?.to, "n-1");
  });
});
