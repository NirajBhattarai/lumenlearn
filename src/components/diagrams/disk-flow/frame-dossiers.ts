import type { FieldRow } from "./nodes";

/** Logical page type once bytes are cast (not stored in FrameHeader). */
export function cachedPageType(pageId: number | null): string {
  if (pageId == null) return "—";
  if (pageId === 0) return "DirectoryPage";
  if (pageId === 4) return "BPlusTreeLeafPage";
  return "TablePage";
}

export function frameFields(opts: {
  frameId: number;
  pageId: number | null;
  pinned?: boolean;
  dirty?: boolean;
  /** True when this frame appears in page_table_ */
  inPageTable: boolean;
  /** True when this frame is on free_frames_ */
  inFreeList: boolean;
  highlight?: "pin" | "dirty" | "page" | "free" | null;
}): FieldRow[] {
  const empty = opts.pageId == null;
  const pinCount = opts.pinned ? 1 : 0;
  const dirty = Boolean(opts.dirty);
  const latch = empty
    ? "unlocked"
    : opts.pinned && dirty
      ? "exclusive (write)"
      : opts.pinned
        ? "shared (read)"
        : "unlocked";

  return [
    {
      name: "frame_id_",
      value: String(opts.frameId),
    },
    {
      name: "page_id",
      value: empty ? "INVALID (−1)" : String(opts.pageId),
      highlight: opts.highlight === "page" || (!empty && opts.highlight == null),
    },
    {
      name: "pin_count_",
      value: String(pinCount),
      highlight: opts.highlight === "pin" || Boolean(opts.pinned),
    },
    {
      name: "is_dirty_",
      value: dirty ? "true" : "false",
      highlight: opts.highlight === "dirty" || dirty,
    },
    {
      name: "data_",
      value: empty ? "zeros · 8192 B" : `char[8192] · ${cachedPageType(opts.pageId)}`,
    },
    {
      name: "rwlatch_",
      value: latch,
      highlight: opts.pinned,
    },
    {
      name: "in_page_table_",
      value: opts.inPageTable ? `yes  P${opts.pageId}→F${opts.frameId}` : "no",
    },
    {
      name: "in_free_list_",
      value: opts.inFreeList ? "yes" : "no",
      highlight: opts.highlight === "free" || opts.inFreeList,
    },
    {
      name: "in_replacer_",
      value: !empty && pinCount === 0 ? "yes (evictable)" : "no",
    },
    {
      name: "disk_offset",
      value: empty ? "—" : `${(opts.pageId as number) * 8192} B`,
    },
  ];
}

export type BpmStep = {
  n: string;
  text: string;
  hot?: boolean;
};

export function bpmFetchSteps(opts: {
  requestPageId?: number | null;
  hitFrameId?: number | null;
  miss?: boolean;
}): BpmStep[] {
  const pid = opts.requestPageId ?? 1;
  const hit = opts.hitFrameId != null && !opts.miss;
  return [
    {
      n: "1",
      text: `CheckedReadPage(${pid})`,
      hot: true,
    },
    {
      n: "2",
      text: `lookup page_table_[${pid}]`,
    },
    hit
      ? {
          n: "3",
          text: `HIT → frame ${opts.hitFrameId} · pin_count_++`,
          hot: true,
        }
      : {
          n: "3",
          text: "MISS → free_frames_ or ArcReplacer.Evict()",
          hot: true,
        },
    hit
      ? {
          n: "4",
          text: "RecordAccess(frame) · return ReadPageGuard",
        }
      : {
          n: "4",
          text: `DiskScheduler.Read(${pid} × 8192) → data_`,
        },
    hit
      ? {
          n: "5",
          text: "Executor reads bytes as TablePage*",
        }
      : {
          n: "5",
          text: `page_table_[${pid}] = frame · pin=1 · guard`,
          hot: true,
        },
  ];
}
