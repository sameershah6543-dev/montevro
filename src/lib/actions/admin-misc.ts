"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendTestWhatsApp } from "@/lib/notify";
import type { FormState } from "./public";

// ── Coupons ─────────────────────────────────────────────

const optDate = z.preprocess((v) => (v ? v : undefined), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional());
const optInt = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(1).optional());

const couponSchema = z
  .object({
    code: z.string().trim().min(3, "Code must be at least 3 characters").max(40).regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - and _ only").transform((s) => s.toUpperCase()),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.coerce.number().int().min(1, "Value must be above 0"),
    minSubtotal: z.coerce.number().int().min(0),
    maxUses: optInt,
    startsAt: optDate,
    endsAt: optDate,
    active: z.boolean(),
  })
  .refine((c) => c.type !== "PERCENT" || c.value <= 100, { message: "Percent discount can't exceed 100" })
  .refine((c) => !c.startsAt || !c.endsAt || c.endsAt >= c.startsAt, { message: "End date must be after start date" });

export async function saveCoupon(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const parsed = couponSchema.safeParse({
    code: fd.get("code"),
    type: fd.get("type"),
    value: fd.get("value"),
    minSubtotal: fd.get("minSubtotal") || 0,
    maxUses: fd.get("maxUses"),
    startsAt: fd.get("startsAt"),
    endsAt: fd.get("endsAt"),
    active: fd.get("active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const c = parsed.data;
  const clash = await db.coupon.findUnique({ where: { code: c.code } });
  if (clash && clash.id !== id) return { error: `Code ${c.code} already exists` };
  const data = {
    code: c.code,
    type: c.type,
    value: c.value,
    minSubtotal: c.minSubtotal,
    maxUses: c.maxUses ?? null,
    startsAt: c.startsAt ? new Date(`${c.startsAt}T00:00:00+05:00`) : null,
    endsAt: c.endsAt ? new Date(`${c.endsAt}T23:59:59+05:00`) : null,
    active: c.active,
  };
  if (id) await db.coupon.update({ where: { id }, data });
  else await db.coupon.create({ data });
  revalidatePath("/admin/coupons");
  if (id) redirect("/admin/coupons");
  return { ok: true, message: `Coupon ${c.code} created` };
}

export async function toggleCoupon(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const c = await db.coupon.findUnique({ where: { id } });
  if (c) await db.coupon.update({ where: { id }, data: { active: !c.active } });
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(fd: FormData) {
  await requireAdmin();
  await db.coupon.delete({ where: { id: String(fd.get("id") ?? "") } });
  revalidatePath("/admin/coupons");
}

// ── Messages ────────────────────────────────────────────

export async function toggleMessageHandled(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const m = await db.contactMessage.findUnique({ where: { id } });
  if (m) await db.contactMessage.update({ where: { id }, data: { handled: !m.handled } });
  revalidatePath("/admin/messages");
  revalidatePath("/admin", "layout");
}

export async function deleteSubscriber(fd: FormData) {
  await requireAdmin();
  await db.subscriber.delete({ where: { id: String(fd.get("id") ?? "") } });
  revalidatePath("/admin/messages");
}

// ── Settings ────────────────────────────────────────────

export async function testWhatsApp(_: FormState): Promise<FormState> {
  await requireAdmin();
  const r = await sendTestWhatsApp();
  revalidatePath("/admin/settings");
  if (r.ok) return { ok: true, message: "Test message sent — check WhatsApp." };
  return { error: r.skipped ? `Not configured: ${r.error}` : `Failed: ${r.error}` };
}

export async function setUserRole(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  if (admin.role !== "ADMIN") return { error: "Only admins can change roles" };
  const parsed = z.object({ userId: z.string().min(1), role: z.enum(["CUSTOMER", "STAFF", "ADMIN"]) }).safeParse({ userId: fd.get("userId"), role: fd.get("role") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.userId === admin.id && parsed.data.role !== "ADMIN") return { error: "You can't remove your own admin access" };
  await db.user.update({ where: { id: parsed.data.userId }, data: { role: parsed.data.role } });
  revalidatePath("/admin/settings");
  return { ok: true, message: "Role updated" };
}
