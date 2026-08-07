import type { GuardBeat, StorySnap } from "./story";

export const BEAT_LABEL: Record<GuardBeat, string> = {
  idle: "idle",
  ask: "SQL update",
  bpmLock: "BPM lock",
  loadPin: "load + pin",
  bpmUnlock: "BPM open",
  pageLock: "page lock",
  update: "edit Ava",
  flush: "SAVE",
  pageUnlock: "unlock",
  unpin: "unpin",
  insertAsk: "SQL insert",
  insertBpm: "BPM lock",
  insertPin: "pin hit",
  insertLock: "page lock",
  insertWrite: "add Ivy",
  insertFlush: "SAVE",
  insertDrop: "drop",
  done: "done",
};

export type SceneCopy = {
  sqlKid: string;
  sqlWhy: string;
  bpmWhy: string;
  bpmTech: string;
  catalogLine: string;
  pinLine: string;
  ioLine: string;
  ioKind: "idle" | "read" | "write";
  pageLockNote: string;
  diskRole: string;
  diskWhy: string;
  frameRole: string;
  frameWhy: string;
  headerNote: string;
  slotNote: string;
  freeNote: string;
  tupleNote: string;
  flowLabel: string;
  flowWhy: string;
};

const DISK_ROLE = "Durable shelf";
const DISK_WHY =
  "This 8 KB block lives in datadb.db. Nothing here changes until a SAVE writes the frame back.";
const FRAME_ROLE = "Working copy in RAM";
const FRAME_WHY =
  "Same bytes, editable. Pin keeps the desk. Page lock decides who may write. Dirty means disk is stale.";

const HEADER_NOTE =
  "Bytes 0–7. next_page_id chains the heap. num_tuples / num_deleted describe live rows — not the student names themselves.";
const SLOT_NOTE =
  "Line pointers grow down from the header. Slot n stores the offset of that row. INSERT adds a new pointer here first.";
const FREE_NOTE =
  "Unclaimed middle. A write eats this from both ends: a new slot downward, a new tuple upward.";
const TUPLE_NOTE =
  "Row payload packed from the end of the page (0x2000). Oldest row sits at the bottom; newest insert appears just above free space.";

