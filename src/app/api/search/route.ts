import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/catalog";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 60) ?? "";
  if (q.trim().length < 2) return NextResponse.json({ results: [] });
  const products = await searchProducts({ q });
  return NextResponse.json({
    results: products.slice(0, 6).map((p) => ({ slug: p.slug, name: p.name, price: p.price, image: p.images[0]?.url, category: p.category.name })),
  });
}
