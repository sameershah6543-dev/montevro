import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { db } from "@/lib/db";
import { getProductBySlug, productCardInclude } from "@/lib/catalog";
import { isWishlisted } from "@/lib/actions/wishlist";
import { ProductCard } from "@/components/store/ProductCard";
import { pkr } from "@/lib/format";
import { site } from "@/lib/site";
import { Gallery } from "./Gallery";
import { BuyBox } from "./BuyBox";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Not found" };
  const description = `${p.tagline ?? p.name} — ${pkr(p.price)}. ${p.description}`.slice(0, 160);
  return {
    title: p.name,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title: p.name, description, images: p.images.slice(0, 1).map((i) => i.url) },
  };
}

function Accordion({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="group border-b border-line" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[12px] font-medium uppercase tracking-[0.18em] [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" strokeWidth={1.5} />
      </summary>
      <div className="pb-6 text-sm leading-relaxed text-ink-soft">{children}</div>
    </details>
  );
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, saved] = await Promise.all([
    db.product.findMany({
      where: { status: "ACTIVE", categoryId: product.categoryId, id: { not: product.id } },
      include: productCardInclude,
      orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
      take: 4,
    }),
    isWishlisted(product.id),
  ]);

  const inStock = product.variants.some((v) => v.stock > 0);
  const off = product.compareAtPrice && product.compareAtPrice > product.price ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => new URL(i.url, site.url).toString()),
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: site.name },
    color: product.color ?? undefined,
    material: product.material ?? undefined,
    category: product.category.name,
    offers: {
      "@type": "Offer",
      url: `${site.url}/products/${product.slug}`,
      priceCurrency: "PKR",
      price: product.price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-x pb-10 pt-6 sm:pt-10">
        <nav className="mb-6 text-[11px] uppercase tracking-[0.18em] text-stone" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/shop?category=${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <div className="-mx-4 sm:mx-0 lg:sticky lg:top-28 lg:self-start">
            <Gallery images={product.images} name={product.name} />
          </div>

          <div className="min-w-0">
            <p className="eyebrow">{product.category.name}</p>
            <h1 className="h-display mt-3 text-4xl sm:text-5xl">{product.name}</h1>
            {product.tagline && <p className="mt-2 text-ink-soft">{product.tagline}</p>}
            <p className="mt-5 text-xl">
              {pkr(product.price)}
              {off > 0 && (
                <>
                  <span className="ml-3 text-base text-stone line-through">{pkr(product.compareAtPrice!)}</span>
                  <span className="ml-3 bg-oxblood px-2 py-0.5 align-middle text-[10px] uppercase tracking-[0.18em] text-ivory">-{off}%</span>
                </>
              )}
            </p>
            {product.color && (
              <p className="mt-2 text-sm text-stone">
                Colour: <span className="text-ink">{product.color}</span>
              </p>
            )}

            <div className="mt-8">
              <BuyBox
                product={{ id: product.id, slug: product.slug, name: product.name, price: product.price, image: product.images[0]?.url }}
                variants={product.variants.map((v) => ({ id: v.id, size: v.size, stock: v.stock, lowStockThreshold: v.lowStockThreshold }))}
                initialSaved={saved}
              />
            </div>

            <ul className="mt-8 grid grid-cols-3 gap-2 border-y border-line py-5 text-center text-[11px] uppercase tracking-[0.14em] text-ink-soft">
              <li>Cash on delivery</li>
              <li>7-day exchange</li>
              <li>{`Free over Rs. ${(site.freeShippingThreshold / 1000).toFixed(0)}k`}</li>
            </ul>

            <div className="mt-2">
              <Accordion title="Description" open>
                <p>{product.description}</p>
              </Accordion>
              {product.details.length > 0 && (
                <Accordion title="Details & materials">
                  <ul className="list-disc space-y-1.5 pl-5">
                    {product.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                    {product.material && !product.details.some((d) => d.includes(product.material!)) && <li>{product.material}</li>}
                  </ul>
                </Accordion>
              )}
              <Accordion title="Size & fit">
                <p>
                  Available in EU {product.variants[0]?.size}–{product.variants[product.variants.length - 1]?.size}. Our shoes fit true to size; if you're
                  between sizes, we recommend sizing up. See the{" "}
                  <Link href="/size-guide" className="link-u text-ink">size guide</Link> or message us on WhatsApp for advice.
                </p>
              </Accordion>
              <Accordion title="Delivery & exchanges">
                <p>
                  Delivered in 3–5 working days across Pakistan. Free delivery on orders over {pkr(site.freeShippingThreshold)}, otherwise{" "}
                  {pkr(site.shippingFee)}. Unworn pairs can be exchanged within 7 days of delivery.{" "}
                  <Link href="/shipping-returns" className="link-u text-ink">Read more</Link>.
                </p>
              </Accordion>
              <Accordion title="Care">
                <p>Wipe clean with a soft dry cloth, condition the leather every few weeks, and use shoe trees to keep the shape. Let them rest a day between wears.</p>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-x border-t border-line pt-16 lg:pt-24">
          <div className="mb-10 flex items-end justify-between gap-6">
            <h2 className="h-display text-3xl sm:text-4xl">You may also like</h2>
            <Link href={`/shop?category=${product.category.slug}`} className="link-u text-xs uppercase tracking-widest">View all</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
