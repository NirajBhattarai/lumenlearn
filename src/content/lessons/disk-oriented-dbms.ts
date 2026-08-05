import type { Lesson } from "@/types/lesson";

/**
 * Disk-oriented DBMS — React Flow lesson.
 * Each step shows only the nodes needed for that idea.
 */
export const diskOrientedDbmsLesson: Lesson = {
  slug: "disk-oriented-dbms",
  title: "Disk-Oriented DBMS Architecture",
  subject: "Database Systems",
  subjectSlug: "database-systems",
  level: "intro",
  order: 1,
  presentation: "immersive",
  summary:
    "How a disk-oriented database stores files as pages, maps table rows into slotted pages, and caches pages in a buffer pool.",
  prerequisites: [],
  steps: [
    {
      id: "hook",
      title: "Disk holds the database as files",
      caption:
        "On a real machine the DBMS owns a folder on disk. Open data/ like a Finder window: bustub.db, bustub.wal, catalog/. Click each entry. RAM on the right only caches pages later.",
      durationMs: 7000,
      visual: {
        component: "DiskOrientedScene",
        props: {
          focus: "overview",
          annotation: "SSD → /var/lib/bustub/data/ · click files in the tree",
          folderHighlight: "data",
          frames: [
            { frameId: 0, pageId: null },
            { frameId: 1, pageId: null },
            { frameId: 2, pageId: null },
            { frameId: 3, pageId: null },
          ],
        },
      },
      callouts: [
        {
          label: "On disk",
          text: "Truth is files under data/ — not scattered bytes in RAM.",
        },
        {
          label: "data/",
          text: "Instance root: .db pages, WAL, catalog, tmp spill.",
        },
        {
          label: "RAM later",
          text: "Empty frames now — buffer pool caches pages after we open them.",
        },
      ],
    },
    {
      id: "folder",
      title: "Inside data/ on your system",
      caption:
        "Same folder tree, zoomed for roles. Click bustub.db → pages; bustub.wal → recovery log; catalog/ → names & schemas. This is how it looks under /var/lib/bustub/data/.",
      durationMs: 7000,
      visual: {
        component: "DiskOrientedScene",
        props: {
          focus: "folder",
          annotation: "File manager view · select an entry to inspect",
          folderHighlight: "data",
        },
      },
      callouts: [
        { label: "bustub.db", text: "Page-addressable file — all 8 KB units." },
        { label: "bustub.wal", text: "Write-ahead log for crash recovery." },
        { label: "catalog/", text: "Names → schemas and root page ids." },
      ],
    },
    {
      id: "db-file",
      title: "bustub.db = array of pages",
      caption:
        "Click P0 (meta), P1 (heap), or P4 (index) — the inspector card swaps real fields for that page type. Each section explains what the field stores and why. Students rows jump the seek to their heap page.",
      durationMs: 9000,
      visual: {
        component: "DiskOrientedScene",
        props: {
          focus: "db-file",
          annotation: "Click a page → inspector fields · meta ≠ heap ≠ index",
          highlightPageId: 1,
          folderHighlight: "data",
        },
      },
      callouts: [
        {
          label: "P0 meta",
          text: "Roots (heap/index), free list — not student tuples.",
        },
        {
          label: "P1–P3 heap",
          text: "TablePage: next_page_id, slots, free, tuple bytes (Ada…).",
        },
        {
          label: "P4 index",
          text: "B+ leaf: keys → RIDs that point into heap pages.",
        },
        {
          label: "Address",
          text: "offset = page_id × 8192 · DiskManager loads whole pages only.",
        },
      ],
    },
    {
      id: "page-header",
      title: "Open a page: slots & tuples",
      caption:
        "Same as before: click P0 / P1 / P4 for the field inspector. On heap pages, use the anatomy card (header · slots · free · tuples) and students rows — section chips explain every field.",
      durationMs: 9000,
      visual: {
        component: "DiskOrientedScene",
        props: {
          focus: "page-header",
          annotation: "Click page → inspector · anatomy shows TablePage layout",
          highlightPageId: 1,
        },
      },
      callouts: [
        {
          label: "Inspector",
          text: "P0 meta · P1–P3 heap fields · P4 index keys → RIDs (same card as slide 3).",
        },
        {
          label: "Anatomy",
          text: "Visual TablePage: header 8 B · slots ↓ · free · tuples ↑.",
        },
        {
          label: "RID",
          text: "(page_id, slot) names a row — click Ada to light slot + tuple.",
        },
      ],
    },
    {
      id: "page-links",
      title: "Pages form a heap chain",
      caption:
        "next_page_id links heap pages: P1 → P2 → P3. One table spans many pages.",
      durationMs: 7500,
      visual: {
        component: "DiskOrientedScene",
        props: {
          focus: "page-links",
          annotation: "Directory → heap chain · index branch",
          highlightPageId: 1,
          activeLink: "1-2",
        },
      },
      callouts: [
        { label: "Heap", text: "Linked list of TablePages holding tuples." },
        {
          label: "Index",
          text: "Tree pages store keys + RIDs into the heap.",
        },
      ],
    },
    {
      id: "buffer-pool",
      title: "Buffer pool frames",
      caption:
        "Each frame holds one page image. Page table: page_id → frame_id. Pin blocks eviction; dirty needs write-back.",
      durationMs: 7500,
      visual: {
        component: "DiskOrientedScene",
        props: {
          focus: "buffer-pool",
          annotation: "Frame = RAM slot · Page = logical 8 KB",
          highlightPageId: 2,
          frames: [
            { frameId: 0, pageId: 1 },
            {
              frameId: 1,
              pageId: 2,
              pinned: true,
              dirty: true,
              highlight: true,
            },
            { frameId: 2, pageId: 4 },
            { frameId: 3, pageId: null },
          ],
          pageTable: [
            { pageId: 1, frameId: 0 },
            { pageId: 2, frameId: 1 },
            { pageId: 4, frameId: 2 },
          ],
        },
      },
      callouts: [
        {
          label: "Frame ≠ page",
          text: "Frame is the RAM slot; page identity can move between disk and frames.",
        },
        {
          label: "One copy",
          text: "Never load the same page into two frames.",
        },
      ],
    },
    {
      id: "request-path",
      title: "Page request end-to-end",
      caption:
        "Need page 1 → check page table → hit: pin. Miss: read offset 1×8192 from bustub.db into a frame.",
      durationMs: 8000,
      visual: {
        component: "DiskOrientedScene",
        props: {
          focus: "request-path",
          annotation: "Executor → BufferPool → Disk",
          requestLabel: "CheckedReadPage(page_id = 1)",
          highlightPageId: 1,
          folderHighlight: "data",
          frames: [
            { frameId: 0, pageId: 1, pinned: true, highlight: true },
            { frameId: 1, pageId: 2 },
            { frameId: 2, pageId: null },
            { frameId: 3, pageId: 4 },
          ],
          pageTable: [
            { pageId: 1, frameId: 0 },
            { pageId: 2, frameId: 1 },
            { pageId: 4, frameId: 3 },
          ],
        },
      },
      callouts: [
        { label: "Hit", text: "Already in page table → pin → done." },
        {
          label: "Miss",
          text: "Allocate/evict frame → disk read → map → pin.",
        },
      ],
    },
    {
      id: "full-stack",
      title: "Put it together",
      caption:
        "Directory → pages in bustub.db → slotted rows → buffer pool in RAM. Executors only see page_ids and guards.",
      durationMs: 7500,
      visual: {
        component: "DiskOrientedScene",
        props: {
          focus: "full-stack",
          annotation: "Disk pages · heap links · frames in RAM",
          highlightPageId: 1,
          folderHighlight: "data",
          activeLink: "1-2",
          frames: [
            { frameId: 0, pageId: 1, pinned: true },
            { frameId: 1, pageId: 2, dirty: true },
            { frameId: 2, pageId: null },
            { frameId: 3, pageId: 4 },
          ],
          pageTable: [
            { pageId: 1, frameId: 0 },
            { pageId: 2, frameId: 1 },
            { pageId: 4, frameId: 3 },
          ],
        },
      },
      callouts: [
        {
          label: "Next",
          text: "Pages vs frames, pin/dirty, and eviction policy.",
        },
        {
          label: "BusTub P1",
          text: "DiskManager · BufferPoolManager · PageGuards.",
        },
      ],
    },
  ],
};
