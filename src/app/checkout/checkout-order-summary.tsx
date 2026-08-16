import Image from "next/image";

import type { CartItem } from "~/ui/components/cart";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

interface CheckoutOrderSummaryProps {
  deliveryCost: number;
  items: CartItem[];
  presentationCost: number;
  subtotal: number;
}

export function CheckoutOrderSummary({
  deliveryCost,
  items,
  presentationCost,
  subtotal,
}: CheckoutOrderSummaryProps) {
  const total = subtotal + deliveryCost + presentationCost;

  return (
    <aside className={`
      bg-krs-mocha px-8 py-12 text-krs-ivory
      sm:px-12 sm:py-16
    `}>
      <p className="krs-eyebrow text-krs-champagne">Your order</p>

      <div className="mt-8 grid gap-6">
        {items.map((item) => (
          <div className="flex gap-4" key={item.id}>
            <div className={`
              relative h-[88px] w-[70px] shrink-0 overflow-hidden
              bg-krs-mocha-tint
            `}>
              <Image
                alt={item.name}
                className="object-cover"
                fill
                sizes="70px"
                src={item.image}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-display text-base">
                {item.name}
              </p>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="krs-meta text-krs-ivory/55">
                  Qty {item.quantity}
                </span>
                <span className="krs-price">
                  {CURRENCY_FORMATTER.format(item.price * item.quantity)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`
        mt-9 grid gap-3 border-t border-krs-champagne/30 pt-6 text-sm font-light
      `}>
        <div className="flex justify-between">
          <span className="text-krs-ivory/70">Subtotal</span>
          <span>{CURRENCY_FORMATTER.format(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-krs-ivory/70">Delivery</span>
          <span>
            {deliveryCost > 0
              ? CURRENCY_FORMATTER.format(deliveryCost)
              : "Included"}
          </span>
        </div>
        {presentationCost > 0 && (
          <div className="flex justify-between">
            <span className="text-krs-ivory/70">Presentation</span>
            <span>{CURRENCY_FORMATTER.format(presentationCost)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-krs-ivory/70">Duties &amp; taxes</span>
          <span>Prepaid</span>
        </div>
      </div>

      <div className={`
        mt-6 flex items-baseline justify-between border-t
        border-krs-champagne/30 pt-6
      `}>
        <span className="krs-eyebrow text-krs-champagne">Total</span>
        <span className="krs-price text-[34px]">
          {CURRENCY_FORMATTER.format(total)}
        </span>
      </div>
    </aside>
  );
}
