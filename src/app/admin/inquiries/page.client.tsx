"use client";

import type { ColumnDef, ColumnMeta } from "@tanstack/react-table";

import { CalendarDays, DollarSign, Hash, User as UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import type { Inquiry } from "~/db/schema";
import type { InquiryStats } from "~/lib/queries/inquiries";

import { defineMeta, filterFn } from "~/lib/filters";
import { formatOrderNumber } from "~/lib/order-number";
import { StatCardGrid } from "~/ui/components/admin/stat-card";
import { DataTable } from "~/ui/primitives/data-table/data-table";
import { DataTableColumnHeader } from "~/ui/primitives/data-table/data-table-column-header";

import { StatusSelect } from "./status-select";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

interface InquiriesPageClientProps {
  inquiries: Inquiry[];
  stats: InquiryStats;
}

export function InquiriesPageClient({
  inquiries,
  stats,
}: InquiriesPageClientProps) {
  const columns = useMemo(
    (): ColumnDef<Inquiry>[] => [
      {
        accessorFn: (row) => formatOrderNumber(row.orderNumber),
        cell: ({ row }) => (
          <Link
            className={`
              font-mono text-xs text-primary
              hover:underline
            `}
            href={`/admin/inquiries/${row.original.id}`}
          >
            {formatOrderNumber(row.original.orderNumber)}
          </Link>
        ),
        filterFn: filterFn("text"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Order" />
        ),
        id: "order",
        meta: defineMeta((row: Inquiry) => formatOrderNumber(row.orderNumber), {
          displayName: "Order",
          icon: Hash,
          type: "text",
        }) as ColumnMeta<Inquiry, unknown>,
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
        meta: defineMeta((row: Inquiry) => row.createdAt, {
          displayName: "Date",
          icon: CalendarDays,
          type: "date",
        }) as ColumnMeta<Inquiry, unknown>,
      },
      {
        accessorKey: "customerName",
        cell: ({ row }) => (
          <div>
            <Link
              className={`
                font-medium text-primary
                hover:underline
              `}
              href={`/admin/inquiries/${row.original.id}`}
            >
              {row.original.customerName}
            </Link>
            <div className="text-xs text-muted-foreground">
              {row.original.customerContact}
            </div>
          </div>
        ),
        filterFn: filterFn("text"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Customer" />
        ),
        meta: defineMeta((row: Inquiry) => row.customerName, {
          displayName: "Customer",
          icon: UserIcon,
          type: "text",
        }) as ColumnMeta<Inquiry, unknown>,
      },
      {
        accessorFn: (row) => row.items.map((item) => item.name).join(", "),
        cell: ({ row }) => {
          const items = row.original.items;
          const visible = items.slice(0, 3);
          const summary =
            items.length <= 2
              ? items.map((item) => item.name).join(", ")
              : `${items[0]?.name}, ${items[1]?.name} +${items.length - 2} more`;

          return (
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {visible.map((item) => (
                  <div
                    className={`
                      relative h-9 w-9 overflow-hidden rounded-md border-2
                      border-background bg-muted
                    `}
                    key={item.id}
                  >
                    <Image
                      alt={item.name}
                      className="object-cover"
                      fill
                      sizes="36px"
                      src={item.image}
                    />
                  </div>
                ))}
                {items.length > 3 && (
                  <div
                    className={`
                      relative flex h-9 w-9 items-center justify-center
                      rounded-md border-2 border-background bg-muted text-[10px]
                      font-medium text-muted-foreground
                    `}
                  >
                    +{items.length - 3}
                  </div>
                )}
              </div>
              <span className="max-w-40 truncate text-xs text-muted-foreground">
                {summary}
              </span>
            </div>
          );
        },
        filterFn: filterFn("text"),
        header: "Items",
        id: "items",
      },
      {
        accessorKey: "subtotal",
        cell: ({ row }) => CURRENCY_FORMATTER.format(row.original.subtotal),
        filterFn: filterFn("number"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Subtotal" />
        ),
        meta: defineMeta((row: Inquiry) => row.subtotal, {
          displayName: "Subtotal",
          icon: DollarSign,
          type: "number",
        }) as ColumnMeta<Inquiry, unknown>,
      },
      {
        accessorKey: "status",
        cell: ({ row }) => (
          <StatusSelect id={row.original.id} status={row.original.status} />
        ),
        header: "Status",
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Inquiries</h2>
        <p className="text-sm text-muted-foreground">
          Every "Send Inquiry" submitted from the cart, whether or not the
          shopper actually sent the WhatsApp message.
        </p>
      </div>

      <StatCardGrid
        stats={[
          { label: "Total", value: stats.total },
          { label: "Pending", value: stats.pending },
          { label: "Approved", value: stats.approved },
          { label: "Rejected", value: stats.rejected },
          {
            label: "Requested Value",
            value: CURRENCY_FORMATTER.format(stats.totalValue),
          },
        ]}
      />

      <DataTable columns={columns} data={inquiries} />
    </div>
  );
}
