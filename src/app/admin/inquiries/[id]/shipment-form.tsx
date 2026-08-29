"use client";

import { useActionState, useEffect, useRef } from "react";

import type { InquiryItem } from "~/db/schema";

import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

import type { ShipmentFormState } from "../actions";

interface ShipmentFormDefaults {
  carrier?: null | string;
  itemIds?: null | string[];
  label?: null | string;
  trackingNumber?: null | string;
  trackingUrl?: null | string;
}

interface ShipmentFormProps {
  action: (
    state: ShipmentFormState,
    formData: FormData,
  ) => Promise<ShipmentFormState>;
  defaults?: ShipmentFormDefaults;
  items: InquiryItem[];
  onDone?: () => void;
  submitLabel?: string;
}

export function ShipmentForm({
  action,
  defaults,
  items,
  onDone,
  submitLabel = "Save Shipment",
}: ShipmentFormProps) {
  const [state, formAction, isPending] = useActionState<
    ShipmentFormState,
    FormData
  >(action, {});
  const selectedItemIds = new Set(defaults?.itemIds ?? []);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) onDone?.();
    wasPending.current = isPending;
  }, [isPending, state.error, onDone]);

  return (
    <form action={formAction} className="space-y-4 rounded-md border p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="carrier">Carrier</Label>
          <Input
            defaultValue={defaults?.carrier ?? ""}
            id="carrier"
            name="carrier"
            placeholder="e.g. DHL Express"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="trackingNumber">Tracking Number</Label>
          <Input
            defaultValue={defaults?.trackingNumber ?? ""}
            id="trackingNumber"
            name="trackingNumber"
            placeholder="1Z999AA10123456784"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="trackingUrl">Tracking Link</Label>
        <Input
          defaultValue={defaults?.trackingUrl ?? ""}
          id="trackingUrl"
          name="trackingUrl"
          placeholder="https://…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="label">Label (optional)</Label>
        <Input
          defaultValue={defaults?.label ?? ""}
          id="label"
          name="label"
          placeholder="e.g. Box 1 of 2"
        />
      </div>

      {items.length > 1 && (
        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">
            Items covered — leave all unchecked for the whole order
          </legend>
          <div className="space-y-1.5">
            {items.map((item) => (
              <label
                className="flex items-center gap-2 text-sm"
                key={item.id}
              >
                <input
                  className="h-4 w-4 rounded border-input"
                  defaultChecked={selectedItemIds.has(item.id)}
                  name="itemIds"
                  type="checkbox"
                  value={item.id}
                />
                {item.name} × {item.quantity}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <Button disabled={isPending} type="submit">
          {isPending ? "Saving…" : submitLabel}
        </Button>
        {onDone && (
          <Button onClick={onDone} type="button" variant="ghost">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
