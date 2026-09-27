import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Banknote, MessageCircle, RefreshCw, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { productCardInclude } from "@/lib/catalog";
import { ProductCard } from "@/components/store/ProductCard";
import { site, whatsappLink } from "@/lib/site";

export const revalidate = 300;

const SERVICES = [
  { icon: Banknote, title: "Cash on delivery", text: "Pay at your door, anywhere in Pakistan." },
  { icon: Truck, title: "Free delivery", text: `On orders over Rs. ${site.freeShippingThreshold.toLocaleString()}.` },
  { icon: RefreshCw, title: "7-day exchanges", text: "Unworn pairs, exchanged for a better fit." },
  { icon: MessageCircle, title: "WhatsApp support", text: "Real people, quick answers on sizing." },
];

const PILLARS = [
  { n: "01", title: "Full-grain leather", text: "We work with genuine cow leather — the strongest, most characterful cut of the hide — so every pair ages into its own patina." },
  { n: "02", title: "Handcrafted", text: "Each pair is lasted, stitched and finished by hand by skilled Pakistani craftsmen, one detail at a time." },
  { n: "03", title: "Made to last", text: "Stacked heels, durable soles and honest construction. Shoes built to be worn hard, cared for, and kept for years." },
];

const REVIEWS = [
  { quote: "The leather quality is excellent and the fit was spot on. Delivered quickly with cash on delivery.", name: "Customer, Lahore" },
  { quote: "Wore my Chelsea boots to a wedding and got compliments all night. Comfortable from day one.", name: "Customer, Islamabad" },
  { quote: "Helpful on WhatsApp with sizing and the shoes look even better in person.", name: "Customer, Karachi" },
];

