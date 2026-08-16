export interface DeliveryMethodOption {
  cost: number;
  description: string;
  label: string;
  value: "collect" | "courier" | "hand_delivery";
}

export const DELIVERY_METHODS: DeliveryMethodOption[] = [
  {
    cost: 0,
    description:
      "Arrives within 3–5 business days · fully insured to declared value · tracked to the door",
    label: "Insured courier — signature required",
    value: "courier",
  },
  {
    cost: 180,
    description: "Within Greater London · fitting and strap sizing on arrival",
    label: "Hand delivery by a KRS associate",
    value: "hand_delivery",
  },
  {
    cost: 0,
    description: "Ready today · appointment held for 7 days",
    label: "Collect from the salon",
    value: "collect",
  },
];

export interface PresentationOptionConfig {
  cost: number;
  description: string;
  label: string;
  value: "engraving" | "gift" | "house_case";
}

export const PRESENTATION_OPTIONS: PresentationOptionConfig[] = [
  {
    cost: 0,
    description: "Mocha lacquer, ivory silk lining",
    label: "House case",
    value: "house_case",
  },
  {
    cost: 40,
    description: "Ribbon, envelope, handwritten note",
    label: "Gift presentation",
    value: "gift",
  },
  {
    cost: 120,
    description: "Caseback, up to 20 characters",
    label: "Engraving",
    value: "engraving",
  },
];

export const ENGRAVING_MAX_LENGTH = 20;
