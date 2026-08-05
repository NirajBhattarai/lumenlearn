import type { Lesson } from "@/types/lesson";
import {
  DEFAULT_CAPACITY,
  STUDENTS_ACCESS_TRACE,
} from "@/lib/cache-policies/sample";

/**
 * Lesson 3 — Cache replacement policies
 * Same students page workload (P1–P5) for every algorithm.
 */
export const cacheReplacementLesson: Lesson = {
  slug: "cache-replacement",
  title: "Cache Replacement Policies",
  subject: "Database Systems",
  subjectSlug: "database-systems",
  level: "intermediate",
  order: 3,
  presentation: "immersive",
  summary:
    "Animate LRU, MRU, LRU-K, Clock, 2Q, and ARC on the same students-page access stream from the disk lesson — see who gets evicted and why.",
  prerequisites: ["disk-oriented-dbms", "pages-vs-frames"],
  steps: [
    {
      id: "intro",
      title: "One workload, many policies",
      caption:
        "Pool capacity is 4 frames. Accesses hit students pages from lesson 1: P1 (Ada/Bob/Cara), P2 (Dan/Eve), P4 (index), plus cold P3/P5. Each step runs one policy on the same trace — use Play/Step inside the stage.",
      durationMs: 8000,
      visual: {
        component: "CachePolicyScene",
        props: {
          policy: "lru",
          capacity: DEFAULT_CAPACITY,
          trace: STUDENTS_ACCESS_TRACE,
          annotation:
            "Shared trace · 4 frames · compare hit/miss as you step",
        },
      },
      callouts: [
        {
          label: "Data source",
          text: "Page ids match bustub.db heap/index pages used for table students.",
        },
        {
          label: "How to use",
          text: "Press Play or Step under the diagram to walk each access. Lesson Next moves to the next policy.",
        },
      ],
    },
    {
      id: "lru",
      title: "LRU — least recently used",
      caption:
        "Keep a recency list (MRU at the end). On hit, move page to MRU. On miss when full, evict the LRU end. Protects a stable hot set like repeated P1 lookups.",
      durationMs: 10000,
      visual: {
        component: "CachePolicyScene",
        props: {
          policy: "lru",
          capacity: DEFAULT_CAPACITY,
          trace: STUDENTS_ACCESS_TRACE,
          annotation: "Evict oldest last-access · hot P1 tends to stay",
        },
      },
      callouts: [
        {
          label: "Strength",
          text: "Great for temporal locality (same rows re-read).",
        },
        {
          label: "Weakness",
          text: "A sequential scan can pollute the cache (every page is “recent”).",
        },
      ],
    },
    {
      id: "mru",
      title: "MRU — most recently used",
      caption:
        "Opposite of LRU: on miss, evict the page that was just used. Helps looping scans where the page you just finished is the least useful next.",
      durationMs: 10000,
      visual: {
        component: "CachePolicyScene",
        props: {
          policy: "mru",
          capacity: DEFAULT_CAPACITY,
          trace: STUDENTS_ACCESS_TRACE,
          annotation: "Evict MRU · useful for cyclic scans",
        },
      },
      callouts: [
        {
          label: "When",
          text: "Repeated full-table scans where reusing the last page is rare.",
        },
        {
          label: "Vs LRU",
          text: "Same hit path (touch recency), opposite victim choice.",
        },
      ],
    },
    {
      id: "lru-k",
      title: "LRU-K (K=2)",
      caption:
        "Remember the last K access times per page. Evict the page whose K-th most recent access is oldest. Correlated double-touches (P1 then P1) look “hotter” than a single scan hit.",
      durationMs: 10000,
      visual: {
        component: "CachePolicyScene",
        props: {
          policy: "lru-k",
          capacity: DEFAULT_CAPACITY,
          trace: STUDENTS_ACCESS_TRACE,
          annotation: "K=2 · oldest 2nd-access wins eviction",
        },
      },
      callouts: [
        {
          label: "Why K",
          text: "One-hit wonders (P5 scan) have a weak K-th time vs pages seen twice.",
        },
        {
          label: "Cost",
          text: "More history state than plain LRU.",
        },
      ],
    },
    {
      id: "clock",
      title: "Clock (second chance)",
      caption:
        "Frames in a ring with a reference bit. Access sets ref=1. Hand walks: ref=1 → clear and skip; ref=0 → evict. Approximates LRU without sorting on every access.",
      durationMs: 10000,
      visual: {
        component: "CachePolicyScene",
        props: {
          policy: "clock",
          capacity: DEFAULT_CAPACITY,
          trace: STUDENTS_ACCESS_TRACE,
          annotation: "Hand + ref bits · second chance if ref=1",
        },
      },
      callouts: [
        {
          label: "Hardware cousin",
          text: "Same idea as the hardware clock page algorithm in OS virtual memory.",
        },
        {
          label: "BusTub",
          text: "Real systems often use variants; BusTub P1 uses ARC instead of Clock.",
        },
      ],
    },
    {
      id: "two-q",
      title: "2Q — two queues",
      caption:
        "First visit goes to A1in (FIFO). A second access promotes to Am (LRU hot list). Prefer evicting from A1in so one-hit scan pages die before the hot Am set.",
      durationMs: 10000,
      visual: {
        component: "CachePolicyScene",
        props: {
          policy: "two-q",
          capacity: DEFAULT_CAPACITY,
          trace: STUDENTS_ACCESS_TRACE,
          annotation: "A1in FIFO · Am LRU · promote on re-reference",
        },
      },
      callouts: [
        {
          label: "Scan resistance",
          text: "Cold P5/P3 stay in A1in and leave without thrashing Am.",
        },
        {
          label: "Hot set",
          text: "P1/P2 re-hits graduate to Am and behave like LRU there.",
        },
      ],
    },
    {
      id: "arc",
      title: "ARC — adaptive replacement",
      caption:
        "T1 = recency, T2 = frequency. Ghost lists B1/B2 remember recent evictions. Ghost hits move target p to favor recency or frequency. BusTub’s ArcReplacer follows this family.",
      durationMs: 11000,
      visual: {
        component: "CachePolicyScene",
        props: {
          policy: "arc",
          capacity: DEFAULT_CAPACITY,
          trace: STUDENTS_ACCESS_TRACE,
          annotation: "T1/T2 live · B1/B2 ghosts · adapt p",
        },
      },
      callouts: [
        {
          label: "Adaptive",
          text: "p grows when B1 ghosts hit (need more recency); shrinks on B2 hits.",
        },
        {
          label: "BusTub P1",
          text: "You implement ARC-style lists for the buffer pool replacer.",
        },
      ],
    },
    {
      id: "compare",
      title: "Compare on the same stream",
      caption:
        "Replay LRU again as a baseline. Step slowly near the first P5/P3 accesses — that is where policies diverge. Next: implement ArcReplacer in BusTub with this mental model.",
      durationMs: 9000,
      visual: {
        component: "CachePolicyScene",
        props: {
          policy: "lru",
          capacity: DEFAULT_CAPACITY,
          trace: STUDENTS_ACCESS_TRACE,
          annotation: "Baseline LRU — note scan pollution vs ARC/2Q",
        },
      },
      callouts: [
        {
          label: "Takeaway",
          text: "Policy only picks among unpinned frames; pins still win over any algorithm.",
        },
        {
          label: "Practice",
          text: "Rerun ARC and 2Q and watch cold pages leave without destroying P1.",
        },
      ],
    },
  ],
};
