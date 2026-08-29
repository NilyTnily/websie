"use client";

import Link from "next/link";
import { useState } from "react";

import type { Inquiry, WhatsappMessage } from "~/db/schema";

import { cn } from "~/lib/cn";
import { formatOrderNumber } from "~/lib/order-number";
import { Button } from "~/ui/primitives/button";

import { ShipmentForm } from "../inquiries/[id]/shipment-form";
import {
  applyMessageAsShipmentAction,
  ignoreMessageAction,
  matchMessageToOrderAction,
} from "../inquiries/actions";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const STATUS_TABS: { label: string; value?: WhatsappMessage["status"] }[] = [
  { label: "All" },
  { label: "Received", value: "received" },
  { label: "Matched", value: "matched" },
  { label: "Applied", value: "applied" },
  { label: "Ignored", value: "ignored" },
];

interface WhatsAppInboxClientProps {
  inquiries: Inquiry[];
  messages: WhatsappMessage[];
  statusFilter?: WhatsappMessage["status"];
}

export function WhatsAppInboxClient({
  inquiries,
  messages,
  statusFilter,
}: WhatsAppInboxClientProps) {
  const inquiryById = new Map(inquiries.map((inquiry) => [inquiry.id, inquiry]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">WhatsApp Inbox</h2>
        <p className="text-sm text-muted-foreground">
          Inbound messages matched to orders. Apply one to fill in tracking,
          or match it to an order manually.
        </p>
      </div>

      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => (
          <Link
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              (statusFilter ?? undefined) === tab.value
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
            href={tab.value ? `/admin/whatsapp?status=${tab.value}` : "/admin/whatsapp"}
            key={tab.label}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {messages.length === 0 && (
        <p className="text-sm text-muted-foreground">No messages yet.</p>
      )}

      <div className="space-y-3">
        {messages.map((message) => (
          <MessageRow
            inquiries={inquiries}
            inquiry={message.inquiryId ? (inquiryById.get(message.inquiryId) ?? null) : null}
            key={message.id}
            message={message}
          />
        ))}
      </div>
    </div>
  );
}

function MatchToOrderForm({
  inquiries,
  messageId,
  onDone,
}: {
  inquiries: Inquiry[];
  messageId: string;
  onDone: () => void;
}) {
  const [selectedId, setSelectedId] = useState("");

  return (
    <div className="flex items-center gap-2 rounded-md border p-3">
      <select
        className={`
          h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm
        `}
        onChange={(e) => setSelectedId(e.target.value)}
        value={selectedId}
      >
        <option value="">Select an order…</option>
        {inquiries.map((inquiry) => (
          <option key={inquiry.id} value={inquiry.id}>
            {formatOrderNumber(inquiry.orderNumber)} — {inquiry.customerName}
          </option>
        ))}
      </select>
      <Button
        disabled={!selectedId}
        onClick={async () => {
          await matchMessageToOrderAction(messageId, selectedId);
          onDone();
        }}
        size="sm"
      >
        Match
      </Button>
      <Button onClick={onDone} size="sm" variant="ghost">
        Cancel
      </Button>
    </div>
  );
}

function MessageRow({
  inquiries,
  inquiry,
  message,
}: {
  inquiries: Inquiry[];
  inquiry: Inquiry | null;
  message: WhatsappMessage;
}) {
  const [isApplying, setIsApplying] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  return (
    <div className="space-y-3 rounded-md border p-4 text-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {DATE_FORMATTER.format(message.receivedAt)} · {message.fromPhone}
          </p>
          <p className="whitespace-pre-wrap">{message.body}</p>
          {inquiry ? (
            <Link
              className="text-xs text-primary underline"
              href={`/admin/inquiries/${inquiry.id}`}
            >
              {formatOrderNumber(inquiry.orderNumber)} — {inquiry.customerName}
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground">Not matched to an order.</p>
          )}
          {(message.extractedCarrier || message.extractedTrackingNumber) && (
            <p className="text-xs text-muted-foreground">
              Guess: {message.extractedCarrier ?? "unknown carrier"}
              {message.extractedTrackingNumber
                ? ` — ${message.extractedTrackingNumber}`
                : ""}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {message.status === "applied" ? (
            <span className="text-xs text-muted-foreground">Applied</span>
          ) : (
            <>
              {inquiry && !isApplying && (
                <Button onClick={() => setIsApplying(true)} size="sm" variant="outline">
                  Apply as Shipment
                </Button>
              )}
              {!inquiry && !isMatching && (
                <Button onClick={() => setIsMatching(true)} size="sm" variant="outline">
                  Match to Order
                </Button>
              )}
              {message.status !== "ignored" && (
                <Button
                  onClick={() => ignoreMessageAction(message.id)}
                  size="sm"
                  variant="ghost"
                >
                  Ignore
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {isApplying && inquiry && (
        <ShipmentForm
          action={applyMessageAsShipmentAction.bind(null, message.id, inquiry.id)}
          defaults={{
            carrier: message.extractedCarrier,
            trackingNumber: message.extractedTrackingNumber,
          }}
          items={inquiry.items}
          onDone={() => setIsApplying(false)}
          submitLabel="Confirm & Apply"
        />
      )}

      {isMatching && (
        <MatchToOrderForm
          inquiries={inquiries}
          messageId={message.id}
          onDone={() => setIsMatching(false)}
        />
      )}
    </div>
  );
}
