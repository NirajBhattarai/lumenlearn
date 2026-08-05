import type {
  Beat,
  CatalogRow,
  DiskExtent,
  Engine,
  Frame,
  HeapPage,
  Rid,
  SchedulerReq,
  TableName,
} from "@/lib/table-catalog/engine";

export type CatalogGraphInput = {
  beat: Beat;
  engine: Engine;
  sql: string;
  note: string;
  packet: string;
  highlightTable?: TableName | null;
  highlightPageId?: number | null;
  scheduler: SchedulerReq[];
  inspectPageId?: number | null;
  rid?: Rid | null;
  scanNames?: string[];
  cacheHit?: boolean;
};

export type SqlNodeData = {
  sql: string;
  packet: string;
  beat: Beat;
  rid?: Rid | null;
  scanNames?: string[];
  cacheHit?: boolean;
};

export type CatalogNodeData = {
  rows: CatalogRow[];
  highlightTable?: TableName | null;
  beat: Beat;
  orphaned: boolean;
};

export type HeapNodeData = {
  catalog: CatalogRow[];
  heaps: Record<number, HeapPage>;
  highlightTable?: TableName | null;
  highlightPageId?: number | null;
};

export type SchedulerNodeData = {
  queue: SchedulerReq[];
  active: boolean;
};

export type DiskMapNodeData = {
  extents: DiskExtent[];
  highlightPageId?: number | null;
  active: boolean;
  fileBytes: number;
};

export type DbFileNodeData = {
  extents: DiskExtent[];
  heaps: Record<number, HeapPage>;
  highlightPageId?: number | null;
  inspectPageId?: number | null;
  orphaned: boolean;
  active: boolean;
};

export type BpmNodeData = {
  frames: Frame[];
  highlightPageId?: number | null;
  active: boolean;
};

export type AnatomyNodeData = {
  page: HeapPage;
  offset: number;
};

export type CompareNodeData = {
  orphaned: boolean;
};

export type LabelNodeData = {
  text: string;
  hint?: string;
};
