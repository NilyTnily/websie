// Pure, framework-agnostic helpers for tying an inbound WhatsApp message to
// an order. No DB access here — see ~/lib/queries/whatsapp-messages for the
// side-effecting half. Keeping this pure makes it easy to unit test and to
// reuse from the webhook route.

const ORDER_NUMBER_PATTERN = /KRS-(\d{6})/i;

const MIN_MATCHABLE_PHONE_DIGITS = 7;

/** Pulls a "KRS-000123" style order number out of free text, if present. */
export function extractOrderNumber(text: string): null | number {
  const match = ORDER_NUMBER_PATTERN.exec(text);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

/**
 * Digit-stripped substring match between the webhook's sender phone and a
 * freeform `customerContact` value (not guaranteed to be canonical E.164 —
 * it may carry a leading 0 instead of a country code, spaces, dashes, etc).
 */
export function matchByPhone(
  fromPhone: string,
  customerContact: string,
): boolean {
  const fromDigits = fromPhone.replace(/\D/g, "");
  const contactDigits = customerContact.replace(/\D/g, "");
  if (
    fromDigits.length < MIN_MATCHABLE_PHONE_DIGITS ||
    contactDigits.length < MIN_MATCHABLE_PHONE_DIGITS
  ) {
    return false;
  }
  return (
    fromDigits.includes(contactDigits) || contactDigits.includes(fromDigits)
  );
}

const KNOWN_CARRIERS = [
  "DHL",
  "FedEx",
  "UPS",
  "USPS",
  "GLS",
  "Israel Post",
  "Aramex",
  "TNT",
];

const TRACKING_NEAR_KEYWORD_PATTERN =
  /(?:tracking|track)\s*(?:#|no\.?|number)?\s*[:\-]?\s*([A-Z0-9]{6,30})/i;
const STANDALONE_TOKEN_PATTERN = /\b[A-Z0-9]{8,30}\b/;

export interface TrackingCandidate {
  carrier: null | string;
  trackingNumber: null | string;
}

/**
 * Best-effort guess at a carrier + tracking number from free text. Always a
 * suggestion for the admin to confirm/edit — never treated as authoritative.
 */
export function extractTrackingCandidate(text: string): TrackingCandidate {
  const carrier =
    KNOWN_CARRIERS.find((name) =>
      text.toLowerCase().includes(name.toLowerCase()),
    ) ?? null;

  const nearKeyword = TRACKING_NEAR_KEYWORD_PATTERN.exec(text);
  if (nearKeyword) {
    return { carrier, trackingNumber: nearKeyword[1] };
  }

  const standalone = STANDALONE_TOKEN_PATTERN.exec(text);
  if (standalone && /\d/.test(standalone[0])) {
    return { carrier, trackingNumber: standalone[0] };
  }

  return { carrier, trackingNumber: null };
}
