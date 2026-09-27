"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { StockError } from "@/lib/inventory";
import { updateOrderStatus } from "@/lib/orders";
import { notifyStatusChange } from "@/lib/notify";
import type { FormState } from "./public";

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"] as const;

function refresh(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
}

export async function changeOrderStatus(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ orderId: z.string().min(1), status: z.enum(STATUSES), note: z.string().trim().max(500).optional(), notify: z.string().optional() })
    .safeParse({ orderId: fd.get("orderId"), status: fd.get("status"), note: fd.get("note") || undefined, notify: fd.get("notify") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const order = await updateOrderStatus({ orderId: parsed.data.orderId, status: parsed.data.status, note: parsed.data.note, userId: admin.id });
    if (parsed.data.notify) after(() => notifyStatusChange(order, parsed.data.status).catch(() => {}));
  } catch (e) {
    if (e instanceof StockError) return { error: `Can't reinstate: ${e.message}. Add stock first.` };
    throw e;
  }
  refresh(parsed.data.orderId);
  return { ok: true, message: `Status updated to ${parsed.data.status.toLowerCase()}` };
}

export async function updateShipping(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = z
    .object({ orderId: z.string().min(1), courier: z.string().trim().max(60), trackingNumber: z.string().trim().max(80) })
    .safeParse({ orderId: fd.get("orderId"), courier: fd.get("courier") ?? "", trackingNumber: fd.get("trackingNumber") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.order.update({
    where: { id: parsed.data.orderId },
    data: { courier: parsed.data.courier || null, trackingNumber: parsed.data.trackingNumber || null },
  });
  refresh(parsed.data.orderId);
  return { ok: true, message: "Shipping details saved" };
}

export async function updatePayment(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = z
    .object({ orderId: z.string().min(1), paymentStatus: z.enum(["UNPAID", "PAID", "REFUNDED"]) })
    .safeParse({ orderId: fd.get("orderId"), paymentStatus: fd.get("paymentStatus") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.order.update({ where: { id: parsed.data.orderId }, data: { paymentStatus: parsed.data.paymentStatus } });
  refresh(parsed.data.orderId);
  return { ok: true, message: "Payment status saved" };
}

export async function addOrderNote(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = z
    .object({ orderId: z.string().min(1), note: z.string().trim().min(1, "Write a note first").max(500) })
    .safeParse({ orderId: fd.get("orderId"), note: fd.get("note") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const order = await db.order.findUniqueOrThrow({ where: { id: parsed.data.orderId }, select: { status: true } });
  await db.orderStatusHistory.create({ data: { orderId: parsed.data.orderId, status: order.status, note: `📝 ${parsed.data.note}` } });
  refresh(parsed.data.orderId);
  return { ok: true, message: "Note added" };
}
