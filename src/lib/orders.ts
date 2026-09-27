import "server-only";
import { z } from "zod";
import { db } from "./db";
import { moveStock, StockError } from "./inventory";
import { checkCoupon } from "./coupons";
import { shippingFor } from "./site";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/client";

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.union([z.literal(""), z.email("Enter a valid email")]).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?92|0)?3\d{2}[\s-]?\d{7}$/, "Enter a valid Pakistani mobile number, e.g. 0300 1234567"),
  addressLine1: z.string().trim().min(5, "Enter your street address").max(160),
  addressLine2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2, "Enter your city").max(60),
  province: z.string().trim().max(60).optional(),
  postalCode: z.string().trim().max(12).optional(),
  notes: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER"]),
  couponCode: z.string().trim().max(40).optional(),
  items: z
    .array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(10) }))
    .min(1, "Your bag is empty")
    .max(30),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const ACTIVE_SALE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
const VOID_STATUSES: OrderStatus[] = ["CANCELLED", "RETURNED"];

async function nextOrderNumber(tx: { $queryRaw: typeof db.$queryRaw }) {
  const rows = await tx.$queryRaw<{ value: string }[]>`
    INSERT INTO "Setting" ("key", "value") VALUES ('order_seq', '10001')
    ON CONFLICT ("key") DO UPDATE SET "value" = (("Setting"."value")::int + 1)::text
    RETURNING "value"`;
  return `MV-${rows[0].value}`;
}

/** Prices, costs and stock always come from the database, never from the client. */
export async function createOrder(input: CheckoutInput, userId?: string) {
  const merged = new Map<string, number>();
  for (const i of input.items) merged.set(i.variantId, (merged.get(i.variantId) ?? 0) + i.quantity);

  const variants = await db.variant.findMany({
    where: { id: { in: [...merged.keys()] } },
    include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
  });
  if (variants.length !== merged.size) throw new StockError("Some items in your bag are no longer available");
  for (const v of variants) if (v.product.status !== "ACTIVE") throw new StockError(`${v.product.name} is no longer available`);

  const lines = variants.map((v) => ({ v, qty: merged.get(v.id)! }));
  const subtotal = lines.reduce((s, l) => s + l.v.product.price * l.qty, 0);

  let discount = 0;
  let couponCode: string | undefined;
  if (input.couponCode) {
    const c = await checkCoupon(input.couponCode, subtotal);
    if (!c.ok) throw new StockError(c.error);
    discount = c.discount;
    couponCode = c.coupon.code;
  }
  const shippingFee = shippingFor(subtotal - discount);
  const total = subtotal - discount + shippingFee;

  const order = await db.$transaction(async (tx) => {
    const number = await nextOrderNumber(tx);
    const created = await tx.order.create({
      data: {
        number,
        userId,
        customerName: input.customerName,
        email: input.email || null,
        phone: input.phone,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 || null,
        city: input.city,
        province: input.province || null,
        postalCode: input.postalCode || null,
        notes: input.notes || null,
        subtotal,
        discount,
        shippingFee,
        total,
        couponCode,
        paymentMethod: input.paymentMethod as PaymentMethod,
        items: {
          create: lines.map(({ v, qty }) => ({
            productId: v.productId,
            variantId: v.id,
            productName: v.product.name,
            size: v.size,
            image: v.product.images[0]?.url,
            unitPrice: v.product.price,
            unitCost: v.product.costPrice,
            quantity: qty,
          })),
        },
        history: { create: { status: "PENDING", note: "Order placed" } },
      },
      include: { items: true },
    });
    for (const { v, qty } of lines) {
      await moveStock(tx, { variantId: v.id, delta: -qty, type: "SALE", orderId: created.id, reason: `Order ${number}` });
    }
    if (couponCode) {
      const res = await tx.coupon.updateMany({
        where: { code: couponCode, OR: [{ maxUses: null }, { usedCount: { lt: db.coupon.fields.maxUses } }] },
        data: { usedCount: { increment: 1 } },
      });
      if (res.count !== 1) throw new StockError("This code has been fully redeemed");
    }
    return created;
  });

  return order;
}

/**
 * Moves an order to a new status. Cancelling/returning puts stock back;
 * re-activating a cancelled order deducts it again.
 */
export async function updateOrderStatus(args: {
  orderId: string;
  status: OrderStatus;
  note?: string;
  userId?: string;
}) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: args.orderId }, include: { items: true } });
    if (order.status === args.status) return order;

    const wasVoid = VOID_STATUSES.includes(order.status);
    const isVoid = VOID_STATUSES.includes(args.status);

    if (!wasVoid && isVoid) {
      for (const i of order.items) {
        if (!i.variantId) continue;
        await moveStock(tx, {
          variantId: i.variantId,
          delta: i.quantity,
          type: args.status === "RETURNED" ? "RETURN" : "CANCEL_RESTOCK",
          orderId: order.id,
          userId: args.userId,
          reason: `Order ${order.number} ${args.status.toLowerCase()}`,
        });
      }
    } else if (wasVoid && !isVoid) {
      for (const i of order.items) {
        if (!i.variantId) continue;
        await moveStock(tx, {
          variantId: i.variantId,
          delta: -i.quantity,
          type: "SALE",
          orderId: order.id,
          userId: args.userId,
          reason: `Order ${order.number} reinstated`,
        });
      }
    }

    const paymentStatus =
      args.status === "DELIVERED" && order.paymentMethod === "COD"
        ? "PAID"
        : args.status === "RETURNED" && order.paymentStatus === "PAID"
          ? "REFUNDED"
          : order.paymentStatus;

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: args.status,
        paymentStatus,
        history: { create: { status: args.status, note: args.note || null } },
      },
      include: { items: true },
    });
  });
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const STATUS_FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
