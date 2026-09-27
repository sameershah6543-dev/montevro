"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { subscribe, type FormState } from "@/lib/actions/public";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, {});
  return (
    <form action={action} className="mt-4 max-w-sm">
      <div className="flex border-b border-ivory/40 focus-within:border-ivory">
        <input
          name="email"
          type="email"
          required
          placeholder="Email address"
          aria-label="Email address"
          className="min-w-0 flex-1 bg-transparent py-3 text-sm text-ivory outline-none placeholder:text-ivory/40"
        />
        <button disabled={pending} className="p-2 text-ivory disabled:opacity-50" aria-label="Subscribe">
          <ArrowRight className="size-4" />
        </button>
      </div>
      {state.error && <p className="mt-2 text-xs text-red-300">{state.error}</p>}
      {state.ok && <p className="mt-2 text-xs text-ivory/80">{state.message}</p>}
    </form>
  );
}
