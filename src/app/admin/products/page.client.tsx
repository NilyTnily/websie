"use client";

import type { ColumnDef, ColumnMeta } from "@tanstack/react-table";

import {
  Award,
  BadgeCheck,
  DollarSign,
  Eye,
  Layers,
  LayoutGrid,
  Star,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import type { ProductWithRelations } from "~/db/schema";

import { ConfirmSubmitButton } from "~/app/admin/confirm-submit-button";
import { defineMeta, filterFn } from "~/lib/filters";
import { MAX_TABLE_PRODUCTS } from "~/lib/table-constants";
import { StatCardGrid } from "~/ui/components/admin/stat-card";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Checkbox } from "~/ui/primitives/checkbox";
import { DataTable } from "~/ui/primitives/data-table/data-table";
import { DataTableColumnHeader } from "~/ui/primitives/data-table/data-table-column-header";

import { deleteProductAction, setProductsVisibilityAction } from "./actions";
import { TableOrderEditor } from "./table-order-editor";
import { TableToggle } from "./table-toggle";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

interface ProductsPageClientProps {
  products: ProductWithRelations[];
}

export function ProductsPageClient({ products }: ProductsPageClientProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  // Draft visibility state — checkboxes only edit this locally; nothing is
  // persisted until "Save Changes" is clicked (see setProductsVisibilityAction).
  const [draft, setDraft] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(products.map((product) => [product.id, product.visible])),
  );

  const inStock = products.filter((product) => product.inStock);
  const featured = products.filter((product) => product.featured);
  const hidden = products.filter((product) => !product.visible);
  // Sorted to match getTableProducts' own order (tableSortOrder ascending,
  // nulls last, tiebreak by updatedAt) — TableOrderEditor needs to start
  // from the homepage's actual current order, not creation order.
  const onTable = products
    .filter((product) => product.onTable)
    .sort((a, b) => {
      if (a.tableSortOrder !== null && b.tableSortOrder !== null) {
        return a.tableSortOrder - b.tableSortOrder;
      }
      if (a.tableSortOrder !== null) return -1;
      if (b.tableSortOrder !== null) return 1;
      return a.updatedAt.getTime() - b.updatedAt.getTime();
    });
  const onTableAtCap = onTable.length >= MAX_TABLE_PRODUCTS;
  const isDirty = products.some(
    (product) => draft[product.id] !== product.visible,
  );

  const setAllVisibility = (visible: boolean) => {
    setDraft(Object.fromEntries(products.map((product) => [product.id, visible])));
  };

  const handleSaveVisibility = () => {
    const changes = products
      .filter((product) => draft[product.id] !== product.visible)
      .map((product) => ({ id: product.id, visible: !!draft[product.id] }));
    if (changes.length === 0) return;

    startSaving(async () => {
      const result = await setProductsVisibilityAction(changes);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Visibility saved.");
      router.refresh();
    });
  };

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
        accessorFn: (row) => row.category.name,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.category.name}
          </span>
        ),
        filterFn: filterFn("text"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Category" />
        ),
        id: "category",
        meta: defineMeta((row: ProductWithRelations) => row.category.name, {
          displayName: "Category",
          icon: Layers,
          type: "text",
        }) as ColumnMeta<ProductWithRelations, unknown>,
      },
      {
        accessorFn: (row) => row.subcategory?.name ?? "—",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.subcategory?.name ?? "—"}
          </span>
        ),
        filterFn: filterFn("text"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Brand" />
        ),
        id: "brand",
        meta: defineMeta(
          (row: ProductWithRelations) => row.subcategory?.name ?? "—",
          { displayName: "Brand", icon: Award, type: "text" },
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
        accessorKey: "onTable",
        cell: ({ row }) => (
          <TableToggle
            atCap={onTableAtCap}
            onTable={row.original.onTable}
            productId={row.original.id}
          />
        ),
        filterFn: filterFn("option"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="On the Table" />
        ),
        meta: defineMeta((row: ProductWithRelations) => row.onTable, {
          displayName: "On the Table",
          icon: LayoutGrid,
          type: "option",
        }) as ColumnMeta<ProductWithRelations, unknown>,
      },
      {
        accessorKey: "visible",
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Visible on the site: ${row.original.name}`}
            checked={draft[row.original.id] ?? row.original.visible}
            onCheckedChange={(checked) =>
              setDraft((prev) => ({
                ...prev,
                [row.original.id]: checked === true,
              }))
            }
          />
        ),
        filterFn: filterFn("option"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Visible" />
        ),
        meta: defineMeta((row: ProductWithRelations) => row.visible, {
          displayName: "Visible",
          icon: Eye,
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
    [onTableAtCap, draft],
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
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAllVisibility(true)}
            type="button"
            variant="outline"
          >
            Select All
          </Button>
          <Button
            onClick={() => setAllVisibility(false)}
            type="button"
            variant="outline"
          >
            Deselect All
          </Button>
          <Button
            disabled={!isDirty || isSaving}
            onClick={handleSaveVisibility}
            type="button"
          >
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
          <Button asChild>
            <Link href="/admin/products/new">New Product</Link>
          </Button>
        </div>
      </div>

      <TableOrderEditor products={onTable} />

      <StatCardGrid
        stats={[
          { label: "Total Products", value: products.length },
          { label: "In Stock", value: inStock.length },
          { label: "Out of Stock", value: products.length - inStock.length },
          { label: "Featured", value: featured.length },
          { label: "Hidden", value: hidden.length },
          {
            label: "On the Table",
            value: `${onTable.length}/${MAX_TABLE_PRODUCTS}`,
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={products}
        initialSorting={[{ desc: false, id: "brand" }]}
      />
    </div>
  );
}
