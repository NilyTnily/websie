"use client";

import * as React from "react";
import { toast } from "sonner";

import { cancelOrderAction } from "~/app/actions/orders";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/ui/primitives/alert-dialog";
import { Button } from "~/ui/primitives/button";

interface CancelOrderButtonProps {
  orderId: string;
  orderNumber?: string;
  variant?: "card" | "detail";
}

export function CancelOrderButton({
  orderId,
  orderNumber,
  variant = "card",
}: CancelOrderButtonProps) {
  const [isPending, setIsPending] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleConfirm = async () => {
    setIsPending(true);
    const result = await cancelOrderAction(orderId);
    setIsPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(
      orderNumber ? `Order ${orderNumber} cancelled.` : "Order cancelled.",
    );
    setOpen(false);
    // Server action already revalidates paths; a soft refresh ensures UI
    // reflects the cancelled state without a full navigation.
    window.location.reload();
  };

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <Button
          className={
            variant === "card"
              ? "h-7 rounded-none px-2 text-[10px] tracking-[0.14em] uppercase"
              : "rounded-none"
          }
          disabled={isPending}
          size={variant === "card" ? "sm" : "default"}
          variant={variant === "card" ? "outline" : "destructive"}
          onClick={(e) => e.stopPropagation()}
        >
          Cancel order
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Cancel {orderNumber ? `order ${orderNumber}` : "this order"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This can&apos;t be undone. Only pending orders can be cancelled —
            once your piece goes into processing it can no longer be cancelled
            from here. Contact an associate if you need help.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep order</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
          >
            {isPending ? "Cancelling…" : "Yes, cancel order"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
