import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { emptyEngine, runCommand } from "./engine.ts";

function lastEngine(cmd: Parameters<typeof runCommand>[1], start = emptyEngine()) {
  const steps = runCommand(start, cmd);
  return steps[steps.length - 1]!.engine;
}

describe("table-catalog engine", () => {
  it("create users stores first_page_id 0 and a disk extent", () => {
    const e = lastEngine({ kind: "create", table: "users" });
    assert.equal(e.catalog.length, 1);
    assert.equal(e.catalog[0]!.name, "users");
    assert.equal(e.catalog[0]!.firstPageId, 0);
    assert.equal(e.extents[0]!.offset, 0);
    assert.equal(e.heaps[0]!.tuples.length, 0);
  });

  it("create orders gets page 1 in the same file", () => {
    let e = lastEngine({ kind: "create", table: "users" });
    e = lastEngine({ kind: "create", table: "orders" }, e);
    assert.equal(e.catalog[1]!.firstPageId, 1);
    assert.equal(e.extents[1]!.offset, 8192);
  });

  it("third users insert allocates a linked page", () => {
    let e = lastEngine({ kind: "create", table: "users" });
    e = lastEngine({ kind: "insert", table: "users" }, e);
    e = lastEngine({ kind: "insert", table: "users" }, e);
    e = lastEngine({ kind: "insert", table: "users" }, e);
    const users = e.catalog[0]!;
    assert.equal(users.firstPageId, 0);
    assert.equal(users.lastPageId, 1);
    assert.equal(e.heaps[0]!.nextPageId, 1);
    assert.equal(e.heaps[0]!.tuples.length, 2);
    assert.equal(e.heaps[1]!.tuples.length, 1);
    assert.equal(e.heaps[1]!.tuples[0]!.name, "cam");
    assert.deepEqual(e.lastRid, { pageId: 1, slot: 0 });
  });

  it("select walks the catalog chain and reports rows", () => {
    let e = lastEngine({ kind: "create", table: "users" });
    e = lastEngine({ kind: "insert", table: "users" }, e);
    e = lastEngine({ kind: "insert", table: "users" }, e);
    const steps = runCommand(e, { kind: "select", table: "users" });
    const done = steps[steps.length - 1]!;
    assert.equal(done.beat, "done");
    assert.deepEqual(done.scanNames, ["ada", "bob"]);
  });

  it("insert uses catalog and refuses unknown tables", () => {
    const steps = runCommand(emptyEngine(), { kind: "insert", table: "orders" });
    assert.equal(steps[0]!.beat, "error");
  });

  it("restart clears catalog but keeps file bytes", () => {
    let e = lastEngine({ kind: "create", table: "users" });
    e = lastEngine({ kind: "insert", table: "users" }, e);
    e = lastEngine({ kind: "restart" }, e);
    assert.equal(e.catalog.length, 0);
    assert.equal(e.orphaned, true);
    assert.ok(e.extents.length > 0);
    assert.equal(e.heaps[0]!.tuples[0]!.name, "ada");
  });
});
