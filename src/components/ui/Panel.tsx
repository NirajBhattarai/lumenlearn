import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  padded?: boolean;
};

export function Panel({ children, className, padded = true, ...props }: Props) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-surface",
        padded && "p-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
