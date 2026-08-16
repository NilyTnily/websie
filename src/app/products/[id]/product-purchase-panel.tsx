"use client";

import { BellRing, Check, Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";

import { notifyMeAction } from "~/app/actions/stock-notifications";
import { cn } from "~/lib/cn";
import { useCart } from "~/lib/hooks/use-cart";
import { useWishlist } from "~/lib/hooks/use-wishlist";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";

const MAX_QUANTITY_PER_ORDER = 10;

interface ProductPurchasePanelProps {
  category: string;
  id: string;
  image: string;
  inStock: boolean;
  name: string;
  price: number;
}

export function ProductPurchasePanel({
  category,
  id,
  image,
  inStock,
  name,
  price,
}: ProductPurchasePanelProps) {
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [quantity, setQuantity] = React.useState(1);
  const [isAdding, setIsAdding] = React.useState(false);
  const isInWishlist = isWishlisted(id);

  const handleQuantityChange = React.useCallback((newQty: number) => {
    setQuantity((prev) =>
      newQty >= 1 && newQty <= MAX_QUANTITY_PER_ORDER ? newQty : prev,
    );
  }, []);

  const handleAddToCart = React.useCallback(async () => {
    setIsAdding(true);
    addItem({ category, id, image, name, price }, quantity);
    setQuantity(1);
    toast.success(`${name} added to your bag`);
    await new Promise((r) => setTimeout(r, 400));
    setIsAdding(false);
  }, [addItem, category, id, image, name, price, quantity]);

  if (!inStock) {
    return <NotifyMeForm productId={id} />;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center">
        <Button
          aria-label="Decrease quantity"
          disabled={quantity <= 1}
          onClick={() => handleQuantityChange(quantity - 1)}
          size="icon"
          variant="outline"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <span className="w-12 text-center select-none">{quantity}</span>

        <Button
          aria-label="Increase quantity"
          disabled={quantity >= MAX_QUANTITY_PER_ORDER}
          onClick={() => handleQuantityChange(quantity + 1)}
          size="icon"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button
          className={`
            h-[54px] flex-1 rounded-none text-xs font-medium
            tracking-[0.15em] uppercase
          `}
          disabled={isAdding}
          onClick={handleAddToCart}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          {isAdding ? "Adding…" : "Add to Bag"}
        </Button>

        <Button
          aria-label={
            isInWishlist ? "Remove from wishlist" : "Save to wishlist"
          }
          aria-pressed={isInWishlist}
          className="h-[54px] w-[54px] shrink-0 rounded-none"
          onClick={() => toggleWishlist(id)}
          size="icon"
          variant="outline"
        >
          <Heart
            className={cn(
              "h-4 w-4",
              isInWishlist
                ? "fill-secondary text-secondary"
                : "text-muted-foreground",
            )}
          />
        </Button>
      </div>
    </div>
  );
}

function NotifyMeForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState(
    notifyMeAction.bind(null, productId),
    {},
  );

  if (state.success) {
    return (
      <p
        className={`mt-6 flex items-center gap-2 text-sm text-muted-foreground`}
      >
        <Check className="h-4 w-4 text-primary" />
        We&apos;ll email you the moment this piece is back.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-6">
      <p className="mb-2 text-sm text-muted-foreground">
        Notify me when this piece is back in stock
      </p>
      <div className={`
        flex flex-col gap-2
        sm:flex-row
      `}>
        <Input
          aria-label="Email address"
          className="h-11"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
        <Button
          className={`
            h-11 shrink-0 text-xs font-medium tracking-[0.15em] uppercase
          `}
          disabled={isPending}
          type="submit"
          variant="outline"
        >
          <BellRing className="mr-2 h-4 w-4" />
          Notify Me
        </Button>
      </div>
      {state.error && (
        <p className="mt-2 text-xs text-destructive">{state.error}</p>
      )}
    </form>
  );
}
