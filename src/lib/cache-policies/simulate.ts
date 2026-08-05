import type {
  CachePolicyId,
  FrameSlot,
  PolicyRun,
  PolicySnapshot,
} from "./types";

function emptyFrames(capacity: number): FrameSlot[] {
  return Array.from({ length: capacity }, (_, i) => ({
    frameId: i,
    pageId: null,
  }));
}

/** Map resident pages onto frame slots in stable frame_id order by first appearance. */
function placePages(
  capacity: number,
  residents: number[],
  meta?: Map<number, Partial<FrameSlot>>,
): FrameSlot[] {
  const frames = emptyFrames(capacity);
  residents.slice(0, capacity).forEach((pageId, i) => {
    frames[i] = {
      frameId: i,
      pageId,
      ...(meta?.get(pageId) ?? {}),
    };
  });
  return frames;
}

function baseSnap(
  step: number,
  access: number | null,
  hit: boolean | null,
  victim: number | null,
  frames: FrameSlot[],
  structures: Record<string, number[]>,
  note: string,
  hits: number,
  misses: number,
): PolicySnapshot {
  return {
    step,
    access,
    hit,
    victim,
    frames,
    structures,
    note,
    hits,
    misses,
  };
}

// ─── LRU ───────────────────────────────────────────────

function simulateLru(trace: number[], capacity: number): PolicySnapshot[] {
  const order: number[] = []; // MRU at end
  let hits = 0;
  let misses = 0;
  const snaps: PolicySnapshot[] = [
    baseSnap(
      0,
      null,
      null,
      null,
      emptyFrames(capacity),
      { recency_mru_end: [] },
      "Empty pool. LRU: most-recent at the right; evict leftmost (oldest).",
      0,
      0,
    ),
  ];

  for (let t = 0; t < trace.length; t++) {
    const p = trace[t]!;
    let victim: number | null = null;
    const idx = order.indexOf(p);
    let hit = false;
    if (idx >= 0) {
      hit = true;
      hits++;
      order.splice(idx, 1);
      order.push(p);
    } else {
      misses++;
      if (order.length >= capacity) {
        victim = order.shift()!;
      }
      order.push(p);
    }
    snaps.push(
      baseSnap(
        t + 1,
        p,
        hit,
        victim,
        placePages(capacity, order),
        { recency_mru_end: [...order] },
        hit
          ? `HIT P${p} — move to MRU end.`
          : victim != null
            ? `MISS P${p} — evict LRU P${victim}, load P${p}.`
            : `MISS P${p} — free frame, load P${p}.`,
        hits,
        misses,
      ),
    );
  }
  return snaps;
}

// ─── MRU ───────────────────────────────────────────────

function simulateMru(trace: number[], capacity: number): PolicySnapshot[] {
  const order: number[] = []; // MRU at end
  let hits = 0;
  let misses = 0;
  const snaps: PolicySnapshot[] = [
    baseSnap(
      0,
      null,
      null,
      null,
      emptyFrames(capacity),
      { recency_mru_end: [] },
      "MRU: on miss, evict the most recently used page (right end).",
      0,
      0,
    ),
  ];

  for (let t = 0; t < trace.length; t++) {
    const p = trace[t]!;
    let victim: number | null = null;
    const idx = order.indexOf(p);
    let hit = false;
    if (idx >= 0) {
      hit = true;
      hits++;
      order.splice(idx, 1);
      order.push(p);
    } else {
      misses++;
      if (order.length >= capacity) {
        victim = order.pop()!;
      }
      order.push(p);
    }
    snaps.push(
      baseSnap(
        t + 1,
        p,
        hit,
        victim,
        placePages(capacity, order),
        { recency_mru_end: [...order] },
        hit
          ? `HIT P${p} — becomes MRU.`
          : victim != null
            ? `MISS P${p} — evict MRU P${victim}, load P${p}.`
            : `MISS P${p} — free frame, load P${p}.`,
        hits,
        misses,
      ),
    );
  }
  return snaps;
}

// ─── LRU-K (K=2) ───────────────────────────────────────

