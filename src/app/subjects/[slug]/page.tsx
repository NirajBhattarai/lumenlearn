import Link from "next/link";
import { notFound } from "next/navigation";
import { subjects } from "@/content/subjects";
import { getLessonsForSubject } from "@/content/lessons";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return subjects.map((s) => ({ slug: s.slug }));
}

export default async function SubjectPage({ params }: Props) {
  const { slug } = await params;
  const subject = subjects.find((s) => s.slug === slug);
  if (!subject) notFound();

  const lessons = getLessonsForSubject(slug);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-eyebrow">Subject</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {subject.title}
        </h1>
        <p className="mt-2 max-w-2xl text-muted">{subject.description}</p>
      </div>

      {lessons.length === 0 ? (
        <p className="text-sm text-subtle">Lessons coming soon.</p>
      ) : (
        <ol className="divide-y divide-border border-y border-border">
          {lessons.map((l, i) => (
            <li key={l.slug}>
              <Link href={`/lessons/${l.slug}`} className="group block py-4">
                <p className="text-eyebrow">
                  Lesson {String(l.order ?? i + 1).padStart(2, "0")}
                </p>
                <p className="mt-1 text-[15px] font-medium text-foreground group-hover:text-accent">
                  {l.title}
                </p>
                <p className="mt-1 max-w-2xl text-sm text-muted">{l.summary}</p>
                <p className="mt-2 font-mono text-xs text-subtle group-hover:text-accent">
                  {l.steps.length} steps →
                </p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
