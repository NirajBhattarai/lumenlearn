import type { AccessIntent } from "@/lib/cache-policies/sample";
import type { CachePolicyId, FrameSlot } from "@/lib/cache-policies/types";

export type CacheBeat = "idle" | "request" | "decide" | "evict" | "load" | "done";

export type CacheStudentsData = {
  focusRowIds: number[];
  focusPageId: number | null;
  victimPage: number | null;
  loadingPage: number | null;
  frameOf: Record<number, number>;
};

export type CachePageData = {
  pageId: number;
  resident: boolean;
  requesting: boolean;
  leaving: boolean;
  loading: boolean;
  hotRowIds: number[];
};

export type CacheFrameData = {
  frame: FrameSlot;
  isTarget: boolean;
  isVictim: boolean;
  hand: boolean;
  hotRowIds: number[];
};

export type CacheQueryData = {
  sql: string;
  why: string;
  ridNote?: string;
  pageId: number;
  beat: CacheBeat;
  hit: boolean | null;
};

export type CacheLabelData = {
  text: string;
  hint?: string;
};

export type CacheRailSlot = {
  frameId: number;
  pageId: number | null;
  ref: boolean;
  hand: boolean;
};

export type CacheRailLane = {
  id: string;
  title: string;
  leftLabel: string;
  rightLabel: string;
  leftTag: string | null;
  rightTag: string | null;
  emptyHint: string;
  pages: number[];
  ghost?: boolean;
  kind?: "pages" | "clock";
  clockSlots?: CacheRailSlot[];
};

export type CachePolicyRailData = {
  policy: CachePolicyId;
  title: string;
  subtitle: string;
  lanes: CacheRailLane[];
  activePage: number | null;
  victimPage: number | null;
  targetP?: number;
  note?: string;
};

export type CacheGraphInput = {
  policy: CachePolicyId;
  beat: CacheBeat;
  frames: FrameSlot[];
  structures: Record<string, number[]>;
  hand: number;
  focusRowIds: number[];
  pendingAccess: number | null;
  victimPage: number | null;
  accessPage: number | null;
  hit: boolean | null;
  intent: AccessIntent | null;
};
