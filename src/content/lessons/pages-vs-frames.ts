import type { Lesson } from "@/types/lesson";

export const pagesVsFramesLesson: Lesson = {
  slug: "pages-vs-frames",
  title: "Pages vs Frames",
  subject: "Database Systems",
  subjectSlug: "database-systems",
  level: "intro",
  order: 2,
  summary:
    "Map students pages (P1–P4 from the disk lesson) into fixed RAM frames with a page table, pins, and dirty flags — foundation for replacement policies.",
  prerequisites: ["disk-oriented-dbms"],
  steps: [
    {
      id: "hook",
      title: "The problem",
      caption:
        "Table students already spans multiple 8 KB pages (P1, P2, …) on disk, but RAM only has 4 frames. We cache hot pages, not the whole file.",
      durationMs: 5500,
      visual: {
        component: "BufferPoolScene",
        props: {
          focus: "disk",
          diskPages: [0, 1, 2, 3, 4, 5],
          frames: [
            { frameId: 0, pageId: null },
            { frameId: 1, pageId: null },
            { frameId: 2, pageId: null },
            { frameId: 3, pageId: null },
          ],
          pageTable: [],
          annotation: "P1 Ada/Bob · P2 Dan/Eve · P4 index · 4 frames only",
        },
      },
      callouts: [
        {
          label: "Key idea",
          text: "We never load the whole database. We cache hot pages in a small pool of frames.",
        },
      ],
    },
    {
      id: "name-parts",
      title: "Name the parts",
      caption:
        "A page is 8 KB of logical data identified by page_id. A frame is a fixed 8 KB slot of RAM identified by frame_id.",
      durationMs: 6000,
      visual: {
        component: "BufferPoolScene",
        props: {
          focus: "all",
          diskPages: [0, 1, 2, 3, 4, 5],
          frames: [
            { frameId: 0, pageId: null, highlight: true },
            { frameId: 1, pageId: null },
            { frameId: 2, pageId: null },
            { frameId: 3, pageId: null },
          ],
          pageTable: [],
          annotation: "Page = content · Frame = container",
        },
      },
      callouts: [
        { label: "Page", text: "Logical 8 KB unit; lives on disk (and maybe in memory)." },
        { label: "Frame", text: "Physical RAM slot that can hold one page at a time." },
      ],
    },
    {
      id: "load",
      title: "Load a page",
      caption:
        "The engine asks for page 2. Disk copies 8 KB into free frame 0. The page table records page 2 → frame 0.",
      durationMs: 6500,
      visual: {
        component: "BufferPoolScene",
        props: {
          focus: "all",
          diskPages: [0, 1, 2, 3, 4, 5],
          frames: [
            { frameId: 0, pageId: 2, highlight: true },
            { frameId: 1, pageId: null },
            { frameId: 2, pageId: null },
            { frameId: 3, pageId: null },
          ],
          pageTable: [{ pageId: 2, frameId: 0 }],
          annotation: "page_table[2] = frame 0",
        },
      },
    },
    {
      id: "pin",
      title: "Pin while using",
      caption:
        "A worker thread pins the frame before reading or writing. While pin_count > 0, the replacer cannot evict it.",
      durationMs: 6000,
      visual: {
        component: "BufferPoolScene",
        props: {
          focus: "frames",
          diskPages: [0, 1, 2, 3, 4, 5],
          frames: [
            { frameId: 0, pageId: 2, pinned: true, highlight: true },
            { frameId: 1, pageId: 5 },
            { frameId: 2, pageId: null },
            { frameId: 3, pageId: null },
          ],
          pageTable: [
            { pageId: 2, frameId: 0 },
            { pageId: 5, frameId: 1 },
          ],
          annotation: "Pinned frames are non-evictable",
        },
      },
      callouts: [
        {
          label: "Pin ≠ lock",
          text: "Pins protect buffer-pool residency. Locks protect transactional correctness.",
        },
      ],
    },
    {
      id: "dirty",
      title: "Dirty means write-back",
      caption:
        "If a thread mutates page 2, the frame is marked dirty. Before eviction, the buffer pool must write those bytes back to disk.",
      durationMs: 6500,
      visual: {
        component: "BufferPoolScene",
        props: {
          focus: "frames",
          diskPages: [0, 1, 2, 3, 4, 5],
          frames: [
            { frameId: 0, pageId: 2, pinned: true, dirty: true, highlight: true },
            { frameId: 1, pageId: 5 },
            { frameId: 2, pageId: 7 },
            { frameId: 3, pageId: null },
          ],
          pageTable: [
            { pageId: 2, frameId: 0 },
            { pageId: 5, frameId: 1 },
            { pageId: 7, frameId: 2 },
          ],
          annotation: "Dirty frame 0 must flush before reuse",
        },
      },
    },
    {
      id: "evict",
      title: "Evict to make room",
      caption:
        "Pool is full and we need page 4. The replacer picks an unpinned victim (frame 1). If dirty, flush first; then load page 4 into that frame.",
      durationMs: 7000,
      visual: {
        component: "BufferPoolScene",
        props: {
          focus: "all",
          diskPages: [0, 1, 2, 3, 4, 5],
          frames: [
            { frameId: 0, pageId: 2, dirty: true },
            { frameId: 1, pageId: 4, highlight: true },
            { frameId: 2, pageId: 7 },
            { frameId: 3, pageId: 1 },
          ],
          pageTable: [
            { pageId: 2, frameId: 0 },
            { pageId: 4, frameId: 1 },
            { pageId: 7, frameId: 2 },
            { pageId: 1, frameId: 3 },
          ],
          annotation: "Same frame, new page — page table updated",
        },
      },
      callouts: [
        {
          label: "Invariant",
          text: "At most one in-memory copy of a page. Page table is the single source of truth for residency.",
        },
      ],
    },
    {
      id: "takeaway",
      title: "Takeaway",
      caption:
        "Pages are logical; frames are physical. The page table maps them. Pins block eviction; dirty forces write-back. Replacement policies only choose among unpinned frames.",
      durationMs: 7000,
      visual: {
        component: "BufferPoolScene",
        props: {
          focus: "all",
          diskPages: [0, 1, 2, 3, 4, 5],
          frames: [
            { frameId: 0, pageId: 2, dirty: true },
            { frameId: 1, pageId: 4, pinned: true, highlight: true },
            { frameId: 2, pageId: 7 },
            { frameId: 3, pageId: 1 },
          ],
          pageTable: [
            { pageId: 2, frameId: 0 },
            { pageId: 4, frameId: 1 },
            { pageId: 7, frameId: 2 },
            { pageId: 1, frameId: 3 },
          ],
          annotation: "Next: which frame to evict? → Cache Replacement lesson",
        },
      },
      callouts: [
        {
          label: "Next lesson",
          text: "LRU, MRU, LRU-K, Clock, 2Q, and ARC animated on the same students page stream.",
        },
      ],
    },
  ],
};

