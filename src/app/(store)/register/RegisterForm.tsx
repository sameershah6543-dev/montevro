"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/lib/actions/auth";
import type { FormState } from "@/lib/actions/public";

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(register, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      {state.error && <p role="alert" className="border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">{state.error}</p>}
      <div>
        <label htmlFor="name" className="label">Full name</label>
        <input id="name" name="name" autoComplete="name" required className="input" />
      </div>
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <div>
        <label htmlFor="phone" className="label">Mobile <span className="normal-case tracking-normal text-stone">(optional)</span></label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="0300 1234567" className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="input" />
        <p className="mt-1 text-xs text-stone">At least 8 characters.</p>
      </div>
      <button disabled={pending} className="btn-primary w-full">{pending ? "Creating account…" : "Create account"}</button>
      <p className="text-center text-sm text-stone">
        Already have an account?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="link-u text-ink">Sign in</Link>
      </p>
    </form>
  );
}
