import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { subjects } from "@/content/subjects";
import { getAllLessons } from "@/content/lessons";
import { ButtonLink } from "@/components/ui/ButtonLink";

export default function HomePage() {
  const lessons = getAllLessons();
  const firstLesson = lessons[0];

  return (
    <div className="space-y-14">
      <section className="max-w-2xl pt-2">
        <p className="text-eyebrow">Interactive technical education</p>
        <h1 className="mt-3 text-[2.25rem] font-semibold leading-[1.15] tracking-tight text-foreground sm:text-5xl">
          LumenLearn
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          See systems move. Step through state. Experiment with parameters.
          Understand by interacting — not by reading walls of text.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {firstLesson ? (
            <ButtonLink href={`/lessons/${firstLesson.slug}`}>
              Start {firstLesson.title}
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          ) : null}
          <ButtonLink href="/subjects/data-structures" variant="secondary">
            Browse subjects
          </ButtonLink>
        </div>
      </section>

      <section className="border-t border-border pt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Lessons
          </h2>
          <p className="font-mono text-[11px] text-subtle">
            {lessons.length} available
          </p>
        </div>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {lessons.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/lessons/${l.slug}`}
                className="group flex flex-col gap-1 py-4 transition-colors sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
              >
                <div className="min-w-0">
                  <p className="text-eyebrow">
                    {l.subject} · {l.level}
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-foreground group-hover:text-accent">
                    {l.title}
                  </p>
                  <p className="mt-1 max-w-xl text-sm text-muted">{l.summary}</p>
                </div>
                <span className="shrink-0 font-mono text-xs text-subtle group-hover:text-accent">
                  {l.steps.length} steps
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Subjects
        </h2>
        <ul className="mt-4 space-y-0 divide-y divide-border border-y border-border">
          {subjects.map((s) => (
            <li key={s.slug}>
              <Link
                href={
                  s.lessonSlugs.length
                    ? `/subjects/${s.slug}`
                    : "/lessons/pages-vs-frames"
                }
                className="group block py-4"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[15px] font-medium text-foreground group-hover:text-accent">
                    {s.title}
                  </h3>
                  <span className="font-mono text-xs text-subtle">
                    {s.lessonSlugs.length
                      ? `${s.lessonSlugs.length} lesson${s.lessonSlugs.length === 1 ? "" : "s"}`
                      : "soon"}
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-muted">{s.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
