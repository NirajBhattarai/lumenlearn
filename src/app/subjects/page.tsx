import Image from "next/image";
import Link from "next/link";
import { subjects } from "@/content/subjects";
import { subjectHero, subjectMark, subjectTracks } from "@/content/subject-tracks";

export default function SubjectsIndexPage() {
  return (
    <div className="space-y-10">
      <header>
        <p className="text-eyebrow">Catalog</p>
        <h1 className="mt-3 text-[2rem] font-semibold tracking-tight text-foreground sm:text-4xl">
          Subjects
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          Each subject is a machine you can walk through — not a course list.
        </p>
      </header>

      <ul className="grid gap-4 lg:grid-cols-2">
        {subjects.map((subject) => {
          const layers = subjectTracks[subject.slug] ?? [];
          const hero = subjectHero[subject.slug];
          const mark = subjectMark[subject.slug];
          return (
            <li key={subject.slug}>
              <Link
                href={`/subjects/${subject.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface transition-colors hover:border-border-strong"
              >
                {hero ? (
                  <div className="relative aspect-[16/8] bg-stage">
                    <Image
                      src={hero}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(min-width: 1024px) 36rem, 100vw"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                    {mark ? (
                      <Image
                        src={mark}
                        alt=""
                        width={56}
                        height={56}
                        className="absolute bottom-3 left-3 h-12 w-12 rounded-[var(--radius-md)] border border-border object-cover shadow-[var(--shadow-stage)]"
                      />
                    ) : null}
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground group-hover:text-accent">
                      {subject.title}
                    </h2>
                    <span className="font-mono text-[11px] text-subtle">
                      {subject.lessonSlugs.length} labs
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">{subject.description}</p>
                  {layers.length > 0 ? (
                    <ol className="mt-auto flex flex-wrap gap-2 pt-1">
                      {layers.map((layer) => (
                        <li
                          key={layer.id}
                          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-stage px-2 py-1"
                        >
                          <Image
                            src={layer.mark}
                            alt=""
                            width={18}
                            height={18}
                            className="h-[18px] w-[18px] rounded-sm object-cover"
                          />
                          <span className="font-mono text-[10px] text-subtle">{layer.kicker}</span>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
