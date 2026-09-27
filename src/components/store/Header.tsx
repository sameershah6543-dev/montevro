"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "./Logo";
import { SearchOverlay } from "./SearchOverlay";
import { cartCount, useCart } from "@/lib/cart-store";
import { site } from "@/lib/site";

export const NAV = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop?category=chelsea-boots", label: "Chelsea Boots" },
  { href: "/shop?category=oxfords", label: "Oxfords" },
  { href: "/shop?category=loafers", label: "Loafers" },
  { href: "/shop?sort=newest", label: "New Arrivals" },
  { href: "/about", label: "Our Craft" },
];

export function Header({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const items = useCart((s) => s.items);
  const setCartOpen = useCart((s) => s.setOpen);
  const count = mounted ? cartCount(items) : 0;

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  return (
    <>
      <div className="bg-ink text-ivory">
        <p className="container-x py-2 text-center text-[10.5px] uppercase tracking-[0.22em] sm:text-[11px]">
          Free delivery over Rs. {site.freeShippingThreshold.toLocaleString()} · Cash on delivery nationwide
        </p>
      </div>
      <header
        className={clsx(
          "sticky top-0 z-40 border-b transition-colors duration-300",
          scrolled ? "border-line bg-ivory/95 backdrop-blur" : "border-transparent bg-ivory",
        )}
      >
        <div className="container-x grid h-[72px] grid-cols-[1fr_auto_1fr] items-center lg:h-[84px]">
          <div className="flex items-center gap-1">
            <button className="-ml-2 p-2 lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <Menu className="size-5" strokeWidth={1.5} />
            </button>
            <button className="p-2 lg:hidden" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Search className="size-5" strokeWidth={1.5} />
            </button>
            <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
              {NAV.slice(0, 4).map((n) => (
                <Link key={n.href} href={n.href} className="text-[12px] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-ink">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <Logo />

          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <nav className="mr-4 hidden items-center gap-7 xl:flex" aria-label="Secondary">
              <Link href="/shop?sort=newest" className="text-[12px] uppercase tracking-[0.16em] text-ink-soft hover:text-ink">New</Link>
              <Link href="/about" className="text-[12px] uppercase tracking-[0.16em] text-ink-soft hover:text-ink">Our Craft</Link>
              <Link href="/contact" className="text-[12px] uppercase tracking-[0.16em] text-ink-soft hover:text-ink">Contact</Link>
            </nav>
            <button className="hidden p-2 lg:block" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Search className="size-5" strokeWidth={1.5} />
            </button>
            <Link href={signedIn ? "/account" : "/login"} className="hidden p-2 sm:block" aria-label="Account">
              <User className="size-5" strokeWidth={1.5} />
            </Link>
            <Link href="/account/wishlist" className="hidden p-2 sm:block" aria-label="Wishlist">
              <Heart className="size-5" strokeWidth={1.5} />
            </Link>
            <button className="relative -mr-2 p-2" aria-label={`Bag, ${count} items`} onClick={() => setCartOpen(true)}>
              <ShoppingBag className="size-5" strokeWidth={1.5} />
              {count > 0 && (
                <span className="absolute right-0.5 top-0.5 grid size-[17px] place-items-center rounded-full bg-oxblood text-[10px] font-medium text-ivory">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={clsx("fixed inset-0 z-50 lg:hidden", menuOpen ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!menuOpen}>
        <div className={clsx("absolute inset-0 bg-ink/40 transition-opacity", menuOpen ? "opacity-100" : "opacity-0")} onClick={() => setMenuOpen(false)} />
        <aside
          className={clsx(
            "absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-ivory transition-transform duration-500 ease-lux",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="eyebrow">Menu</span>
            <button className="p-2" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-5 py-4">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="block border-b border-line py-4 font-display text-2xl">
                {n.label}
              </Link>
            ))}
            <Link href="/contact" className="block border-b border-line py-4 font-display text-2xl">Contact</Link>
            <Link href="/track" className="block border-b border-line py-4 font-display text-2xl">Track Order</Link>
          </nav>
          <div className="grid grid-cols-2 gap-2 border-t border-line p-5">
            <Link href={signedIn ? "/account" : "/login"} className="btn-outline px-3">
              <User className="size-4" /> {signedIn ? "Account" : "Sign in"}
            </Link>
            <Link href="/account/wishlist" className="btn-outline px-3">
              <Heart className="size-4" /> Wishlist
            </Link>
          </div>
        </aside>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
