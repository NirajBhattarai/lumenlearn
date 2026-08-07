export type SubjectChapter = {
  id: string;
  kicker: string;
  title: string;
  blurb: string;
  mark: string;
  /** First lesson is the featured lab; the rest are sibling variants. */
  variantHub?: boolean;
  lessonSlugs: string[];
};

export const lessonSee: Record<string, string> = {
  "disk-oriented-dbms": "Open the folder, the .db file, then a slotted page.",
  "pages-vs-frames": "A page is durable. A frame is a RAM slot that holds one.",
  "table-catalog-storage": "CREATE stores first_page_id. INSERT writes hex into datadb.db.",
  "page-guard-raii": "Tall 8 KB page: BPM lock, pin frame, UPDATE Ava, INSERT Ivy, SAVE.",
  "cache-lru": "Evict the coldest page on the students trace.",
  "cache-mru": "Opposite of LRU — drop the page you just finished.",
  "cache-lru-k": "K=2: correlated re-reads outrank a single scan touch.",
  "cache-clock": "Second-chance bit. Sweep the circle, don’t keep timestamps.",
  "cache-2q": "First touch is probation. A re-hit graduates to Am.",
  "cache-arc": "Recency vs frequency, ghosts, and an adaptive target p.",
  "array-vs-linked-list": "Index math vs pointer chase — watch insert cost move.",
};

export const lessonChip: Record<string, string> = {
  "cache-lru": "LRU",
  "cache-mru": "MRU",
  "cache-lru-k": "LRU-K",
  "cache-clock": "Clock",
  "cache-2q": "2Q",
  "cache-arc": "ARC",
};

export const lessonMark: Record<string, string> = {
  "disk-oriented-dbms": "/marks/mark-disk.jpg",
  "pages-vs-frames": "/marks/mark-pages.jpg",
  "table-catalog-storage": "/marks/mark-catalog.jpg",
  "page-guard-raii": "/marks/mark-guard.jpg",
  "cache-lru": "/marks/mark-lru.jpg",
  "cache-mru": "/marks/mark-mru.jpg",
  "cache-lru-k": "/marks/mark-lruk.jpg",
  "cache-clock": "/marks/mark-clock.jpg",
  "cache-2q": "/marks/mark-2q.jpg",
  "cache-arc": "/marks/mark-arc.jpg",
  "array-vs-linked-list": "/marks/mark-linear.jpg",
};

export const subjectHero: Record<string, string> = {
  "database-systems": "/marks/hero-database.jpg",
  "data-structures": "/marks/hero-structures.jpg",
};

export const subjectMark: Record<string, string> = {
  "database-systems": "/marks/mark-disk.jpg",
  "data-structures": "/marks/mark-linear.jpg",
};

export const subjectTracks: Record<string, SubjectChapter[]> = {
  "database-systems": [
    {
      id: "architecture",
      kicker: "01 · Disk",
      title: "The machine on disk",
      blurb:
        "A database file is not a spreadsheet. It is 8 KB pages, headers, and a buffer pool that copies pages into frames.",
      mark: "/marks/mark-disk.jpg",
      lessonSlugs: ["disk-oriented-dbms", "pages-vs-frames"],
    },
    {
      id: "catalog",
      kicker: "02 · Catalog",
      title: "Names become page ids",
      blurb:
        "CREATE TABLE does not stamp the word “users” into the file. It remembers first_page_id in RAM, then writes a heap page.",
      mark: "/marks/mark-catalog.jpg",
      lessonSlugs: ["table-catalog-storage"],
    },
    {
      id: "guards",
      kicker: "03 · Guard",
      title: "Who may touch the page",
      blurb:
        "Two locks on a vertical slotted page: short BPM mutex, then PageGuard on the frame. UPDATE and INSERT both pin, write, SAVE, drop.",
      mark: "/marks/mark-guard.jpg",
      lessonSlugs: ["page-guard-raii"],
    },
    {
      id: "replacement",
      kicker: "04 · Replacer",
      title: "What to evict",
      blurb:
        "When every frame is full, a policy picks a victim. Same students workload — only the rule changes.",
      mark: "/marks/mark-cache.jpg",
      variantHub: true,
      lessonSlugs: [
        "cache-lru",
        "cache-mru",
        "cache-lru-k",
        "cache-clock",
        "cache-2q",
        "cache-arc",
      ],
    },
  ],
  "data-structures": [
    {
      id: "linear",
      kicker: "01 · Linear",
      title: "Contiguous vs linked",
      blurb:
        "Arrays buy O(1) index math. Lists buy cheap splice. The diagram is the proof.",
      mark: "/marks/mark-linear.jpg",
      lessonSlugs: ["array-vs-linked-list"],
    },
  ],
};
