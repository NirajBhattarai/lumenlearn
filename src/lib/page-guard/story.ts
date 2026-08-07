export type GuardStudent = {
  id: number;
  name: string;
  score: number;
  pageId: number;
  slot: number;
};

export const GUARD_STUDENTS: GuardStudent[] = [
  { id: 1, name: "Ava", score: 91, pageId: 0, slot: 0 },
  { id: 2, name: "Ben", score: 88, pageId: 0, slot: 1 },
  { id: 3, name: "Cara", score: 95, pageId: 0, slot: 2 },
  { id: 4, name: "Dev", score: 84, pageId: 1, slot: 0 },
  { id: 5, name: "Eve", score: 90, pageId: 1, slot: 1 },
  { id: 6, name: "Finn", score: 79, pageId: 1, slot: 2 },
  { id: 7, name: "Gia", score: 93, pageId: 2, slot: 0 },
  { id: 8, name: "Hale", score: 86, pageId: 2, slot: 1 },
];

export const IVY: GuardStudent = { id: 9, name: "Ivy", score: 87, pageId: 0, slot: 3 };

export const GUARD_PAGE_IDS = [0, 1, 2] as const;
export const GUARD_FRAME_COUNT = 3;
export const PAGE_SIZE = 8192;
export const HEADER_BYTES = 8;
export const SLOT_BYTES = 24;
export const TUPLE_BYTES = 48;

export function rowsOnPage(
  pageId: number,
  rows: GuardStudent[] = GUARD_STUDENTS,
): GuardStudent[] {
  return rows.filter((r) => r.pageId === pageId).sort((a, b) => a.slot - b.slot);
}

export function tupleOffset(slot: number): number {
  return PAGE_SIZE - TUPLE_BYTES * (slot + 1);
}

export function hexOff(n: number): string {
  return `0x${n.toString(16).toUpperCase().padStart(4, "0")}`;
}

export type PageSlot = {
  slot: number;
  offset: number;
  row: GuardStudent;
  hot: boolean;
  fresh?: boolean;
};

export type PageAnatomy = {
  pageId: number;
  nextPageId: number | null;
  numTuples: number;
  numDeleted: number;
  slots: PageSlot[];
  freeBytes: number;
};

export function pageAnatomy(
  pageId: number,
  rows: GuardStudent[],
  focusRowId: number | null,
  freshRowId?: number | null,
): PageAnatomy {
  const pageRows = rowsOnPage(pageId, rows);
  const slots: PageSlot[] = pageRows.map((row) => ({
    slot: row.slot,
    offset: tupleOffset(row.slot),
    row,
    hot: focusRowId === row.id,
    fresh: freshRowId === row.id,
  }));
  const used = HEADER_BYTES + slots.length * SLOT_BYTES + slots.length * TUPLE_BYTES;
  return {
    pageId,
    nextPageId: pageId < 2 ? pageId + 1 : null,
    numTuples: slots.length,
    numDeleted: 0,
    slots,
    freeBytes: Math.max(0, PAGE_SIZE - used),
  };
}

export type GuardBeat =
  | "idle"
  | "ask"
  | "bpmLock"
  | "loadPin"
  | "bpmUnlock"
  | "pageLock"
  | "update"
  | "flush"
  | "pageUnlock"
  | "unpin"
  | "insertAsk"
  | "insertBpm"
  | "insertPin"
  | "insertLock"
  | "insertWrite"
  | "insertFlush"
  | "insertDrop"
  | "done";

export type ThreadView = {
  id: "A" | "B";
  title: string;
  kid: string;
  phase: "idle" | "bpm" | "wait" | "hold" | "done";
  pageId: number | null;
};

export type FrameView = {
  frameId: number;
  pageId: number | null;
  pin: number;
  locked: boolean;
  dirty: boolean;
  rows: GuardStudent[];
};

export type StorySnap = {
  beat: GuardBeat;
  kid: string;
  tech: string;
  bpmLocked: boolean;
  diskRows: GuardStudent[];
  frames: FrameView[];
  threads: ThreadView[];
  focusPage: number | null;
  focusRowId: number | null;
  freshRowId?: number | null;
  sql?: string;
  flow?: "load" | "save" | "idle";
};

