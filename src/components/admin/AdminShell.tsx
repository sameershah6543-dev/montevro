"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  BarChart3,
  Boxes,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";

type Badges = { pendingOrders: number; lowStock: number; unreadMessages: number };

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, badge: "pendingOrders" as const },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, badge: "lowStock" as const },
  { href: "/admin/expenses", label: "Expenses", icon: Wallet },
  { href: "/admin/finance", label: "Finance & Reports", icon: BarChart3 },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/messages", label: "Messages", icon: Mail, badge: "unreadMessages" as const },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function NavList({ badges, onNavigate }: { badges: Badges; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Admin">
      {NAV.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        const count = n.badge ? badges[n.badge] : 0;
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
              active ? "bg-ink text-ivory" : "text-ink-soft hover:bg-cream hover:text-ink",
            )}
          >
            <n.icon className="size-4 shrink-0" strokeWidth={1.6} aria-hidden />
            <span className="flex-1">{n.label}</span>
            {count > 0 && (
              <span className={clsx("min-w-5 rounded-full px-1.5 text-center text-[10.5px] font-medium tabular-nums", active ? "bg-ivory text-ink" : n.badge === "lowStock" ? "bg-amber-100 text-amber-900" : "bg-oxblood text-ivory")}>
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function Footer({ name }: { name: string }) {
  return (
    <div className="border-t border-line p-3">
      <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-ink-soft hover:text-ink">
        <ExternalLink className="size-4" strokeWidth={1.6} aria-hidden /> View store
      </Link>
      <form action={logout}>
        <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-ink-soft hover:text-ink">
          <LogOut className="size-4" strokeWidth={1.6} aria-hidden /> Sign out
        </button>
      </form>
      <p className="truncate px-3 pt-2 text-[11px] text-stone">Signed in as {name}</p>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-baseline gap-2">
      <span className="font-display text-xl tracking-[0.28em]">MONTEVRO</span>
      <span className="text-[10px] uppercase tracking-[0.2em] text-stone">Admin</span>
    </Link>
  );
}

export function AdminShell({ children, badges, userName }: { children: React.ReactNode; badges: Badges; userName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="admin-surface min-h-dvh bg-[#f6f5f2]">
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-line px-6">
          <Brand />
        </div>
        <NavList badges={badges} />
        <Footer name={userName} />
      </aside>

      {/* Mobile top bar */}
      <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <button onClick={() => setOpen(true)} className="-ml-2 p-2" aria-label="Open admin menu">
          <Menu className="size-5" strokeWidth={1.6} />
        </button>
        <Brand />
        <Link href="/admin/orders?status=PENDING" className="relative -mr-2 p-2" aria-label={`${badges.pendingOrders} pending orders`}>
          <ShoppingCart className="size-5" strokeWidth={1.6} />
          {badges.pendingOrders > 0 && (
            <span className="absolute right-0 top-0.5 grid size-[17px] place-items-center rounded-full bg-oxblood text-[10px] text-ivory">{badges.pendingOrders}</span>
          )}
        </Link>
      </header>

      {/* Mobile drawer */}
      <div className={clsx("no-print fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
        <div className={clsx("absolute inset-0 bg-ink/40 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <aside className={clsx("absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white transition-transform duration-300", open ? "translate-x-0" : "-translate-x-full")}>
          <div className="flex h-14 items-center justify-between border-b border-line px-5">
            <Brand />
            <button onClick={() => setOpen(false)} className="p-2" aria-label="Close menu">
              <X className="size-5" strokeWidth={1.6} />
            </button>
          </div>
          <NavList badges={badges} onNavigate={() => setOpen(false)} />
          <Footer name={userName} />
        </aside>
      </div>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:ml-60 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}

