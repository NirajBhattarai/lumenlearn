import type { Lesson } from "@/types/lesson";
import { arrayVsLinkedListLesson } from "./array-vs-linked-list";
import { cacheReplacementLesson } from "./cache-replacement";
import { diskOrientedDbmsLesson } from "./disk-oriented-dbms";
import { pagesVsFramesLesson } from "./pages-vs-frames";

export const allLessons: Lesson[] = [
  diskOrientedDbmsLesson,
  { ...pagesVsFramesLesson, order: 2, prerequisites: ["disk-oriented-dbms"] },
  {
    ...cacheReplacementLesson,
    order: 3,
    prerequisites: ["disk-oriented-dbms", "pages-vs-frames"],
  },
  arrayVsLinkedListLesson,
];

export const lessonsBySlug: Record<string, Lesson> = Object.fromEntries(
  allLessons.map((l) => [l.slug, l]),
);

export function getLesson(slug: string): Lesson | undefined {
  return lessonsBySlug[slug];
}

export function getAllLessons(): Lesson[] {
  return [...allLessons].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export function getLessonsForSubject(subjectSlug: string): Lesson[] {
  return getAllLessons().filter((l) => l.subjectSlug === subjectSlug);
}
