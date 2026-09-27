"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Print / Save PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-outline no-print px-5 py-2.5">
      <Printer className="size-4" /> {label}
    </button>
  );
}
