"use client";

import type { ColumnDef, ColumnMeta } from "@tanstack/react-table";

import { Hash, Layers, Tag } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import type { CategoryWithCount } from "~/db/schema";

import { ConfirmSubmitButton } from "~/app/admin/confirm-submit-button";
import { defineMeta, filterFn } from "~/lib/filters";
import { StatCardGrid } from "~/ui/components/admin/stat-card";
import { Button } from "~/ui/primitives/button";
import { DataTable } from "~/ui/primitives/data-table/data-table";
import { DataTableColumnHeader } from "~/ui/primitives/data-table/data-table-column-header";

import { deleteCategoryAction } from "./actions";

interface CategoriesPageClientProps {
  categories: CategoryWithCount[];
}

export function CategoriesPageClient({
  categories,
}: CategoriesPageClientProps) {
  const totalProducts = categories.reduce(
    (sum, category) => sum + category.productCount,
    0,
  );
  const empty = categories.filter((category) => category.productCount === 0);

  const columns = useMemo(
    (): ColumnDef<CategoryWithCount>[] => [
      {
        accessorKey: "name",
        cell: ({ row }) => (
          <Link
            className={`
              font-medium text-primary
              hover:underline
            `}
            href={`/admin/categories/${row.original.id}`}
          >
            {row.original.name}
          </Link>
        ),
        filterFn: filterFn("text"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        meta: defineMeta((row: CategoryWithCount) => row.name, {
          displayName: "Name",
          icon: Tag,
          type: "text",
        }) as ColumnMeta<CategoryWithCount, unknown>,
      },
      {
        accessorKey: "slug",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.slug}</span>
        ),
        filterFn: filterFn("text"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Slug" />
        ),
        meta: defineMeta((row: CategoryWithCount) => row.slug, {
          displayName: "Slug",
          icon: Hash,
          type: "text",
        }) as ColumnMeta<CategoryWithCount, unknown>,
      },
      {
        accessorKey: "productCount",
        filterFn: filterFn("number"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Products" />
        ),
        meta: defineMeta((row: CategoryWithCount) => row.productCount, {
          displayName: "Products",
          icon: Layers,
          type: "number",
        }) as ColumnMeta<CategoryWithCount, unknown>,
      },
      {
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-3">
            <Link
              className={`
                text-primary
                hover:underline
              `}
              href={`/admin/categories/${row.original.id}`}
            >
              Edit
            </Link>
            <form action={deleteCategoryAction}>
              <input name="id" type="hidden" value={row.original.id} />
              <ConfirmSubmitButton
                className={`
                  text-destructive
                  hover:underline
                `}
                confirmMessage={`Delete "${row.original.name}"? This only works if it has no products or subcategories left.`}
              >
                Delete
              </ConfirmSubmitButton>
            </form>
          </div>
        ),
        header: "",
        id: "actions",
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Categories</h2>
          <p className="text-sm text-muted-foreground">
            Manage top-level categories and their subcategories.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">New Category</Link>
        </Button>
      </div>

      <StatCardGrid
        stats={[
          { label: "Total Categories", value: categories.length },
          { label: "Total Products", value: totalProducts },
          { label: "Empty Categories", value: empty.length },
        ]}
      />

      <DataTable columns={columns} data={categories} />
    </div>
  );
}
