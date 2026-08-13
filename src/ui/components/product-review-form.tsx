"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";

import type { ReviewFormState } from "~/app/actions/reviews";

import { cn } from "~/lib/cn";
import { Button } from "~/ui/primitives/button";

interface ProductReviewFormProps {
  action: (
    state: ReviewFormState,
    formData: FormData,
  ) => Promise<ReviewFormState>;
}

export function ProductReviewForm({ action }: ProductReviewFormProps) {
  const [state, formAction, isPending] = useActionState<
    ReviewFormState,
    FormData
  >(action, {});
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  if (state.success) {
    return (
      <p className="text-sm text-muted-foreground">
        Thanks — your review is in queue for approval.
      </p>
    );
  }

  return (
    <form action={formAction} className="max-w-md space-y-3">
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHoverRating(0)}
      >
        {Array.from({ length: 5 }, (_, i) => {
          const value = i + 1;
          return (
            <button
              className="p-0.5"
              key={value}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              type="button"
            >
              <Star
                className={cn(
                  "h-5 w-5",
                  value <= (hoverRating || rating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground",
                )}
              />
            </button>
          );
        })}
      </div>
      <input name="rating" type="hidden" value={rating} />
      <textarea
        className={`
          flex min-h-20 w-full rounded-md border border-input bg-transparent
          px-3 py-2 text-sm shadow-xs outline-none
          focus-visible:border-ring focus-visible:ring-[3px]
          focus-visible:ring-ring/50
        `}
        name="comment"
        placeholder="Share your experience with this piece…"
        required
      />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button disabled={isPending} size="sm" type="submit">
        {isPending ? "Submitting…" : "Submit Review"}
      </Button>
    </form>
  );
}
