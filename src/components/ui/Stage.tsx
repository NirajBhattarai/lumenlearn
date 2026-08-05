import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/** Reserved-height lesson stage frame — chrome only, no decorative gradients. */
export function Stage({ children, className, ...props }: Props) {
  return (
    <div
      className={cn(
        "relative h-[min(72vh,720px)] overflow-hidden rounded-[var(--radius-stage)] border border-border bg-stage shadow-[var(--shadow-stage)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