export function sceneCopy(snap: StorySnap): SceneCopy {
  const pin = snap.frames[0]?.pin ?? 0;
  const mapped = snap.frames[0]?.pageId != null;
  const locked = snap.frames.some((f) => f.locked);
  const inserting = snap.beat.startsWith("insert");

  const base: SceneCopy = {
    sqlKid: inserting ? "INSERT Ivy on page 0" : "UPDATE Ava on page 0",
    sqlWhy: inserting
      ? "A new row needs a free slot and tuple space on the same heap page."
      : "Ava already lives at RID(0,0). We must pin that page before changing her score.",
    bpmWhy: "BPM is the librarian: it maps page_id → frame, pins, and schedules disk I/O. It does not edit tuples.",
    bpmTech: "std::mutex bpm_latch_ · page_table_ · pin_count_",
    catalogLine: mapped ? "page_table_  0 → frame 0" : "page_table_  0 → (not loaded)",
    pinLine: mapped ? `pin_count_ on frame 0  =  ${pin}` : "pin_count_  —  no frame yet",
    ioLine: "DiskScheduler idle",
    ioKind: "idle",
    pageLockNote: locked
      ? "Page lock is on the frame (rwlatch_), not on BPM. BPM already released."
      : "Page lock is open. Anyone with a pin may still be evicted only after pin hits 0.",
    diskRole: DISK_ROLE,
    diskWhy: DISK_WHY,
    frameRole: FRAME_ROLE,
    frameWhy: FRAME_WHY,
    headerNote: HEADER_NOTE,
    slotNote: SLOT_NOTE,
    freeNote: FREE_NOTE,
    tupleNote: TUPLE_NOTE,
    flowLabel: "idle",
    flowWhy: "No bytes moving between shelf and desk.",
  };

  switch (snap.beat) {
    case "idle":
      return {
        ...base,
        sqlKid: "No SQL yet",
        sqlWhy: "Three shelf pages sit on disk. Frames are empty desks waiting for a pin.",
        bpmWhy: "Open. Anyone may ask which frame holds a page_id — nobody is rewriting the catalog.",
      };
    case "ask":
      return {
        ...base,
        bpmWhy: "SQL arrived. Next we take bpm_latch_ so the page table cannot change mid-lookup.",
      };
    case "bpmLock":
      return {
        ...base,
        bpmWhy:
          "LOCKED. Only this thread may read/write page_table_ and free_frames_. Ava’s score is still 91 on disk — we have not copied yet.",
        bpmTech: "bpm_latch_.lock() · lookup page_id 0",
        ioLine: "About to READ 8192 B for page 0",
        ioKind: "read",
        flowLabel: "LOAD → frame",
        flowWhy: "BPM will copy the whole vertical page into a frame, then pin it.",
      };
    case "loadPin":
      return {
        ...base,
        bpmWhy:
          "Still locked. DiskScheduler filled frame 0. Pin = 1 means “do not evict — a guard is coming.”",
        catalogLine: "page_table_  0 → frame 0",
        pinLine: "pin_count_  0 → 1   SetEvictable(false)",
        ioLine: "DiskScheduler READ page 0 · 8192 B done",
        ioKind: "read",
        flowLabel: "LOAD → frame",
        flowWhy: "Shelf bytes now exist as a RAM copy. Disk is unchanged.",
      };
    case "bpmUnlock":
      return {
        ...base,
        bpmWhy:
          "OPEN again. Catalog work is done. Holding bpm_latch_ while taking rwlatch_ would deadlock other threads.",
        bpmTech: "bpm_latch_.unlock() before page lock",
        pageLockNote: "Teacher B now waits on the page lock, not on BPM.",
      };
    case "pageLock":
      return {
        ...base,
        bpmWhy: "BPM stays open. The exclusive lock moved onto frame 0’s rwlatch_.",
        pageLockNote:
          "WritePageGuard holds unique_lock(rwlatch_). Only Thread A may touch tuple bytes.",
      };
    case "update":
      return {
        ...base,
        bpmWhy: "BPM is not involved in the score change. Mutation is GetDataMut() on the pinned frame.",
        pageLockNote: "Frame is dirty: Ava is 99 in RAM, still 91 on the shelf.",
        tupleNote:
          "Ava’s tuple at offset 0x1FD0 flipped 91 → 99. Same slot, same RID(0,0). No new pointer needed.",
      };
    case "flush":
      return {
        ...base,
        bpmWhy: "Flush asks DiskScheduler to write the frame. BPM latch is not required for this path in the story.",
        ioLine: "DiskScheduler WRITE page 0 · 8192 B",
        ioKind: "write",
        flowLabel: "SAVE → disk",
        flowWhy: "The vertical shelf page is rewritten. Header, slots, and Ava’s tuple all persist.",
        diskWhy: "Just updated. Shelf now matches the desk: Ava = 99.",
      };
    case "pageUnlock":
      return {
        ...base,
        bpmWhy: "Still open. Drop() released rwlatch_; Thread B is granted the page lock.",
        pageLockNote: "A is done writing. B may enter. Pin is still 1 until both drop.",
      };
    case "unpin":
      return {
        ...base,
        bpmWhy: "Both writers finished. Pin hit 0 — the frame may stay cached but is evictable.",
        pinLine: "pin_count_  1 → 0   SetEvictable(true)",
        pageLockNote: "No page lock. Cached copy of page 0 remains in frame 0.",
      };
    case "insertAsk":
      return {
        ...base,
        bpmWhy: "New INSERT. Same contract: short BPM lock, then pin, then page lock, then grow the slotted page.",
      };
    case "insertBpm":
      return {
        ...base,
        bpmWhy:
          "LOCKED again. Catalog check: Ivy belongs on first_page_id 0. Page is already in frame 0 — this will be a HIT.",
        bpmTech: "bpm_latch_ · cache probe page 0",
      };
    case "insertPin":
      return {
        ...base,
        bpmWhy: "HIT. No disk read. Just pin_count_++ so eviction cannot steal the desk mid-insert.",
        pinLine: "pin_count_  0 → 1   cache HIT",
        ioLine: "No I/O — frame already holds page 0",
      };
    case "insertLock":
      return {
        ...base,
        bpmWhy: "BPM released. Page lock acquired. Ready to allocate slot 3 and pack Ivy from the end.",
        pageLockNote: "Exclusive rwlatch_ on frame 0. Slot directory and tuple region will both grow.",
      };
    case "insertWrite":
      return {
        ...base,
        bpmWhy: "BPM idle. The slotted page grew only in RAM: num_tuples 3→4, dirty flag set.",
        slotNote:
          "New pointer [3] → 0x1F40. Directory grew downward into free space.",
        tupleNote:
          "Ivy’s 48 B tuple was packed upward from the end. Disk still has three rows until SAVE.",
        freeNote: "Free space shrank from both ends — that is a classic slotted-page insert.",
        pageLockNote: "Dirty frame. Shelf page 0 does not know Ivy yet.",
      };
    case "insertFlush":
      return {
        ...base,
        bpmWhy: "SAVE persists the taller page. Four slots + four tuples land on disk page 0.",
        ioLine: "DiskScheduler WRITE page 0 · 8192 B",
        ioKind: "write",
        flowLabel: "SAVE → disk",
        flowWhy: "Shelf page 0 now includes Ivy at RID(0,3).",
        diskWhy: "Persisted insert. Header ntup=4. Ivy is durable.",
      };
    case "insertDrop":
      return {
        ...base,
        bpmWhy: "Guard dropped: page unlock + unpin. RAII finished the INSERT lifetime.",
        pinLine: "pin_count_  1 → 0",
        pageLockNote: "Open. Ivy remains in the cached frame and on disk.",
      };
    case "done":
      return {
        ...base,
        sqlKid: "Both writes complete",
        sqlWhy: "One page_id, two short BPM locks, two page-guard lifetimes, one vertical page.",
        bpmWhy: "Open. page 0 may still sit in frame 0 as a warm cache.",
      };
  }
}
