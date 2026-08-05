/**
 * Access workload grounded in a larger students heap + id index.
 * P1–P3 = heap pages · P4 = B+ leaf (id → RID) · P5 = scan leftover
 */

export type PageMeta = {
  id: number;
  label: string;
  kind: "meta" | "heap" | "index" | "other";
  who: string;
};

export type CacheStudent = {
  id: number;
  name: string;
  major: string;
  year: number;
  gpa: string;
  pageId: number;
  slot: number;
};

/** Logical table the executor reads — 12 rows packed onto 3 heap pages. */
export const CACHE_STUDENTS: CacheStudent[] = [
  { id: 1, name: "Ada", major: "CS", year: 2024, gpa: "3.9", pageId: 1, slot: 0 },
  { id: 2, name: "Bob", major: "Math", year: 2023, gpa: "3.4", pageId: 1, slot: 1 },
  { id: 3, name: "Cara", major: "Physics", year: 2025, gpa: "3.7", pageId: 1, slot: 2 },
  { id: 6, name: "Finn", major: "CS", year: 2024, gpa: "3.2", pageId: 1, slot: 3 },
  { id: 4, name: "Dan", major: "CS", year: 2022, gpa: "3.6", pageId: 2, slot: 0 },
  { id: 5, name: "Eve", major: "History", year: 2023, gpa: "3.5", pageId: 2, slot: 1 },
  { id: 7, name: "Gia", major: "Bio", year: 2025, gpa: "3.8", pageId: 2, slot: 2 },
  { id: 12, name: "Hale", major: "Art", year: 2022, gpa: "3.1", pageId: 2, slot: 3 },
  { id: 8, name: "Ivan", major: "Econ", year: 2024, gpa: "3.3", pageId: 3, slot: 0 },
  { id: 9, name: "Jade", major: "CS", year: 2026, gpa: "3.9", pageId: 3, slot: 1 },
  { id: 10, name: "Kai", major: "Music", year: 2023, gpa: "3.0", pageId: 3, slot: 2 },
  { id: 11, name: "Lia", major: "Chem", year: 2025, gpa: "3.6", pageId: 3, slot: 3 },
];

export const HEAP_PAGE_IDS = [1, 2, 3] as const;

export const WORKLOAD_PAGES: PageMeta[] = [
  { id: 1, label: "P1", kind: "heap", who: "Ada, Bob, Cara, Finn" },
  { id: 2, label: "P2", kind: "heap", who: "Dan, Eve, Gia, Hale" },
  { id: 3, label: "P3", kind: "heap", who: "Ivan, Jade, Kai, Lia" },
  { id: 4, label: "P4", kind: "index", who: "id → RID leaf" },
  { id: 5, label: "P5", kind: "other", who: "scan leftover" },
];

/** B+ leaf: primary key → RID (page, slot). Not the row payload. */
export const INDEX_LEAF = CACHE_STUDENTS.map((r) => ({
  key: r.id,
  pageId: r.pageId,
  slot: r.slot,
  name: r.name,
}));

export type AccessIntent = {
  pageId: number;
  sql: string;
  focusRowIds: number[];
  why: string;
  /** Plain-language decode of id / RID / page (shown on the query card). */
  ridNote?: string;
};

