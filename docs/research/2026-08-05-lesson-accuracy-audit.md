# Lesson accuracy audit

Date: 2026-08-05

## Question

Are all shipped LumenLearn lessons technically correct vs BusTub source and standard algorithms?

## Sources

- `bustub-private/src/include/common/config.h` (`BUSTUB_PAGE_SIZE = 8192`, `LRUK_REPLACER_K = 10`)
- `storage/disk/disk_manager.cpp` (`.log` sibling file, not `.wal`)
- `storage/page/table_page.h` (8 B header: `next_page_id`, `num_tuples`, `num_deleted`)
- `storage/table/table_heap.h` (heap is a page chain; struct only has next)
- `storage/page/b_plus_tree_leaf_page.h` (keys + RIDs, 16 B header, tombstones)
- `buffer/buffer_pool_manager.h` (`FrameHeader`, `page_table_`, `ArcReplacer`)
- `buffer/arc_replacer.h` (mru / mfu / ghosts + `mru_target_size_`)
- O’Neil LRU-K; Johnson & Shasha 2Q; Megiddo & Modha ARC

## Findings → fixes

| Item | Verdict | Action |
|------|---------|--------|
| Page size 8 KB, offset = page_id × 8192 | Correct | none |
| TablePage slotted layout + RID | Correct vs `table_page.h` | none |
| Heap chain via `next_page_id` | Correct (header text “doubly-linked” in BusTub is stale) | none |
| B+ leaf keys → RIDs | Correct | expanded sample keys Ada…Eve |
| Pin / dirty / page table | Correct | none |
| Array O(1) vs list O(k) | Correct | none |
| `bustub.wal` + `catalog/` folder + `/var/lib/bustub` | **Incorrect** for BusTub | `.log`, in-memory `catalog_`, relative paths |
| P0 “directory page” | Teaching model, not BusTub catalog | already labeled; left as model |
| pages-vs-frames showed **P7** not on disk strip | Bug | P7 → P3 |
| Cache PK lookup hit heap before index | Unrealistic | index then heap |
| 2Q sim (promote on resident re-hit, no A1out) | Simplified, not paper 2Q | labeled |
| ARC sim vs BusTub ArcReplacer | Same family, not identical | labeled |
| LRU-K K=2 vs BusTub K=10 / Arc BPM | Teaching K=2 | labeled |
| Disk lesson 5 students vs cache lesson 12 | Two sample scales | noted, not merged |

## Decision

Fix hard errors; keep useful teaching models with explicit disclaimers.

## Reason

Learners should not memorize invented BusTub paths or impossible page ids. Simplified 2Q/ARC remain useful labs if named as such.
