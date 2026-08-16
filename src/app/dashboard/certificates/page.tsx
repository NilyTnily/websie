import Image from "next/image";
import Link from "next/link";

import { getCurrentUserOrRedirect } from "~/lib/auth";
import { getDeliveredItemsForUser } from "~/lib/queries/inquiries";
import { Button } from "~/ui/primitives/button";

export default async function CertificatesPage() {
  const user = await getCurrentUserOrRedirect();
  if (!user) return null;

  const pieces = await getDeliveredItemsForUser(user.id);

  return (
    <div>
      <div className="space-y-0.5 pb-8">
        <h2 className="font-display text-2xl text-foreground">
          Certificates
        </h2>
        <p className="text-muted-foreground">
          Authentication and provenance records for pieces in your vault.
        </p>
      </div>

      {pieces.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">
            Nothing in the vault yet — certificates appear once a piece is
            delivered.
          </p>
          <Button asChild className="mt-4 rounded-none" variant="outline">
            <Link href="/products">Browse the Collection</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {pieces.map((piece) => (
            <div
              className={`flex items-center gap-5 border border-border p-5`}
              key={`${piece.inquiryId}-${piece.id}`}
            >
              <div className={`
                relative h-16 w-16 shrink-0 overflow-hidden bg-muted
              `}>
                <Image
                  alt={piece.name}
                  className="object-cover"
                  fill
                  sizes="64px"
                  src={piece.image}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base text-foreground">
                  {piece.name}
                </p>
                <p className="krs-meta mt-1 text-krs-warm-grey">
                  Ref. {piece.id}
                </p>
              </div>
              <span className="krs-meta shrink-0 text-krs-ash">
                Available on request
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
