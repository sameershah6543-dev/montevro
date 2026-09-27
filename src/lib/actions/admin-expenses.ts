"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { storeFile } from "@/lib/storage";
import type { FormState } from "./public";

const expenseSchema = z.object({
  amount: z.coerce.number().int("Whole rupees only").min(1, "Amount must be above 0").max(100_000_000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  categoryId: z.string().min(1, "Choose a category"),
  description: z.string().trim().min(2, "Add a short description").max(200),
  vendor: z.string().trim().max(100).optional(),
});

/** Store expense dates at midday Pakistan time so they never slip into the neighbouring day. */
const pkNoon = (d: string) => new Date(`${d}T12:00:00+05:00`);

function refresh() {
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
}

async function receipt(fd: FormData) {
  const f = fd.get("receipt");
  return f instanceof File && f.size > 0 ? storeFile(f, "receipts") : undefined;
}

function parse(fd: FormData) {
  return expenseSchema.safeParse({
    amount: fd.get("amount"),
    date: fd.get("date"),
    categoryId: fd.get("categoryId"),
    description: fd.get("description"),
    vendor: fd.get("vendor") || undefined,
  });
}

export async function createExpense(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = parse(fd);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  let receiptUrl: string | undefined;
  try {
    receiptUrl = await receipt(fd);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Receipt upload failed" };
  }
  const { date, vendor, ...rest } = parsed.data;
  await db.expense.create({ data: { ...rest, vendor: vendor || null, date: pkNoon(date), receiptUrl, userId: admin.id } });
  refresh();
  return { ok: true, message: "Expense added" };
}

export async function updateExpense(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const parsed = parse(fd);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  let receiptUrl: string | undefined;
  try {
    receiptUrl = await receipt(fd);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Receipt upload failed" };
  }
  const { date, vendor, ...rest } = parsed.data;
  await db.expense.update({
    where: { id },
    data: { ...rest, vendor: vendor || null, date: pkNoon(date), ...(receiptUrl ? { receiptUrl } : fd.get("removeReceipt") === "on" ? { receiptUrl: null } : {}) },
  });
  refresh();
  redirect("/admin/expenses");
}

export async function deleteExpense(fd: FormData) {
  await requireAdmin();
  await db.expense.delete({ where: { id: String(fd.get("id") ?? "") } });
  refresh();
}

const categorySchema = z.object({
  name: z.string().trim().min(2, "Category name is required").max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function saveExpenseCategory(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const parsed = categorySchema.safeParse({ name: fd.get("name"), color: fd.get("color") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const clash = await db.expenseCategory.findUnique({ where: { name: parsed.data.name } });
  if (clash && clash.id !== id) return { error: "A category with that name already exists" };
  if (id) await db.expenseCategory.update({ where: { id }, data: parsed.data });
  else await db.expenseCategory.create({ data: parsed.data });
  refresh();
  return { ok: true, message: id ? "Category updated" : "Category added" };
}

export async function deleteExpenseCategory(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const used = await db.expense.count({ where: { categoryId: id } });
  if (used) return { error: `This category has ${used} expense${used > 1 ? "s" : ""}. Move or delete them first.` };
  await db.expenseCategory.delete({ where: { id } });
  refresh();
  return { ok: true, message: "Category deleted" };
}
