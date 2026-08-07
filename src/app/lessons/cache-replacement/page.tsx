import Image from "next/image";
import Link from "next/link";
import { getLesson } from "@/content/lessons";
import { lessonMark, lessonSee } from "@/content/subject-tracks";
import { ButtonLink } from "@/components/ui/ButtonLink";

const POLICY_SLUGS = [
  "cache-lru",
  "cache-mru",
  "cache-lru-k",
  "cache-clock",
  "cache-2q",
  "cache-arc",
] as const;

export default function CacheReplacementHubPage() {
  const lessons = POLICY_SLUGS.map((slug) => getLesson(slug)).filter(
    (l): l is NonNullable<typeof l> => l != null,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow">Database Systems</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Cache replacement policies
          </h1>
          <p className="mt-2 max-w-2xl text-muted">
            Each mechanism is its own lesson on the same students table and 4-frame
            pool. Start with LRU, then change only the victim rule.
          </p>
          <div className="mt-6">
            <ButtonLink href="/lessons/cache-lru">Start with LRU</ButtonLink>
          </div>
        </div>
        <Image
          src="/marks/mark-cache.jpg"
          alt=""
          width={96}
          height={96}
          className="h-20 w-20 rounded-[var(--radius-md)] border border-border object-cover sm:h-24 sm:w-24"
        />
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {lessons.map((l) => (
          <li key={l.slug}>
            <Link
              href={`/lessons/${l.slug}`}
              className="group flex gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-3 transition-colors hover:border-border-strong hover:bg-surface-raised sm:p-4"
            >
              {lessonMark[l.slug] ? (
                <Image
                  src={lessonMark[l.slug]!}
                  alt=""
                  width={72}
                  height={72}
                  className="h-16 w-16 shrink-0 rounded-[var(--radius-sm)] border border-border object-cover sm:h-[72px] sm:w-[72px]"
                />
              ) : null}
              <div className="min-w-0">
                <p className="text-eyebrow">{l.level}</p>
                <p className="mt-1 text-[15px] font-medium text-foreground group-hover:text-accent">
                  {l.title}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {lessonSee[l.slug] ?? l.summary}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
