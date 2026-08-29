"use client";

import { useState } from "react";

import type { InquiryItem, WhatsappMessage } from "~/db/schema";

import { Button } from "~/ui/primitives/button";

import { applyMessageAsShipmentAction } from "../actions";
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

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">WhatsApp Messages</h3>
        <p className="text-sm text-muted-foreground">
          Messages matched to this order — apply one to fill in a shipment.
        </p>
      </div>

      {messages.map((message) => (
        <div className="space-y-3 rounded-md border p-3 text-sm" key={message.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                {DATE_FORMATTER.format(message.receivedAt)} · {message.fromPhone}
              </p>
              <p className="whitespace-pre-wrap">{message.body}</p>
            </div>
            {message.status === "applied" ? (
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
            )}
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
    </div>
  );
}
