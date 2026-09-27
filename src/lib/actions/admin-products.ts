"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { moveStock, StockError } from "@/lib/inventory";
import { storeFile } from "@/lib/storage";
import { slugify } from "@/lib/format";
import type { FormState } from "./public";

const int = (min = 0) => z.coerce.number().int().min(min);
const optInt = z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.coerce.number().int().min(0).optional());

const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: z.string().trim().max(120).optional(),
  tagline: z.string().trim().max(160).optional(),
  description: z.string().trim().min(10, "Add a description (10+ characters)").max(5000),
  details: z.string().max(4000).optional(),
  categoryId: z.string().min(1, "Choose a category"),
  color: z.string().trim().max(40).optional(),
  material: z.string().trim().max(80).optional(),
  price: int(1),
  compareAtPrice: optInt,
  costPrice: int(0),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  featured: z.boolean(),
  isNew: z.boolean(),
  tags: z.string().max(500).optional(),
});

function parseProduct(fd: FormData) {
  return productSchema.safeParse({
    name: fd.get("name"),
    slug: fd.get("slug") || undefined,
    tagline: fd.get("tagline") || undefined,
    description: fd.get("description"),
    details: fd.get("details") || undefined,
    categoryId: fd.get("categoryId"),
    color: fd.get("color") || undefined,
    material: fd.get("material") || undefined,
    price: fd.get("price"),
    compareAtPrice: fd.get("compareAtPrice"),
    costPrice: fd.get("costPrice") || 0,
    status: fd.get("status"),
    featured: fd.get("featured") === "on",
    isNew: fd.get("isNew") === "on",
    tags: fd.get("tags") || undefined,
  });
}

