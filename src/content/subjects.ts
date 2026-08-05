import type { Subject } from "@/types/lesson";

export const subjects: Subject[] = [
  {
    slug: "database-systems",
    title: "Database Systems",
    description:
      "Disk-oriented architecture, buffer pools, ARC, pages, indexes, and concurrency — as animated state machines.",
    lessonSlugs: [
      "disk-oriented-dbms",
      "pages-vs-frames",
      "table-catalog-storage",
      "cache-lru",
      "cache-mru",
      "cache-lru-k",
      "cache-clock",
      "cache-2q",
      "cache-arc",
    ],
  },
  {
    slug: "data-structures",
    title: "Data Structures",
    description:
      "Arrays, lists, trees, graphs, hash maps, and caches — visualized as data-driven state.",
    lessonSlugs: ["array-vs-linked-list"],
  },
];
