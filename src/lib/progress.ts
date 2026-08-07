const KEY = "lumen:visited-lessons";

export function getVisitedLessons(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function markLessonVisited(slug: string) {
  if (typeof window === "undefined") return;
  const next = new Set(getVisitedLessons());
  next.add(slug);
  window.localStorage.setItem(KEY, JSON.stringify([...next]));
}
