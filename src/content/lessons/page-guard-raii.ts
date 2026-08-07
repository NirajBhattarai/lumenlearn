import type { Lesson } from "@/types/lesson";

export const pageGuardRaiiLesson: Lesson = {
  slug: "page-guard-raii",
  title: "PageGuard, pin & two latches",
  subject: "Database Systems",
  subjectSlug: "database-systems",
  level: "intermediate",
  order: 2.7,
  presentation: "immersive",
  summary:
    "Vertical 8 KB pages: UPDATE Ava then INSERT Ivy. BPM lock → pin the frame → page lock → mutate slots/tuples → SAVE back to disk.",
  prerequisites: ["disk-oriented-dbms", "pages-vs-frames"],
  steps: [
    {
      id: "lab",
      title: "Ava then Ivy",
      caption:
        "Watch the tall page: header, slots down, tuples up. Update Ava, then insert Ivy into a new slot and flush.",
      visual: {
        component: "PageGuardScene",
        props: {
          teach: {
            title: "Disk · BPM · Frame",
            body: "BPM sits in the middle. Left is durable 8 KB. Right is the pinned copy. Read each band — header, slots, free, tuples.",
          },
        },
      },
    },
  ],
};
