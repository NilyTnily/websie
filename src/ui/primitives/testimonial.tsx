import { cn } from "~/lib/cn";
import { Avatar, AvatarFallback, AvatarImage } from "~/ui/primitives/avatar";

export interface TestimonialAuthor {
  avatar: string;
  handle: string;
  name: string;
}

export interface TestimonialCardProps {
  author: TestimonialAuthor;
  className?: string;
  href?: string;
  text: string;
}

export function TestimonialCard({
  author,
  className,
  href,
  text,
}: TestimonialCardProps) {
  const Card = href ? "a" : "div";

  return (
    <Card
      {...(href ? { href } : {})}
      className={cn(
        "flex flex-col rounded-sm border border-border bg-card",
        "border-t-2 border-t-primary",
        `
          p-4 text-start
          sm:p-6
        `,
        "hover:border-primary/40",
        `
          max-w-[320px]
          sm:max-w-[320px]
        `,
        "transition-colors duration-300",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 ring-1 ring-border">
          <AvatarImage alt={author.name} src={author.avatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {author.name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start">
          <h3 className="text-md font-display leading-none text-foreground">
            {author.name}
          </h3>
          <p className="krs-ref mt-1 text-[11px] text-muted-foreground">
            {author.handle}
          </p>
        </div>
      </div>
      <p
        className={`
          sm:text-md
          mt-4 text-sm text-muted-foreground
        `}
      >
        {text}
      </p>
    </Card>
  );
}
