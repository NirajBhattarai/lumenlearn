import type { Lesson } from "@/types/lesson";
import type { CachePolicyId } from "@/lib/cache-policies/types";
import {
  DEFAULT_CAPACITY,
  STUDENTS_ACCESS_TRACE,
} from "@/lib/cache-policies/sample";

const sharedPrereqs = ["disk-oriented-dbms", "pages-vs-frames"] as const;

function makeLesson(
  policy: CachePolicyId,
  spec: {
    slug: string;
    order: number;
    title: string;
    summary: string;
    teachTitle: string;
    teachBody: string;
    prerequisites?: string[];
    level?: Lesson["level"];
  },
): Lesson {
  return {
    slug: spec.slug,
    title: spec.title,
    subject: "Database Systems",
    subjectSlug: "database-systems",
    level: spec.level ?? "intermediate",
    order: spec.order,
    presentation: "immersive",
    summary: spec.summary,
    prerequisites: spec.prerequisites ?? [...sharedPrereqs],
    steps: [
      {
        id: "lab",
        title: spec.title,
        caption: spec.teachBody,
        visual: {
          component: "CachePolicyScene",
          props: {
            policy,
            capacity: DEFAULT_CAPACITY,
            trace: STUDENTS_ACCESS_TRACE,
            teach: { title: spec.teachTitle, body: spec.teachBody },
          },
        },
      },
    ],
  };
}

export const cacheLruLesson = makeLesson("lru", {
  slug: "cache-lru",
  order: 3,
  title: "LRU Cache Replacement",
  summary:
    "Least-recently-used eviction on the students table: recency list, hit→MRU, miss→evict the cold end.",
  teachTitle: "LRU tool",
  teachBody:
    "Keep a recency stack. Hits move a page to MRU. When full, detach the page idle the longest. A PK lookup is index page then heap page: Lookup(1) on P4, then RID (P1, slot 0) for Ada — she shares P1 with Bob, Cara, and Finn.",
});

export const cacheMruLesson = makeLesson("mru", {
  slug: "cache-mru",
  order: 4,
  title: "MRU Cache Replacement",
  summary:
    "Most-recently-used eviction: drop the page you just finished. Same students trace, opposite victim of LRU.",
  prerequisites: [...sharedPrereqs, "cache-lru"],
  teachTitle: "MRU tool",
  teachBody:
    "Same hit path as LRU, opposite miss: evict the page just used. Helps looping scans where the last page is the least useful next.",
});

export const cacheLruKLesson = makeLesson("lru-k", {
  slug: "cache-lru-k",
  order: 5,
  title: "LRU-K Cache Replacement",
  summary:
    "Track the last K=2 access times. Correlated re-reads of P1 outrank a single scan touch on P5.",
  prerequisites: [...sharedPrereqs, "cache-lru"],
  level: "advanced",
  teachTitle: "LRU-K tool (K=2)",
  teachBody:
    "Record the last two access times. Evict the page whose 2nd-most-recent access is oldest. One scan hit is weaker than Ada looked up twice.",
});

export const cacheClockLesson = makeLesson("clock", {
  slug: "cache-clock",
  order: 6,
  title: "Clock Cache Replacement",
  summary:
    "Second-chance CLOCK: a circular hand and one reference bit per frame approximate LRU without sorting.",
  prerequisites: [...sharedPrereqs, "cache-lru"],
  teachTitle: "Clock tool",
  teachBody:
    "Each frame has ref=0/1. Access sets ref=1. The hand skips ref=1 (clears it) and detaches the first ref=0 frame — second chance, no sorted list.",
});

export const cacheTwoQLesson = makeLesson("two-q", {
  slug: "cache-2q",
  order: 7,
  title: "2Q Cache Replacement",
  summary:
    "Two queues: first touch lands in A1in (FIFO); a re-hit promotes to Am (LRU). Scan junk dies in A1in.",
  prerequisites: [...sharedPrereqs, "cache-lru"],
  level: "advanced",
  teachTitle: "2Q tool",
  teachBody:
    "Simplified 2Q (no A1out ghost): first visit → A1in (probation FIFO). Re-hit while still cached → Am (hot LRU). Prefer detaching from A1in so scan junk dies first. Paper 2Q promotes on A1out ghost hits.",
});

export const cacheArcLesson = makeLesson("arc", {
  slug: "cache-arc",
  order: 8,
  title: "ARC Cache Replacement",
  summary:
    "Adaptive Replacement Cache: T1 recency, T2 frequency, ghost lists B1/B2, and a moving target p. BusTub P1 family.",
  prerequisites: [...sharedPrereqs, "cache-lru", "cache-2q"],
  level: "advanced",
  teachTitle: "ARC tool",
  teachBody:
    "T1 = recency, T2 = frequency. Ghosts B1/B2 remember evictions (no frame). Ghost hits slide target p. BusTub ArcReplacer is this family (mru_/mfu_/ghosts), not a byte-identical paper clone.",
});

export const cachePolicyLessons: Lesson[] = [
  cacheLruLesson,
  cacheMruLesson,
  cacheLruKLesson,
  cacheClockLesson,
  cacheTwoQLesson,
  cacheArcLesson,
];
