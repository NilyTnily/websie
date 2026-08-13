"use client";

import { useActionState } from "react";

import type { Inquiry } from "~/db/schema";

import { DELIVERY_STATUS_LABEL, DELIVERY_STEPS } from "~/lib/delivery-status";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

import type { DeliveryFormState } from "./actions";

interface DeliveryFormProps {
  action: (
    state: DeliveryFormState,
    formData: FormData,
  ) => Promise<DeliveryFormState>;
  carrier: null | string;
  deliveryStatus: Inquiry["deliveryStatus"];
  trackingUrl: null | string;
}

export function DeliveryForm({
  action,
  carrier,
  deliveryStatus,
  trackingUrl,
}: DeliveryFormProps) {
  const [state, formAction, isPending] = useActionState<
    DeliveryFormState,
    FormData
  >(action, {});

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="deliveryStatus">Delivery Status</Label>
        <select
          className={`
            flex h-9 w-full rounded-md border border-input bg-transparent px-3
            text-sm shadow-xs outline-none
            focus-visible:border-ring focus-visible:ring-[3px]
            focus-visible:ring-ring/50
          `}
          defaultValue={deliveryStatus}
          id="deliveryStatus"
          name="deliveryStatus"
        >
          {DELIVERY_STEPS.map((step) => (
            <option key={step} value={step}>
              {DELIVERY_STATUS_LABEL[step]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="carrier">Carrier</Label>
        <Input
          defaultValue={carrier ?? ""}
          id="carrier"
          name="carrier"
          placeholder="e.g. DHL Express"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="trackingUrl">Tracking Link</Label>
        <Input
          defaultValue={trackingUrl ?? ""}
          id="trackingUrl"
          name="trackingUrl"
          placeholder="https://…"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button disabled={isPending} type="submit">
        {isPending ? "Saving…" : "Save Delivery Info"}
      </Button>
    </form>
  );
}