export default async function HomePage() {
  const [categories, featured, newArrivals, modelShots] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.findMany({ where: { status: "ACTIVE", featured: true }, include: productCardInclude, orderBy: { createdAt: "asc" }, take: 8 }),
    db.product.findMany({ where: { status: "ACTIVE", isNew: true }, include: productCardInclude, orderBy: { createdAt: "desc" }, take: 4 }),
    db.productImage.findMany({
      where: { product: { status: "ACTIVE" } },
      orderBy: [{ isModel: "desc" }, { sortOrder: "asc" }],
      include: { product: { select: { slug: true, name: true } } },
      take: 12,
    }),
  ]);

  // Editorial band: model (on-foot) photos first, topped up with product shots — never a broken slot.
  const seen = new Set<string>();
  const editorial = modelShots.filter((i) => (i.isModel || !seen.has(i.productId)) && !seen.has(i.url) && seen.add(i.productId) && seen.add(i.url)).slice(0, 4);
  const lead = modelShots.find((i) => i.isModel) ?? modelShots[0];

  return (
    <>
      {/* Hero */}
      <section className="relative h-[calc(100svh-110px)] min-h-[520px] overflow-hidden bg-ink lg:h-[calc(100svh-120px)]">
        <Image
          src="/products/burgundy-italian-chelsea-2.jpg"
          alt="Montevro burgundy Italian Chelsea boots"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
        <div className="container-x relative flex h-full flex-col justify-end pb-14 sm:pb-20">
          <p className="eyebrow !text-ivory/80">Handcrafted in Pakistan</p>
          <h1 className="h-display mt-4 max-w-3xl text-5xl text-ivory sm:text-6xl lg:text-8xl">
            Made for the man <em className="font-normal">who notices.</em>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ivory/80 sm:text-base">
            Genuine leather Chelsea boots, Oxfords and loafers — considered down to the last stitch.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-light">Shop the collection</Link>
            <Link href="/shop?category=chelsea-boots" className="btn border border-ivory/60 text-ivory hover:bg-ivory hover:text-ink">
              Chelsea boots
            </Link>
          </div>
        </div>
      </section>

      {/* Service strip */}
      <section className="border-b border-line bg-cream">
        <div className="container-x grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-4">
          {SERVICES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col items-start gap-3 sm:flex-row">
              <Icon className="size-5 shrink-0 text-cognac" strokeWidth={1.5} />
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.16em]">{title}</p>
                <p className="mt-1 text-sm text-stone">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-x py-20 lg:py-28">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">The collection</p>
            <h2 className="h-display mt-3 text-4xl sm:text-5xl">Shop by style</h2>
          </div>
          <Link href="/shop" className="link-u hidden text-xs uppercase tracking-widest sm:block">View all</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {categories.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-cream sm:aspect-[3/4]">
              {c.image && (
                <Image src={c.image} alt={c.name} fill sizes="(min-width:640px) 33vw, 100vw" className="object-cover transition duration-[1.2s] ease-lux group-hover:scale-105" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
                <h3 className="font-display text-3xl">{c.name}</h3>
                <span className="mt-2 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-ivory/85">
                  Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container-x pb-20 lg:pb-28">
          <div className="mb-10 text-center">
            <p className="eyebrow">Signature pairs</p>
            <h2 className="h-display mt-3 text-4xl sm:text-5xl">Our bestsellers</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {featured.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 2} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/shop" className="btn-outline">Shop all shoes</Link>
          </div>
        </section>
      )}

      {/* Lifestyle split */}
      {lead && (
        <section className="bg-cream">
          <div className="grid lg:grid-cols-2">
            <div className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[720px]">
              <Image src={lead.url} alt={lead.alt ?? lead.product.name} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="flex items-center px-6 py-16 sm:px-12 lg:px-20">
              <div className="max-w-md">
                <p className="eyebrow">Worn by you</p>
                <h2 className="h-display mt-4 text-4xl sm:text-5xl">Dressed up, dressed down, always considered.</h2>
                <p className="mt-6 leading-relaxed text-ink-soft">
                  From a crisp shalwar kameez to tailored trousers and denim, our boots and shoes are cut to work with everything you already own —
                  and to look better every time you wear them.
                </p>
                <Link href={`/products/${lead.product.slug}`} className="btn-primary mt-8">
                  Shop the {lead.product.name}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Editorial band (model photos from DB: ProductImage.isModel = true, topped up with product shots) */}
      {editorial.length >= 2 && (
        <section className="container-x py-20 lg:py-28">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">The Montevro man</p>
              <h2 className="h-display mt-3 text-4xl sm:text-5xl">In the details</h2>
            </div>
            <a href={site.instagram} target="_blank" rel="noopener" className="link-u hidden text-xs uppercase tracking-widest sm:block">
              @montevro
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {editorial.map((im) => (
              <Link key={im.id} href={`/products/${im.product.slug}`} className="group relative block aspect-[3/4] overflow-hidden bg-cream">
                <Image src={im.url} alt={im.alt ?? im.product.name} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover transition duration-[1.2s] ease-lux group-hover:scale-105" />
                <span className="absolute bottom-3 left-3 bg-ivory/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] opacity-0 transition-opacity group-hover:opacity-100">
                  {im.product.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="border-t border-line">
          <div className="container-x py-20 lg:py-28">
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <p className="eyebrow">Just landed</p>
                <h2 className="h-display mt-3 text-4xl sm:text-5xl">New arrivals</h2>
              </div>
              <Link href="/shop?sort=newest" className="link-u text-xs uppercase tracking-widest">View all</Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Craftsmanship */}
      <section className="bg-ink text-ivory">
        <div className="container-x py-20 lg:py-28">
          <div className="max-w-2xl">
            <p className="eyebrow !text-ivory/60">Our craft</p>
            <h2 className="h-display mt-4 text-4xl sm:text-5xl">Quality you can feel before you see it.</h2>
          </div>
          <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
            {PILLARS.map((p) => (
              <div key={p.n} className="border-t border-ivory/20 pt-6">
                <p className="font-display text-xl text-cognac">{p.n}</p>
                <h3 className="mt-3 font-display text-2xl">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ivory/70">{p.text}</p>
              </div>
            ))}
          </div>
          <Link href="/about" className="btn mt-14 border border-ivory/50 text-ivory hover:bg-ivory hover:text-ink">
            Discover our craft
          </Link>
        </div>
      </section>

      {/* Reviews */}
      <section className="container-x py-20 lg:py-28">
        <div className="mb-12 text-center">
          <p className="eyebrow">Customer reviews</p>
          <h2 className="h-display mt-3 text-4xl sm:text-5xl">Words from our customers</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <figure key={r.name} className="border border-line bg-white/60 p-8">
              <p className="text-cognac" aria-label="5 out of 5 stars">★★★★★</p>
              <blockquote className="mt-4 font-display text-xl leading-snug">“{r.quote}”</blockquote>
              <figcaption className="mt-5 text-[11px] uppercase tracking-[0.2em] text-stone">{r.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="container-x">
        <div className="grid items-center gap-8 bg-cream px-6 py-14 sm:px-12 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="h-display text-3xl sm:text-4xl">Not sure about your size?</h2>
            <p className="mt-3 max-w-xl text-ink-soft">Message us on WhatsApp — we'll help you find the right fit and confirm your order in minutes.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={whatsappLink("Hi Montevro, I need help choosing a size.")} target="_blank" rel="noopener" className="btn-primary">
              <MessageCircle className="size-4" /> Chat on WhatsApp
            </a>
            <a href={site.instagram} target="_blank" rel="noopener" className="btn-outline">Instagram</a>
          </div>
        </div>
      </section>
    </>
  );
}
