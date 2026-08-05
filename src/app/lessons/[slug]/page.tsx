import { notFound } from "next/navigation";
import { getAllLessons, getLesson } from "@/content/lessons";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllLessons().map((l) => ({ slug: l.slug }));
}

export const dynamicParams = false;

export default async function LessonPage({ params }: Props) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) notFound();

  return <LessonPlayer lesson={lesson} />;
}
