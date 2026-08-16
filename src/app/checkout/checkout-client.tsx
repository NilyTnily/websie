"use client";

import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { checkoutAction } from "~/app/actions/checkout";
import { useCurrentUser } from "~/lib/auth-client";
import {
  DELIVERY_METHODS,
  ENGRAVING_MAX_LENGTH,
  PRESENTATION_OPTIONS,
} from "~/lib/checkout-options";
import { cn } from "~/lib/cn";
import { useCart } from "~/lib/hooks/use-cart";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";

import { CheckoutOrderSummary } from "./checkout-order-summary";

type Step = 1 | 2 | 3;

const STEPS: { label: string; step: Step }[] = [
  { label: "1 · Delivery", step: 1 },
  { label: "2 · Presentation", step: 2 },
  { label: "3 · Payment", step: 3 },
];

const FIELD_LABEL = "krs-eyebrow text-krs-tobacco";
const FIELD_INPUT = "h-[46px] rounded-none border-input px-3.5 text-sm";

export function CheckoutClient() {
  const { clearCart, items, subtotal } = useCart();
  const { user } = useCurrentUser();
  const [isMounted, setIsMounted] = React.useState(false);

  const [step, setStep] = React.useState<Step>(1);
  const [name, setName] = React.useState("");
  const [street, setStreet] = React.useState("");
  const [city, setCity] = React.useState("");
  const [postcode, setPostcode] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [deliveryMethod, setDeliveryMethod] = React.useState(
    DELIVERY_METHODS[0]!.value,
  );
  const [presentationOption, setPresentationOption] = React.useState(
    PRESENTATION_OPTIONS[0]!.value,
  );
  const [engravingText, setEngravingText] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<null | string>(null);
  const [whatsappUrl, setWhatsappUrl] = React.useState<null | string>(null);
  const [isPlaced, setIsPlaced] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (!user) return;
    setName((prev) => prev || user.name || "");
    setContact((prev) => prev || user.email || "");
  }, [user]);

  const delivery = DELIVERY_METHODS.find((m) => m.value === deliveryMethod)!;
  const presentation = PRESENTATION_OPTIONS.find(
    (p) => p.value === presentationOption,
  )!;

  const isStep1Valid =
    name.trim() && street.trim() && city.trim() && postcode.trim() && contact.trim();
  const isStep2Valid =
    presentationOption !== "engraving" || engravingText.trim().length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    const result = await checkoutAction({
      customerContact: contact,
      deliveryAddress: { city, name, postcode, street },
      deliveryMethod,
      engravingText: presentationOption === "engraving" ? engravingText : undefined,
      items: items.map((item) => ({
        id: item.id,
        image: item.image,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      presentationOption,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setWhatsappUrl(result.whatsappUrl);
    setIsPlaced(true);
    clearCart();
    toast.success("Order request sent");
  };

  if (!isMounted) {
    return <div className="min-h-screen" />;
  }

  if (items.length === 0 && !isPlaced) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted-foreground">Your bag is empty.</p>
        <Button asChild className="mt-6 rounded-none">
          <Link href="/products">Browse the Collection</Link>
        </Button>
      </div>
    );
  }

  if (isPlaced) {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <p className="krs-eyebrow text-krs-champagne">Request received</p>
        <h1 className="mt-4 font-display text-3xl text-foreground">
          An associate will be in touch
        </h1>
        <p className="mt-4 text-muted-foreground">
          We&apos;ll confirm details and arrange payment within one business
          day, by {contact}.
        </p>
        {whatsappUrl && (
          <a
            className={`
              mt-8 inline-flex h-[52px] items-center justify-center
              bg-krs-champagne px-8 text-xs font-semibold tracking-[0.22em]
              text-krs-mocha uppercase
            `}
            href={whatsappUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Continue on WhatsApp
          </a>
        )}
        <div className="mt-6">
          <Link className={`
            text-sm text-muted-foreground
            hover:text-primary
          `} href="/products">
            Back to the Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        grid grid-cols-1 bg-krs-ivory-bright
        lg:min-h-[900px] lg:grid-cols-[1fr_512px]
      `}
    >
      <div className={`
        px-6 py-12
        sm:px-12 sm:py-16
      `}>
        <p className="krs-brand-mark font-display text-2xl text-foreground">
          KRS
        </p>

        <div className="mt-10 flex gap-8 border-b border-border pb-4 text-xs">
          {STEPS.map((s) => (
            <span
              className={cn(
                "krs-label -mb-[17px] border-b pb-4",
                s.step === step
                  ? "border-krs-champagne text-foreground"
                  : "border-transparent text-krs-ash",
              )}
              key={s.step}
            >
              {s.label}
            </span>
          ))}
        </div>

        {step === 1 && (
          <div className="mt-11">
            <h2 className={`
              font-display text-2xl text-foreground
              sm:text-[26px]
            `}>
              Where should it go?
            </h2>
            <div className={`
              mt-6 grid grid-cols-1 gap-4
              sm:grid-cols-2
            `}>
              <Field className="sm:col-span-2" label="Full name">
                <Input
                  className={FIELD_INPUT}
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                />
              </Field>
              <Field className="sm:col-span-2" label="Street address">
                <Input
                  className={FIELD_INPUT}
                  onChange={(e) => setStreet(e.target.value)}
                  value={street}
                />
              </Field>
              <Field label="City">
                <Input
                  className={FIELD_INPUT}
                  onChange={(e) => setCity(e.target.value)}
                  value={city}
                />
              </Field>
              <Field label="Postcode">
                <Input
                  className={FIELD_INPUT}
                  onChange={(e) => setPostcode(e.target.value)}
                  value={postcode}
                />
              </Field>
              <Field className="sm:col-span-2" label="Email or phone">
                <Input
                  className={FIELD_INPUT}
                  onChange={(e) => setContact(e.target.value)}
                  value={contact}
                />
              </Field>
            </div>

            <h2 className={`
              mt-12 font-display text-2xl text-foreground
              sm:text-[26px]
            `}>
              How it travels
            </h2>
            <div className="mt-5 grid gap-3">
              {DELIVERY_METHODS.map((method) => (
                <button
                  className={cn(
                    `
                      flex items-center justify-between border px-6 py-5
                      text-left
                    `,
                    deliveryMethod === method.value
                      ? "border-primary"
                      : "border-input",
                  )}
                  key={method.value}
                  onClick={() => setDeliveryMethod(method.value)}
                  type="button"
                >
                  <div>
                    <p className="text-[15px]">{method.label}</p>
                    <p className={`
                      mt-1 text-[13px] font-light text-muted-foreground
                    `}>
                      {method.description}
                    </p>
                  </div>
                  <span className="krs-price shrink-0 pl-4 text-base">
                    {method.cost > 0 ? `$${method.cost}` : "Included"}
                  </span>
                </button>
              ))}
            </div>

            <Button
              className={`
                mt-10 h-[52px] w-full rounded-none
                sm:w-auto sm:px-10
              `}
              disabled={!isStep1Valid}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-11">
            <h2 className={`
              font-display text-2xl text-foreground
              sm:text-[26px]
            `}>
              Presentation
            </h2>
            <div className={`
              mt-6 grid grid-cols-1 gap-3
              sm:grid-cols-3
            `}>
              {PRESENTATION_OPTIONS.map((option) => (
                <button
                  className={cn(
                    "border p-[18px] text-left",
                    presentationOption === option.value
                      ? "border-primary"
                      : "border-input",
                  )}
                  key={option.value}
                  onClick={() => setPresentationOption(option.value)}
                  type="button"
                >
                  <p className="text-sm">{option.label}</p>
                  <p className="mt-1.5 text-xs font-light text-muted-foreground">
                    {option.description}
                  </p>
                  <p className="krs-price mt-3">
                    {option.cost > 0 ? `$${option.cost}` : "Included"}
                  </p>
                </button>
              ))}
            </div>

            {presentationOption === "engraving" && (
              <Field className="mt-6 max-w-xs" label="Engraving text">
                <Input
                  className={FIELD_INPUT}
                  maxLength={ENGRAVING_MAX_LENGTH}
                  onChange={(e) => setEngravingText(e.target.value)}
                  value={engravingText}
                />
              </Field>
            )}

            <div className="mt-10 flex gap-3">
              <Button
                className="h-[52px] rounded-none"
                onClick={() => setStep(1)}
                variant="outline"
              >
                Back
              </Button>
              <Button
                className={`
                  h-[52px] flex-1 rounded-none
                  sm:flex-none sm:px-10
                `}
                disabled={!isStep2Valid}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-11">
            <h2 className={`
              font-display text-2xl text-foreground
              sm:text-[26px]
            `}>
              Confirm your request
            </h2>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              This is a request, not a charge. An associate will contact you
              within one business day to confirm details and arrange payment.
              Nothing is billed until then.
            </p>

            {error && (
              <p className="mt-4 text-sm text-destructive">{error}</p>
            )}

            <div className="mt-10 flex gap-3">
              <Button
                className="h-[52px] rounded-none"
                onClick={() => setStep(2)}
                variant="outline"
              >
                Back
              </Button>
              <Button
                className={`
                  h-[52px] flex-1 rounded-none bg-krs-champagne text-xs
                  font-semibold tracking-[0.22em] text-krs-mocha uppercase
                  hover:bg-krs-champagne-light
                  sm:flex-none sm:px-10
                `}
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? "Sending…" : "Request Order"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <CheckoutOrderSummary
        deliveryCost={delivery.cost}
        items={items}
        presentationCost={presentation.cost}
        subtotal={subtotal}
      />
    </div>
  );
}

function Field({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={className}>
      <p className={`
        ${FIELD_LABEL}
        mb-2
      `}>{label}</p>
      {children}
    </div>
  );
}
