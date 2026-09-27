import "server-only";
import { db } from "./db";
import type { Prisma, StockMoveType } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export class StockError extends Error {}

/**
 * Atomically changes a variant's stock and records the movement.
 * A negative delta fails (StockError) if it would push stock below zero.
 */
export async function moveStock(
  tx: Tx,
  args: { variantId: string; delta: number; type: StockMoveType; reason?: string; orderId?: string; userId?: string },
) {
  const { variantId, delta } = args;
  if (delta === 0) return;
  if (delta < 0) {
    const res = await tx.variant.updateMany({ where: { id: variantId, stock: { gte: -delta } }, data: { stock: { increment: delta } } });
    if (res.count !== 1) {
      const v = await tx.variant.findUnique({ where: { id: variantId }, include: { product: { select: { name: true } } } });
      throw new StockError(v ? `Only ${v.stock} left of ${v.product.name} (EU ${v.size})` : "Variant not found");
    }
  } else {
    await tx.variant.update({ where: { id: variantId }, data: { stock: { increment: delta } } });
  }
  const v = await tx.variant.findUniqueOrThrow({ where: { id: variantId }, select: { stock: true } });
  await tx.stockMovement.create({
    data: { variantId, type: args.type, quantity: delta, balance: v.stock, reason: args.reason, orderId: args.orderId, userId: args.userId },
  });
}

export async function adjustStock(args: { variantId: string; delta: number; type: StockMoveType; reason?: string; userId?: string }) {
  return db.$transaction((tx) => moveStock(tx, args));
}

export async function lowStockVariants(limit = 50) {
  const rows = await db.variant.findMany({
    where: { product: { status: { not: "ARCHIVED" } } },
    include: { product: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ stock: "asc" }],
  });
  return rows.filter((v) => v.stock <= v.lowStockThreshold).slice(0, limit);
}