function simulateLruK(
  trace: number[],
  capacity: number,
  k = 2,
): PolicySnapshot[] {
  const history = new Map<number, number[]>(); // page → access timestamps
  const resident = new Set<number>();
  let hits = 0;
  let misses = 0;
  const snaps: PolicySnapshot[] = [
    baseSnap(
      0,
      null,
      null,
      null,
      emptyFrames(capacity),
      { resident: [], kth_oldest_first: [] },
      `LRU-${k}: track last ${k} access times; evict page with oldest K-th access.`,
      0,
      0,
    ),
  ];

  const kthTime = (page: number): number => {
    const h = history.get(page) ?? [];
    if (h.length < k) return -Infinity; // fewer than K hits → prefer keep until correlated
    return h[h.length - k]!;
  };

  for (let t = 0; t < trace.length; t++) {
    const p = trace[t]!;
    let victim: number | null = null;
    const hit = resident.has(p);
    if (hit) hits++;
    else misses++;

    const hist = history.get(p) ?? [];
    hist.push(t);
    if (hist.length > k + 2) hist.splice(0, hist.length - (k + 2));
    history.set(p, hist);

    if (!hit) {
      if (resident.size >= capacity) {
        // Evict: among resident, smallest kthTime; if -Inf, treat as very old only if all are -Inf use FIFO-ish
        let best: number | null = null;
        let bestScore = Infinity;
        for (const r of resident) {
          let score = kthTime(r);
          if (score === -Infinity) {
            // not yet K references — use first access as weak score
            score = (history.get(r) ?? [t])[0]!;
          }
          if (score < bestScore) {
            bestScore = score;
            best = r;
          }
        }
        victim = best;
        if (victim != null) resident.delete(victim);
      }
      resident.add(p);
    }

    const resList = [...resident];
    const ranked = [...resList].sort((a, b) => kthTime(a) - kthTime(b));
    snaps.push(
      baseSnap(
        t + 1,
        p,
        hit,
        victim,
        placePages(capacity, resList),
        {
          resident: resList,
          kth_oldest_first: ranked,
        },
        hit
          ? `HIT P${p} — record access #${(history.get(p) ?? []).length}.`
          : victim != null
            ? `MISS P${p} — evict P${victim} (oldest ${k}-th access), load P${p}.`
            : `MISS P${p} — load into free frame.`,
        hits,
        misses,
      ),
    );
  }
  return snaps;
}

// ─── Clock ─────────────────────────────────────────────

function simulateClock(trace: number[], capacity: number): PolicySnapshot[] {
  const frames = emptyFrames(capacity).map((f) => ({
    ...f,
    ref: false,
  }));
  let hand = 0;
  let hits = 0;
  let misses = 0;
  const snaps: PolicySnapshot[] = [
    baseSnap(
      0,
      null,
      null,
      null,
      frames.map((f) => ({ ...f })),
      { hand: [0], ref_bits: [] },
      "Clock hand at 0. On access set ref=1. Evict first frame with ref=0 (give second chance if ref=1).",
      0,
      0,
    ),
  ];

  const findFrame = (pageId: number) =>
    frames.findIndex((f) => f.pageId === pageId);

  for (let t = 0; t < trace.length; t++) {
    const p = trace[t]!;
    let victim: number | null = null;
    let hit = false;
    const fi = findFrame(p);
    if (fi >= 0) {
      hit = true;
      hits++;
      frames[fi]!.ref = true;
    } else {
      misses++;
      // find free
      let free = frames.findIndex((f) => f.pageId == null);
      if (free < 0) {
        // clock scan
        for (let s = 0; s < capacity * 2; s++) {
          const f = frames[hand]!;
          if (!f.ref) {
            victim = f.pageId;
            free = hand;
            hand = (hand + 1) % capacity;
            break;
          }
          f.ref = false;
          hand = (hand + 1) % capacity;
        }
        if (free < 0) free = hand;
      }
      frames[free] = {
        frameId: free,
        pageId: p,
        ref: true,
      };
    }

    snaps.push(
      baseSnap(
        t + 1,
        p,
        hit,
        victim,
        frames.map((f) => ({ ...f })),
        {
          hand: [hand],
          ref_bits: frames.map((f) => (f.pageId == null ? -1 : f.ref ? 1 : 0)),
          resident: frames
            .filter((f) => f.pageId != null)
            .map((f) => f.pageId!),
        },
        hit
          ? `HIT P${p} — set ref=1 on its frame.`
          : victim != null
            ? `MISS P${p} — clock evicts P${victim} (ref=0), load P${p}, hand→${hand}.`
            : `MISS P${p} — load into free frame, ref=1.`,
        hits,
        misses,
      ),
    );
  }
  return snaps;
}

