"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import type { FormState } from "@/lib/actions/public";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      {state.error && <p role="alert" className="border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">{state.error}</p>}
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <button disabled={pending} className="btn-primary w-full">{pending ? "Signing in…" : "Sign in"}</button>
      <p className="text-center text-sm text-stone">
        New to Montevro?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="link-u text-ink">Create an account</Link>
      </p>
      <p className="text-center text-xs text-stone">
        Forgot your password? <Link href="/contact" className="link-u">Contact us</Link> and we'll reset it.
      </p>
    </form>
  );
}
