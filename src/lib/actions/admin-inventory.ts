"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { adjustStock, StockError } from "@/lib/inventory";
import { db } from "@/lib/db";
import type { FormState } from "./public";

const schema = z.object({
  variantId: z.string().min(1),
  mode: z.enum(["in", "out", "set"]),
  quantity: z.coerce.number().int().min(0).max(9999),
  reason: z.string().trim().max(200).optional(),
});

export async function adjustInventory(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse({ variantId: fd.get("variantId"), mode: fd.get("mode"), quantity: fd.get("quantity"), reason: fd.get("reason") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { variantId, mode, quantity, reason } = parsed.data;
  const v = await db.variant.findUnique({ where: { id: variantId } });
  if (!v) return { error: "Size not found" };

  const delta = mode === "in" ? quantity : mode === "out" ? -quantity : quantity - v.stock;
  if (delta === 0) return { error: mode === "set" ? "Stock is already at that level" : "Enter a quantity above 0" };
  if (mode === "set" && !reason) return { error: "Give a reason for the adjustment (e.g. stock count)" };
  try {
    await adjustStock({
      variantId,
      delta,
      type: mode === "in" ? "STOCK_IN" : mode === "out" ? "STOCK_OUT" : "ADJUSTMENT",
      reason: reason || (mode === "in" ? "Stock received" : "Stock removed"),
      userId: admin.id,
    });
  } catch (e) {
    if (e instanceof StockError) return { error: e.message };
    throw e;
  }
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/history");
  revalidatePath("/admin");
  const after = v.stock + delta;
  return { ok: true, message: `EU ${v.size}: ${v.stock} → ${after} pairs` };
}
