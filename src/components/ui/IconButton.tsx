import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
};

export function IconButton({
  label,
  className,
  children,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-foreground transition-colors",
        "hover:border-border-strong hover:bg-surface-raised",
        "disabled:pointer-events-none disabled:opacity-30",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
