import { MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";

import { formatOrderNumber } from "~/lib/order-number";
import { getInquiryById } from "~/lib/queries/inquiries";
import { getShipmentsForInquiry } from "~/lib/queries/shipments";
import { getWhatsAppMessagesForInquiry } from "~/lib/queries/whatsapp-messages";
import { Button } from "~/ui/primitives/button";

import { updateInquiryDeliveryAction } from "../actions";
import { DeliveryForm } from "../delivery-form";
import { StatusSelect } from "../status-select";
import { ShipmentsPanel } from "./shipments-panel";
import { WhatsAppMessagesPanel } from "./whatsapp-messages-panel";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "full",
  timeStyle: "short",
});

interface InquiryDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InquiryDetailPage({
  params,
}: InquiryDetailPageProps) {
  const { id } = await params;
  const inquiry = await getInquiryById(id);

  if (!inquiry) notFound();

  const [shipments, whatsappMessages] = await Promise.all([
    getShipmentsForInquiry(inquiry.id),
    getWhatsAppMessagesForInquiry(inquiry.id),
  ]);

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            Order {formatOrderNumber(inquiry.orderNumber)}
          </p>
          <h2 className="text-xl font-semibold">{inquiry.customerName}</h2>
          <p className="text-sm text-muted-foreground">
            {DATE_FORMATTER.format(inquiry.createdAt)}
          </p>
        </div>
        <StatusSelect id={inquiry.id} status={inquiry.status} />
      </div>

      <div className="space-y-3 rounded-md border p-4 text-sm">
        <p>
          <span className="text-muted-foreground">Contact: </span>
          {inquiry.customerContact}
        </p>
        {inquiry.note && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Note: </span>
            <span>{inquiry.note}</span>
          </div>
        )}
        <WhatsAppButton
          customerName={inquiry.customerName}
          href={
            whatsappLink(
              inquiry.customerContact,
              inquiry.customerName,
              formatOrderNumber(inquiry.orderNumber),
            ) ?? undefined
          }
        />
      </div>

      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead
            className={`
              bg-muted/50 text-left text-xs text-muted-foreground uppercase
            `}
          >
            <tr>
              <th className="px-4 py-3">Piece</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {inquiry.items.map((item) => (
              <tr className="border-t" key={item.id}>
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3 text-right">
                  {CURRENCY_FORMATTER.format(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-semibold">
              <td className="px-4 py-3" colSpan={2}>
                Subtotal
              </td>
              <td className="px-4 py-3 text-right">
                {CURRENCY_FORMATTER.format(inquiry.subtotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="space-y-4 border-t pt-6">
        <div>
          <h3 className="text-lg font-semibold">Delivery</h3>
          <p className="text-sm text-muted-foreground">
            Visible to the customer under My Orders once saved.
          </p>
        </div>
        <DeliveryForm
          action={updateInquiryDeliveryAction.bind(null, inquiry.id)}
          deliveryStatus={inquiry.deliveryStatus}
        />
      </div>

      <div className="border-t pt-6">
        <ShipmentsPanel
          inquiryId={inquiry.id}
          items={inquiry.items}
          legacyCarrier={inquiry.carrier}
          legacyTrackingUrl={inquiry.trackingUrl}
          shipments={shipments}
        />
      </div>

      {whatsappMessages.length > 0 && (
        <div className="border-t pt-6">
          <WhatsAppMessagesPanel
            inquiryId={inquiry.id}
            items={inquiry.items}
            messages={whatsappMessages}
          />
        </div>
      )}
    </div>
  );
}

function WhatsAppButton({
  customerName,
  href,
}: {
  customerName: string;
  href?: string;
}) {
  if (!href) return null;
  return (
    <Button asChild className="mt-1" size="sm" variant="outline">
      <a href={href} rel="noopener noreferrer" target="_blank">
        <MessageCircle className="size-4" />
        WhatsApp {customerName.split(" ")[0]}
      </a>
    </Button>
  );
}

/** A contact counts as WhatsApp-able when its digits form a plausible phone number (8–15 digits). */
function whatsappLink(contact: string, customerName: string, orderRef: string) {
  const digits = contact.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  const message = encodeURIComponent(
    `Hi ${customerName}, it's KRS regarding your order ${orderRef}.`,
  );
  return `https://wa.me/${digits}?text=${message}`;
}
