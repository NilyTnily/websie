"use client";

import type { ColumnDef, ColumnMeta } from "@tanstack/react-table";

import { Bell, Mail } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

import type { StockNotificationWithProduct } from "~/lib/queries/stock-notifications";

import { defineMeta, filterFn } from "~/lib/filters";
import { StatCardGrid } from "~/ui/components/admin/stat-card";
import { DataTable } from "~/ui/primitives/data-table/data-table";
import { DataTableColumnHeader } from "~/ui/primitives/data-table/data-table-column-header";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

interface StockNotificationsPageClientProps {
  notifications: StockNotificationWithProduct[];
}

export function StockNotificationsPageClient({
  notifications,
}: StockNotificationsPageClientProps) {
  const pending = notifications.filter((n) => !n.notified).length;

  const columns = useMemo(
    (): ColumnDef<StockNotificationWithProduct>[] => [
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
        meta: defineMeta(
          (row: StockNotificationWithProduct) => row.product.name,
          { displayName: "Product", icon: Bell, type: "text" },
        ) as ColumnMeta<StockNotificationWithProduct, unknown>,
      },
      {
        accessorKey: "email",
        cell: ({ row }) => row.original.email,
        filterFn: filterFn("text"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        meta: defineMeta((row: StockNotificationWithProduct) => row.email, {
          displayName: "Email",
          icon: Mail,
          type: "text",
        }) as ColumnMeta<StockNotificationWithProduct, unknown>,
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
          <DataTableColumnHeader column={column} title="Requested" />
        ),
        meta: defineMeta(
          (row: StockNotificationWithProduct) => row.createdAt,
          { displayName: "Requested", icon: Bell, type: "date" },
        ) as ColumnMeta<StockNotificationWithProduct, unknown>,
      },
      {
        accessorKey: "notified",
        cell: ({ row }) =>
          row.original.notified ? (
            <span className="text-xs text-muted-foreground">Notified</span>
          ) : (
            <span className="text-xs text-primary">Waiting</span>
          ),
        header: "Status",
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Stock Alerts</h2>
        <p className="text-sm text-muted-foreground">
          Customers waiting to hear when an out-of-stock piece comes back.
          Emails go out automatically when you mark a product back in stock.
        </p>
      </div>

      <StatCardGrid
        stats={[
          { label: "Total requests", value: notifications.length },
          { label: "Waiting", value: pending },
          { label: "Notified", value: notifications.length - pending },
        ]}
      />

      <DataTable columns={columns} data={notifications} />
    </div>
  );
}
