"use server";

import { z } from "zod";
import { db } from "@/lib/db";

export type FormState = { ok?: boolean; error?: string; message?: string };

export async function subscribe(_: FormState, fd: FormData): Promise<FormState> {
  const email = z.email().safeParse(String(fd.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: "Enter a valid email address" };
  await db.subscriber.upsert({ where: { email: email.data }, update: {}, create: { email: email.data } });
  return { ok: true, message: "You're on the list." };
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.union([z.literal(""), z.email("Enter a valid email")]),
  phone: z.string().trim().max(20),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(2000),
});

export async function sendContactMessage(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse({
    name: fd.get("name") ?? "",
    email: fd.get("email") ?? "",
    phone: fd.get("phone") ?? "",
    message: fd.get("message") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!parsed.data.email && !parsed.data.phone) return { error: "Add an email or phone number so we can reply" };
  await db.contactMessage.create({ data: { ...parsed.data, email: parsed.data.email || null, phone: parsed.data.phone || null } });
  return { ok: true, message: "Thank you — we'll get back to you within a day." };
}
