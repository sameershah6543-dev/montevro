"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";

const PRESETS = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
  { key: "custom", label: "Custom" },
] as const;

/** Segmented Today / Week / Month / Year / Custom control, synced to ?range=&from=&to= */
export function DateRangeFilter({ current, from, to }: { current: string; from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [showCustom, setShowCustom] = useState(current === "custom");
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);

  const go = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) (v === null ? sp.delete(k) : sp.set(k, v));
    sp.delete("page");
    router.push(`${pathname}?${sp.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex border border-line bg-white p-0.5" role="group" aria-label="Date range">
        {PRESETS.map((p) => {
          const active = p.key === "custom" ? showCustom : !showCustom && current === p.key;
          return (
            <button
              key={p.key}
              type="button"
              aria-pressed={active}
              onClick={() => {
                if (p.key === "custom") return setShowCustom(true);
                setShowCustom(false);
                go({ range: p.key, from: null, to: null });
              }}
              className={clsx("px-3 py-1.5 text-xs font-medium transition-colors sm:px-3.5", active ? "bg-ink text-ivory" : "text-ink-soft hover:text-ink")}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      {showCustom && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (f && t) go({ range: "custom", from: f, to: t });
          }}
        >
          <input type="date" value={f} max={t || undefined} onChange={(e) => setF(e.target.value)} className="border border-line bg-white px-2 py-1.5 text-xs" aria-label="From date" required />
          <span className="text-xs text-stone">to</span>
          <input type="date" value={t} min={f || undefined} onChange={(e) => setT(e.target.value)} className="border border-line bg-white px-2 py-1.5 text-xs" aria-label="To date" required />
          <button className="bg-ink px-3 py-1.5 text-xs font-medium text-ivory">Apply</button>
        </form>
      )}
    </div>
  );
}
