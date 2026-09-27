"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import type { FormState } from "./public";

async function uid() {
  const s = await getSession();
  if (!s) throw new Error("Not signed in");
  return s.userId;
}

const phone = z
  .string()
  .trim()
  .regex(/^(\+?92|0)?3\d{2}[\s-]?\d{7}$/, "Enter a valid Pakistani mobile number");

const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the recipient's name").max(80),
  phone,
  line1: z.string().trim().min(5, "Enter the street address").max(160),
  line2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2, "Enter the city").max(60),
  province: z.string().trim().max(60).optional(),
  postalCode: z.string().trim().max(12).optional(),
  isDefault: z.boolean(),
});

export async function saveAddress(_: FormState, fd: FormData): Promise<FormState> {
  const userId = await uid();
  const id = String(fd.get("id") ?? "") || null;
  const parsed = addressSchema.safeParse({
    fullName: fd.get("fullName") ?? "",
    phone: fd.get("phone") ?? "",
    line1: fd.get("line1") ?? "",
    line2: fd.get("line2") || undefined,
    city: fd.get("city") ?? "",
    province: fd.get("province") || undefined,
    postalCode: fd.get("postalCode") || undefined,
    isDefault: fd.get("isDefault") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = { ...parsed.data, line2: parsed.data.line2 ?? null, province: parsed.data.province ?? null, postalCode: parsed.data.postalCode ?? null };

  await db.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId } });
    const makeDefault = data.isDefault || count === 0 || (id !== null && count === 1);
    if (makeDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    if (id) {
      const res = await tx.address.updateMany({ where: { id, userId }, data: { ...data, isDefault: makeDefault } });
      if (res.count !== 1) throw new Error("Address not found");
    } else {
      await tx.address.create({ data: { ...data, isDefault: makeDefault, userId } });
    }
  });
  revalidatePath("/account/addresses");
  return { ok: true, message: "Address saved" };
}

export async function deleteAddress(id: string) {
  const userId = await uid();
  await db.$transaction(async (tx) => {
    const a = await tx.address.findFirst({ where: { id, userId } });
    if (!a) return;
    await tx.address.delete({ where: { id: a.id } });
    if (a.isDefault) {
      const next = await tx.address.findFirst({ where: { userId } });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  revalidatePath("/account/addresses");
}

export async function setDefaultAddress(id: string) {
  const userId = await uid();
  await db.$transaction([
    db.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    db.address.updateMany({ where: { id, userId }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account/addresses");
}

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const userId = await uid();
  const parsed = z
    .object({ name: z.string().trim().min(2, "Enter your name").max(80), phone: z.union([z.literal(""), phone]) })
    .safeParse({ name: fd.get("name") ?? "", phone: String(fd.get("phone") ?? "").trim() });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.user.update({ where: { id: userId }, data: { name: parsed.data.name, phone: parsed.data.phone || null } });
  revalidatePath("/account", "layout");
  return { ok: true, message: "Profile updated" };
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const userId = await uid();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters" };
  if (next.length > 100) return { error: "New password is too long" };
  if (next !== confirm) return { error: "New passwords don't match" };
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !(await verifyPassword(current, user.passwordHash))) return { error: "Current password is incorrect" };
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(next) } });
  return { ok: true, message: "Password changed" };
}
