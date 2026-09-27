import Image from "next/image";
import Link from "next/link";
import { pkr } from "@/lib/format";
import type { ProductCardData } from "@/lib/catalog";

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const [a, b] = product.images;
  const inStock = product.variants.some((v) => v.stock > 0);
  const off = product.compareAtPrice && product.compareAtPrice > product.price ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-cream">
        {a && (
          <Image
            src={a.url}
            alt={a.alt ?? product.name}
            fill
            priority={priority}
            sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw"
            className="object-cover transition-all duration-[1.2s] ease-lux group-hover:scale-[1.04]"
          />
        )}
        {b && (
          <Image
            src={b.url}
            alt=""
            fill
            sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw"
            className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {!inStock && <span className="bg-ink px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-ivory">Sold out</span>}
          {inStock && off > 0 && <span className="bg-oxblood px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-ivory">-{off}%</span>}
          {inStock && product.isNew && <span className="bg-ivory px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-ink">New</span>}
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-[10.5px] uppercase tracking-[0.2em] text-stone">{product.category.name}</p>
        <h3 className="font-display text-[19px] leading-tight sm:text-xl">{product.name}</h3>
        <p className="text-sm">
          {pkr(product.price)}
          {off > 0 && <span className="ml-2 text-stone line-through">{pkr(product.compareAtPrice!)}</span>}
        </p>
      </div>
    </Link>
  );
}
