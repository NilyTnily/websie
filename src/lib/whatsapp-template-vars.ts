export interface TemplateVariable {
  label: string;
  sample: string;
  token: string;
}

/** Quick-insert variables offered in the template body editor. */
export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { label: "First Name", sample: "Alex", token: "first_name" },
  { label: "Last Name", sample: "Morgan", token: "last_name" },
  { label: "Full Name", sample: "Alex Morgan", token: "full_name" },
  { label: "Order Number", sample: "KRS-000123", token: "order_number" },
  { label: "Total", sample: "$1,200", token: "total" },
  { label: "Status", sample: "shipped", token: "status" },
  { label: "Tracking Link", sample: "https://track.example/abc", token: "tracking_url" },
  { label: "Product List", sample: "Submariner, Daytona", token: "product_list" },
  { label: "Link", sample: "https://example.com/new-arrivals", token: "link" },
];

export interface WhatsAppTemplateBodies {
  newArrivals: string;
  orderCancelledRefunded: string;
  orderConfirmed: string;
  orderShipped: string;
  orderStatusUpdate: string;
}

/** Used server-side as the fallback when no DB override is set, and client-side as the editor's starting text. */
export const DEFAULT_TEMPLATE_BODIES: WhatsAppTemplateBodies = {
  newArrivals: "Hi {{first_name}}, our new arrivals are here: {{product_list}}. View them here: {{link}}",
  orderCancelledRefunded:
    "Hi {{first_name}}, order {{order_number}} has been {{status}}. Contact us with questions.",
  orderConfirmed:
    "Hi {{first_name}}, we've received your order {{order_number}}. Total: {{total}}. We'll update you soon.",
  orderShipped:
    "Hi {{first_name}}, order {{order_number}} has shipped. Tracking: {{tracking_url}}.",
  orderStatusUpdate: "Hi {{first_name}}, order {{order_number}} is now {{status}}.",
};

const TOKEN_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * Scans a body's {{token}} placeholders in the order they appear and
 * returns the matching values as a positional array — this is what lines
 * up with Meta's {{1}}, {{2}}, ... slots in the approved template. Unknown
 * or missing tokens resolve to an empty string rather than throwing, since
 * a malformed body must never block sending the rest of the message.
 */
export function buildTemplateParams(
  body: string,
  values: Record<string, string>,
): string[] {
  const params: string[] = [];
  for (const match of body.matchAll(TOKEN_PATTERN)) {
    const token = match[1];
    params.push(token ? (values[token] ?? "") : "");
  }
  return params;
}

/** Renders a body with sample values for the live preview in the editor. */
export function renderTemplatePreview(body: string): string {
  const samples = Object.fromEntries(
    TEMPLATE_VARIABLES.map((variable) => [variable.token, variable.sample]),
  );
  return body.replaceAll(TOKEN_PATTERN, (_match, token: string) => samples[token] ?? `{{${token}}}`);
}
