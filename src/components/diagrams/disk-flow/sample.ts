/** Shared students sample for disk lesson nodes. */

export type StudentRow = {
  id: number;
  name: string;
  major: string;
  pageId: number;
  slot: number;
  offset: number;
  size: number;
};

export const STUDENTS = {
  name: "students",
  ddl: "CREATE TABLE students (id INT, name VARCHAR, major VARCHAR);",
  rows: [
    { id: 1, name: "Ada", major: "CS", pageId: 1, slot: 0, offset: 8120, size: 72 },
    { id: 2, name: "Bob", major: "Math", pageId: 1, slot: 1, offset: 8040, size: 80 },
    { id: 3, name: "Cara", major: "Physics", pageId: 1, slot: 2, offset: 7952, size: 88 },
    { id: 4, name: "Dan", major: "CS", pageId: 2, slot: 0, offset: 8112, size: 80 },
    { id: 5, name: "Eve", major: "History", pageId: 2, slot: 1, offset: 8024, size: 88 },
  ] satisfies StudentRow[],
};

export function rowsOnPage(pageId: number): StudentRow[] {
  return STUDENTS.rows.filter((r) => r.pageId === pageId);
}

export const FILE_PAGES = [
  { id: 0, kind: "meta" as const, short: "dir" },
  { id: 1, kind: "heap" as const, short: "heap" },
  { id: 2, kind: "heap" as const, short: "heap" },
  { id: 3, kind: "heap" as const, short: "heap" },
  { id: 4, kind: "index" as const, short: "idx" },
];