export const BEAT_ORDER: GuardBeat[] = [
  "idle",
  "ask",
  "bpmLock",
  "loadPin",
  "bpmUnlock",
  "pageLock",
  "update",
  "flush",
  "pageUnlock",
  "unpin",
  "insertAsk",
  "insertBpm",
  "insertPin",
  "insertLock",
  "insertWrite",
  "insertFlush",
  "insertDrop",
  "done",
];

export const BEAT_AT: number[] = [
  0, 1.0, 2.1, 3.3, 4.4, 5.5, 6.7, 7.9, 9.0, 10.1, 11.3, 12.4, 13.5, 14.6, 15.8, 17.0, 18.1, 19.2,
];
export const STORY_END = 20.2;

export function beatFromTime(t: number): GuardBeat {
  for (let i = BEAT_ORDER.length - 1; i >= 0; i--) {
    if (t + 1e-6 >= (BEAT_AT[i] ?? 0)) return BEAT_ORDER[i]!;
  }
  return "idle";
}

export function timeForBeat(beat: GuardBeat): number {
  const i = BEAT_ORDER.indexOf(beat);
  return BEAT_AT[Math.max(0, i)] ?? 0;
}

const UPDATE_SQL = "UPDATE students SET score = 99 WHERE name = 'Ava'";
const INSERT_SQL = "INSERT INTO students(name, score) VALUES ('Ivy', 87)";

function emptyFrames(): FrameView[] {
  return Array.from({ length: GUARD_FRAME_COUNT }, (_, frameId) => ({
    frameId,
    pageId: null,
    pin: 0,
    locked: false,
    dirty: false,
    rows: [],
  }));
}

function withAvaScore(rows: GuardStudent[], score: number): GuardStudent[] {
  return rows.map((r) => (r.id === 1 ? { ...r, score } : { ...r }));
}

function withIvy(rows: GuardStudent[]): GuardStudent[] {
  if (rows.some((r) => r.id === 9)) return rows.map((r) => ({ ...r }));
  return [...rows.map((r) => ({ ...r })), { ...IVY }];
}