// ─── 2Q ────────────────────────────────────────────────

function simulateTwoQ(trace: number[], capacity: number): PolicySnapshot[] {
  // Kin ≈ 25% of capacity for A1in, rest Am (simplified)
  const kin = Math.max(1, Math.floor(capacity / 2));
  const a1in: number[] = []; // FIFO, front = oldest
  const am: number[] = []; // LRU, end = MRU
  let hits = 0;
  let misses = 0;
  const snaps: PolicySnapshot[] = [
    baseSnap(
      0,
      null,
      null,
      null,
      emptyFrames(capacity),
      { A1in_fifo: [], Am_lru_mru_end: [] },
      `2Q: first touch → A1in (FIFO, max ~${kin}). Re-hit → promote to Am (LRU).`,
      0,
      0,
    ),
  ];

  const total = () => a1in.length + am.length;

  for (let t = 0; t < trace.length; t++) {
    const p = trace[t]!;
    let victim: number | null = null;
    let hit = false;

    const inAm = am.indexOf(p);
    const inA1 = a1in.indexOf(p);

    if (inAm >= 0) {
      hit = true;
      hits++;
      am.splice(inAm, 1);
      am.push(p);
    } else if (inA1 >= 0) {
      hit = true;
      hits++;
      a1in.splice(inA1, 1);
      am.push(p);
    } else {
      misses++;
      if (total() >= capacity) {
        if (a1in.length > 0) {
          victim = a1in.shift()!;
        } else {
          victim = am.shift()!; // LRU of Am
        }
      }
      // Prefer A1in for first insert if room under kin, else Am
      if (a1in.length < kin) a1in.push(p);
      else am.push(p);
    }

    const residents = [...a1in, ...am];
    const meta = new Map<number, Partial<FrameSlot>>();
    a1in.forEach((pg) => meta.set(pg, { list: "A1in" }));
    am.forEach((pg) => meta.set(pg, { list: "Am" }));

    snaps.push(
      baseSnap(
        t + 1,
        p,
        hit,
        victim,
        placePages(capacity, residents, meta),
        { A1in_fifo: [...a1in], Am_lru_mru_end: [...am] },
        hit
          ? am.includes(p) && inA1 < 0
            ? `HIT P${p} — stay/move in Am (LRU hot list).`
            : `HIT P${p} — promote A1in → Am (seen twice).`
          : victim != null
            ? `MISS P${p} — evict P${victim}, insert into ${a1in.includes(p) ? "A1in" : "Am"}.`
            : `MISS P${p} — first touch → ${a1in.includes(p) ? "A1in" : "Am"}.`,
        hits,
        misses,
      ),
    );
  }
  return snaps;
}

// ─── ARC (teaching simplified) ─────────────────────────

