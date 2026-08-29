import type { whatsappMessageTable } from "./tables";

export type NewWhatsappMessage = typeof whatsappMessageTable.$inferInsert;
export type WhatsappMessage = typeof whatsappMessageTable.$inferSelect;