export function snapshotAt(beat: GuardBeat): StorySnap {
  const diskBase = GUARD_STUDENTS.map((r) => ({ ...r }));
  const frames = emptyFrames();
  const threads: ThreadView[] = [
    { id: "A", title: "Thread A", kid: "Ava’s teacher", phase: "idle", pageId: null },
    { id: "B", title: "Thread B", kid: "Waiting writer", phase: "idle", pageId: null },
  ];

  const load = (rows: GuardStudent[], pin = 1, locked = false, dirty = false) => {
    frames[0] = {
      frameId: 0,
      pageId: 0,
      pin,
      locked,
      dirty,
      rows: rowsOnPage(0, rows).map((r) => ({ ...r })),
    };
  };

  const updatedDisk = withAvaScore(diskBase, 99);
  const insertedDisk = withIvy(updatedDisk);

  switch (beat) {
    case "idle":
      return {
        beat,
        kid: "Three vertical 8 KB pages on disk. Frames are empty desks.",
        tech: "header + slots↓ + free + tuples↑ · BusTub TablePage",
        bpmLocked: false,
        diskRows: diskBase,
        frames,
        threads,
        focusPage: 0,
        focusRowId: null,
        flow: "idle",
      };
    case "ask":
      threads[0] = { ...threads[0]!, phase: "bpm", pageId: 0 };
      return {
        beat,
        kid: "UPDATE Ava’s score. First we must borrow page 0.",
        tech: UPDATE_SQL,
        bpmLocked: false,
        diskRows: diskBase,
        frames,
        threads,
        focusPage: 0,
        focusRowId: 1,
        sql: UPDATE_SQL,
        flow: "idle",
      };
    case "bpmLock":
      threads[0] = { ...threads[0]!, phase: "bpm", pageId: 0 };
      return {
        beat,
        kid: "BPM lock ON — look up page_id 0. Do not edit bytes yet.",
        tech: "bpm_latch_ exclusive · page_table_ / free_frames_",
        bpmLocked: true,
        diskRows: diskBase,
        frames,
        threads,
        focusPage: 0,
        focusRowId: 1,
        sql: UPDATE_SQL,
        flow: "load",
      };
    case "loadPin":
      load(diskBase, 1, false, false);
      threads[0] = { ...threads[0]!, phase: "bpm", pageId: 0 };
      return {
        beat,
        kid: "Copy the whole vertical page into frame 0. PIN = 1.",
        tech: "DiskScheduler read 8192 B · pin_count_++ · SetEvictable(false)",
        bpmLocked: true,
        diskRows: diskBase,
        frames,
        threads,
        focusPage: 0,
        focusRowId: 1,
        sql: UPDATE_SQL,
        flow: "load",
      };
    case "bpmUnlock":
      load(diskBase, 1, false, false);
      threads[0] = { ...threads[0]!, phase: "hold", pageId: 0 };
      threads[1] = { ...threads[1]!, phase: "wait", pageId: 0 };
      return {
        beat,
        kid: "BPM lock OFF. Teacher B waits on the page lock, not the catalog.",
        tech: "release bpm_latch_ before rwlatch_",
        bpmLocked: false,
        diskRows: diskBase,
        frames,
        threads,
        focusPage: 0,
        focusRowId: 1,
        sql: UPDATE_SQL,
        flow: "idle",
      };
    case "pageLock":
      load(diskBase, 1, true, false);
      threads[0] = { ...threads[0]!, phase: "hold", pageId: 0 };
      threads[1] = { ...threads[1]!, phase: "wait", pageId: 0 };
      return {
        beat,
        kid: "Page lock ON the frame copy. Only Thread A may change tuples.",
        tech: "WritePageGuard · unique_lock(rwlatch_)",
        bpmLocked: false,
        diskRows: diskBase,
        frames,
        threads,
        focusPage: 0,
        focusRowId: 1,
        sql: UPDATE_SQL,
        flow: "idle",
      };
    case "update":
      load(withAvaScore(diskBase, 99), 1, true, true);
      threads[0] = { ...threads[0]!, phase: "hold", pageId: 0 };
      threads[1] = { ...threads[1]!, phase: "wait", pageId: 0 };
      return {
        beat,
        kid: "Frame tuple Ava: 91 → 99. Disk page still 91 (dirty).",
        tech: "GetDataMut() at slot 0 / offset 0x1FD0 · is_dirty_ = true",
        bpmLocked: false,
        diskRows: diskBase,
        frames,
        threads,
        focusPage: 0,
        focusRowId: 1,
        sql: UPDATE_SQL,
        flow: "idle",
      };
    case "flush":
      load(withAvaScore(diskBase, 99), 1, true, false);
      threads[0] = { ...threads[0]!, phase: "hold", pageId: 0 };
      threads[1] = { ...threads[1]!, phase: "wait", pageId: 0 };
      return {
        beat,
        kid: "SAVE: write the vertical frame back onto disk page 0.",
        tech: "Flush() · DiskScheduler WritePage(0) · dirty cleared",
        bpmLocked: false,
        diskRows: updatedDisk,
        frames,
        threads,
        focusPage: 0,
        focusRowId: 1,
        sql: UPDATE_SQL,
        flow: "save",
      };
    case "pageUnlock":
      load(updatedDisk, 1, true, false);
      threads[0] = { ...threads[0]!, phase: "done", pageId: 0 };
      threads[1] = { ...threads[1]!, phase: "hold", pageId: 0 };
      return {
        beat,
        kid: "A drops the guard. B gets the page lock. PIN still 1.",
        tech: "Drop() unlocks · waiter granted",
        bpmLocked: false,
        diskRows: updatedDisk,
        frames,
        threads,
        focusPage: 0,
        focusRowId: 1,
        flow: "idle",
      };
    case "unpin":
      load(updatedDisk, 0, false, false);
      threads[0] = { ...threads[0]!, phase: "done", pageId: 0 };
      threads[1] = { ...threads[1]!, phase: "done", pageId: 0 };
      return {
        beat,
        kid: "Both writers done. PIN = 0. Page 0 may stay cached.",
        tech: "pin_count_ = 0 · SetEvictable(true)",
        bpmLocked: false,
        diskRows: updatedDisk,
        frames,
        threads,
        focusPage: 0,
        focusRowId: 1,
        flow: "idle",
      };
    case "insertAsk":
      load(updatedDisk, 0, false, false);
      threads[0] = { ...threads[0]!, phase: "bpm", pageId: 0 };
      threads[1] = { ...threads[1]!, phase: "done", pageId: 0 };
      return {
        beat,
        kid: "Now INSERT Ivy. Same path: BPM → pin frame → lock → write slot → save page.",
        tech: INSERT_SQL,
        bpmLocked: false,
        diskRows: updatedDisk,
        frames,
        threads,
        focusPage: 0,
        focusRowId: 9,
        sql: INSERT_SQL,
        flow: "idle",
      };
    case "insertBpm":
      load(updatedDisk, 0, false, false);
      threads[0] = { ...threads[0]!, phase: "bpm", pageId: 0 };
      threads[1] = { ...threads[1]!, phase: "done", pageId: 0 };
      return {
        beat,
        kid: "BPM lock ON again — catalog says Ivy belongs on page 0.",
        tech: "bpm_latch_ · first_page_id still 0 · check free space",
        bpmLocked: true,
        diskRows: updatedDisk,
        frames,
        threads,
        focusPage: 0,
        focusRowId: 9,
        sql: INSERT_SQL,
        flow: "idle",
      };
    case "insertPin":
      load(updatedDisk, 1, false, false);
      threads[0] = { ...threads[0]!, phase: "bpm", pageId: 0 };
      threads[1] = { ...threads[1]!, phase: "done", pageId: 0 };
      return {
        beat,
        kid: "Hit: page 0 already in frame 0. Just PIN++ (0 → 1).",
        tech: "cache HIT · RecordAccess · SetEvictable(false)",
        bpmLocked: true,
        diskRows: updatedDisk,
        frames,
        threads,
        focusPage: 0,
        focusRowId: 9,
        sql: INSERT_SQL,
        flow: "idle",
      };
    case "insertLock":
      load(updatedDisk, 1, true, false);
      threads[0] = { ...threads[0]!, phase: "hold", pageId: 0 };
      threads[1] = { ...threads[1]!, phase: "done", pageId: 0 };
      return {
        beat,
        kid: "BPM off. Page lock ON. Ready to grow the slotted page.",
        tech: "WritePageGuard · rwlatch_ exclusive",
        bpmLocked: false,
        diskRows: updatedDisk,
        frames,
        threads,
        focusPage: 0,
        focusRowId: 9,
        sql: INSERT_SQL,
        flow: "idle",
      };
    case "insertWrite":
      load(insertedDisk, 1, true, true);
      threads[0] = { ...threads[0]!, phase: "hold", pageId: 0 };
      threads[1] = { ...threads[1]!, phase: "done", pageId: 0 };
      return {
        beat,
        kid: "New slot [3] at the top. Ivy’s tuple packed up from the bottom.",
        tech: "num_tuples 3→4 · slot dir ↓ · tuple bytes ↑ · dirty",
        bpmLocked: false,
        diskRows: updatedDisk,
        frames,
        threads,
        focusPage: 0,
        focusRowId: 9,
        freshRowId: 9,
        sql: INSERT_SQL,
        flow: "idle",
      };
    case "insertFlush":
      load(insertedDisk, 1, true, false);
      threads[0] = { ...threads[0]!, phase: "hold", pageId: 0 };
      threads[1] = { ...threads[1]!, phase: "done", pageId: 0 };
      return {
        beat,
        kid: "SAVE the taller page back to disk. Shelf page 0 now has Ivy.",
        tech: "WritePage(0) · 4 slots + 4 tuples persisted",
        bpmLocked: false,
        diskRows: insertedDisk,
        frames,
        threads,
        focusPage: 0,
        focusRowId: 9,
        freshRowId: 9,
        sql: INSERT_SQL,
        flow: "save",
      };
    case "insertDrop":
      load(insertedDisk, 0, false, false);
      threads[0] = { ...threads[0]!, phase: "done", pageId: 0 };
      threads[1] = { ...threads[1]!, phase: "done", pageId: 0 };
      return {
        beat,
        kid: "Drop guard: page lock open, PIN 0. RAII finished both UPDATE and INSERT.",
        tech: "Drop() · unlock rwlatch_ · unpin",
        bpmLocked: false,
        diskRows: insertedDisk,
        frames,
        threads,
        focusPage: 0,
        focusRowId: 9,
        freshRowId: 9,
        flow: "idle",
      };
    case "done":
      load(insertedDisk, 0, false, false);
      return {
        beat,
        kid: "Done. Same vertical page, two writes, two short BPM locks, two page-guard lifetimes.",
        tech: "UPDATE then INSERT · one page_id · RAII each time",
        bpmLocked: false,
        diskRows: insertedDisk,
        frames,
        threads: [
          { ...threads[0]!, phase: "done", pageId: 0 },
          { ...threads[1]!, phase: "done", pageId: 0 },
        ],
        focusPage: 0,
        focusRowId: 9,
        freshRowId: 9,
        flow: "idle",
      };
  }
}
