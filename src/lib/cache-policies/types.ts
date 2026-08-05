export type CachePolicyId =
  | "lru"
  | "mru"
  | "lru-k"
  | "clock"
  | "two-q"
  | "arc";

export type FrameSlot = {
  frameId: number;
  pageId: number | null;
  /** Clock reference bit */
  ref?: boolean;
  /** Which list owns this page (2Q / ARC) */
  list?: string;
};

export type PolicySnapshot = {
  step: number;
  /** Access that produced this state (null = initial) */
  access: number | null;
  hit: boolean | null;
  victim: number | null;
  frames: FrameSlot[];
  /** Policy-specific ordered structures for teaching */
  structures: Record<string, number[]>;
  /** Short human explanation of what just happened */
  note: string;
  hits: number;
  misses: number;
};

export type PolicyRun = {
  policy: CachePolicyId;
  capacity: number;
  trace: number[];
  snapshots: PolicySnapshot[];
};

export const POLICY_META: Record<
  CachePolicyId,
  { name: string; short: string; rule: string; wikiUrl: string }
> = {
  lru: {
    name: "LRU",
    short: "Least Recently Used",
    rule: "Evict the page whose last access is oldest. Hot working set stays.",
    wikiUrl:
      "https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU)",
  },
  mru: {
    name: "MRU",
    short: "Most Recently Used",
    rule: "Evict the page used most recently. Helps looping scans (opposite of LRU).",
    wikiUrl:
      "https://en.wikipedia.org/wiki/Cache_replacement_policies#Most_recently_used_(MRU)",
  },
  "lru-k": {
    name: "LRU-K",
    short: "K-th last access (K=2)",
    rule: "Evict the page with the oldest K-th access time. Correlated references resist eviction better than plain LRU.",
    wikiUrl: "https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU-K",
  },
  clock: {
    name: "Clock",
    short: "Second-chance / CLOCK",
    rule: "Circular scan: if ref=1 clear and advance; if ref=0, evict. Approximates LRU with cheap bits.",
    wikiUrl: "https://en.wikipedia.org/wiki/Page_replacement_algorithm#Clock",
  },
  "two-q": {
    name: "2Q",
    short: "Two queues (A1in + Am)",
    rule: "First touch → A1in (FIFO). Re-reference → Am (LRU). Prefer victims from A1in so one-hit wonders die first.",
    wikiUrl: "https://en.wikipedia.org/wiki/Cache_replacement_policies#2Q",
  },
  arc: {
    name: "ARC",
    short: "Adaptive Replacement Cache",
    rule: "Balance recency (T1) vs frequency (T2) using ghost lists B1/B2. Target p adapts on ghost hits.",
    wikiUrl: "https://en.wikipedia.org/wiki/Adaptive_replacement_cache",
  },
};
