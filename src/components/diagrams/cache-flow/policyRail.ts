import type { CachePolicyId, FrameSlot } from "@/lib/cache-policies/types";
import type { CacheBeat, CachePolicyRailData, CacheRailLane } from "./types";

function laneFromKey(
  policy: CachePolicyId,
  key: string,
  pages: number[],
): CacheRailLane | null {
  if (key === "ref_bits" || key === "hand" || key === "target_p" || key === "resident") {
    return null;
  }

  if (key === "recency_mru_end") {
    if (policy === "mru") {
      return {
        id: key,
        title: "Recency",
        leftLabel: "older",
        rightLabel: "MRU",
        leftTag: null,
        rightTag: "evict",
        emptyHint: "Empty pool. First miss lands on the MRU end.",
        pages,
      };
    }
    return {
      id: key,
      title: "Recency",
      leftLabel: "LRU",
      rightLabel: "MRU",
      leftTag: "evict",
      rightTag: "hot",
      emptyHint: "Empty pool. Hits will slide right to MRU; a full miss drops the LRU end.",
      pages,
    };
  }

  if (key === "kth_oldest_first") {
    return {
      id: key,
      title: "K-th access rank (K=2)",
      leftLabel: "oldest K-th",
      rightLabel: "newest K-th",
      leftTag: "evict",
      rightTag: "keep",
      emptyHint: "No residents yet. Correlated re-reads outrank a single scan touch.",
      pages,
    };
  }

  if (key === "A1in_fifo") {
    return {
      id: key,
      title: "A1in · first-touch FIFO",
      leftLabel: "out",
      rightLabel: "in",
      leftTag: "evict",
      rightTag: "new",
      emptyHint: "Probation queue empty. First visit to a page enters here.",
      pages,
    };
  }

  if (key === "Am_lru_mru_end") {
    return {
      id: key,
      title: "Am · hot LRU",
      leftLabel: "LRU",
      rightLabel: "MRU",
      leftTag: "cold",
      rightTag: "hot",
      emptyHint: "Hot list empty until a page is seen twice.",
      pages,
    };
  }

  if (key === "T1") {
    return {
      id: key,
      title: "T1 · recency",
      leftLabel: "LRU",
      rightLabel: "MRU",
      leftTag: null,
      rightTag: "recent",
      emptyHint: "No recency residents.",
      pages,
    };
  }

  if (key === "T2") {
    return {
      id: key,
      title: "T2 · frequency",
      leftLabel: "LRU",
      rightLabel: "MRU",
      leftTag: null,
      rightTag: "frequent",
      emptyHint: "No frequency residents yet.",
      pages,
    };
  }

  if (key === "B1_ghost") {
    return {
      id: key,
      title: "B1 · ghost of T1",
      leftLabel: "old",
      rightLabel: "new",
      leftTag: null,
      rightTag: null,
      emptyHint: "No T1 ghosts. Ghost hits grow target p.",
      ghost: true,
      pages,
    };
  }

  if (key === "B2_ghost") {
    return {
      id: key,
      title: "B2 · ghost of T2",
      leftLabel: "old",
      rightLabel: "new",
      leftTag: null,
      rightTag: null,
      emptyHint: "No T2 ghosts. Ghost hits shrink target p.",
      ghost: true,
      pages,
    };
  }

  return {
    id: key,
    title: key.replace(/_/g, " "),
    leftLabel: "",
    rightLabel: "",
    leftTag: null,
    rightTag: null,
    emptyHint: "Empty.",
    pages,
  };
}

export function buildPolicyRailData(input: {
  policy: CachePolicyId;
  structures: Record<string, number[]>;
  frames: FrameSlot[];
  hand: number;
  beat: CacheBeat;
  accessPage: number | null;
  pendingAccess: number | null;
  victimPage: number | null;
}): CachePolicyRailData {
  const {
    policy,
    structures,
    frames,
    hand,
    beat,
    accessPage,
    pendingAccess,
    victimPage,
  } = input;

  const activePage =
    beat === "idle" ? null : (pendingAccess ?? accessPage);

  if (policy === "clock") {
    return {
      policy,
      title: "Clock",
      subtitle: "Second chance: hand skips ref=1 (clears it) and evicts the first ref=0.",
      lanes: [
        {
          id: "clock",
          title: "Circular frames",
          leftLabel: "scan",
          rightLabel: "hand",
          leftTag: null,
          rightTag: null,
          emptyHint: "All frames empty. Hand starts at frame 0.",
          kind: "clock",
          pages: frames.map((f) => f.pageId ?? -1),
          clockSlots: frames.map((f) => ({
            frameId: f.frameId,
            pageId: f.pageId,
            ref: f.ref ?? false,
            hand: hand === f.frameId,
          })),
        },
      ],
      activePage,
      victimPage: beat === "evict" || beat === "load" || beat === "done" ? victimPage : null,
      note: "ref=1 gets a second chance. ref=0 is detached.",
    };
  }

  const lanes = Object.entries(structures)
    .map(([key, pages]) => laneFromKey(policy, key, pages))
    .filter((lane): lane is CacheRailLane => lane != null);

  const meta: Record<CachePolicyId, { title: string; subtitle: string; note: string }> = {
    lru: {
      title: "LRU recency",
      subtitle: "Left is idle longest. Right was just used.",
      note: "Hit → slide to MRU. Miss when full → detach LRU.",
    },
    mru: {
      title: "MRU recency",
      subtitle: "Same stack as LRU — opposite victim.",
      note: "Hit → becomes MRU. Miss when full → detach the MRU end.",
    },
    "lru-k": {
      title: "LRU-K rank",
      subtitle: "Ordered by the K-th most recent access (K=2).",
      note: "One scan touch is weaker than Ada looked up twice.",
    },
    clock: {
      title: "Clock",
      subtitle: "",
      note: "",
    },
    "two-q": {
      title: "2Q lists",
      subtitle: "First touch in A1in. Second visit promotes to Am.",
      note: "Prefer victims from A1in so scan junk never enters the hot set.",
    },
    arc: {
      title: "ARC lists",
      subtitle: "T1 recency · T2 frequency · B1/B2 remember evictions.",
      note: "Ghost hits slide target p — no extra frames required.",
    },
  };

  return {
    policy,
    title: meta[policy].title,
    subtitle: meta[policy].subtitle,
    lanes,
    activePage,
    victimPage: beat === "evict" || beat === "load" || beat === "done" ? victimPage : null,
    targetP: policy === "arc" ? structures.target_p?.[0] : undefined,
    note: meta[policy].note,
  };
}
