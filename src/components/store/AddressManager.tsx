"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { deleteAddress, saveAddress, setDefaultAddress } from "@/lib/actions/account";
import type { FormState } from "@/lib/actions/public";
import type { Address } from "@/generated/prisma/client";

const PROVINCES = ["Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Islamabad Capital Territory", "Gilgit-Baltistan", "Azad Kashmir"];

export function AddressManager({ addresses, defaultName, defaultPhone }: { addresses: Address[]; defaultName: string; defaultPhone: string }) {
  const [editing, setEditing] = useState<Address | "new" | null>(addresses.length ? null : "new");
  const [pending, start] = useTransition();

  return (
    <div className="mt-6 space-y-4">
      <ul className="grid gap-4 md:grid-cols-2">
        {addresses.map((a) => (
          <li key={a.id} className="flex flex-col border border-line bg-white/60 p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">{a.fullName}</p>
              {a.isDefault && <span className="bg-ink px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-ivory">Default</span>}
            </div>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
              {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
              {a.city}{a.province ? `, ${a.province}` : ""}{a.postalCode ? ` ${a.postalCode}` : ""}<br />
              {a.phone}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-widest">
              <button onClick={() => setEditing(a)} className="link-u">Edit</button>
              {!a.isDefault && (
                <button disabled={pending} onClick={() => start(() => setDefaultAddress(a.id))} className="link-u">Set default</button>
              )}
              <button
                disabled={pending}
                onClick={() => confirm("Delete this address?") && start(() => deleteAddress(a.id))}
                className="link-u text-danger"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editing ? (
        <AddressForm
          key={editing === "new" ? "new" : editing.id}
          address={editing === "new" ? null : editing}
          defaultName={defaultName}
          defaultPhone={defaultPhone}
          onDone={() => setEditing(null)}
          canCancel={addresses.length > 0}
        />
      ) : (
        <button onClick={() => setEditing("new")} className="btn-outline">
          <Plus className="size-4" /> Add address
        </button>
      )}
    </div>
  );
}

function AddressForm({
  address,
  defaultName,
  defaultPhone,
  onDone,
  canCancel,
}: {
  address: Address | null;
  defaultName: string;
  defaultPhone: string;
  onDone: () => void;
  canCancel: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveAddress, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="border border-line bg-white/60 p-5 sm:p-6">
      <p className="font-display text-xl">{address ? "Edit address" : "New address"}</p>
      {address && <input type="hidden" name="id" value={address.id} />}
      {state.error && <p role="alert" className="mt-4 border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">{state.error}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="a-name">Full name</label>
          <input id="a-name" name="fullName" defaultValue={address?.fullName ?? defaultName} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="a-phone">Mobile</label>
          <input id="a-phone" name="phone" type="tel" defaultValue={address?.phone ?? defaultPhone} placeholder="0300 1234567" required className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="a-line1">Address</label>
          <input id="a-line1" name="line1" defaultValue={address?.line1} required className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="a-line2">Apartment, landmark (optional)</label>
          <input id="a-line2" name="line2" defaultValue={address?.line2 ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="a-city">City</label>
          <input id="a-city" name="city" defaultValue={address?.city} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="a-prov">Province</label>
          <select id="a-prov" name="province" defaultValue={address?.province ?? ""} className="input">
            <option value="">Select province</option>
            {PROVINCES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="a-postal">Postal code (optional)</label>
          <input id="a-postal" name="postalCode" defaultValue={address?.postalCode ?? ""} className="input" />
        </div>
        <label className="flex items-center gap-2 self-end pb-3 text-sm">
          <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault} className="accent-ink" /> Make default
        </label>
      </div>
      <div className="mt-6 flex gap-3">
        <button disabled={pending} className="btn-primary">{pending ? "Saving…" : "Save address"}</button>
        {canCancel && <button type="button" onClick={onDone} className="btn-outline">Cancel</button>}
      </div>
    </form>
  );
}
