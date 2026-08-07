import { notFound } from "next/navigation";
import { subjects } from "@/content/subjects";
import { getLessonsForSubject, lessonsBySlug } from "@/content/lessons";
import {
  lessonChip,
  lessonMark,
  lessonSee,
  subjectHero,
  subjectTracks,
} from "@/content/subject-tracks";
import { SubjectMap, type MapChapter } from "@/components/subjects/SubjectMap";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return subjects.map((s) => ({ slug: s.slug }));
}

export const dynamicParams = false;

export default async function SubjectPage({ params }: Props) {
  const { slug } = await params;
  const subject = subjects.find((s) => s.slug === slug);
  if (!subject) notFound();

  const catalog = getLessonsForSubject(slug);
  const tracks = subjectTracks[slug];

  const chapters: MapChapter[] = tracks
    ? tracks.map((chapter) => ({
        id: chapter.id,
        kicker: chapter.kicker,
        title: chapter.title,
        blurb: chapter.blurb,
        mark: chapter.mark,
        variantHub: chapter.variantHub,
        lessons: chapter.lessonSlugs
          .map((lessonSlug) => {
            const lesson = lessonsBySlug[lessonSlug];
            if (!lesson) return null;
            return {
              slug: lesson.slug,
              title: lesson.title,
              summary: lesson.summary,
              level: lesson.level,
              steps: lesson.steps.length,
              see: lessonSee[lesson.slug] ?? lesson.summary,
              chip: lessonChip[lesson.slug],
              mark: lessonMark[lesson.slug],
            };
          })
          .filter((x): x is NonNullable<typeof x> => x != null),
      }))
    : [
        {
          id: "all",
          kicker: "Path",
          title: "Lessons",
          blurb: subject.description,
          lessons: catalog.map((lesson) => ({
            slug: lesson.slug,
            title: lesson.title,
            summary: lesson.summary,
            level: lesson.level,
            steps: lesson.steps.length,
            see: lessonSee[lesson.slug] ?? lesson.summary,
            chip: lessonChip[lesson.slug],
            mark: lessonMark[lesson.slug],
          })),
        },
      ];

  return (
    <SubjectMap
      subjectTitle={subject.title}
      subjectDescription={subject.description}
      heroSrc={subjectHero[slug]}
      chapters={chapters}
    />
  );
}
