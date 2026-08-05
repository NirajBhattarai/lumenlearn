import { cn } from "@/lib/cn";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  variant?: Variant;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent-hover",
  secondary:
    "border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-raised",
};

/** Next Link styled as a button — for CTAs that navigate. */
export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
  ...props
}: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-medium transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
