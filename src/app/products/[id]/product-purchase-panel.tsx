"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { useCart } from "~/lib/hooks/use-cart";
import { Button } from "~/ui/primitives/button";

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
  const [quantity, setQuantity] = React.useState(1);
  const [isAdding, setIsAdding] = React.useState(false);

  const handleQuantityChange = React.useCallback((newQty: number) => {
    setQuantity((prev) => (newQty >= 1 ? newQty : prev));
  }, []);

  const handleAddToCart = React.useCallback(async () => {
    setIsAdding(true);
    addItem({ category, id, image, name, price }, quantity);
    setQuantity(1);
    toast.success(`${name} added to your bag`);
    await new Promise((r) => setTimeout(r, 400));
    setIsAdding(false);
  }, [addItem, category, id, image, name, price, quantity]);

  return (
    <>
      <div aria-atomic="true" aria-live="polite" className="mt-6">
        {inStock ? (
          <p className="krs-ref text-xs text-primary">In Stock</p>
        ) : (
          <p className="krs-ref text-xs text-secondary">Out of Stock</p>
        )}
      </div>

      <div
        className={`
          mt-6 flex flex-col gap-4
          sm:flex-row sm:items-center
        `}
      >
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
            onClick={() => handleQuantityChange(quantity + 1)}
            size="icon"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button
          className={`
            h-11 flex-1 text-xs font-medium tracking-[0.15em] uppercase
          `}
          disabled={!inStock || isAdding}
          onClick={handleAddToCart}
          variant="outline"
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          {isAdding ? "Adding…" : "Add to Bag"}
        </Button>
      </div>
    </>
  );
}
