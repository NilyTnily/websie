import { ImageOff } from "lucide-react";

import { cn } from "~/lib/cn";

interface ImageFallbackProps {
  className?: string;
}

export function ImageFallback({ className }: ImageFallbackProps) {
  return (
    <div
      className={cn(
        `
          absolute inset-0 flex items-center justify-center bg-muted
          text-muted-foreground
        `,
        className,
      )}
    >
      <ImageOff className="h-6 w-6" />
    </div>
  );
}
