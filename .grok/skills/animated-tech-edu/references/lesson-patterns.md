# Lesson scene patterns

## Universal 6-beat arc

1. **Hook** — show a failure or mystery (thrashing, wrong result)
2. **Name the parts** — introduce entities with labels
3. **Happy path** — one successful walkthrough
4. **Mechanism** — zoom into the rule / invariant
5. **Edge case** — pin, full pool, ghost hit, etc.
6. **Transfer** — one quiz or interactive lab

## Systems / databases

| Topic | Visual metaphor | Key props |
|-------|-----------------|-----------|
| Pages vs frames | Books vs reading desks | `pageId`, `frameId`, `mapping` |
| Buffer pool | Array of frames + disk strip | `frames[]`, `dirty`, `pin` |
| LRU / CLOCK / ARC | Lists with hand/pointer | `lists`, `hand`, `targetP` |
| B+ tree | Expanding node cards | `nodes`, `highlightPath` |
| WAL / recovery | Log tape + page images | `lsn`, `flushed`, `dirtyPages` |
| 2PL locks | Resource table + wait-for graph | `locks`, `waits` |

## Algorithms

- Array as boxes; highlight indices; show invariant banner.
- Recursion as stack frames sliding in from right.
- Graphs: node position stable across steps; only edges/colors change.

## Distributed / blockchain

- Message packets animate along links (transform only).
- Clocks / heights as counters with causal arrows.
- Never animate 10 nodes fully; abstract to 3–5.

## Math

- KaTeX equation + linked highlight on diagram region.
- Number lines / area models before symbols.

## Caption writing

- Bad: “Now we update the data structure.”
- Good: “Page 7 is not in any frame, so we take free frame 2 and read 8 KB from disk.”

Use present tense. Name IDs. Prefer verbs learners can picture.
