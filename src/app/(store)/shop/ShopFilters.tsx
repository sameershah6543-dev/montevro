"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import clsx from "clsx";
import { SlidersHorizontal, X } from "lucide-react";

import { buildHref, PRICE_BANDS, SORTS, type Params, type Props } from "./shared";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line py-6 first:pt-0">
      <p className="label !mb-4">{title}</p>
      {children}
    </div>
  );
}

function FilterBody({ params, categories, colors, sizes, go }: Omit<Props, "total"> & { go: (patch: Params) => void }) {
  return (
    <>
      <Section title="Category">
        <ul className="space-y-2.5 text-sm">
          <li>
            <button onClick={() => go({ category: undefined })} className={clsx("hover:text-ink", !params.category ? "text-ink underline underline-offset-4" : "text-ink-soft")}>
              All shoes
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <button
                onClick={() => go({ category: params.category === c.slug ? undefined : c.slug })}
                className={clsx("hover:text-ink", params.category === c.slug ? "text-ink underline underline-offset-4" : "text-ink-soft")}
              >
                {c.name} <span className="text-stone">({c.count})</span>
              </button>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Size (EU)">
        <div className="grid grid-cols-4 gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => go({ size: params.size === s ? undefined : s })}
              className={clsx("border py-2 text-sm transition-colors", params.size === s ? "border-ink bg-ink text-ivory" : "border-line hover:border-ink")}
              aria-pressed={params.size === s}
            >
              {s}
            </button>
          ))}
        </div>
      </Section>
      {colors.length > 0 && (
        <Section title="Colour">
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => go({ color: params.color === c ? undefined : c })}
                className={clsx("border px-3 py-1.5 text-xs transition-colors", params.color === c ? "border-ink bg-ink text-ivory" : "border-line hover:border-ink")}
                aria-pressed={params.color === c}
              >
                {c}
              </button>
            ))}
          </div>
        </Section>
      )}
      <Section title="Price">
        <ul className="space-y-2.5 text-sm">
          {PRICE_BANDS.map((b) => {
            const active = params.min === b.min && params.max === b.max;
            return (
              <li key={b.label}>
                <button
                  onClick={() => go(active ? { min: undefined, max: undefined } : { min: b.min, max: b.max })}
                  className={clsx("hover:text-ink", active ? "text-ink underline underline-offset-4" : "text-ink-soft")}
                >
                  {b.label}
                </button>
              </li>
            );
          })}
        </ul>
      </Section>
      <Section title="Availability">
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" className="size-4 accent-ink" checked={params.inStock === "1"} onChange={(e) => go({ inStock: e.target.checked ? "1" : undefined })} />
          In stock only
        </label>
      </Section>
    </>
  );
}

export function ShopFilters(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const go = (patch: Params) => start(() => router.push(buildHref(props.params, patch), { scroll: false }));

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 border-y border-line py-3 lg:col-span-2">
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] lg:hidden">
          <SlidersHorizontal className="size-4" strokeWidth={1.5} /> Filter
        </button>
        <p className={clsx("hidden text-sm text-stone lg:block", pending && "opacity-50")}>
          {props.total} {props.total === 1 ? "style" : "styles"}
        </p>
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.16em]">
          <span className="hidden sm:inline text-stone">Sort</span>
          <select
            value={props.params.sort ?? "featured"}
            onChange={(e) => go({ sort: e.target.value === "featured" ? undefined : e.target.value })}
            className="border-none bg-transparent py-1 text-xs uppercase tracking-[0.12em] outline-none"
            aria-label="Sort products"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Desktop sidebar */}
      <aside className={clsx("hidden lg:block", pending && "opacity-60")} aria-label="Filters">
        <div className="sticky top-28">
          <FilterBody {...props} go={go} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <div className={clsx("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
        <div className={clsx("absolute inset-0 bg-ink/40 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <div
          role="dialog"
          aria-label="Filters"
          className={clsx(
            "absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-ivory transition-transform duration-500 ease-lux",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="eyebrow">Filter</span>
            <button className="p-2" onClick={() => setOpen(false)} aria-label="Close filters">
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <FilterBody {...props} go={go} />
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-line p-5">
            <button className="btn-outline px-3" onClick={() => go({ category: undefined, size: undefined, color: undefined, min: undefined, max: undefined, inStock: undefined })}>
              Clear
            </button>
            <button className="btn-primary px-3" onClick={() => setOpen(false)}>
              Show {props.total}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