function simulateArc(trace: number[], capacity: number): PolicySnapshot[] {
  const t1: number[] = []; // recency, MRU at end
  const t2: number[] = []; // frequency, MRU at end
  const b1: number[] = []; // ghost of T1
  const b2: number[] = []; // ghost of T2
  let p = 0; // target size for T1
  let hits = 0;
  let misses = 0;
  const c = capacity;

  const snaps: PolicySnapshot[] = [
    baseSnap(
      0,
      null,
      null,
      null,
      emptyFrames(capacity),
      { T1: [], T2: [], B1_ghost: [], B2_ghost: [], target_p: [0] },
      "ARC: T1 recency, T2 frequency; ghosts B1/B2 adapt target p.",
      0,
      0,
    ),
  ];

  const replace = (pageInB2: boolean): number | null => {
    // Classic ARC replace
    if (t1.length > 0 && (t1.length > p || (pageInB2 && t1.length === p))) {
      const v = t1.shift()!;
      b1.push(v);
      if (b1.length > c) b1.shift();
      return v;
    }
    if (t2.length > 0) {
      const v = t2.shift()!;
      b2.push(v);
      if (b2.length > c) b2.shift();
      return v;
    }
    if (t1.length > 0) {
      const v = t1.shift()!;
      b1.push(v);
      return v;
    }
    return null;
  };

  for (let t = 0; t < trace.length; t++) {
    const x = trace[t]!;
    let victim: number | null = null;
    let hit = false;

    const inT1 = t1.indexOf(x);
    const inT2 = t2.indexOf(x);

    if (inT1 >= 0 || inT2 >= 0) {
      hit = true;
      hits++;
      if (inT1 >= 0) {
        t1.splice(inT1, 1);
        t2.push(x);
      } else {
        t2.splice(inT2, 1);
        t2.push(x);
      }
    } else {
      misses++;
      const inB1 = b1.indexOf(x);
      const inB2 = b2.indexOf(x);

      if (inB1 >= 0) {
        // ghost hit B1 → increase p
        const delta = b1.length >= b2.length ? 1 : Math.floor(b2.length / Math.max(b1.length, 1));
        p = Math.min(c, p + Math.max(delta, 1));
        victim = replace(false);
        b1.splice(inB1, 1);
        t2.push(x);
      } else if (inB2 >= 0) {
        const delta = b2.length >= b1.length ? 1 : Math.floor(b1.length / Math.max(b2.length, 1));
        p = Math.max(0, p - Math.max(delta, 1));
        victim = replace(true);
        b2.splice(inB2, 1);
        t2.push(x);
      } else {
        // pure miss
        if (t1.length + t2.length >= c) {
          victim = replace(false);
        }
        // also trim ghosts if L1 or L2 too large
        if (t1.length + b1.length >= c && t1.length === c) {
          // edge: handled by replace
        }
        t1.push(x);
      }
    }

    // cap resident
    while (t1.length + t2.length > c) {
      const v = replace(false);
      if (v == null) break;
      if (victim == null) victim = v;
    }

    const residents = [...t1, ...t2];
    const meta = new Map<number, Partial<FrameSlot>>();
    t1.forEach((pg) => meta.set(pg, { list: "T1" }));
    t2.forEach((pg) => meta.set(pg, { list: "T2" }));

    snaps.push(
      baseSnap(
        t + 1,
        x,
        hit,
        victim,
        placePages(capacity, residents, meta),
        {
          T1: [...t1],
          T2: [...t2],
          B1_ghost: [...b1],
          B2_ghost: [...b2],
          target_p: [p],
        },
        hit
          ? `HIT P${x} — move to T2 (frequent). p=${p}`
          : victim != null
            ? `MISS P${x} — adapt p=${p}, evict P${victim}, place in ${t2.includes(x) ? "T2" : "T1"}.`
            : `MISS P${x} — load into T1 (recency). p=${p}`,
        hits,
        misses,
      ),
    );
  }
  return snaps;
}

export function simulatePolicy(
  policy: CachePolicyId,
  trace: number[],
  capacity: number,
): PolicyRun {
  let snapshots: PolicySnapshot[];
  switch (policy) {
    case "lru":
      snapshots = simulateLru(trace, capacity);
      break;
    case "mru":
      snapshots = simulateMru(trace, capacity);
      break;
    case "lru-k":
      snapshots = simulateLruK(trace, capacity, 2);
      break;
    case "clock":
      snapshots = simulateClock(trace, capacity);
      break;
    case "two-q":
      snapshots = simulateTwoQ(trace, capacity);
      break;
    case "arc":
      snapshots = simulateArc(trace, capacity);
      break;
    default:
      snapshots = simulateLru(trace, capacity);
  }
  return { policy, capacity, trace, snapshots };
}

export function allPolicies(): CachePolicyId[] {
  return ["lru", "mru", "lru-k", "clock", "two-q", "arc"];
}
