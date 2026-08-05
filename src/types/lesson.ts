export type LessonLevel = "intro" | "intermediate" | "advanced";

export type BufferPoolVisualProps = {
  frames: Array<{
    frameId: number;
    pageId: number | null;
    pinned?: boolean;
    dirty?: boolean;
    highlight?: boolean;
  }>;
  diskPages: number[];
  pageTable: Array<{ pageId: number; frameId: number }>;
  focus?: "disk" | "frames" | "page-table" | "all";
  annotation?: string;
};

/** Animated cache replacement policy demo (lesson 3). */
export type CachePolicyVisualProps = {
  policy: "lru" | "mru" | "lru-k" | "clock" | "two-q" | "arc";
  /** Frame capacity (default 4) */
  capacity?: number;
  /** Page-id access stream */
  trace?: number[];
  annotation?: string;
};

/** Disk-oriented DBMS React Flow scene props. */
export type DiskOrientedVisualProps = {
  focus:
    | "overview"
    | "folder"
    | "db-file"
    | "page-header"
    | "page-links"
    | "buffer-pool"
    | "request-path"
    | "full-stack";
  annotation?: string;
  highlightPageId?: number | null;
  pageTable?: Array<{ pageId: number; frameId: number }>;
  frames?: Array<{
    frameId: number;
    pageId: number | null;
    pinned?: boolean;
    dirty?: boolean;
    highlight?: boolean;
  }>;
  requestLabel?: string;
  folderHighlight?: "root" | "data" | "wal" | "catalog" | null;
  activeLink?: string | null;
};

export type StructuresVisualProps = {
  mode:
    | "array"
    | "list"
    | "both"
    | "compare-access"
    | "animate-insert";
  arrayValues: Array<string | number | null>;
  listValues: Array<string | number>;
  highlightIndex?: number | null;
  highlightNodeId?: string | null;
  annotation?: string;
};

export type VisualSpec =
  | { component: "BufferPoolScene"; props: BufferPoolVisualProps }
  | { component: "DiskOrientedScene"; props: DiskOrientedVisualProps }
  | { component: "StructuresScene"; props: StructuresVisualProps }
  | { component: "CachePolicyScene"; props: CachePolicyVisualProps };

export type LessonStep = {
  id: string;
  title: string;
  caption: string;
  body?: string;
  durationMs?: number;
  visual: VisualSpec;
  callouts?: Array<{ label: string; text: string }>;
};

export type Lesson = {
  slug: string;
  title: string;
  subject: string;
  subjectSlug: string;
  level: LessonLevel;
  summary: string;
  prerequisites?: string[];
  order?: number;
  presentation?: "default" | "immersive";
  steps: LessonStep[];
};

export type Subject = {
  slug: string;
  title: string;
  description: string;
  lessonSlugs: string[];
};
