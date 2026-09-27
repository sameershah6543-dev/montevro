"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Search, X } from "lucide-react";
import { pkr } from "@/lib/format";

type Hit = { slug: string; name: string; price: number; image?: string; category: string };
const SUGGESTIONS = ["Chelsea", "Oxford", "Loafers", "Brown", "Burgundy", "Black"];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return setHits([]);
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => setHits(d.results ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    onClose();
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className={clsx("fixed inset-0 z-50", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
      <div className={clsx("absolute inset-0 bg-ink/40 transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <div className={clsx("absolute inset-x-0 top-0 bg-ivory shadow-xl transition-transform duration-500 ease-lux", open ? "translate-y-0" : "-translate-y-full")}>
        <div className="container-x py-6 sm:py-10">
          <form onSubmit={submit} className="flex items-center gap-3 border-b border-ink pb-3">
            <Search className="size-5 shrink-0 text-stone" strokeWidth={1.5} />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Chelsea boots, Oxfords, loafers…"
              className="min-w-0 flex-1 bg-transparent font-display text-2xl outline-none placeholder:text-stone/60 sm:text-4xl"
              aria-label="Search products"
            />
            <button type="button" onClick={onClose} className="p-2" aria-label="Close search">
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </form>

          {q.trim().length < 2 ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="eyebrow mr-2">Popular</span>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setQ(s)} className="border border-line px-4 py-2 text-xs uppercase tracking-widest hover:border-ink">
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              {loading && !hits.length ? (
                <p className="text-sm text-stone">Searching…</p>
              ) : hits.length === 0 ? (
                <p className="text-sm text-stone">No products match “{q}”. Try “Chelsea” or “Oxford”.</p>
              ) : (
                <>
                  <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {hits.map((h) => (
                      <li key={h.slug}>
                        <Link href={`/products/${h.slug}`} onClick={onClose} className="group block">
                          <div className="relative aspect-[4/5] overflow-hidden bg-cream">
                            {h.image && <Image src={h.image} alt={h.name} fill sizes="200px" className="object-cover transition duration-700 group-hover:scale-105" />}
                          </div>
                          <p className="mt-2 text-sm">{h.name}</p>
                          <p className="text-xs text-stone">{pkr(h.price)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <button onClick={submit} className="link-u mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest">
                    See all results <ArrowRight className="size-3.5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
