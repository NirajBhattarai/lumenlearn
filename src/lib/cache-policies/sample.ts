/**
 * Access workload grounded in lesson-1 students pages.
 * P1 = Ada/Bob/Cara · P2 = Dan/Eve · P3 empty heap · P4 index · P5 scan noise
 */

export type PageMeta = {
  id: number;
  label: string;
  kind: "meta" | "heap" | "index" | "other";
  who: string;
};

export const WORKLOAD_PAGES: PageMeta[] = [
  { id: 1, label: "P1", kind: "heap", who: "Ada, Bob, Cara" },
  { id: 2, label: "P2", kind: "heap", who: "Dan, Eve" },
  { id: 3, label: "P3", kind: "heap", who: "(empty heap)" },
  { id: 4, label: "P4", kind: "index", who: "B+ leaf keys" },
  { id: 5, label: "P5", kind: "other", who: "scan noise" },
];

/** Realistic mixed OLTP + one scan: hot P1, warm P2/P4, cold P3/P5. */
export const STUDENTS_ACCESS_TRACE: number[] = [
  1, // lookup Ada (heap)
  4, // index probe
  1, // Ada again
  2, // Dan
  1, // hot
  4, // index
  2, // Eve path
  5, // one-hit scan page
  3, // another cold
  1, // still hot
  2,
  4,
  5, // scan again
  1,
];

export const DEFAULT_CAPACITY = 4;

export function pageLabel(pageId: number): string {
  return WORKLOAD_PAGES.find((p) => p.id === pageId)?.label ?? `P${pageId}`;
}

export function pageWho(pageId: number): string {
  return WORKLOAD_PAGES.find((p) => p.id === pageId)?.who ?? "—";
}
