"use client";

import { useActionState, useState } from "react";

import type { InquiryItem, WhatsappMessage } from "~/db/schema";

import { Button } from "~/ui/primitives/button";

import type { WhatsAppReplyFormState } from "../actions";

import { applyMessageAsShipmentAction, sendWhatsAppReplyAction } from "../actions";
import { ShipmentForm } from "./shipment-form";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

interface WhatsAppMessagesPanelProps {
  inquiryId: string;
  items: InquiryItem[];
  messages: WhatsappMessage[];
}

export function WhatsAppMessagesPanel({
  inquiryId,
  items,
  messages,
}: WhatsAppMessagesPanelProps) {
  const [applyingId, setApplyingId] = useState<null | string>(null);

  if (messages.length === 0) return null;

  const lastInbound = messages.find((message) => message.direction === "inbound");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">WhatsApp Messages</h3>
        <p className="text-sm text-muted-foreground">
          Messages matched to this order — apply one to fill in a shipment.
        </p>
      </div>

      {messages.map((message) => (
        <div
          className={`
            space-y-3 rounded-md border p-3 text-sm
            ${message.direction === "outbound" ? "bg-muted/40" : ""}
          `}
          key={message.id}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                {DATE_FORMATTER.format(message.receivedAt)} ·{" "}
                {message.direction === "outbound" ? "You" : message.fromPhone}
              </p>
              <p className="whitespace-pre-wrap">{message.body}</p>
            </div>
            {message.direction === "inbound" &&
              (message.status === "applied" ? (
                <span className="shrink-0 text-xs text-muted-foreground">
                  Applied
                </span>
              ) : (
                applyingId !== message.id && (
                  <Button
                    onClick={() => setApplyingId(message.id)}
                    size="sm"
                    variant="outline"
                  >
                    Apply as Shipment
                  </Button>
                )
              ))}
          </div>

          {applyingId === message.id && (
            <ShipmentForm
              action={applyMessageAsShipmentAction.bind(
                null,
                message.id,
                inquiryId,
              )}
              defaults={{
                carrier: message.extractedCarrier,
                trackingNumber: message.extractedTrackingNumber,
              }}
              items={items}
              onDone={() => setApplyingId(null)}
              submitLabel="Confirm & Apply"
            />
          )}
        </div>
      ))}

      {lastInbound && (
        <ReplyForm inquiryId={inquiryId} toPhone={lastInbound.fromPhone} />
      )}
    </div>
  );
}

function ReplyForm({
  inquiryId,
  toPhone,
}: {
  inquiryId: string;
  toPhone: string;
}) {
  const [state, formAction, isPending] = useActionState<
    WhatsAppReplyFormState,
    FormData
  >(sendWhatsAppReplyAction.bind(null, inquiryId, toPhone), {});

  return (
    <form action={formAction} className="space-y-2 border-t pt-4">
      <label className="text-xs text-muted-foreground" htmlFor="whatsapp-reply">
        Reply to {toPhone} (only works within 24h of their last message)
      </label>
      <textarea
        className={`
          flex min-h-20 w-full rounded-md border border-input bg-transparent
          px-3 py-2 text-sm shadow-xs outline-none
          focus-visible:border-ring focus-visible:ring-[3px]
          focus-visible:ring-ring/50
        `}
        id="whatsapp-reply"
        name="body"
        placeholder="Type a reply…"
        required
      />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button disabled={isPending} size="sm" type="submit">
        {isPending ? "Sending…" : "Send Reply"}
      </Button>
    </form>
  );
}
