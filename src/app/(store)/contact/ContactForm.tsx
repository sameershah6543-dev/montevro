"use client";

import { useActionState } from "react";
import { sendContactMessage, type FormState } from "@/lib/actions/public";

export function ContactForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContactMessage, {});
  if (state.ok)
    return (
      <div className="border border-line bg-white/60 p-8 text-center">
        <p className="font-display text-3xl">Message sent</p>
        <p className="mt-3 text-sm text-ink-soft">{state.message}</p>
      </div>
    );
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="name" className="label">Name</label>
        <input id="name" name="name" required autoComplete="name" className="input" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" className="input" />
        </div>
        <div>
          <label htmlFor="phone" className="label">Phone / WhatsApp</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className="input" />
        </div>
      </div>
      <div>
        <label htmlFor="message" className="label">Message</label>
        <textarea id="message" name="message" required rows={5} className="input resize-y" />
      </div>
      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full sm:w-auto">{pending ? "Sending…" : "Send message"}</button>
    </form>
  );
}
