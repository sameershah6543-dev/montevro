import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { getCategories, getColors, searchProducts, type ShopFilters as Filters } from "@/lib/catalog";
import { ProductCard } from "@/components/store/ProductCard";
import { site } from "@/lib/site";
import { pkr } from "@/lib/format";
import { ShopFilters } from "./ShopFilters";
import { buildHref, SORTS, type Params } from "./shared";

type SP = Promise<Record<string, string | string[] | undefined>>;

function clean(sp: Awaited<SP>): Params {
  const out: Params = {};
  for (const k of ["q", "category", "size", "color", "min", "max", "sort", "inStock"]) {
    const v = sp[k];
    const s = (Array.isArray(v) ? v[0] : v)?.trim();
    if (s) out[k] = s.slice(0, 80);
  }
  return out;
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const p = clean(await searchParams);
  if (p.q) return { title: `Search: ${p.q}`, robots: { index: false } };
  if (p.category) {
    const cats = await getCategories();
    const c = cats.find((x) => x.slug === p.category);
    if (c) return { title: c.name, description: c.description ?? undefined, alternates: { canonical: `/shop?category=${c.slug}` } };
  }
  return { title: "Shop All Shoes", description: "Genuine leather Chelsea boots, Oxfords and loafers, handcrafted in Pakistan.", alternates: { canonical: "/shop" } };
}

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const params = clean(await searchParams);
  const num = (v?: string) => (v && /^\d+$/.test(v) ? Number(v) : undefined);
  const filters: Filters = {
    q: params.q,
    category: params.category,
    size: params.size,
    color: params.color,
    min: num(params.min),
    max: num(params.max),
    sort: SORTS.some((s) => s.value === params.sort) ? (params.sort as Filters["sort"]) : undefined,
    inStock: params.inStock === "1",
  };

  const [products, categories, colors] = await Promise.all([searchProducts(filters), getCategories(), getColors()]);
  const category = categories.find((c) => c.slug === params.category);

  const title = params.q ? `Results for “${params.q}”` : category ? category.name : params.sort === "newest" ? "New Arrivals" : "All Shoes";
  const intro = params.q
    ? `${products.length} ${products.length === 1 ? "style matches" : "styles match"} your search.`
    : (category?.description ?? "Genuine leather footwear, handcrafted in Pakistan and made to last.");

  const chips: { label: string; patch: Params }[] = [];
  if (params.q) chips.push({ label: `“${params.q}”`, patch: { q: undefined } });
  if (category) chips.push({ label: category.name, patch: { category: undefined } });
  if (params.size) chips.push({ label: `EU ${params.size}`, patch: { size: undefined } });
  if (params.color) chips.push({ label: params.color, patch: { color: undefined } });
  if (params.min || params.max)
    chips.push({
      label: params.min && params.max ? `${pkr(+params.min)} – ${pkr(+params.max)}` : params.min ? `From ${pkr(+params.min)}` : `Up to ${pkr(+params.max!)}`,
      patch: { min: undefined, max: undefined },
    });
  if (params.inStock === "1") chips.push({ label: "In stock", patch: { inStock: undefined } });

  return (
    <div className="container-x pb-10 pt-10 sm:pt-14">
      <nav className="text-[11px] uppercase tracking-[0.18em] text-stone" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link> <span className="mx-1.5">/</span>
        <Link href="/shop" className="hover:text-ink">Shop</Link>
        {category && (
          <>
            <span className="mx-1.5">/</span> <span className="text-ink">{category.name}</span>
          </>
        )}
      </nav>
      <header className="mb-8 mt-5 max-w-2xl sm:mb-10">
        <h1 className="h-display text-4xl sm:text-6xl">{title}</h1>
        <p className="mt-3 text-ink-soft">{intro}</p>
      </header>

      <div className="grid gap-x-12 lg:grid-cols-[240px_1fr]">
        <ShopFilters
          params={params}
          categories={categories.map((c) => ({ slug: c.slug, name: c.name, count: c._count.products }))}
          colors={colors}
          sizes={site.sizes}
          total={products.length}
        />

        <section className="mt-6 min-w-0">
          {chips.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <Link key={c.label} href={buildHref(params, c.patch)} scroll={false} className="inline-flex items-center gap-1.5 border border-line bg-white/60 px-3 py-1.5 text-xs hover:border-ink">
                  {c.label} <X className="size-3" />
                </Link>
              ))}
              <Link href={params.q ? `/shop?q=${encodeURIComponent(params.q)}` : "/shop"} scroll={false} className="link-u ml-1 text-xs text-stone">
                Clear all
              </Link>
            </div>
          )}

          {products.length === 0 ? (
            <div className="border border-line bg-white/50 px-6 py-20 text-center">
              <p className="font-display text-3xl">Nothing matches — yet.</p>
              <p className="mx-auto mt-3 max-w-sm text-sm text-stone">Try removing a filter, or browse the full collection.</p>
              <Link href="/shop" className="btn-primary mt-8">View all shoes</Link>
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm text-stone lg:hidden">
                {products.length} {products.length === 1 ? "style" : "styles"}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6">
                {products.map((p, i) => (
                  <ProductCard key={p.id} product={p} priority={i < 3} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
