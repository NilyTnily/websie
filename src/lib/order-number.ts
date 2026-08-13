export function formatOrderNumber(orderNumber: number): string {
  return `KRS-${orderNumber.toString().padStart(6, "0")}`;
}
