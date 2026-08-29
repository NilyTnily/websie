"use client";

import { useActionState } from "react";

import type { Inquiry } from "~/db/schema";

import {
  DELIVERY_STATUS_LABEL,
  DELIVERY_STEPS,
  TERMINAL_DELIVERY_STATUSES,
} from "~/lib/delivery-status";
import { Button } from "~/ui/primitives/button";
import { Label } from "~/ui/primitives/label";

import type { DeliveryFormState } from "./actions";

interface DeliveryFormProps {
  action: (
    state: DeliveryFormState,
    formData: FormData,
  ) => Promise<DeliveryFormState>;
  deliveryStatus: Inquiry["deliveryStatus"];
}

export function DeliveryForm({ action, deliveryStatus }: DeliveryFormProps) {
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
          <option disabled>──────────</option>
          {TERMINAL_DELIVERY_STATUSES.map((step) => (
            <option key={step} value={step}>
              {DELIVERY_STATUS_LABEL[step]}
            </option>
          ))}
        </select>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button disabled={isPending} type="submit">
        {isPending ? "Saving…" : "Save Delivery Info"}
      </Button>
    </form>
  );
}
