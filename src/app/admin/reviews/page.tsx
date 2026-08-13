import { getAllReviewsForAdmin, getReviewStats } from "~/lib/queries/reviews";

import { ReviewsPageClient } from "./page.client";

export default async function AdminReviewsPage() {
  const [stats, reviews] = await Promise.all([
    getReviewStats(),
    getAllReviewsForAdmin(),
  ]);

  return <ReviewsPageClient reviews={reviews} stats={stats} />;
}
