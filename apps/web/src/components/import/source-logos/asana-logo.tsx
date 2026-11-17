import type { SourceLogoProps } from "@/components/import/source-logos/source-logo-size";
import { cn } from "@/lib/cn";

export function AsanaLogo({ size }: SourceLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cn("text-foreground", size === "sm" ? "size-4" : "size-5")}
    >
      <circle cx="12" cy="4.5" r="2.15" />
      <circle cx="6" cy="16.5" r="2.15" />
      <circle cx="18" cy="16.5" r="2.15" />
    </svg>
  );
}
