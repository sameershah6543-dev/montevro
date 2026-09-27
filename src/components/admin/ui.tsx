import Link from "next/link";
import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { OrderStatus } from "@/generated/prisma/client";
import { pct } from "@/lib/format";

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-medium leading-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-stone">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, action, children, className, bodyClassName }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={clsx("min-w-0 border border-line bg-white", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          {title && <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft">{title}</h2>}
          {action}
        </header>
      )}
      <div className={clsx("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** growth: percent change; invert=true when "up is bad" (e.g. expenses). */
export function StatTile({ label, value, growth, invert, sub }: { label: string; value: string; growth?: number | null; invert?: boolean; sub?: React.ReactNode }) {
  const g = growth ?? null;
  const good = g === null || g === 0 ? null : invert ? g < 0 : g > 0;
  const Icon = g === null || g === 0 ? Minus : g > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="min-w-0 border border-line bg-white p-4 sm:p-5">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-stone">{label}</p>
      <p className="mt-2 truncate text-2xl font-medium tabular-nums text-ink sm:text-[28px]">{value}</p>
      {growth !== undefined && (
        <p
          className={clsx(
            "mt-1.5 inline-flex items-center gap-1 text-xs tabular-nums",
            good === null ? "text-stone" : good ? "text-success" : "text-danger",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          <span>{g === null ? "New" : pct(g)}</span>
          <span className="text-stone">vs prev.</span>
        </p>
      )}
      {sub && <p className="mt-1 text-xs text-stone">{sub}</p>}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="font-display text-xl">{title}</p>
      {children && <div className="mt-2 text-sm text-stone">{children}</div>}
    </div>
  );
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  CONFIRMED: "bg-sky-50 text-sky-800 ring-sky-200",
  PROCESSING: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  SHIPPED: "bg-violet-50 text-violet-800 ring-violet-200",
  DELIVERED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  CANCELLED: "bg-stone-100 text-stone-600 ring-stone-200",
  RETURNED: "bg-rose-50 text-rose-800 ring-rose-200",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={clsx("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset", STATUS_STYLE[status])}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function Pill({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "bad"; children: React.ReactNode }) {
  const cls = {
    neutral: "bg-stone-100 text-stone-700 ring-stone-200",
    good: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-800 ring-rose-200",
  }[tone];
  return <span className={clsx("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset", cls)}>{children}</span>;
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={clsx("block min-w-0", className)}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone">{hint}</span>}
    </label>
  );
}

/** Horizontally scrollable table wrapper (use inside a Card with p-0 body) so wide tables never cause page-level scroll. */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="relative overflow-x-auto">{children}</div>;
}

export const th = "whitespace-nowrap px-4 py-2.5 text-left text-[10.5px] font-medium uppercase tracking-[0.14em] text-stone sm:px-5";
export const td = "whitespace-nowrap px-4 py-3 text-sm sm:px-5";

export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
      <span className="text-stone">
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? <Link className="border border-line bg-white px-3 py-1.5 hover:border-ink" href={hrefFor(page - 1)}>Previous</Link> : null}
        {page < pages ? <Link className="border border-line bg-white px-3 py-1.5 hover:border-ink" href={hrefFor(page + 1)}>Next</Link> : null}
      </div>
    </nav>
  );
}

export const smallBtn = "inline-flex items-center justify-center gap-1.5 border border-line bg-white px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-ink transition hover:border-ink disabled:opacity-50";
export const primaryBtn = "inline-flex items-center justify-center gap-1.5 bg-ink px-4 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-ivory transition hover:bg-oxblood disabled:opacity-50";
export const adminInput = "w-full border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-ink";
