"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "~/lib/admin";
import {
  setNewArrival,
  setNewArrivals,
  setNewArrivalsOrder,
} from "~/lib/queries/catalog-admin";
import { broadcastNewArrivals } from "~/lib/queries/new-arrivals-notify";

export async function toggleNewArrivalAction(id: string, isNewArrival: boolean) {
  await requireAdmin();
  const result = await setNewArrival(id, isNewArrival);
  if (!result.success) return result;
  revalidateTag("products");
  revalidatePath("/admin/new-arrivals");
  return result;
}

export async function saveNewArrivalsAction(changes: { id: string; isNewArrival: boolean }[]) {
  await requireAdmin();
  const result = await setNewArrivals(changes);
  if (!result.success) return result;
  revalidateTag("products");
  revalidatePath("/admin/new-arrivals");
  return result;
}

export async function saveNewArrivalsOrderAction(orderedIds: string[]) {
  await requireAdmin();
  const result = await setNewArrivalsOrder(orderedIds);
  if (!result.success) return result;
  revalidateTag("products");
  revalidatePath("/admin/new-arrivals");
  return result;
}

export async function broadcastNewArrivalsAction(productIds: string[]) {
  await requireAdmin();
  const result = await broadcastNewArrivals(productIds);
  if (!result.success) return result;
  revalidateTag("products");
  return result;
}
