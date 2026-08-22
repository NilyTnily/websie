"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { ProductWithRelations } from "~/db/schema";

import { Button } from "~/ui/primitives/button";

import { setTableOrderAction } from "./actions";

interface TableOrderEditorProps {
  products: ProductWithRelations[];
}

/**
 * Drag-and-drop arrangement of the up-to-6 products currently "on the
 * table" (see the "On the Table" column below) — the homepage hero's table
 * scene renders them in exactly this order (see tableSortOrder in
 * getTableProducts). Draft-then-Save, same pattern as the visibility
 * editor above it: dragging only reorders local state, nothing persists
 * until Save is clicked.
 */
export function TableOrderEditor({ products }: TableOrderEditorProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [order, setOrder] = useState(() => products.map((product) => product.id));
  const [draggedId, setDraggedId] = useState<null | string>(null);

  const isDirty = order.some((id, index) => id !== products[index]?.id);
  const byId = new Map(products.map((product) => [product.id, product]));

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    setOrder((prev) => {
      const next = prev.filter((id) => id !== draggedId);
      const targetIndex = next.indexOf(targetId);
      next.splice(targetIndex, 0, draggedId);
      return next;
    });
    setDraggedId(null);
  }

  function handleSave() {
    startSaving(async () => {
      const result = await setTableOrderAction(order);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Table order saved.");
      router.refresh();
    });
  }

  if (products.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4">
        <h3 className="text-sm font-medium">Table Arrangement</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No products are on the table yet — toggle some on from the &quot;On
          the Table&quot; column below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Table Arrangement</h3>
          <p className="text-xs text-muted-foreground">
            Drag to reorder — this is exactly the layout the homepage table
            scene uses (3 top, 3 bottom).
          </p>
        </div>
        <Button disabled={!isDirty || isSaving} onClick={handleSave} size="sm">
          {isSaving ? "Saving…" : "Save Order"}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {order.map((id) => {
          const product = byId.get(id);
          if (!product) return null;
          return (
            <div
              className={`
                flex cursor-grab flex-col items-center gap-2 rounded-md border
                bg-card p-3
                active:cursor-grabbing
                ${draggedId === id ? "opacity-40" : ""}
              `}
              draggable
              key={id}
              onDragOver={(e) => e.preventDefault()}
              onDragStart={() => setDraggedId(id)}
              onDrop={() => handleDrop(id)}
            >
              <div
                className={`
                  relative h-16 w-16 overflow-hidden rounded bg-muted
                `}
              >
                <Image
                  alt={product.name}
                  className="object-cover"
                  fill
                  sizes="64px"
                  src={product.image}
                />
              </div>
              <p className="line-clamp-2 text-center text-xs font-medium">
                {product.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
