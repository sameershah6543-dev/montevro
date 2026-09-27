"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Minus, Plus, X } from "lucide-react";
import { cartCount, cartSubtotal, useCart } from "@/lib/cart-store";
import { pkr } from "@/lib/format";
import { site } from "@/lib/site";

export function CartDrawer() {
  const { items, open, setOpen, setQty, remove } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const list = mounted ? items : [];
  const subtotal = cartSubtotal(list);
  const toFree = Math.max(0, site.freeShippingThreshold - subtotal);

  return (
    <div className={clsx("fixed inset-0 z-50", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
      <div className={clsx("absolute inset-0 bg-ink/40 transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
      <aside
        role="dialog"
        aria-label="Shopping bag"
        className={clsx(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-ivory transition-transform duration-500 ease-lux",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <p className="font-display text-2xl">Your Bag {list.length > 0 && <span className="text-stone">({cartCount(list)})</span>}</p>
          <button onClick={() => setOpen(false)} className="p-2" aria-label="Close bag">
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <p className="font-display text-3xl">Your bag is empty</p>
            <p className="text-sm text-stone">Find a pair that's made to last.</p>
            <Link href="/shop" onClick={() => setOpen(false)} className="btn-primary">Shop the collection</Link>
          </div>
        ) : (
          <>
            <div className="border-b border-line px-6 py-3 text-xs text-ink-soft">
              {toFree > 0 ? <>You're {pkr(toFree)} away from <b>free delivery</b>.</> : <>You've unlocked <b>free delivery</b>.</>}
              <div className="mt-2 h-[3px] bg-sand">
                <div className="h-full bg-cognac transition-all" style={{ width: `${Math.min(100, (subtotal / site.freeShippingThreshold) * 100)}%` }} />
              </div>
            </div>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {list.map((i) => (
                <li key={i.variantId} className="flex gap-4 py-5">
                  <Link href={`/products/${i.slug}`} onClick={() => setOpen(false)} className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-cream">
                    {i.image && <Image src={i.image} alt={i.name} fill sizes="96px" className="object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <p className="text-sm leading-snug">{i.name}</p>
                      <button onClick={() => remove(i.variantId)} className="text-stone hover:text-ink" aria-label={`Remove ${i.name}`}>
                        <X className="size-4" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-stone">EU {i.size}</p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-line">
                        <button className="p-2 disabled:opacity-30" disabled={i.quantity <= 1} onClick={() => setQty(i.variantId, i.quantity - 1)} aria-label="Decrease quantity">
                          <Minus className="size-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{i.quantity}</span>
                        <button className="p-2 disabled:opacity-30" disabled={i.quantity >= Math.min(i.maxStock, 10)} onClick={() => setQty(i.variantId, i.quantity + 1)} aria-label="Increase quantity">
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <p className="text-sm">{pkr(i.price * i.quantity)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-6 py-5">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{pkr(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-stone">Shipping and discounts calculated at checkout.</p>
              <Link href="/checkout" onClick={() => setOpen(false)} className="btn-primary mt-5 w-full">Checkout</Link>
              <Link href="/cart" onClick={() => setOpen(false)} className="link-u mt-3 block text-center text-xs uppercase tracking-widest">View bag</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
