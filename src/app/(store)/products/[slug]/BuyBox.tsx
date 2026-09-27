"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import { Heart, MessageCircle, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { toggleWishlist } from "@/lib/actions/wishlist";
import { pkr } from "@/lib/format";
import { whatsappLink } from "@/lib/site";

type Variant = { id: string; size: string; stock: number; lowStockThreshold: number };
type Props = {
  product: { id: string; slug: string; name: string; price: number; image?: string };
  variants: Variant[];
  initialSaved: boolean;
};

export function BuyBox({ product, variants, initialSaved }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const add = useCart((s) => s.add);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();
  const [showBar, setShowBar] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const mainBtn = useRef<HTMLButtonElement>(null);

  const selected = variants.find((v) => v.id === sizeId);
  const soldOut = variants.every((v) => v.stock <= 0);
  const maxQty = Math.min(selected?.stock ?? 10, 10);

  useEffect(() => setPageUrl(window.location.href), []);
  useEffect(() => {
    const el = mainBtn.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const addToBag = () => {
    if (!selected) {
      setError("Please select a size");
      return;
    }
    add({ variantId: selected.id, productId: product.id, slug: product.slug, name: product.name, size: selected.size, price: product.price, image: product.image, maxStock: selected.stock }, qty);
    setError(null);
  };

  const wish = () =>
    start(async () => {
      const r = await toggleWishlist(product.id);
      if (r.needsLogin) router.push(`/login?next=${encodeURIComponent(pathname)}`);
      else setSaved(!!r.saved);
    });

  const waText = `Hi Montevro, I'd like to order the ${product.name}${selected ? ` in EU ${selected.size}` : ""} (${pkr(product.price)}). ${pageUrl}`;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="label !mb-0">Select size (EU)</p>
        <Link href="/size-guide" className="link-u text-xs text-stone">Size guide</Link>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7" role="radiogroup" aria-label="Size">
        {variants.map((v) => {
          const out = v.stock <= 0;
          return (
            <button
              key={v.id}
              role="radio"
              aria-checked={sizeId === v.id}
              disabled={out}
              onClick={() => {
                setSizeId(v.id);
                setQty(1);
                setError(null);
              }}
              className={clsx(
                "relative border py-3 text-sm transition-colors",
                sizeId === v.id ? "border-ink bg-ink text-ivory" : "border-line bg-white/60 hover:border-ink",
                out && "cursor-not-allowed text-stone/60 line-through hover:border-line",
              )}
              aria-label={`EU ${v.size}${out ? ", sold out" : ""}`}
            >
              {v.size}
            </button>
          );
        })}
      </div>
      <p className="mt-3 min-h-5 text-xs" aria-live="polite">
        {error ? (
          <span className="text-danger">{error}</span>
        ) : selected && selected.stock <= selected.lowStockThreshold ? (
          <span className="text-oxblood">Only {selected.stock} left in EU {selected.size}</span>
        ) : selected ? (
          <span className="text-success">In stock — ready to ship</span>
        ) : null}
      </p>

      <div className="mt-4 flex gap-3">
        <div className="flex items-center border border-line bg-white/60">
          <button className="p-3.5 disabled:opacity-30" disabled={qty <= 1} onClick={() => setQty(qty - 1)} aria-label="Decrease quantity">
            <Minus className="size-3.5" />
          </button>
          <span className="w-8 text-center text-sm" aria-live="polite">{qty}</span>
          <button className="p-3.5 disabled:opacity-30" disabled={qty >= maxQty} onClick={() => setQty(qty + 1)} aria-label="Increase quantity">
            <Plus className="size-3.5" />
          </button>
        </div>
        <button ref={mainBtn} onClick={addToBag} disabled={soldOut} className="btn-primary flex-1">
          {soldOut ? "Sold out" : "Add to bag"}
        </button>
        <button
          onClick={wish}
          disabled={pending}
          className="grid w-[52px] shrink-0 place-items-center border border-line bg-white/60 hover:border-ink"
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={saved}
        >
          <Heart className={clsx("size-5", saved && "fill-oxblood text-oxblood")} strokeWidth={1.5} />
        </button>
      </div>

      <a href={whatsappLink(waText)} target="_blank" rel="noopener" className="btn-outline mt-3 w-full">
        <MessageCircle className="size-4" /> Order on WhatsApp
      </a>

      {/* Sticky mobile bar */}
      <div
        className={clsx(
          "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur transition-transform duration-300 lg:hidden",
          showBar ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex items-center gap-3 pr-16">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{product.name}</p>
            <p className="text-xs text-stone">{pkr(product.price)}{selected ? ` · EU ${selected.size}` : ""}</p>
          </div>
          <button
            onClick={() => (selected ? addToBag() : window.scrollTo({ top: 0, behavior: "smooth" }))}
            disabled={soldOut}
            className="btn-primary px-5 py-3"
          >
            {soldOut ? "Sold out" : selected ? "Add to bag" : "Select size"}
          </button>
        </div>
      </div>
    </div>
  );
}
