import { getProject, onChange, type ISheet } from "@theatre/core";
import { STORY_END } from "./story";

let sheet: ISheet | null = null;

export function getGuardSheet(): ISheet {
  if (sheet) return sheet;
  const project = getProject("lumen-page-guard");
  sheet = project.sheet("Ava Ivy write story");
  return sheet;
}

export function subscribeStoryTime(onTime: (t: number) => void): () => void {
  const sequence = getGuardSheet().sequence;
  return onChange(sequence.pointer.position, (pos) => {
    onTime(pos);
  });
}

export async function playStory(rate = 1): Promise<void> {
  const sequence = getGuardSheet().sequence;
  await sequence.play({ iterationCount: 1, range: [0, STORY_END], rate });
}

export function pauseStory(): void {
  getGuardSheet().sequence.pause();
}

export function seekStory(time: number): void {
  getGuardSheet().sequence.position = Math.max(0, Math.min(STORY_END, time));
}

export function storyTime(): number {
  return getGuardSheet().sequence.position;
}
