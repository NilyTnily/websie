"use client";

import type { ColumnDef, ColumnMeta } from "@tanstack/react-table";

import { Check, MessageSquare, Star, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useTransition } from "react";

import type { ReviewStats, ReviewWithProduct } from "~/lib/queries/reviews";

import { defineMeta, filterFn } from "~/lib/filters";
import { StatCardGrid } from "~/ui/components/admin/stat-card";
import { Button } from "~/ui/primitives/button";
import { DataTable } from "~/ui/primitives/data-table/data-table";
import { DataTableColumnHeader } from "~/ui/primitives/data-table/data-table-column-header";

import { approveReviewAction, rejectReviewAction } from "./actions";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          className={
            i < rating
              ? "h-3.5 w-3.5 fill-primary text-primary"
              : "h-3.5 w-3.5 text-muted-foreground"
          }
          key={i}
        />
      ))}
    </div>
  );
}

function ReviewActions({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        disabled={isPending}
        onClick={() => startTransition(() => approveReviewAction(id))}
        size="sm"
        variant="outline"
      >
        <Check className="h-3.5 w-3.5" />
        Approve
      </Button>
      <Button
        disabled={isPending}
        onClick={() => startTransition(() => rejectReviewAction(id))}
        size="sm"
        variant="ghost"
      >
        <X className="h-3.5 w-3.5" />
        Reject
      </Button>
    </div>
  );
}

interface ReviewsPageClientProps {
  reviews: ReviewWithProduct[];
  stats: ReviewStats;
}

export function ReviewsPageClient({ reviews, stats }: ReviewsPageClientProps) {
  const columns = useMemo(
    (): ColumnDef<ReviewWithProduct>[] => [
      {
        accessorKey: "product",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div
              className={`
                relative h-9 w-9 shrink-0 overflow-hidden rounded-md border
                bg-muted
              `}
            >
              <Image
                alt={row.original.product.name}
                className="object-cover"
                fill
                sizes="36px"
                src={row.original.product.image}
              />
            </div>
            <span className="max-w-40 truncate text-sm font-medium">
              {row.original.product.name}
            </span>
          </div>
        ),
        filterFn: filterFn("text"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Product" />
        ),
        id: "product",
        meta: defineMeta((row: ReviewWithProduct) => row.product.name, {
          displayName: "Product",
          icon: MessageSquare,
          type: "text",
        }) as ColumnMeta<ReviewWithProduct, unknown>,
      },
      {
        accessorKey: "customerName",
        cell: ({ row }) => row.original.customerName,
        filterFn: filterFn("text"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Customer" />
        ),
        meta: defineMeta((row: ReviewWithProduct) => row.customerName, {
          displayName: "Customer",
          icon: MessageSquare,
          type: "text",
        }) as ColumnMeta<ReviewWithProduct, unknown>,
      },
      {
        accessorKey: "rating",
        cell: ({ row }) => <StarRating rating={row.original.rating} />,
        filterFn: filterFn("number"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Rating" />
        ),
        meta: defineMeta((row: ReviewWithProduct) => row.rating, {
          displayName: "Rating",
          icon: Star,
          type: "number",
        }) as ColumnMeta<ReviewWithProduct, unknown>,
      },
      {
        accessorKey: "comment",
        cell: ({ row }) => (
          <p className="max-w-sm truncate text-muted-foreground">
            {row.original.comment}
          </p>
        ),
        header: "Comment",
      },
      {
        accessorKey: "createdAt",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {DATE_FORMATTER.format(row.original.createdAt)}
          </span>
        ),
        filterFn: filterFn("date"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        meta: defineMeta((row: ReviewWithProduct) => row.createdAt, {
          displayName: "Date",
          icon: MessageSquare,
          type: "date",
        }) as ColumnMeta<ReviewWithProduct, unknown>,
      },
      {
        cell: ({ row }) =>
          row.original.approved ? (
            <span className="text-xs text-muted-foreground">Approved</span>
          ) : (
            <ReviewActions id={row.original.id} />
          ),
        header: "",
        id: "actions",
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Reviews</h2>
        <p className="text-sm text-muted-foreground">
          Left by customers who've inquired about a piece. Approve to show on
          the product page.
        </p>
      </div>

      <StatCardGrid
        stats={[
          { label: "Total", value: stats.total },
          { label: "Pending", value: stats.pending },
          { label: "Approved", value: stats.approved },
        ]}
      />

      <DataTable columns={columns} data={reviews} />
    </div>
  );
}
