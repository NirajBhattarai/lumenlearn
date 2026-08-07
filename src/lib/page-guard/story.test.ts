import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sceneCopy } from "./copy.ts";
import {
  beatFromTime,
  pageAnatomy,
  snapshotAt,
  timeForBeat,
  tupleOffset,
} from "./story.ts";

describe("page-guard story", () => {
  it("maps theatre time onto beats", () => {
    assert.equal(beatFromTime(0), "idle");
    assert.equal(beatFromTime(timeForBeat("bpmLock")), "bpmLock");
    assert.equal(beatFromTime(timeForBeat("update")), "update");
    assert.equal(beatFromTime(timeForBeat("insertWrite")), "insertWrite");
    assert.equal(beatFromTime(20), "done");
  });

  it("loads mock rows into a pinned locked frame on pageLock", () => {
    const snap = snapshotAt("pageLock");
    assert.equal(snap.bpmLocked, false);
    assert.equal(snap.frames[0]!.pageId, 0);
    assert.equal(snap.frames[0]!.pin, 1);
    assert.equal(snap.frames[0]!.locked, true);
    assert.ok(snap.frames[0]!.rows.some((r) => r.name === "Ava" && r.score === 91));
    assert.equal(snap.threads[1]!.phase, "wait");
  });

  it("updates desk then disk on flush", () => {
    const upd = snapshotAt("update");
    assert.equal(upd.frames[0]!.rows.find((r) => r.name === "Ava")?.score, 99);
    assert.equal(upd.diskRows.find((r) => r.name === "Ava")?.score, 91);
    assert.equal(upd.frames[0]!.dirty, true);
    assert.equal(upd.flow, "idle");
    const flush = snapshotAt("flush");
    assert.equal(flush.diskRows.find((r) => r.name === "Ava")?.score, 99);
    assert.equal(flush.frames[0]!.dirty, false);
    assert.equal(flush.flow, "save");
  });

  it("unpins after both writers finish", () => {
    const snap = snapshotAt("unpin");
    assert.equal(snap.frames[0]!.pin, 0);
    assert.equal(snap.frames[0]!.locked, false);
    assert.equal(snap.bpmLocked, false);
  });

  it("inserts Ivy on the frame then saves the vertical page", () => {
    const write = snapshotAt("insertWrite");
    assert.equal(write.bpmLocked, false);
    assert.equal(write.frames[0]!.locked, true);
    assert.equal(write.frames[0]!.dirty, true);
    assert.equal(write.frames[0]!.pin, 1);
    assert.ok(write.frames[0]!.rows.some((r) => r.name === "Ivy" && r.slot === 3));
    assert.equal(write.diskRows.some((r) => r.name === "Ivy"), false);
    assert.equal(write.freshRowId, 9);

    const flush = snapshotAt("insertFlush");
    assert.ok(flush.diskRows.some((r) => r.name === "Ivy" && r.score === 87));
    assert.equal(flush.flow, "save");
    assert.equal(flush.frames[0]!.dirty, false);

    const disk = pageAnatomy(0, flush.diskRows, 9, 9);
    assert.equal(disk.numTuples, 4);
    assert.equal(disk.slots[3]!.row.name, "Ivy");
    assert.equal(disk.slots[3]!.offset, tupleOffset(3));
    assert.ok(disk.freeBytes < pageAnatomy(0, snapshotAt("unpin").diskRows, null).freeBytes);
  });

  it("takes bpm lock before pin on both write paths", () => {
    assert.equal(snapshotAt("bpmLock").bpmLocked, true);
    assert.equal(snapshotAt("bpmLock").frames[0]!.pageId, null);
    assert.equal(snapshotAt("insertBpm").bpmLocked, true);
    assert.equal(snapshotAt("insertBpm").frames[0]!.pin, 0);
    assert.equal(snapshotAt("insertPin").frames[0]!.pin, 1);
    assert.equal(snapshotAt("insertPin").bpmLocked, true);
    assert.equal(snapshotAt("insertLock").bpmLocked, false);
    assert.equal(snapshotAt("insertLock").frames[0]!.locked, true);
  });

  it("describes BPM as the middle control plane", () => {
    const copy = sceneCopy(snapshotAt("bpmLock"));
    assert.match(copy.bpmWhy, /LOCKED/i);
    assert.equal(copy.ioKind, "read");
    assert.match(copy.catalogLine, /not loaded/);
    const insert = sceneCopy(snapshotAt("insertWrite"));
    assert.match(insert.slotNote, /\[3\]/);
    assert.match(insert.tupleNote, /Ivy/);
  });
});
