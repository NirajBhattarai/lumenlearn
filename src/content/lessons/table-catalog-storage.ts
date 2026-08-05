import type { Lesson } from "@/types/lesson";

export const tableCatalogStorageLesson: Lesson = {
  slug: "table-catalog-storage",
  title: "Tables, Catalog & datadb.db",
  subject: "Database Systems",
  subjectSlug: "database-systems",
  level: "intermediate",
  order: 2.5,
  presentation: "immersive",
  summary:
    "Click Create users / orders, watch the RAM catalog store first_page_id, inspect the raw datadb.db hex, then Insert through the catalog into the right page.",
  prerequisites: ["disk-oriented-dbms", "pages-vs-frames"],
  steps: [
    {
      id: "lab",
      title: "Interactive lab — create, insert, inspect the file",
      caption:
        "Use the buttons. Create tables first so the catalog knows each first_page_id. Inserts look up that id, then DiskScheduler writes 8 KB into datadb.db.",
      visual: {
        component: "TableCatalogScene",
        props: {
          teach: {
            title: "You drive the engine",
            body: "Create → Insert (watch RID + slotted page) → Select (HIT vs MISS) → click a datadb.db slot. Restart shows why Postgres keeps pg_class on disk.",
          },
        },
      },
    },
  ],
};
