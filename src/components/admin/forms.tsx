"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import type { FormState } from "@/lib/actions/public";

export function SubmitButton({ children, className, pendingText, variant = "primary", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string; variant?: "primary" | "small" | "danger" }) {
  const { pending } = useFormStatus();
  const base =
    variant === "primary"
      ? "inline-flex items-center justify-center gap-1.5 bg-ink px-4 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-ivory transition hover:bg-oxblood disabled:opacity-50"
      : variant === "danger"
        ? "inline-flex items-center justify-center gap-1.5 border border-rose-200 bg-white px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-danger transition hover:border-danger disabled:opacity-50"
        : "inline-flex items-center justify-center gap-1.5 border border-line bg-white px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-ink transition hover:border-ink disabled:opacity-50";
  return (
    <button type="submit" disabled={pending || rest.disabled} className={clsx(base, className)} {...rest}>
      {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

/** A form bound to a server action that shows the returned error / success message inline. */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  confirm,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      {state.error && (
        <p role="alert" className="mt-3 border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p role="status" className="mt-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-success">
          {state.message}
        </p>
      )}
    </form>
  );
}

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-1.5 bg-ink px-4 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-ivory hover:bg-oxblood">
      Print / Save PDF
    </button>
  );
}

/** Submit button that asks for confirmation first (for use inside plain server-action forms). */
export function ConfirmSubmit({ message, children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { message: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
