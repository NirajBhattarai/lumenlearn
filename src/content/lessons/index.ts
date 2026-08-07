import type { Lesson } from "@/types/lesson";
import { arrayVsLinkedListLesson } from "./array-vs-linked-list";
import { cachePolicyLessons } from "./cache-policies";
import { diskOrientedDbmsLesson } from "./disk-oriented-dbms";
import { pagesVsFramesLesson } from "./pages-vs-frames";
import { tableCatalogStorageLesson } from "./table-catalog-storage";
import { pageGuardRaiiLesson } from "./page-guard-raii";

export const allLessons: Lesson[] = [
  diskOrientedDbmsLesson,
  { ...pagesVsFramesLesson, order: 2, prerequisites: ["disk-oriented-dbms"] },
  tableCatalogStorageLesson,
  pageGuardRaiiLesson,
  ...cachePolicyLessons,
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
