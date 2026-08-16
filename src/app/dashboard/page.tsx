import Image from "next/image";
import Link from "next/link";

import { getCurrentUserOrRedirect } from "~/lib/auth";
import { getDeliveredItemsForUser } from "~/lib/queries/inquiries";
import { Button } from "~/ui/primitives/button";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

export default async function VaultPiecesPage() {
  const user = await getCurrentUserOrRedirect();
  if (!user) return null;

  const pieces = await getDeliveredItemsForUser(user.id);

  if (pieces.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">
          Nothing in the vault yet — delivered pieces will appear here.
        </p>
        <Button asChild className="mt-4 rounded-none" variant="outline">
          <Link href="/products">Browse the Collection</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {pieces.map((piece) => (
        <div
          className={`
            grid grid-cols-1 border border-border
            sm:grid-cols-[132px_1fr_220px_200px]
          `}
          key={`${piece.inquiryId}-${piece.id}`}
        >
          <div className={`
            relative aspect-square bg-muted
            sm:aspect-auto
          `}>
            <Image
              alt={piece.name}
              className="object-cover"
              fill
              sizes="132px"
              src={piece.image}
            />
          </div>
          <div className="p-6">
            <p className="krs-meta text-krs-tobacco">{piece.id}</p>
            <p className="mt-2 font-display text-lg text-foreground">
              {piece.name}
            </p>
            <p className="krs-meta mt-2 text-krs-warm-grey">
              Acquired {DATE_FORMATTER.format(piece.acquiredAt)}
            </p>
          </div>
          <div
            className={`
              flex flex-col justify-center gap-2 border-t border-border p-6
              sm:border-t-0 sm:border-l
            `}
          >
            <p className="krs-meta text-krs-tobacco">Service</p>
            <p className="text-sm font-light text-muted-foreground">
              Not yet tracked
            </p>
          </div>
          <div
            className={`
              flex flex-col justify-center gap-2 border-t border-border p-6
              sm:border-t-0 sm:border-l
            `}
          >
            <p className="krs-price text-lg text-foreground">
              {CURRENCY_FORMATTER.format(piece.price * piece.quantity)}
            </p>
            <p className="krs-meta text-krs-ash">Certificate available on request</p>
          </div>
        </div>
      ))}
    </div>
  );
}
