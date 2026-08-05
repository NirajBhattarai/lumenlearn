import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  highlightNode,
  insertNode,
  removeNode,
  swapNodes,
} from "./primitives.ts";
import { applyBeat, stateAtTimelineIndex, timelineFromBeats } from "./timeline.ts";
import { scaleDurationMs } from "./presets.ts";
import { layoutLinkedList } from "../visualization/layout.ts";

describe("animation primitives", () => {
  it("highlightNode emits highlight event", () => {
    const events = highlightNode("n-1");
    assert.deepEqual(events, [{ type: "highlight", nodeIds: ["n-1"] }]);
  });

  it("insertNode then removeNode round-trips list membership", () => {
    let state = layoutLinkedList({ values: ["A", "B"] });
    state = applyBeat(state, {
      id: "ins",
      teaches: "insert C",
      transition: insertNode({
        id: "n-c",
        label: "C",
        x: 80,
        y: 36,
        kind: "list-node",
      }),
    });
    assert.ok(state.nodes.some((n) => n.id === "n-c"));
    state = applyBeat(state, {
      id: "rm",
      teaches: "remove C",
      transition: removeNode("n-c"),
    });
    assert.equal(
      state.nodes.some((n) => n.id === "n-c"),
      false,
    );
  });

  it("swapNodes exchanges coordinates", () => {
    const state = layoutLinkedList({ values: ["A", "B"] });
    const a = state.nodes[0]!;
    const b = state.nodes[1]!;
    const next = applyBeat(state, {
      id: "swap",
      teaches: "swap A and B",
      transition: swapNodes(
        { id: a.id, x: a.x, y: a.y },
        { id: b.id, x: b.x, y: b.y },
      ),
    });
    assert.equal(next.nodes.find((n) => n.id === a.id)?.x, b.x);
    assert.equal(next.nodes.find((n) => n.id === b.id)?.x, a.x);
  });
});

describe("timeline", () => {
  it("stateAtTimelineIndex applies beats in order", () => {
    const initial = layoutLinkedList({ values: ["A"] });
    const steps = timelineFromBeats([
      {
        id: "h",
        teaches: "highlight head",
        transition: highlightNode("n-0"),
      },
    ]);
    const before = stateAtTimelineIndex(initial, steps, -1);
    assert.notEqual(before.nodes[0]?.status, "highlight");
    const after = stateAtTimelineIndex(initial, steps, 0);
    assert.equal(after.nodes[0]?.status, "highlight");
  });

  it("scaleDurationMs respects speed", () => {
    assert.equal(scaleDurationMs(1000, 1), 1000);
    assert.equal(scaleDurationMs(1000, 2), 500);
    assert.equal(scaleDurationMs(1000, 0.5), 2000);
  });
});
