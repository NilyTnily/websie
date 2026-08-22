"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Switch } from "~/ui/primitives/switch";

import { setProductOnTableAction } from "./actions";

interface TableToggleProps {
  atCap: boolean;
  onTable: boolean;
  productId: string;
}

// Instant on/off, unlike every other product field (those go through the
// full edit form) — "on the table" is meant to be swapped every now and
// then, not buried behind a form submit. Generating the cutout on first
// enable can take a few seconds (self-hosted background removal), so this
// stays pending/disabled until the server action resolves rather than
// optimistically flipping the switch.
export function TableToggle({ atCap, onTable, productId }: TableToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      aria-label="On the table"
      checked={onTable}
      disabled={isPending || (atCap && !onTable)}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          const result = await setProductOnTableAction(productId, checked);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          // Re-fetch the server-rendered product list so every row's atCap
          // (derived from the full list, not just this one) stays accurate.
          router.refresh();
        });
      }}
    />
  );
}