function productData(p: z.infer<typeof productSchema>) {
  return {
    name: p.name,
    slug: slugify(p.slug || p.name),
    tagline: p.tagline || null,
    description: p.description,
    details: (p.details ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    categoryId: p.categoryId,
    color: p.color || null,
    material: p.material || null,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    costPrice: p.costPrice,
    status: p.status,
    featured: p.featured,
    isNew: p.isNew,
    tags: (p.tags ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
  };
}

function refresh(id?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  if (id) revalidatePath(`/admin/products/${id}`);
  revalidatePath("/", "layout");
}

async function slugTaken(slug: string, exceptId?: string) {
  const p = await db.product.findUnique({ where: { slug }, select: { id: true } });
  return !!p && p.id !== exceptId;
}

export async function createProduct(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = parseProduct(fd);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = productData(parsed.data);
  if (!data.slug) return { error: "Slug can't be empty" };
  if (await slugTaken(data.slug)) return { error: `The URL slug “${data.slug}” is already used by another product` };
  const sizes = fd.getAll("sizes").map(String).filter((s) => /^\d{2}(\.5)?$/.test(s));
  const initial = Math.max(0, Math.min(999, Number(fd.get("initialStock")) || 0));

  const product = await db.$transaction(async (tx) => {
    const created = await tx.product.create({ data });
    const count = await tx.product.count();
    for (const size of sizes) {
      const v = await tx.variant.create({ data: { productId: created.id, size, sku: `MV-${String(count).padStart(2, "0")}-${size}-${created.id.slice(-4).toUpperCase()}`, stock: 0 } });
      if (initial > 0) await moveStock(tx, { variantId: v.id, delta: initial, type: "STOCK_IN", reason: "Opening stock", userId: admin.id });
    }
    return created;
  });
  refresh(product.id);
  redirect(`/admin/products/${product.id}?created=1`);
}

export async function updateProduct(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const parsed = parseProduct(fd);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = productData(parsed.data);
  if (await slugTaken(data.slug, id)) return { error: `The URL slug “${data.slug}” is already used by another product` };
  await db.product.update({ where: { id }, data });
  refresh(id);
  return { ok: true, message: "Product saved" };
}

export async function deleteProduct(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const orders = await db.orderItem.count({ where: { productId: id } });
  if (orders > 0) {
    await db.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    refresh(id);
    return { ok: true, message: "This product has orders, so it was archived (hidden from the store) instead of deleted." };
  }
  await db.product.delete({ where: { id } });
  refresh();
  redirect("/admin/products");
}

// ── Images ──────────────────────────────────────────────

export async function addImages(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const productId = String(fd.get("productId") ?? "");
  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const url = String(fd.get("url") ?? "").trim();
  const isModel = fd.get("isModel") === "on";
  if (!files.length && !url) return { error: "Choose image files or paste an image URL" };
  if (url && !/^(https:\/\/|\/)/.test(url)) return { error: "Image URL must start with https:// or /" };

  const product = await db.product.findUniqueOrThrow({ where: { id: productId }, select: { name: true, _count: { select: { images: true } } } });
  let order = product._count.images;
  const urls: string[] = [];
  try {
    for (const f of files) urls.push(await storeFile(f, "products"));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed" };
  }
  if (url) urls.push(url);
  await db.productImage.createMany({ data: urls.map((u) => ({ productId, url: u, alt: product.name, isModel, sortOrder: order++ })) });
  refresh(productId);
  return { ok: true, message: `${urls.length} image${urls.length > 1 ? "s" : ""} added` };
}

export async function imageAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("imageId") ?? "");
  const op = String(fd.get("op") ?? "");
  const img = await db.productImage.findUnique({ where: { id } });
  if (!img) return;
  if (op === "delete") {
    await db.productImage.delete({ where: { id } });
  } else if (op === "model") {
    await db.productImage.update({ where: { id }, data: { isModel: !img.isModel } });
  } else if (op === "up" || op === "down") {
    const all = await db.productImage.findMany({ where: { productId: img.productId }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
    const idx = all.findIndex((i) => i.id === id);
    const swap = op === "up" ? idx - 1 : idx + 1;
    if (swap >= 0 && swap < all.length) {
      [all[idx], all[swap]] = [all[swap], all[idx]];
      await db.$transaction(all.map((im, i) => db.productImage.update({ where: { id: im.id }, data: { sortOrder: i } })));
    }
  }
  refresh(img.productId);
}

// ── Variants / sizes ────────────────────────────────────

export async function addVariant(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ productId: z.string().min(1), size: z.string().trim().regex(/^\d{2}(\.5)?$/, "Size must be an EU size like 42"), stock: int(0), sku: z.string().trim().max(40).optional() })
    .safeParse({ productId: fd.get("productId"), size: fd.get("size"), stock: fd.get("stock") || 0, sku: fd.get("sku") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { productId, size, stock } = parsed.data;
  if (await db.variant.findUnique({ where: { productId_size: { productId, size } } })) return { error: `Size ${size} already exists` };
  const sku = parsed.data.sku || `MV-${productId.slice(-5).toUpperCase()}-${size}`;
  if (await db.variant.findUnique({ where: { sku } })) return { error: `SKU ${sku} is already in use` };
  await db.$transaction(async (tx) => {
    const v = await tx.variant.create({ data: { productId, size, sku, stock: 0 } });
    if (stock > 0) await moveStock(tx, { variantId: v.id, delta: stock, type: "STOCK_IN", reason: "Opening stock", userId: admin.id });
  });
  refresh(productId);
  return { ok: true, message: `Size ${size} added` };
}

export async function saveVariants(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const productId = String(fd.get("productId") ?? "");
  const variants = await db.variant.findMany({ where: { productId } });
  try {
    await db.$transaction(async (tx) => {
      for (const v of variants) {
        const stock = Number(fd.get(`stock_${v.id}`));
        const threshold = Number(fd.get(`threshold_${v.id}`));
        const sku = String(fd.get(`sku_${v.id}`) ?? v.sku).trim() || v.sku;
        if (!Number.isInteger(stock) || stock < 0) throw new StockError(`Stock for EU ${v.size} must be a whole number ≥ 0`);
        if (sku !== v.sku) {
          const clash = await tx.variant.findUnique({ where: { sku } });
          if (clash) throw new StockError(`SKU ${sku} is already in use`);
        }
        await tx.variant.update({ where: { id: v.id }, data: { sku, lowStockThreshold: Number.isInteger(threshold) && threshold >= 0 ? threshold : v.lowStockThreshold } });
        if (stock !== v.stock) await moveStock(tx, { variantId: v.id, delta: stock - v.stock, type: "ADJUSTMENT", reason: "Edited on product page", userId: admin.id });
      }
    });
  } catch (e) {
    if (e instanceof StockError) return { error: e.message };
    throw e;
  }
  refresh(productId);
  return { ok: true, message: "Sizes & stock saved" };
}

export async function deleteVariant(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("variantId") ?? "");
  const v = await db.variant.findUnique({ where: { id } });
  if (!v) return;
  await db.variant.delete({ where: { id } });
  refresh(v.productId);
}
