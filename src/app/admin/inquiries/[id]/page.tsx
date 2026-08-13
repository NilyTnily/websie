import { notFound } from "next/navigation";

import { formatOrderNumber } from "~/lib/order-number";
import { getInquiryById } from "~/lib/queries/inquiries";

import { updateInquiryDeliveryAction } from "../actions";
import { DeliveryForm } from "../delivery-form";
import { StatusSelect } from "../status-select";

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

      <div className="space-y-1 rounded-md border p-4 text-sm">
        <p>
          <span className="text-muted-foreground">Contact: </span>
          {inquiry.customerContact}
        </p>
        {inquiry.note && (
          <p>
            <span className="text-muted-foreground">Note: </span>
            {inquiry.note}
          </p>
        )}
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
          carrier={inquiry.carrier}
          deliveryStatus={inquiry.deliveryStatus}
          trackingUrl={inquiry.trackingUrl}
        />
      </div>
    </div>
  );
}
