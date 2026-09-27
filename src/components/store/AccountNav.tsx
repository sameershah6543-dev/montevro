"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { logout } from "@/lib/actions/auth";

const TABS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile" },
];

export function AccountNav() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/account" ? pathname === href : pathname.startsWith(href));
  return (
    <nav aria-label="Account" className="-mx-4 relative overflow-x-auto border-b border-line px-4 lg:mx-0 lg:overflow-visible lg:border-0 lg:px-0">
      <ul className="flex gap-6 whitespace-nowrap lg:flex-col lg:gap-0">
        {TABS.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              aria-current={active(t.href) ? "page" : undefined}
              className={clsx(
                "block border-b-2 py-3 text-[12px] uppercase tracking-[0.16em] transition-colors lg:border-b lg:border-line lg:py-4",
                active(t.href) ? "border-ink text-ink lg:border-line lg:font-medium" : "border-transparent text-stone hover:text-ink lg:border-line",
              )}
            >
              {t.label}
            </Link>
          </li>
        ))}
        <li>
          <form action={logout}>
            <button className="block py-3 text-[12px] uppercase tracking-[0.16em] text-stone hover:text-oxblood lg:py-4">Sign out</button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
