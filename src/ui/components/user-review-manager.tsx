"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteReviewAction, updateReviewAction } from "~/app/actions/reviews";
import type { ProductReview } from "~/db/schema";
import { ProductReviewForm } from "~/ui/components/product-review-form";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";

interface UserReviewManagerProps {
  productId: string;
  review: ProductReview;
}

export function UserReviewManager({ productId, review }: UserReviewManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, startDeleting] = useTransition();

  const handleDelete = () => {
    if (!confirm("Delete your review? This cannot be undone.")) return;
    startDeleting(async () => {
      const res = await deleteReviewAction(productId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Review deleted.");
      // revalidate will refresh page; fallback to reload if needed
      window.location.reload();
    });
  };

  if (isEditing) {
    return (
      <Card>
        <CardContent className="pt-4">
          <p className="mb-3 text-sm font-medium">Edit your review</p>
          <ProductReviewForm
            action={updateReviewAction.bind(null, productId)}
            initialComment={review.comment}
            initialRating={review.rating}
            submitLabel="Update Review"
          />
          <Button className="mt-3" onClick={() => setIsEditing(false)} size="sm" variant="ghost">
            Cancel
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">Updating will send it back for admin approval.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4">
        <p className="text-sm font-medium">Your review {review.approved ? "(visible)" : "(pending approval)"}</p>
        <p className="mt-1 text-sm text-muted-foreground">{"★".repeat(review.rating)} — {review.comment}</p>
        {!review.approved && (
          <p className="mt-2 text-xs text-amber-600">Awaiting admin approval — you can still edit or delete.</p>
        )}
        <div className="mt-3 flex gap-2">
          <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
            Edit
          </Button>
          <Button disabled={isDeleting} onClick={handleDelete} size="sm" variant="ghost">
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