export const ACCESS_INTENTS: AccessIntent[] = [
  {
    pageId: 4,
    sql: "idx_students_id.Lookup(1)",
    focusRowIds: [1],
    why: "PK lookup reads the index leaf first",
    ridNote:
      "1 → (P1, slot 0) means: student id 1 lives on page P1 in slot 0 (Ada). The index does not store major or GPA.",
  },
  {
    pageId: 1,
    sql: "fetch RID (P1, slot 0)  — Ada",
    focusRowIds: [1],
    why: "Then the heap page named by the RID",
    ridNote: "Fetching Ada also keeps Bob, Cara, and Finn cached — they share P1.",
  },
  {
    pageId: 1,
    sql: "SELECT name FROM students WHERE id = 2",
    focusRowIds: [2],
    why: "Bob shares P1 — heap hit if P1 is still attached",
    ridNote: "id 2 → RID (P1, slot 1) = Bob. Same page as Ada, different slot.",
  },
  {
    pageId: 4,
    sql: "idx_students_id.Lookup(4)",
    focusRowIds: [4],
    why: "Index again, now for Dan",
    ridNote: "4 → (P2, slot 0) = Dan. Key in the leaf, row still on the heap.",
  },
  {
    pageId: 2,
    sql: "fetch RID (P2, slot 0)  — Dan",
    focusRowIds: [4],
    why: "Heap follow after the index RID",
    ridNote: "id 4 is Dan. RID (P2, slot 0).",
  },
  {
    pageId: 4,
    sql: "idx_students_id.Lookup(5)",
    focusRowIds: [5],
    why: "Index probe for Eve",
    ridNote: "5 → (P2, slot 1) = Eve.",
  },
  {
    pageId: 2,
    sql: "fetch RID (P2, slot 1)  — Eve",
    focusRowIds: [5],
    why: "Eve shares P2 with Dan",
    ridNote: "id 5 → RID (P2, slot 1) = Eve.",
  },
  {
    pageId: 5,
    sql: "SELECT * FROM students  /* seq scan leftover */",
    focusRowIds: [],
    why: "One-hit scan page — not a student row page",
    ridNote: "P5 is scan junk, not part of the students heap. Easy victim later.",
  },
  {
    pageId: 4,
    sql: "idx_students_id.Lookup(8)",
    focusRowIds: [8],
    why: "Index probe for Ivan",
    ridNote: "8 → (P3, slot 0) = Ivan.",
  },
  {
    pageId: 3,
    sql: "fetch RID (P3, slot 0)  — Ivan",
    focusRowIds: [8],
    why: "Ivan lives on colder heap P3",
    ridNote: "id 8 → RID (P3, slot 0) = Ivan. P3 also holds Jade, Kai, Lia.",
  },
  {
    pageId: 1,
    sql: "SELECT * FROM students WHERE id = 3",
    focusRowIds: [3],
    why: "Cara still on hot P1",
    ridNote: "id 3 → RID (P1, slot 2) = Cara.",
  },
  {
    pageId: 2,
    sql: "SELECT major FROM students WHERE id = 5",
    focusRowIds: [5],
    why: "Eve / P2 again",
    ridNote: "Same RID (P2, slot 1) — a hit if P2 is still attached.",
  },
  {
    pageId: 4,
    sql: "idx_students_id.Lookup(3)",
    focusRowIds: [3],
    why: "Index leaf stay-resident?",
    ridNote: "3 → (P1, slot 2) = Cara. Index page P4 is its own cached block.",
  },
  {
    pageId: 5,
    sql: "seq scan continues on P5",
    focusRowIds: [],
    why: "Scan noise returns",
    ridNote: "P5 has no student RIDs — just leftover scan bytes.",
  },
  {
    pageId: 1,
    sql: "SELECT * FROM students WHERE id = 1",
    focusRowIds: [1],
    why: "Ada still the working set",
    ridNote: "Back to id 1 / RID (P1, slot 0).",
  },
];

export const STUDENTS_ACCESS_TRACE: number[] = ACCESS_INTENTS.map((a) => a.pageId);

export const DEFAULT_CAPACITY = 4;

export const STUDENTS_DDL =
  "CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR, major VARCHAR, year INT, gpa DECIMAL);";

export function pageLabel(pageId: number): string {
  return WORKLOAD_PAGES.find((p) => p.id === pageId)?.label ?? `P${pageId}`;
}

export function pageWho(pageId: number): string {
  return WORKLOAD_PAGES.find((p) => p.id === pageId)?.who ?? "—";
}

export function pageKind(pageId: number): PageMeta["kind"] {
  return WORKLOAD_PAGES.find((p) => p.id === pageId)?.kind ?? "other";
}

export function intentAt(traceIndex: number): AccessIntent | null {
  return ACCESS_INTENTS[traceIndex] ?? null;
}

export function cacheRowsOnPage(pageId: number): CacheStudent[] {
  return CACHE_STUDENTS.filter((r) => r.pageId === pageId);
}

export function cacheStudentById(id: number): CacheStudent | undefined {
  return CACHE_STUDENTS.find((r) => r.id === id);
}

export function formatRid(pageId: number, slot: number): string {
  return `(P${pageId}, slot ${slot})`;
}

export function ridForStudent(id: number): string {
  const row = cacheStudentById(id);
  return row ? formatRid(row.pageId, row.slot) : "—";
}
