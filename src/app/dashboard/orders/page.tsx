import { Package } from "lucide-react";
import Link from "next/link";

import { getCurrentUser } from "~/lib/auth";
import { getInquiriesForUser } from "~/lib/queries/inquiries";
import { OrderCard } from "~/ui/components/order-card";
import { Button } from "~/ui/primitives/button";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  const orders = user ? await getInquiriesForUser(user.id) : [];
  const ongoing = orders.filter((o) => o.deliveryStatus !== "delivered");
  const completed = orders.filter((o) => o.deliveryStatus === "delivered");

  return (
    <div className="space-y-10">
      <div className="space-y-0.5">
        <h2 className="font-display text-2xl text-foreground">Orders</h2>
        <p className="text-muted-foreground">
          Every piece you&apos;ve requested from KRS, and where it stands.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            No orders yet — nothing requested from the collection so far.
          </p>
          <Link href="/products">
            <Button className="mt-4" variant="outline">
              Browse the Collection
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {ongoing.length > 0 && (
            <section className="space-y-4">
              <h3 className="krs-meta text-xs text-muted-foreground">Ongoing</h3>
              <div
                className={`
                  grid grid-cols-1 gap-4
                  sm:grid-cols-2
                  lg:grid-cols-3
                `}
              >
                {ongoing.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="space-y-4">
              <h3 className="krs-meta text-xs text-muted-foreground">
                Delivered
              </h3>
              <div
                className={`
                  grid grid-cols-1 gap-4
                  sm:grid-cols-2
                  lg:grid-cols-3
                `}
              >
                {completed.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
