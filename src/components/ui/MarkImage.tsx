import Image from "next/image";
import { cn } from "@/lib/cn";

type Props = {
  src: string;
  alt?: string;
  size?: number;
  className?: string;
  priority?: boolean;
};

export function MarkImage({ src, alt = "", size = 40, className, priority }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={cn(
        "shrink-0 rounded-[var(--radius-sm)] border border-border bg-stage object-cover",
        className,
      )}
    />
  );
}
