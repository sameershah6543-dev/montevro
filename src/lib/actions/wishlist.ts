"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** Returns { needsLogin: true } for guests so the client can redirect to /login. */
export async function toggleWishlist(productId: string): Promise<{ needsLogin?: boolean; saved?: boolean }> {
  const s = await getSession();
  if (!s) return { needsLogin: true };
  const key = { userId_productId: { userId: s.userId, productId } };
  const existing = await db.wishlistItem.findUnique({ where: key });
  if (existing) await db.wishlistItem.delete({ where: key });
  else await db.wishlistItem.create({ data: { userId: s.userId, productId } });
  revalidatePath("/account/wishlist");
  return { saved: !existing };
}

export async function isWishlisted(productId: string) {
  const s = await getSession();
  if (!s) return false;
  return !!(await db.wishlistItem.findUnique({ where: { userId_productId: { userId: s.userId, productId } } }));
}
