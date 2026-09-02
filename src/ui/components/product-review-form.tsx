"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";

import type { ReviewFormState } from "~/app/actions/reviews";

import {
  REVIEW_COMMENT_MAX_LENGTH,
  REVIEW_COMMENT_MIN_LENGTH,
} from "~/lib/review-constants";
import { cn } from "~/lib/cn";
import { Button } from "~/ui/primitives/button";

interface ProductReviewFormProps {
  action: (
    state: ReviewFormState,
    formData: FormData,
  ) => Promise<ReviewFormState>;
}

export function ProductReviewForm({
  action,
  initialComment = "",
  initialRating = 5,
  submitLabel = "Submit Review",
}: ProductReviewFormProps & { initialComment?: string; initialRating?: number; submitLabel?: string }) {
  const [state, formAction, isPending] = useActionState<
    ReviewFormState,
    FormData
  >(action, {});
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initialComment);

  if (state.success) {
    return (
      <p className="text-sm text-muted-foreground">
        Thanks — your review is in queue for approval.
      </p>
    );
  }

  const count = comment.length;
  const tooShort = count > 0 && count < REVIEW_COMMENT_MIN_LENGTH;
  const tooLong = count > REVIEW_COMMENT_MAX_LENGTH;

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
        maxLength={REVIEW_COMMENT_MAX_LENGTH}
        name="comment"
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this piece…"
        required
        value={comment}
      />
      <div className="flex items-center justify-between text-xs">
        <span className={tooShort || tooLong ? "text-destructive" : "text-muted-foreground"}>
          {count}/{REVIEW_COMMENT_MAX_LENGTH} {tooShort ? `— min ${REVIEW_COMMENT_MIN_LENGTH}` : ""}
        </span>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button disabled={isPending || tooShort || tooLong} size="sm" type="submit">
        {isPending ? "Submitting…" : submitLabel}
      </Button>
    </form>
  );
}
