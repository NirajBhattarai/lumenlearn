import Link from "next/link";
import { getLesson } from "@/content/lessons";
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

      <ol className="divide-y divide-border border-y border-border">
        {lessons.map((l, i) => (
          <li key={l.slug}>
            <Link href={`/lessons/${l.slug}`} className="group block py-4">
              <p className="text-eyebrow">
                Lesson {String(l.order ?? i + 3).padStart(2, "0")} · {l.level}
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
    </div>
  );
}
