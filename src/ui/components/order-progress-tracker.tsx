import {
  BadgeCheck,
  Clock,
  ExternalLink,
  Gem,
  Hammer,
  Home,
  MapPin,
  Navigation,
  Package,
  PackageCheck,
  Truck,
} from "lucide-react";

import type { Inquiry } from "~/db/schema";

import { cn } from "~/lib/cn";
import {
  DELIVERY_STATUS_LABEL,
  DELIVERY_STEPS,
  getDeliveryStepIndex,
} from "~/lib/delivery-status";
import { Button } from "~/ui/primitives/button";

const STEP_ICON: Record<
  Inquiry["deliveryStatus"],
  React.ComponentType<{ className?: string }>
> = {
  confirmed: BadgeCheck,
  delivered: PackageCheck,
  out_for_delivery: Navigation,
  pending_review: Clock,
  placed: Package,
  processing: Hammer,
  shipped: Truck,
};

interface OrderProgressTrackerProps {
  carrier: null | string;
  deliveryStatus: Inquiry["deliveryStatus"];
  trackingUrl: null | string;
}

export function OrderProgressTracker({
  carrier,
  deliveryStatus,
  trackingUrl,
}: OrderProgressTrackerProps) {
  const currentIndex = getDeliveryStepIndex(deliveryStatus);
  const progressPercent = (currentIndex / (DELIVERY_STEPS.length - 1)) * 100;

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto">
        <ol className="flex min-w-[560px] items-start">
          {DELIVERY_STEPS.map((step, index) => {
            const Icon = STEP_ICON[step];
            const isDone = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFilled = isDone || isCurrent;

            return (
              <li
                className="flex flex-1 flex-col items-center gap-2"
                key={step}
              >
                <div className="flex w-full items-center">
                  <div
                    className={cn(
                      "h-0.5 flex-1",
                      index === 0
                        ? "invisible"
                        : isFilled
                          ? "bg-primary"
                          : `bg-border`,
                    )}
                  />
                  <div
                    className={cn(
                      `
                        flex h-8 w-8 shrink-0 items-center justify-center
                        rounded-full border-2
                      `,
                      isDone &&
                        `border-primary bg-primary text-primary-foreground`,
                      isCurrent && "border-primary text-primary",
                      !isFilled && "border-border text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div
                    className={cn(
                      "h-0.5 flex-1",
                      index === DELIVERY_STEPS.length - 1
                        ? "invisible"
                        : isDone
                          ? "bg-primary"
                          : "bg-border",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "px-1 text-center text-[11px] leading-tight",
                    isCurrent
                      ? "font-semibold text-foreground"
                      : `text-muted-foreground`,
                  )}
                >
                  {DELIVERY_STATUS_LABEL[step]}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="border border-border bg-muted/30 p-6">
        <div
          className={`
            flex items-center justify-between text-xs text-muted-foreground
          `}
        >
          <span className="flex items-center gap-1.5">
            <Gem className="h-3.5 w-3.5" />
            KRS Workshop
          </span>
          <span className="flex items-center gap-1.5">
            Your Door
            <Home className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="relative mt-5 h-6">
          <div
            className={`
              absolute top-1/2 right-0 left-0 border-t border-dashed
              border-border
            `}
          />
          <div
            className="absolute top-1/2 left-0 border-t-2 border-primary"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className={`
              absolute top-1/2 -translate-x-1/2 -translate-y-1/2
              transition-[left] duration-500
            `}
            style={{ left: `${progressPercent}%` }}
          >
            <div
              className={`
                flex h-6 w-6 items-center justify-center rounded-full bg-primary
                text-primary-foreground shadow-sm
              `}
            >
              <MapPin className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          {trackingUrl ? (
            <Button asChild className="gap-1.5" variant="outline">
              <a href={trackingUrl} rel="noopener noreferrer" target="_blank">
                <ExternalLink className="h-3.5 w-3.5" />
                Track with {carrier || "Courier"}
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tracking details will appear here once your piece ships.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
