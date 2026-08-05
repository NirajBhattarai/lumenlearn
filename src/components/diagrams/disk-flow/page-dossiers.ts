import { rowsOnPage } from "./sample";

export type DossierField = {
  name: string;
  value: string;
  /** Why this field exists — shown under the row */
  why: string;
};

export type DossierSection = {
  id: string;
  title: string;
  /** Short tag e.g. "8 B" or "grows ↓" */
  tag?: string;
  /** Section purpose in plain language */
  about: string;
  fields: DossierField[];
};

export type PageDossier = {
  pageId: number;
  kind: "meta" | "heap" | "index";
  typeName: string;
  subtitle: string;
  /** One-line role of this page type */
  role: string;
  fileOffset: number;
  sections: DossierSection[];
  /** Bottom takeaway */
  remember: string;
};

function heapDossier(pageId: number): PageDossier {
  const rows = rowsOnPage(pageId);
  const next = pageId < 3 ? pageId + 1 : null;
  const numTuples = rows.length;

  return {
    pageId,
    kind: "heap",
    typeName: "TablePage",
    subtitle: "Slotted heap page · table students",
    role: "Stores actual table rows (tuples). Slots point into the tuple area at the end of the page.",
    fileOffset: pageId * 8192,
    sections: [
      {
        id: "header",
        title: "Header",
        tag: "8 B fixed",
        about:
          "BusTub TablePage header is only 8 bytes at the start of the page (table_page.h).",
        fields: [
          {
            name: "next_page_id",
            value: next == null ? "INVALID (−1)" : String(next),
            why: "Links this heap page to the next one so a table can span many pages.",
          },
          {
            name: "num_tuples",
            value: String(numTuples),
            why: "How many slots / rows are recorded on this page (including deleted).",
          },
          {
            name: "num_deleted",
            value: "0",
            why: "Count of soft-deleted tuples (tombstoned via TupleMeta).",
          },
        ],
      },
      {
        id: "slots",
        title: "Slot directory",
        tag: "grows ↓",
        about:
          "Each slot is ~24 B: (offset, size, TupleMeta). Slot index = RID.slot_num.",
        fields:
          numTuples > 0
            ? rows.map((r) => ({
                name: `tuple_info[${r.slot}]`,
                value: `off=${r.offset}  sz=${r.size}  → ${r.name}`,
                why: `RID (${r.pageId}, ${r.slot}) finds this slot, then jumps to byte ${r.offset} for the tuple body.`,
              }))
            : [
                {
                  name: "tuple_info[]",
                  value: "(empty)",
                  why: "No rows yet — free space fills most of the page.",
                },
              ],
      },
      {
        id: "free",
        title: "Free space",
        tag: "middle",
        about:
          "Gap between the end of the slot array and the start of tuple bytes. Shrinks on INSERT.",
        fields: [
          {
            name: "after slots",
            value: "start of free",
            why: "New slot entries grow downward into free space.",
          },
          {
            name: "before tuples",
            value: "end of free",
            why: "New tuple payloads grow upward from the page end into free space.",
          },
        ],
      },
      {
        id: "tuples",
        title: "Tuple payload",
        tag: "grows ↑",
        about:
          "Raw row bytes from the end of the page. Layout is schema-dependent (meta + column data).",
        fields:
          numTuples > 0
            ? rows.map((r) => ({
                name: `T${r.slot} @ ${r.offset}`,
                value: `(${r.id}, "${r.name}", "${r.major}")`,
                why: `Sample students row. Size ${r.size} B at file-local page offset ${r.offset}.`,
              }))
            : [
                {
                  name: "tuples",
                  value: "(none)",
                  why: "Empty heap page ready for inserts.",
                },
              ],
      },
    ],
    remember:
      "Heap page = header + slots↓ + free + tuples↑. RID (page_id, slot) addresses one row without scanning the table.",
  };
}

