"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword, updateProfile } from "@/lib/actions/account";
import type { FormState } from "@/lib/actions/public";

function Status({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">{state.error}</p>;
  if (state.ok) return <p role="status" className="border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">{state.message}</p>;
  return null;
}

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  return (
    <form action={action} className="mt-5 space-y-4">
      <Status state={state} />
      <div>
        <label className="label" htmlFor="p-email">Email</label>
        <input id="p-email" value={email} disabled className="input opacity-60" />
      </div>
      <div>
        <label className="label" htmlFor="p-name">Full name</label>
        <input id="p-name" name="name" defaultValue={name} required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="p-phone">Mobile</label>
        <input id="p-phone" name="phone" type="tel" defaultValue={phone} placeholder="0300 1234567" className="input" />
      </div>
      <button disabled={pending} className="btn-primary">{pending ? "Saving…" : "Save changes"}</button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="mt-5 space-y-4">
      <Status state={state} />
      <div>
        <label className="label" htmlFor="pw-current">Current password</label>
        <input id="pw-current" name="current" type="password" autoComplete="current-password" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="pw-next">New password</label>
        <input id="pw-next" name="next" type="password" autoComplete="new-password" minLength={8} required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="pw-confirm">Confirm new password</label>
        <input id="pw-confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required className="input" />
      </div>
      <button disabled={pending} className="btn-primary">{pending ? "Updating…" : "Update password"}</button>
    </form>
  );
}
