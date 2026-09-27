import "server-only";
import type { Coupon } from "@/generated/prisma/client";
import { db } from "./db";

export type CouponCheck = { ok: true; coupon: Coupon; discount: number } | { ok: false; error: string };

export function computeDiscount(coupon: Coupon, subtotal: number) {
  const raw = coupon.type === "PERCENT" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return Math.max(0, Math.min(raw, subtotal));
}

export async function checkCoupon(code: string, subtotal: number): Promise<CouponCheck> {
  const coupon = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  const now = new Date();
  if (!coupon || !coupon.active) return { ok: false, error: "This code isn't valid" };
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, error: "This code isn't active yet" };
  if (coupon.endsAt && coupon.endsAt < now) return { ok: false, error: "This code has expired" };
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return { ok: false, error: "This code has been fully redeemed" };
  if (subtotal < coupon.minSubtotal) return { ok: false, error: `Spend Rs. ${coupon.minSubtotal.toLocaleString()} or more to use this code` };
  return { ok: true, coupon, discount: computeDiscount(coupon, subtotal) };
}
