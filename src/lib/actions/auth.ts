"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, isAdminRole, verifyPassword } from "@/lib/auth";
import type { FormState } from "./public";

const safeNext = (n: FormDataEntryValue | null, fallback: string) => {
  const s = typeof n === "string" ? n : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : fallback;
};

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password" };
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: "Incorrect email or password" };
  await createSession(user);
  redirect(safeNext(fd.get("next"), isAdminRole(user.role) ? "/admin" : "/account"));
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase()),
  phone: z.string().trim().max(20).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: fd.get("name"),
    email: String(fd.get("email") ?? "").trim(),
    phone: fd.get("phone") || undefined,
    password: fd.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { error: "An account with this email already exists — sign in instead" };
  const user = await db.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone, passwordHash: await hashPassword(parsed.data.password) },
  });
  // Attach previous guest orders placed with the same email
  await db.order.updateMany({ where: { email: user.email, userId: null }, data: { userId: user.id } });
  await createSession(user);
  redirect(safeNext(fd.get("next"), "/account"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
