import type { GuardBeat, PageAnatomy, ThreadView } from "@/lib/page-guard/story";

export type QueryNodeData = {
  sql: string;
  kid: string;
  why: string;
  beat: GuardBeat;
};

export type BpmHubNodeData = {
  locked: boolean;
  why: string;
  tech: string;
  catalogLine: string;
  pinLine: string;
  ioLine: string;
  ioKind: "idle" | "read" | "write";
  pageLockNote: string;
  threads: ThreadView[];
};

export type VerticalPageNodeData = {
  kind: "disk" | "frame";
  anatomy: PageAnatomy;
  compact?: boolean;
  hot: boolean;
  flow?: "load" | "save" | "idle";
  pin?: number;
  locked?: boolean;
  dirty?: boolean;
  empty?: boolean;
  frameId?: number;
  roleTitle: string;
  roleBody: string;
  headerNote: string;
  slotNote: string;
  freeNote: string;
  tupleNote: string;
};

export type ThreadNodeData = ThreadView & { why: string };

export type LabelNodeData = { kicker: string; text: string; hint?: string };

export type FlowBadgeNodeData = {
  flow: "load" | "save" | "idle";
  label: string;
  why: string;
};
