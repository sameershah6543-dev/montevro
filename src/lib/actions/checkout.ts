"use server";

import { after } from "next/server";
import { getSession } from "@/lib/auth";
import { checkCoupon } from "@/lib/coupons";
import { notifyNewOrder } from "@/lib/notify";
import { checkoutSchema, createOrder, type CheckoutInput } from "@/lib/orders";
import { StockError } from "@/lib/inventory";

export type PlaceOrderResult =
  | { ok: true; number: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof CheckoutInput, string>> };

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof CheckoutInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof CheckoutInput;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Please check the highlighted fields", fieldErrors };
  }

  const session = await getSession();
  try {
    const order = await createOrder(parsed.data, session?.userId);
    after(() => notifyNewOrder(order));
    return { ok: true, number: order.number };
  } catch (e) {
    if (e instanceof StockError) return { ok: false, error: e.message };
    console.error("placeOrder failed", e);
    return { ok: false, error: "We couldn't place your order. Please try again or order on WhatsApp." };
  }
}

export async function applyCoupon(code: string, subtotal: number): Promise<{ ok: true; code: string; discount: number } | { ok: false; error: string }> {
  const c = String(code ?? "").trim();
  if (!c) return { ok: false, error: "Enter a code" };
  if (!Number.isFinite(subtotal) || subtotal < 0) return { ok: false, error: "Invalid bag total" };
  const res = await checkCoupon(c, Math.round(subtotal));
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, code: res.coupon.code, discount: res.discount };
}
