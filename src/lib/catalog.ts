import "server-only";
import { db } from "./db";
import type { Prisma } from "@/generated/prisma/client";

export const productCardInclude = {
  images: { orderBy: { sortOrder: "asc" }, take: 2 },
  category: { select: { name: true, slug: true } },
  variants: { select: { id: true, size: true, stock: true }, orderBy: { size: "asc" } },
} satisfies Prisma.ProductInclude;

export type ProductCardData = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

export type ShopFilters = {
  q?: string;
  category?: string;
  size?: string;
  color?: string;
  min?: number;
  max?: number;
  sort?: "featured" | "newest" | "price-asc" | "price-desc";
  inStock?: boolean;
};

export async function searchProducts(f: ShopFilters) {
  const q = f.q?.trim();
  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(f.category ? { category: { slug: f.category } } : {}),
    ...(f.color ? { color: { equals: f.color, mode: "insensitive" } } : {}),
    ...(f.min || f.max ? { price: { ...(f.min ? { gte: f.min } : {}), ...(f.max ? { lte: f.max } : {}) } } : {}),
    ...(f.size || f.inStock ? { variants: { some: { ...(f.size ? { size: f.size } : {}), stock: { gt: 0 } } } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { color: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
            { tags: { hasSome: q.toLowerCase().split(/\s+/) } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    f.sort === "price-asc"
      ? [{ price: "asc" }]
      : f.sort === "price-desc"
        ? [{ price: "desc" }]
        : f.sort === "newest"
          ? [{ createdAt: "desc" }]
          : [{ featured: "desc" }, { isNew: "desc" }, { createdAt: "asc" }];
  return db.product.findMany({ where, orderBy, include: productCardInclude });
}

export async function getProductBySlug(slug: string) {
  return db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
      variants: { orderBy: { size: "asc" } },
    },
  });
}

export async function getCategories() {
  return db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } } });
}

export async function getColors() {
  const rows = await db.product.findMany({ where: { status: "ACTIVE", color: { not: null } }, select: { color: true }, distinct: ["color"] });
  return rows.map((r) => r.color!).sort();
}
