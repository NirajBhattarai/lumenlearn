"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { getVisitedLessons } from "@/lib/progress";
import { ButtonLink } from "@/components/ui/ButtonLink";

export type MapLesson = {
  slug: string;
  title: string;
  summary: string;
  level: string;
  steps: number;
  see: string;
  chip?: string;
  mark?: string;
};

export type MapChapter = {
  id: string;
  kicker: string;
  title: string;
  blurb: string;
  mark?: string;
  variantHub?: boolean;
  lessons: MapLesson[];
};

type Props = {
  subjectTitle: string;
  subjectDescription: string;
  heroSrc?: string;
  chapters: MapChapter[];
};

export function SubjectMap({
  subjectTitle,
  subjectDescription,
  heroSrc,
  chapters,
}: Props) {
  const [visited, setVisited] = useState<Set<string>>(new Set());

  useEffect(() => {
    setVisited(new Set(getVisitedLessons()));
  }, []);

  const flat = useMemo(() => chapters.flatMap((c) => c.lessons), [chapters]);
  const nextLesson = useMemo(
    () => flat.find((l) => !visited.has(l.slug)) ?? flat[0],
    [flat, visited],
  );
  const seenCount = flat.filter((l) => visited.has(l.slug)).length;

  return (
    <div className="space-y-10">
      <header className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-stage">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
          <div className="flex flex-col justify-end p-5 sm:p-7">
            <Link
              href="/subjects"
              className="font-mono text-[11px] text-subtle transition-colors hover:text-foreground"
            >
              ← Subjects
            </Link>
            <h1 className="mt-4 text-[2rem] font-semibold leading-[1.08] tracking-tight text-foreground sm:text-[2.6rem]">
              {subjectTitle}
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
              {subjectDescription}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-subtle">
              Walk the storage stack — disk, catalog, then what to evict.
            </p>
            {nextLesson ? (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <ButtonLink href={`/lessons/${nextLesson.slug}`}>
                  {seenCount === 0 ? "Enter path" : "Continue"}
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <span className="font-mono text-[11px] text-subtle">
                  {nextLesson.title}
                  <span className="mx-1.5 text-border-strong">·</span>
                  {seenCount}/{flat.length} opened
                </span>
              </div>
            ) : null}
          </div>
          {heroSrc ? (
            <div className="relative min-h-[200px] border-t border-border lg:border-l lg:border-t-0">
              <Image
                src={heroSrc}
                alt=""
                fill
                priority
                className="object-cover object-center"
                sizes="(min-width: 1024px) 22rem, 100vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stage via-transparent to-transparent lg:bg-gradient-to-l" />
            </div>
          ) : null}
        </div>

        <nav
          aria-label="Stack overview"
          className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4"
        >
          {chapters.map((ch, i) => {
            const done = ch.lessons.every((l) => visited.has(l.slug));
            const partial = !done && ch.lessons.some((l) => visited.has(l.slug));
            return (
              <a
                key={ch.id}
                href={`#layer-${ch.id}`}
                className="flex items-center gap-3 bg-surface px-3 py-3 transition-colors hover:bg-surface-raised"
              >
                {ch.mark ? (
                  <Image
                    src={ch.mark}
                    alt=""
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-[var(--radius-sm)] border border-border object-cover"
                  />
                ) : (
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      done && "bg-ok",
                      partial && "bg-accent",
                      !done && !partial && "bg-border-strong",
                    )}
                  />
                )}
                <span className="min-w-0">
                  <span className="block font-mono text-[10px] text-subtle">
                    {String(i + 1).padStart(2, "0")}
                    {done ? " · done" : partial ? " · in path" : ""}
                  </span>
                  <span className="block truncate text-[13px] font-medium text-foreground">
                    {ch.title}
                  </span>
                </span>
              </a>
            );
          })}
        </nav>
      </header>

      <div className="relative">
        <div
          aria-hidden
          className="absolute bottom-6 left-[21px] top-6 w-px bg-border sm:left-[27px]"
        />

        <ol className="space-y-10">
          {chapters.map((chapter, chapterIndex) => {
            const featured = chapter.lessons[0];
            const variants = chapter.variantHub ? chapter.lessons.slice(1) : [];
            const stations = chapter.variantHub ? [] : chapter.lessons;

            return (
              <li key={chapter.id} id={`layer-${chapter.id}`} className="relative scroll-mt-8">
                <div className="flex gap-4 sm:gap-6">
                  <div className="relative z-[1] mt-1 shrink-0">
                    {chapter.mark ? (
                      <Image
                        src={chapter.mark}
                        alt=""
                        width={56}
                        height={56}
                        className="h-11 w-11 rounded-[var(--radius-md)] border border-border-strong bg-stage object-cover shadow-[var(--shadow-stage)] sm:h-14 sm:w-14"
                      />
                    ) : (
                      <span className="mt-1 flex h-3 w-3 items-center justify-center rounded-full border border-border-strong bg-background">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pb-1">
                    <p className="text-eyebrow">{chapter.kicker}</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                      {chapter.title}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                      {chapter.blurb}
                    </p>

                    {stations.length > 0 ? (
                      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                        {stations.map((lesson, i) => (
                          <li key={lesson.slug}>
                            <Station
                              lesson={lesson}
                              index={`${chapterIndex + 1}.${i + 1}`}
                              visited={visited.has(lesson.slug)}
                              featured={i === 0 && chapterIndex === 0 && seenCount === 0}
                            />
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {chapter.variantHub && featured ? (
                      <div className="mt-4 space-y-3">
                        <Station
                          lesson={featured}
                          index={`${chapterIndex + 1}.1`}
                          visited={visited.has(featured.slug)}
                          featured
                        />
                        {variants.length > 0 ? (
                          <div className="rounded-[var(--radius-md)] border border-border bg-stage px-3 py-3 sm:px-4">
                            <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">
                              Same trace · swap the rule
                            </p>
                            <ul className="mt-2 flex flex-wrap gap-1.5">
                              {variants.map((v) => {
                                const seen = visited.has(v.slug);
                                return (
                                  <li key={v.slug}>
                                    <Link
                                      href={`/lessons/${v.slug}`}
                                      title={v.see}
                                      className={cn(
                                        "inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5 font-mono text-[11px] transition-colors",
                                        seen
                                          ? "border-ok/40 text-ok hover:bg-ok/10"
                                          : "border-border bg-surface text-muted hover:border-accent hover:text-foreground",
                                      )}
                                    >
                                      {seen ? <Check className="h-3 w-3" aria-hidden /> : null}
                                      {v.chip ?? v.title}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function Station({
  lesson,
  index,
  visited,
  featured,
}: {
  lesson: MapLesson;
  index: string;
  visited: boolean;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/lessons/${lesson.slug}`}
      className={cn(
        "group flex h-full gap-3 rounded-[var(--radius-md)] border p-3 transition-colors sm:p-4",
        featured
          ? "border-accent/50 bg-accent-muted/30 hover:bg-accent-muted/50"
          : "border-border bg-surface hover:border-border-strong hover:bg-surface-raised",
      )}
    >
      {lesson.mark ? (
        <Image
          src={lesson.mark}
          alt=""
          width={64}
          height={64}
          className="h-14 w-14 shrink-0 rounded-[var(--radius-sm)] border border-border object-cover sm:h-16 sm:w-16"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="font-mono text-[10px] text-subtle">
            {index}
            <span className="mx-1.5 text-border-strong">·</span>
            {lesson.level}
          </p>
          {visited ? (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-ok">
              <Check className="h-3 w-3" aria-hidden />
              opened
            </span>
          ) : (
            <span className="font-mono text-[10px] text-subtle group-hover:text-accent">
              {lesson.steps} step{lesson.steps === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <p className="mt-1 text-[15px] font-medium leading-snug text-foreground group-hover:text-accent">
          {lesson.title}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{lesson.see}</p>
      </div>
    </Link>
  );
}
