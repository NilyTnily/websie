import { Star } from "lucide-react";

import { submitReviewAction } from "~/app/actions/reviews";
import { getCurrentUser } from "~/lib/auth";
import {
  canUserReviewProduct,
  getApprovedReviewsForProduct,
} from "~/lib/queries/reviews";
import { ProductReviewForm } from "~/ui/components/product-review-form";
import { Avatar, AvatarFallback } from "~/ui/primitives/avatar";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

interface ProductReviewsProps {
  productId: string;
}

export async function ProductReviews({ productId }: ProductReviewsProps) {
  const [{ averageRating, reviews, totalCount }, user] = await Promise.all([
    getApprovedReviewsForProduct(productId),
    getCurrentUser(),
  ]);

  const canReview = user
    ? await canUserReviewProduct(user.id, productId)
    : false;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-2xl text-foreground">Reviews</h2>
        {totalCount > 0 && (
          <div
            className={`flex items-center gap-1.5 text-sm text-muted-foreground`}
          >
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  className={
                    i < Math.round(averageRating)
                      ? "h-4 w-4 fill-primary text-primary"
                      : "h-4 w-4 text-border"
                  }
                  key={i}
                />
              ))}
            </div>
            <span>
              {averageRating.toFixed(1)} ({totalCount} review
              {totalCount === 1 ? "" : "s"})
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No reviews yet — be the first to share your experience.
        </p>
      ) : (
        <ul className="space-y-6">
          {reviews.map((review) => (
            <li className="flex gap-3" key={review.id}>
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {review.customerName.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {review.customerName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {DATE_FORMATTER.format(review.createdAt)}
                  </span>
                </div>
                <div className="mt-0.5 flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      className={
                        i < review.rating
                          ? "h-3.5 w-3.5 fill-primary text-primary"
                          : "h-3.5 w-3.5 text-border"
                      }
                      key={i}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {review.comment}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canReview && (
        <div className="border-t border-border pt-6">
          <h3 className="mb-3 text-sm font-medium">Leave a review</h3>
          <ProductReviewForm
            action={submitReviewAction.bind(null, productId)}
          />
        </div>
      )}
    </div>
  );
}