export function getPageDossier(pageId: number): PageDossier {
  if (pageId === 0) {
    return {
      pageId: 0,
      kind: "meta",
      typeName: "Directory / meta page",
      subtitle: "Catalog roots & free-space map (teaching model)",
      role: "Does not store student rows. Points the system at heap/index roots and tracks which pages exist in the file.",
      fileOffset: 0,
      sections: [
        {
          id: "identity",
          title: "Page identity",
          tag: "file head",
          about: "P0 starts at byte 0 of bustub.db — often the first block DiskManager can load.",
          fields: [
            {
              name: "page_id",
              value: "0",
              why: "Logical id. Physical offset = 0 × 8192 = 0 B.",
            },
            {
              name: "page_size",
              value: "8192 B",
              why: "Same size as every other page — meta is not a special length.",
            },
            {
              name: "role",
              value: "directory / catalog root",
              why: "Teaches “where is my table?” without opening every heap page.",
            },
          ],
        },
        {
          id: "roots",
          title: "Root pointers",
          tag: "navigation",
          about: "Links from names in the catalog down into the page graph.",
          fields: [
            {
              name: "root_heap",
              value: "P1 → TablePage",
              why: "First data page of table students (heap chain starts here).",
            },
            {
              name: "root_index",
              value: "P4 → B+ leaf",
              why: "Entry into the index for keyed lookups (id → RID).",
            },
            {
              name: "entry_count",
              value: "4",
              why: "How many tracked pages / directory entries in this sample.",
            },
          ],
        },
        {
          id: "space",
          title: "Space map (simplified)",
          tag: "allocation",
          about: "Real systems track free pages so INSERT can allocate without scanning the whole file.",
          fields: [
            {
              name: "pages_used",
              value: "P0…P4",
              why: "Allocated range in our teaching file layout.",
            },
            {
              name: "free_list_head",
              value: "P3 (empty heap)",
              why: "Example free page the allocator could reuse next.",
            },
            {
              name: "lsn (sample)",
              value: "0x1a000",
              why: "Log sequence number ties page image to WAL for recovery (BPM bookkeeping).",
            },
          ],
        },
        {
          id: "not-here",
          title: "What is NOT on meta",
          tag: "important",
          about: "Avoid a common misconception.",
          fields: [
            {
              name: "tuples",
              value: "none",
              why: "Student rows live only on heap TablePages (P1, P2, …).",
            },
            {
              name: "index keys",
              value: "none",
              why: "Keys live on B+ tree pages (e.g. P4), not in the directory block.",
            },
          ],
        },
      ],
      remember:
        "Meta/directory pages navigate the database. Heap pages hold rows. Index pages hold keys → RIDs.",
    };
  }

  if (pageId === 4) {
    return {
      pageId: 4,
      kind: "index",
      typeName: "BPlusTreeLeafPage",
      subtitle: "Index leaf · keys ordered → RIDs",
      role: "Does not store full rows. Maps search keys to RIDs so the DBMS can jump straight to a heap page + slot.",
      fileOffset: 4 * 8192,
      sections: [
        {
          id: "header",
          title: "Leaf header",
          tag: "~16 B",
          about: "From b_plus_tree_leaf_page.h — page type, size, and sibling link.",
          fields: [
            {
              name: "page_type",
              value: "LEAF_PAGE",
              why: "Distinguishes leaf from internal B+ nodes.",
            },
            {
              name: "size",
              value: "2 keys (sample)",
              why: "How many live key/RID pairs are stored on this leaf.",
            },
            {
              name: "max_size",
              value: "LEAF_PAGE_SLOT_CNT",
              why: "Capacity before the leaf must split.",
            },
            {
              name: "next_page_id",
              value: "INVALID",
              why: "Sibling pointer for ordered leaf scans (range queries).",
            },
          ],
        },
        {
          id: "entries",
          title: "Key → RID entries",
          tag: "payload",
          about: "Each key points at exactly one heap location (unique index sample).",
          fields: [
            {
              name: "key[0] = 1",
              value: "RID (1, 0) → Ada",
              why: "Lookup id=1 → open P1, read slot 0 — no table scan.",
            },
            {
              name: "key[1] = 4",
              value: "RID (2, 0) → Dan",
              why: "id=4 lives on a different heap page (P2).",
            },
          ],
        },
        {
          id: "tombs",
          title: "Tombstones",
          tag: "deletes",
          about: "BusTub leaves can track deleted key indexes without immediately compacting.",
          fields: [
            {
              name: "num_tombstones",
              value: "0",
              why: "No deleted keys in this sample leaf.",
            },
          ],
        },
        {
          id: "flow",
          title: "Lookup path",
          tag: "how used",
          about: "What happens on SELECT * FROM students WHERE id = 1.",
          fields: [
            {
              name: "1. index",
              value: "find key 1 on P4",
              why: "Binary search inside the leaf (keys are ordered).",
            },
            {
              name: "2. RID",
              value: "(1, 0)",
              why: "Tells buffer pool which page and which slot.",
            },
            {
              name: "3. heap",
              value: "ReadPage(1) → slot 0",
              why: "Loads the whole heap page, then extracts one tuple.",
            },
          ],
        },
      ],
      remember:
        "Index page = keys + RIDs. Heap page = actual row bytes. Meta page = roots to both.",
    };
  }

  // P1, P2, P3 heap (and any other id maps to nearest teaching heap)
  const heapId = pageId >= 1 && pageId <= 3 ? pageId : 1;
  return heapDossier(heapId);
}
