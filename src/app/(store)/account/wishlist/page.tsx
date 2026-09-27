import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { pkr } from "@/lib/format";
import { WishlistRemoveButton } from "@/components/store/WishlistRemoveButton";

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const items = await db.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          category: { select: { name: true } },
          variants: { select: { stock: true } },
        },
      },
    },
  });

  return (
    <div>
      <h2 className="font-display text-2xl">Wishlist</h2>
      {items.length === 0 ? (
        <div className="mt-5 border border-line bg-white/60 px-6 py-12 text-center">
          <p className="text-sm text-stone">Save the pairs you love and find them here later.</p>
          <Link href="/shop" className="btn-primary mt-6">Browse the collection</Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
          {items.map(({ product: p }) => {
            const available = p.status === "ACTIVE";
            const inStock = available && p.variants.some((v) => v.stock > 0);
            return (
              <li key={p.id} className="group relative">
                <Link href={`/products/${p.slug}`} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-cream">
                    {p.images[0] && (
                      <Image src={p.images[0].url} alt={p.name} fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
                    )}
                    {!inStock && (
                      <span className="absolute left-3 top-3 bg-ink px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-ivory">
                        {available ? "Sold out" : "Unavailable"}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[10.5px] uppercase tracking-[0.2em] text-stone">{p.category.name}</p>
                  <p className="font-display text-lg leading-tight">{p.name}</p>
                  <p className="text-sm">{pkr(p.price)}</p>
                </Link>
                <div className="absolute right-2 top-2">
                  <WishlistRemoveButton productId={p.id} />
                </div>
                {inStock && (
                  <Link href={`/products/${p.slug}`} className="btn-outline mt-3 w-full px-3 py-2.5">Choose size</Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
