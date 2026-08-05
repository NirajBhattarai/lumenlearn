import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { simulatePolicy } from "./simulate.ts";
import { STUDENTS_ACCESS_TRACE } from "./sample.ts";

describe("simulatePolicy LRU", () => {
  it("evicts the least-recent page when full", () => {
    const run = simulatePolicy("lru", [1, 2, 3, 4, 1], 3);
    const last = run.snapshots.at(-1)!;
    assert.equal(last.hit, false);
    assert.equal(last.victim, 2);
    assert.equal(last.hits, 0);
    assert.equal(last.misses, 5);
    assert.deepEqual(
      last.frames.map((f) => f.pageId),
      [3, 4, 1],
    );
    const miss4 = run.snapshots.find((s) => s.access === 4 && s.step === 4)!;
    assert.equal(miss4.victim, 1);
    assert.equal(miss4.hit, false);
  });

  it("moves a hit to the MRU end without eviction", () => {
    const run = simulatePolicy("lru", [1, 2, 1], 2);
    const hit = run.snapshots[3]!;
    assert.equal(hit.hit, true);
    assert.equal(hit.victim, null);
    assert.deepEqual(hit.structures.recency_mru_end, [2, 1]);
  });
});

describe("simulatePolicy MRU", () => {
  it("evicts the most recently used page on miss", () => {
    const run = simulatePolicy("mru", [1, 2, 3], 2);
    const miss3 = run.snapshots[3]!;
    assert.equal(miss3.hit, false);
    assert.equal(miss3.victim, 2);
    assert.deepEqual(
      miss3.frames.map((f) => f.pageId),
      [1, 3],
    );
  });
});

describe("simulatePolicy clock", () => {
  it("clears ref bits then evicts the first ref=0 frame", () => {
    const run = simulatePolicy("clock", [1, 2, 3], 2);
    const miss3 = run.snapshots.at(-1)!;
    assert.equal(miss3.hit, false);
    assert.equal(miss3.victim, 1);
    assert.deepEqual(
      miss3.frames.map((f) => f.pageId),
      [3, 2],
    );
  });
});

describe("simulatePolicy 2Q", () => {
  it("promotes a re-reference from A1in to Am", () => {
    const run = simulatePolicy("two-q", [1, 2, 1], 4);
    const hit = run.snapshots.at(-1)!;
    assert.equal(hit.hit, true);
    assert.deepEqual(hit.structures.A1in_fifo, [2]);
    assert.deepEqual(hit.structures.Am_lru_mru_end, [1]);
  });
});

describe("simulatePolicy ARC", () => {
  it("moves a T1 hit into T2", () => {
    const run = simulatePolicy("arc", [1, 1], 2);
    const hit = run.snapshots.at(-1)!;
    assert.equal(hit.hit, true);
    assert.deepEqual(hit.structures.T1, []);
    assert.deepEqual(hit.structures.T2, [1]);
  });
});

describe("students workload", () => {
  it("runs every policy to completion on the shared trace", () => {
    for (const policy of ["lru", "mru", "lru-k", "clock", "two-q", "arc"] as const) {
      const run = simulatePolicy(policy, STUDENTS_ACCESS_TRACE, 4);
      assert.equal(run.snapshots.length, STUDENTS_ACCESS_TRACE.length + 1);
      const last = run.snapshots.at(-1)!;
      assert.equal(last.hits + last.misses, STUDENTS_ACCESS_TRACE.length);
      assert.ok(last.frames.filter((f) => f.pageId != null).length <= 4);
    }
  });
});
