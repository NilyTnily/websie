"use client";

import { useState } from "react";

import type { InquiryItem, InquiryShipment } from "~/db/schema";

import { Button } from "~/ui/primitives/button";

import {
  createShipmentAction,
  deleteShipmentAction,
  updateShipmentAction,
} from "../actions";
import { ShipmentForm } from "./shipment-form";

interface ShipmentsPanelProps {
  inquiryId: string;
  items: InquiryItem[];
  legacyCarrier: null | string;
  legacyTrackingUrl: null | string;
  shipments: InquiryShipment[];
}

export function ShipmentsPanel({
  inquiryId,
  items,
  legacyCarrier,
  legacyTrackingUrl,
  shipments,
}: ShipmentsPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<null | string>(null);

  const itemById = new Map(items.map((item) => [item.id, item]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Shipments</h3>
          <p className="text-sm text-muted-foreground">
            One order can ship in several pieces — add a tracking number per
            shipment.
          </p>
        </div>
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            size="sm"
            variant="outline"
          >
            Add Shipment
          </Button>
        )}
      </div>

      {shipments.length === 0 && !legacyTrackingUrl && !isAdding && (
        <p className="text-sm text-muted-foreground">
          No shipments yet.
        </p>
      )}

      {shipments.length === 0 && legacyTrackingUrl && (
        <div className="rounded-md border p-3 text-sm">
          <p className="text-muted-foreground">
            Carrier: {legacyCarrier || "—"}
          </p>
          <a
            className="text-primary underline"
            href={legacyTrackingUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {legacyTrackingUrl}
          </a>
        </div>
      )}

      {shipments.map((shipment) =>
        editingId === shipment.id ? (
          <ShipmentForm
            action={updateShipmentAction.bind(null, inquiryId, shipment.id)}
            defaults={shipment}
            items={items}
            key={shipment.id}
            onDone={() => setEditingId(null)}
            submitLabel="Update Shipment"
          />
        ) : (
          <div className={`
            flex items-start justify-between rounded-md border p-3 text-sm
          `} key={shipment.id}>
            <div className="space-y-1">
              {shipment.label && (
                <p className="font-medium">{shipment.label}</p>
              )}
              <p className="text-muted-foreground">
                {shipment.carrier || "Carrier not set"}
                {shipment.trackingNumber ? ` — ${shipment.trackingNumber}` : ""}
              </p>
              {shipment.trackingUrl && (
                <a
                  className="text-primary underline"
                  href={shipment.trackingUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {shipment.trackingUrl}
                </a>
              )}
              {shipment.itemIds && shipment.itemIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Covers:{" "}
                  {shipment.itemIds
                    .map((id) => itemById.get(id)?.name ?? "Unknown item")
                    .join(", ")}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                onClick={() => setEditingId(shipment.id)}
                size="sm"
                variant="ghost"
              >
                Edit
              </Button>
              <Button
                onClick={() => deleteShipmentAction(inquiryId, shipment.id)}
                size="sm"
                variant="ghost"
              >
                Delete
              </Button>
            </div>
          </div>
        ),
      )}

      {isAdding && (
        <ShipmentForm
          action={createShipmentAction.bind(null, inquiryId)}
          items={items}
          onDone={() => setIsAdding(false)}
        />
      )}
    </div>
  );
}
