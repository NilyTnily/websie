"use client";

import type { ColumnDef, ColumnMeta } from "@tanstack/react-table";

import { Award, BadgeCheck, DollarSign, Eye, Layers, Search, Sparkles, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import type { ProductWithRelations } from "~/db/schema";

import { defineMeta, filterFn } from "~/lib/filters";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Checkbox } from "~/ui/primitives/checkbox";
import { Input } from "~/ui/primitives/input";
import { DataTable } from "~/ui/primitives/data-table/data-table";
import { DataTableColumnHeader } from "~/ui/primitives/data-table/data-table-column-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";

import {
  broadcastNewArrivalsAction,
  saveNewArrivalsAction,
  saveNewArrivalsOrderAction,
} from "./actions";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

interface NewArrivalsPageClientProps {
  contactCount: number;
  products: ProductWithRelations[];
}

export function NewArrivalsPageClient({ contactCount, products }: NewArrivalsPageClientProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [isBroadcasting, startBroadcasting] = useTransition();
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const haystack = `${p.name} ${p.ref} ${p.category.name} ${p.subcategory?.name ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [products, searchQuery]);

  const [draft, setDraft] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(products.map((p) => [p.id, Boolean((p as unknown as Record<string, unknown>).isNewArrival)])),
  );

  const newArrivals = products
    .filter((p) => Boolean((p as unknown as Record<string, unknown>).isNewArrival))
    .sort((a, b) => {
      const ao = (a as unknown as Record<string, unknown>).newArrivalSortOrder as number | null;
      const bo = (b as unknown as Record<string, unknown>).newArrivalSortOrder as number | null;
      if (ao !== null && bo !== null) return ao - bo;
      if (ao !== null) return -1;
      if (bo !== null) return 1;
      const at = (a as unknown as Record<string, unknown>).newArrivalAt as Date | null;
      const bt = (b as unknown as Record<string, unknown>).newArrivalAt as Date | null;
      if (at && bt) return bt.getTime() - at.getTime();
      if (at) return -1;
      if (bt) return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

  // draft-aware selected ids for broadcast (what will be saved)
  const draftSelectedIds = products.filter((p) => draft[p.id]).map((p) => p.id);
  const persistedSelectedIds = products
    .filter((p) => Boolean((p as unknown as Record<string, unknown>).isNewArrival))
    .map((p) => p.id);

  const isDirty = products.some((p) => draft[p.id] !== Boolean((p as unknown as Record<string, unknown>).isNewArrival));

  const setAll = (value: boolean) => {
    setDraft(Object.fromEntries(products.map((p) => [p.id, value])));
  };

  const handleSave = () => {
    const changes = products
      .filter((p) => draft[p.id] !== Boolean((p as unknown as Record<string, unknown>).isNewArrival))
      .map((p) => ({ id: p.id, isNewArrival: Boolean(draft[p.id]) }));
    if (changes.length === 0) return;
    startSaving(async () => {
      const result = await saveNewArrivalsAction(changes);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Saved ${changes.length} changes.`);
      router.refresh();
    });
  };

  const handleBroadcast = () => {
    const idsToSend = draftSelectedIds.length > 0 ? draftSelectedIds : persistedSelectedIds;
    if (idsToSend.length === 0) {
      toast.error("Select at least one product as New Arrival first.");
      return;
    }
    if (contactCount === 0) {
      toast.error("No contacts with phone numbers. Customers need phone at sign-up or checkout.");
      return;
    }
    startBroadcasting(async () => {
      const result = await broadcastNewArrivalsAction(idsToSend);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Broadcast sent to ${result.result?.sent ?? 0} contacts (${result.result?.failed ?? 0} failed).`);
      setShowBroadcast(false);
    });
  };

  const columns = useMemo(
    (): ColumnDef<ProductWithRelations>[] => [
      {
        accessorKey: "image",
        cell: ({ row }) => (
          <div className="relative h-12 w-12 overflow-hidden rounded bg-muted">
            <Image alt={row.original.name} fill className="object-cover" sizes="48px" src={row.original.image} />
          </div>
        ),
        header: "Image",
        enableSorting: false,
      },
      {
        accessorKey: "name",
        cell: ({ row }) => (
          <Link className="font-medium text-primary hover:underline" href={`/admin/products/${row.original.id}`}>
            {row.original.name}
          </Link>
        ),
        filterFn: filterFn("text"),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        meta: defineMeta((row: ProductWithRelations) => row.name, {
          displayName: "Name",
          icon: Tag,
          type: "text",
        }) as ColumnMeta<ProductWithRelations, unknown>,
      },
      {
        accessorFn: (row) => row.category.name,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.category.name}</span>,
        filterFn: filterFn("text"),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
        id: "category",
        meta: defineMeta((row: ProductWithRelations) => row.category.name, {
          displayName: "Category",
          icon: Layers,
          type: "text",
        }) as ColumnMeta<ProductWithRelations, unknown>,
      },
      {
        accessorFn: (row) => row.subcategory?.name ?? "—",
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.subcategory?.name ?? "—"}</span>,
        filterFn: filterFn("text"),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Brand" />,
        id: "brand",
        meta: defineMeta((row: ProductWithRelations) => row.subcategory?.name ?? "—", {
          displayName: "Brand",
          icon: Award,
          type: "text",
        }) as ColumnMeta<ProductWithRelations, unknown>,
      },
      {
        accessorKey: "price",
        cell: ({ row }) => CURRENCY_FORMATTER.format(row.original.price),
        filterFn: filterFn("number"),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
        meta: defineMeta((row: ProductWithRelations) => row.price, {
          displayName: "Price",
          icon: DollarSign,
          type: "number",
        }) as ColumnMeta<ProductWithRelations, unknown>,
      },
      {
        accessorKey: "inStock",
        cell: ({ row }) => <Badge variant={row.original.inStock ? "default" : "secondary"}>{row.original.inStock ? "In stock" : "Out"}</Badge>,
        filterFn: filterFn("option"),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" />,
        meta: defineMeta((row: ProductWithRelations) => row.inStock, {
          displayName: "In Stock",
          icon: BadgeCheck,
          type: "option",
        }) as ColumnMeta<ProductWithRelations, unknown>,
      },
      {
        accessorKey: "isNewArrival",
        cell: ({ row }) => (
          <Checkbox
            aria-label={`New Arrival: ${row.original.name}`}
            checked={Boolean(draft[row.original.id])}
            onCheckedChange={(checked) =>
              setDraft((prev) => ({ ...prev, [row.original.id]: checked === true }))
            }
          />
        ),
        filterFn: filterFn("option"),
        header: ({ column }) => <DataTableColumnHeader column={column} title="New Arrival" />,
        meta: defineMeta((row: ProductWithRelations) => Boolean((row as unknown as Record<string, unknown>).isNewArrival), {
          displayName: "New Arrival",
          icon: Sparkles,
          type: "option",
        }) as ColumnMeta<ProductWithRelations, unknown>,
      },
      {
        accessorKey: "visible",
        cell: ({ row }) => (
          <span className={row.original.visible ? "text-muted-foreground" : "text-amber-600"}>{row.original.visible ? "Yes" : "Hidden"}</span>
        ),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Visible" />,
        meta: defineMeta((row: ProductWithRelations) => row.visible, {
          displayName: "Visible",
          icon: Eye,
          type: "option",
        }) as ColumnMeta<ProductWithRelations, unknown>,
      },
    ],
    [draft],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="h-5 w-5 text-primary" /> New Arrivals
          </h2>
          <p className="text-sm text-muted-foreground">
            Select products to feature as New Arrivals. {newArrivals.length} selected • {contactCount} contacts with phone will be messaged on broadcast.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAll(true)} type="button">
            Select All
          </Button>
          <Button variant="outline" onClick={() => setAll(false)} type="button">
            Clear All
          </Button>
          <Button disabled={!isDirty || isSaving} onClick={handleSave} type="button">
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
          <Button
            disabled={draftSelectedIds.length === 0 && persistedSelectedIds.length === 0}
            onClick={() => setShowBroadcast(true)}
            type="button"
            variant="default"
          >
            Broadcast via WhatsApp
          </Button>
        </div>
      </div>

      {newArrivals.length > 0 && (
        <NewArrivalsOrderEditor products={newArrivals} onRefreshed={() => router.refresh()} />
      )}

      {newArrivals.length === 0 && (
        <div className="rounded-md border border-dashed p-4">
          <p className="text-sm text-muted-foreground">No products marked as New Arrival yet — tick the checkbox in the table below then Save.</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredProducts}
        initialPageSize={100}
        initialSorting={[{ desc: false, id: "brand" }]}
        toolbarExtra={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-7 w-[260px] pl-8 text-sm"
                placeholder="Search name, ref, category…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <span className="hidden text-xs text-muted-foreground sm:block">
              {filteredProducts.length}/{products.length}
            </span>
            {searchQuery && (
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setSearchQuery("")}>
                Clear
              </Button>
            )}
          </div>
        }
      />

      <Dialog open={showBroadcast} onOpenChange={setShowBroadcast}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Broadcast New Arrivals via WhatsApp?</DialogTitle>
            <DialogDescription>
              This will send the <span className="font-medium">new_arrivals</span> approved template to <span className="font-medium">{contactCount}</span> contacts
              {(() => {
                const ids = draftSelectedIds.length > 0 ? draftSelectedIds : persistedSelectedIds;
                return ids.length > 0 ? ` about ${ids.length} product${ids.length === 1 ? "" : "s"}` : "";
              })()}
              . Contacts are merged from user phone + inquiry phone and deduped. Requires Meta template approval and Cloud API configured in /admin/settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div className="rounded bg-muted p-3">
              <p className="font-medium">Will send:</p>
              <p className="text-muted-foreground">{(draftSelectedIds.length > 0 ? draftSelectedIds : persistedSelectedIds).length} products • {contactCount} recipients</p>
              <ul className="mt-2 list-disc pl-5">
                {products
                  .filter((p) => (draftSelectedIds.length > 0 ? draftSelectedIds.includes(p.id) : persistedSelectedIds.includes(p.id)))
                  .slice(0, 5)
                  .map((p) => (
                    <li key={p.id}>{p.name}</li>
                  ))}
                {(draftSelectedIds.length > 0 ? draftSelectedIds : persistedSelectedIds).length > 5 && <li>…and more</li>}
              </ul>
            </div>
            {isDirty && (
              <p className="text-amber-600">You have unsaved changes — broadcast will use your current draft selection. Save first if you want it persisted.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBroadcast(false)} disabled={isBroadcasting}>
              Cancel
            </Button>
            <Button onClick={handleBroadcast} disabled={isBroadcasting}>
              {isBroadcasting ? "Sending…" : `Send to ${contactCount} contacts`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewArrivalsOrderEditor({
  products,
  onRefreshed,
}: {
  products: ProductWithRelations[];
  onRefreshed: () => void;
}) {
  const [isSaving, startSaving] = useTransition();
  const [order, setOrder] = useState(() => products.map((p) => p.id));
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // sync when products change after save
  useState(() => {
    setOrder(products.map((p) => p.id));
  });

  const isDirty = order.some((id, i) => id !== products[i]?.id);
  const byId = new Map(products.map((p) => [p.id, p]));

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    setOrder((prev) => {
      const next = prev.filter((id) => id !== draggedId);
      const idx = next.indexOf(targetId);
      next.splice(idx, 0, draggedId);
      return next;
    });
    setDraggedId(null);
  }

  function handleSave() {
    startSaving(async () => {
      const result = await saveNewArrivalsOrderAction(order);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("New Arrivals order saved.");
      onRefreshed();
    });
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">New Arrivals Order</h3>
          <p className="text-xs text-muted-foreground">Drag to reorder — storefront shows in this order first, then by newest marked.</p>
        </div>
        <Button disabled={!isDirty || isSaving} onClick={handleSave} size="sm">
          {isSaving ? "Saving…" : "Save Order"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {order.map((id) => {
          const product = byId.get(id);
          if (!product) return null;
          return (
            <div
              key={id}
              draggable
              onDragStart={() => setDraggedId(id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(id)}
              className={`relative flex cursor-grab flex-col items-center gap-2 rounded-md border bg-card p-3 active:cursor-grabbing ${draggedId === id ? "opacity-40" : ""}`}
            >
              <div className="relative h-16 w-16 overflow-hidden rounded bg-muted">
                <Image alt={product.name} fill className="object-cover" sizes="64px" src={product.image} />
              </div>
              <p className="line-clamp-2 text-center text-xs font-medium">{product.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
