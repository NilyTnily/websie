import { X } from "lucide-react";
import Link from "next/link";

interface ActiveFilterBannerProps {
  clearHref: string;
  label: string;
}

/** Shows the active deep-link filter (e.g. from a dashboard stat card) with a one-click clear. */
export function ActiveFilterBanner({
  clearHref,
  label,
}: ActiveFilterBannerProps) {
  return (
    <div
      className={`
        flex items-center gap-3 rounded-md border border-primary/30 bg-primary/5
        px-4 py-2.5 text-sm
      `}
    >
      <span>
        Filtered to <strong>{label}</strong>
      </span>
      <Link
        className={`
          ml-auto flex items-center gap-1 text-xs text-muted-foreground
          hover:text-foreground
        `}
        href={clearHref}
      >
        <X className="size-3.5" />
        Clear
      </Link>
    </div>
  );
}
