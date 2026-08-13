"use client";

import type { ColumnDef, ColumnMeta } from "@tanstack/react-table";

import { BadgeCheck, DollarSign, Layers, Star, Tag } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import type { ProductWithRelations } from "~/db/schema";

import { defineMeta, filterFn } from "~/lib/filters";
import { ConfirmSubmitButton } from "~/app/admin/confirm-submit-button";
import { StatCardGrid } from "~/ui/components/admin/stat-card";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { DataTable } from "~/ui/primitives/data-table/data-table";
import { DataTableColumnHeader } from "~/ui/primitives/data-table/data-table-column-header";

import { deleteProductAction } from "./actions";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

interface ProductsPageClientProps {
  products: ProductWithRelations[];
}

export function ProductsPageClient({ products }: ProductsPageClientProps) {
  const inStock = products.filter((product) => product.inStock);
  const featured = products.filter((product) => product.featured);

  const columns = useMemo(
    (): ColumnDef<ProductWithRelations>[] => [
      {
        accessorKey: "name",
        cell: ({ row }) => (
          <Link
            className={`
              font-medium text-primary
              hover:underline
            `}
            href={`/admin/products/${row.original.id}`}
          >
            {row.original.name}
          </Link>
        ),
        filterFn: filterFn("text"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        meta: defineMeta((row: ProductWithRelations) => row.name, {
          displayName: "Name",
          icon: Tag,
          type: "text",
        }) as ColumnMeta<ProductWithRelations, unknown>,
      },
      {
        accessorFn: (row) =>
          row.subcategory
            ? `${row.category.name} / ${row.subcategory.name}`
            : row.category.name,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.category.name}
            {row.original.subcategory && ` / ${row.original.subcategory.name}`}
          </span>
        ),
        filterFn: filterFn("text"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Category" />
        ),
        id: "category",
        meta: defineMeta(
          (row: ProductWithRelations) =>
            row.subcategory
              ? `${row.category.name} / ${row.subcategory.name}`
              : row.category.name,
          { displayName: "Category", icon: Layers, type: "text" },
        ) as ColumnMeta<ProductWithRelations, unknown>,
      },
      {
        accessorKey: "price",
        cell: ({ row }) => CURRENCY_FORMATTER.format(row.original.price),
        filterFn: filterFn("number"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Price" />
        ),
        meta: defineMeta((row: ProductWithRelations) => row.price, {
          displayName: "Price",
          icon: DollarSign,
          type: "number",
        }) as ColumnMeta<ProductWithRelations, unknown>,
      },
      {
        accessorKey: "inStock",
        cell: ({ row }) => (
          <Badge variant={row.original.inStock ? "default" : "secondary"}>
            {row.original.inStock ? "In stock" : "Out of stock"}
          </Badge>
        ),
        filterFn: filterFn("option"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Stock" />
        ),
        meta: defineMeta((row: ProductWithRelations) => row.inStock, {
          displayName: "In Stock",
          icon: BadgeCheck,
          type: "option",
        }) as ColumnMeta<ProductWithRelations, unknown>,
      },
      {
        accessorKey: "featured",
        cell: ({ row }) => (row.original.featured ? "Yes" : "—"),
        filterFn: filterFn("option"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Featured" />
        ),
        meta: defineMeta((row: ProductWithRelations) => row.featured, {
          displayName: "Featured",
          icon: Star,
          type: "option",
        }) as ColumnMeta<ProductWithRelations, unknown>,
      },
      {
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-3">
            <Link
              className={`
                text-primary
                hover:underline
              `}
              href={`/admin/products/${row.original.id}`}
            >
              Edit
            </Link>
            <form action={deleteProductAction}>
              <input name="id" type="hidden" value={row.original.id} />
              <ConfirmSubmitButton
                className={`
                  text-destructive
                  hover:underline
                `}
                confirmMessage={`Delete "${row.original.name}"? This cannot be undone.`}
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
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">
            {products.length} product{products.length === 1 ? "" : "s"} in the
            catalog.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">New Product</Link>
        </Button>
      </div>

      <StatCardGrid
        stats={[
          { label: "Total Products", value: products.length },
          { label: "In Stock", value: inStock.length },
          { label: "Out of Stock", value: products.length - inStock.length },
          { label: "Featured", value: featured.length },
        ]}
      />

      <DataTable columns={columns} data={products} />
    </div>
  );
}
