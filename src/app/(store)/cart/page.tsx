"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { cartCount, cartSubtotal, useCart } from "@/lib/cart-store";
import { pkr } from "@/lib/format";
import { shippingFor, site } from "@/lib/site";

export default function CartPage() {
  const { items, setQty, remove } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    document.title = "Your Bag | Montevro";
  }, []);

  if (!mounted) return <div className="container-x min-h-[50vh] py-16" />;

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);

  if (items.length === 0)
    return (
      <div className="container-x flex min-h-[55vh] flex-col items-center justify-center py-20 text-center">
        <h1 className="h-display text-5xl">Your bag is empty</h1>
        <p className="mt-4 text-stone">Find a pair that's made to last.</p>
        <Link href="/shop" className="btn-primary mt-8">Shop the collection</Link>
      </div>
    );

  return (
    <div className="container-x py-12 sm:py-16">
      <h1 className="h-display text-4xl sm:text-5xl">
        Your Bag <span className="text-stone">({cartCount(items)})</span>
      </h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-line border-y border-line">
          {items.map((i) => (
            <li key={i.variantId} className="flex gap-4 py-6 sm:gap-6">
              <Link href={`/products/${i.slug}`} className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-cream sm:w-32">
                {i.image && <Image src={i.image} alt={i.name} fill sizes="128px" className="object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link href={`/products/${i.slug}`} className="font-display text-xl hover:text-cognac">{i.name}</Link>
                    <p className="mt-1 text-sm text-stone">EU {i.size} · {pkr(i.price)}</p>
                  </div>
                  <button onClick={() => remove(i.variantId)} className="self-start p-1 text-stone hover:text-ink" aria-label={`Remove ${i.name}`}>
                    <X className="size-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <div className="flex items-center border border-line bg-white/60">
                    <button className="p-2.5 disabled:opacity-30" disabled={i.quantity <= 1} onClick={() => setQty(i.variantId, i.quantity - 1)} aria-label="Decrease quantity">
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-9 text-center text-sm">{i.quantity}</span>
                    <button
                      className="p-2.5 disabled:opacity-30"
                      disabled={i.quantity >= Math.min(i.maxStock, 10)}
                      onClick={() => setQty(i.variantId, i.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <p>{pkr(i.price * i.quantity)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit bg-cream p-6 sm:p-8 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl">Order summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{pkr(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{shipping ? pkr(shipping) : "Free"}</dd>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-stone">Add {pkr(site.freeShippingThreshold - subtotal)} more for free delivery.</p>
            )}
            <div className="flex justify-between border-t border-line pt-4 text-base">
              <dt>Estimated total</dt>
              <dd>{pkr(subtotal + shipping)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-stone">Discount codes can be applied at checkout.</p>
          <Link href="/checkout" className="btn-primary mt-6 w-full">Proceed to checkout</Link>
          <Link href="/shop" className="link-u mt-4 block text-center text-xs uppercase tracking-widest">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
