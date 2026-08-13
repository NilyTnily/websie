"use client";

import { MessageCircle } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";

import type { CartItem } from "~/ui/components/cart";

import { submitInquiryAction } from "~/app/actions/inquiries";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

interface InquiryFormProps {
  items: CartItem[];
  onBack: () => void;
  onSuccess: () => void;
}

export function InquiryForm({ items, onBack, onSuccess }: InquiryFormProps) {
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<null | string>(null);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleSubmit = (formData: FormData) => {
    setError(null);
    const customerName = String(formData.get("customerName") ?? "");
    const customerContact = String(formData.get("customerContact") ?? "");
    const note = String(formData.get("note") ?? "");

    startTransition(async () => {
      const result = await submitInquiryAction({
        customerContact,
        customerName,
        items,
        note,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (result.whatsappUrl) {
        window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.success("Inquiry sent — we'll be in touch shortly.");
      }
      onSuccess();
    });
  };

  return (
    <form action={handleSubmit} className="contents">
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
        <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Tell us how to reach you and we&apos;ll open a WhatsApp chat with
            your bag ready to send.
          </p>
        </div>

        <div>
          <h3 className="krs-ref text-[11px] text-muted-foreground">
            Order Summary
          </h3>
          <ul className="mt-3 space-y-3">
            {items.map((item) => (
              <li className="flex items-center gap-3" key={item.id}>
                <div
                  className={`
                    relative h-12 w-12 shrink-0 overflow-hidden bg-muted
                  `}
                >
                  <Image
                    alt={item.name}
                    className="object-cover"
                    fill
                    sizes="48px"
                    src={item.image}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty {item.quantity}
                  </p>
                </div>
                <p className="krs-ref shrink-0 text-sm text-foreground">
                  {CURRENCY_FORMATTER.format(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <div className="krs-hairline mt-4" />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Subtotal
            </span>
            <span className="krs-ref text-sm font-semibold text-foreground">
              {CURRENCY_FORMATTER.format(subtotal)}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="krs-ref text-[11px] text-muted-foreground">
            Your Details
          </h3>

          <div className="space-y-1.5">
            <Label htmlFor="customerName">Your name</Label>
            <Input id="customerName" name="customerName" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customerContact">Phone or email</Label>
            <Input id="customerContact" name="customerContact" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <textarea
              className={`
                flex min-h-16 w-full rounded-md border border-input
                bg-transparent px-3 py-2 text-sm shadow-xs outline-none
                focus-visible:border-ring focus-visible:ring-[3px]
                focus-visible:ring-ring/50
              `}
              id="note"
              name="note"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>

      <div className="border-t px-6 py-4">
        <div className="flex items-center gap-2">
          <Button onClick={onBack} type="button" variant="outline">
            Back
          </Button>
          <Button className="flex-1 gap-1.5" disabled={isPending} type="submit">
            <MessageCircle className="h-4 w-4" />
            {isPending ? "Sending…" : "Send Inquiry"}
          </Button>
        </div>
      </div>
    </form>
  );
}
