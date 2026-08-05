import Link from "next/link";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/subjects/data-structures", label: "Subjects" },
  { href: "/lessons/array-vs-linked-list", label: "Start" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-[var(--max-width)] items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-foreground"
        >
          <span
            aria-hidden
            className="inline-flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] border border-border-strong bg-surface font-mono text-[10px] font-semibold tracking-tight text-accent"
          >
            L
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            LumenLearn
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <nav className="flex items-center gap-1 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-[var(--radius-md)] px-3 py-1.5 text-muted transition-colors",
                  "hover:bg-surface-raised hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
