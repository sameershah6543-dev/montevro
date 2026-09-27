"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import clsx from "clsx";
import { ChevronDown, Lock, Tag, X } from "lucide-react";
import { applyCoupon, placeOrder } from "@/lib/actions/checkout";
import { cartCount, cartSubtotal, useCart } from "@/lib/cart-store";
import { pkr } from "@/lib/format";
import { shippingFor } from "@/lib/site";
import type { CheckoutInput } from "@/lib/orders";

export type CheckoutPrefill = Partial<Record<"customerName" | "email" | "phone" | "addressLine1" | "addressLine2" | "city" | "province" | "postalCode", string>>;

const CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
  "Hyderabad", "Abbottabad", "Bahawalpur", "Sargodha", "Sukkur", "Mardan", "Gujrat", "Sahiwal", "Rahim Yar Khan", "Mirpur",
];
const PROVINCES = ["Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Islamabad Capital Territory", "Gilgit-Baltistan", "Azad Kashmir"];

type Field = keyof CheckoutInput;

export function CheckoutForm({ prefill, signedIn }: { prefill: CheckoutPrefill; signedIn: boolean }) {
  const router = useRouter();
  const { items, clear } = useCart();
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [couponPending, startCoupon] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [payment, setPayment] = useState<"COD" | "BANK_TRANSFER">("COD");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [placed, setPlaced] = useState(false);

  useEffect(() => setMounted(true), []);

  const list = mounted ? items : [];
  const subtotal = cartSubtotal(list);
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const shipping = shippingFor(subtotal - discount);
  const total = subtotal - discount + shipping;

  // Re-validate coupon when the bag changes (percent discounts depend on subtotal)
  useEffect(() => {
    if (!coupon || !mounted) return;
    applyCoupon(coupon.code, subtotal).then((r) => {
      if (r.ok) setCoupon({ code: r.code, discount: r.discount });
      else {
        setCoupon(null);
        setCouponError(r.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const onApply = () => {
    setCouponError(null);
    startCoupon(async () => {
      const r = await applyCoupon(couponInput, subtotal);
      if (r.ok) {
        setCoupon({ code: r.code, discount: r.discount });
        setCouponInput("");
      } else setCouponError(r.error);
    });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    const input = {
      customerName: get("customerName"),
      email: get("email"),
      phone: get("phone"),
      addressLine1: get("addressLine1"),
      addressLine2: get("addressLine2") || undefined,
      city: get("city"),
      province: get("province") || undefined,
      postalCode: get("postalCode") || undefined,
      notes: get("notes") || undefined,
      paymentMethod: payment,
      couponCode: coupon?.code,
      items: list.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    };
    startTransition(async () => {
      const r = await placeOrder(input);
      if (r.ok) {
        setPlaced(true);
        clear();
        router.push(`/order/${r.number}/success`);
      } else {
        setError(r.error);
        setFieldErrors(r.fieldErrors ?? {});
        const first = r.fieldErrors && Object.keys(r.fieldErrors)[0];
        if (first) document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
        else window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  if (mounted && list.length === 0 && !placed) {
    return (
      <div className="mt-12 border border-line bg-white/60 px-6 py-16 text-center">
        <p className="font-display text-3xl">Your bag is empty</p>
        <p className="mt-2 text-sm text-stone">Add a pair to your bag to check out.</p>
        <Link href="/shop" className="btn-primary mt-8">Shop the collection</Link>
      </div>
    );
  }

  const summary = (
    <div>
      <ul className="divide-y divide-line">
        {list.map((i) => (
          <li key={i.variantId} className="flex gap-4 py-4">
            <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-cream">
              {i.image && <Image src={i.image} alt={i.name} fill sizes="64px" className="object-cover" />}
              <span className="absolute -right-0 -top-0 grid size-5 place-items-center bg-ink text-[10px] text-ivory">{i.quantity}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">{i.name}</p>
              <p className="mt-0.5 text-xs text-stone">EU {i.size} · Qty {i.quantity}</p>
            </div>
            <p className="text-sm">{pkr(i.price * i.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="border-t border-line pt-4">
        {coupon ? (
          <div className="flex items-center justify-between bg-cream px-3 py-2 text-sm">
            <span className="inline-flex items-center gap-2"><Tag className="size-3.5" /> {coupon.code}</span>
            <button type="button" onClick={() => setCoupon(null)} className="text-stone hover:text-ink" aria-label="Remove code">
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onApply();
                  }
                }}
                placeholder="Discount code"
                aria-label="Discount code"
                className="input"
              />
              <button type="button" onClick={onApply} disabled={couponPending || !couponInput.trim()} className="btn-outline px-5">
                {couponPending ? "…" : "Apply"}
              </button>
            </div>
            {couponError && <p className="mt-2 text-xs text-danger">{couponError}</p>}
          </div>
        )}
      </div>

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{pkr(subtotal)}</dd></div>
        {discount > 0 && <div className="flex justify-between text-success"><dt>Discount</dt><dd>-{pkr(discount)}</dd></div>}
        <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping ? pkr(shipping) : "Free"}</dd></div>
        <div className="flex justify-between border-t border-line pt-3 text-base font-medium"><dt>Total</dt><dd>{pkr(total)}</dd></div>
      </dl>
    </div>
  );

  const err = (k: Field) => fieldErrors[k] && <p className="mt-1 text-xs text-danger">{fieldErrors[k]}</p>;
  const cls = (k: Field) => clsx("input", fieldErrors[k] && "!border-danger");

  return (
    <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[1fr_420px] lg:gap-16">
      {/* Mobile summary toggle */}
      <div className="border border-line bg-white/60 lg:hidden">
        <button type="button" onClick={() => setSummaryOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-4 text-sm" aria-expanded={summaryOpen}>
          <span className="inline-flex items-center gap-2">
            {summaryOpen ? "Hide" : "Show"} order summary ({cartCount(list)})
            <ChevronDown className={clsx("size-4 transition-transform", summaryOpen && "rotate-180")} />
          </span>
          <span className="font-medium">{pkr(total)}</span>
        </button>
        {summaryOpen && <div className="border-t border-line px-4 pb-4">{summary}</div>}
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-10">
        {error && <div role="alert" className="border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}

        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Contact</h2>
            {!signedIn && (
              <Link href="/login?next=/checkout" className="link-u text-xs">Have an account? Sign in</Link>
            )}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="customerName">Full name</label>
              <input id="customerName" name="customerName" autoComplete="name" defaultValue={prefill.customerName} className={cls("customerName")} required />
              {err("customerName")}
            </div>
            <div>
              <label className="label" htmlFor="phone">Mobile number</label>
              <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0300 1234567" defaultValue={prefill.phone} className={cls("phone")} required />
              {err("phone")}
            </div>
            <div>
              <label className="label" htmlFor="email">Email <span className="normal-case tracking-normal text-stone">(optional, for receipt)</span></label>
              <input id="email" name="email" type="email" autoComplete="email" defaultValue={prefill.email} className={cls("email")} />
              {err("email")}
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl">Delivery address</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="addressLine1">Address</label>
              <input id="addressLine1" name="addressLine1" autoComplete="address-line1" placeholder="House, street, area" defaultValue={prefill.addressLine1} className={cls("addressLine1")} required />
              {err("addressLine1")}
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="addressLine2">Apartment, landmark <span className="normal-case tracking-normal text-stone">(optional)</span></label>
              <input id="addressLine2" name="addressLine2" autoComplete="address-line2" defaultValue={prefill.addressLine2} className={cls("addressLine2")} />
            </div>
            <div>
              <label className="label" htmlFor="city">City</label>
              <input id="city" name="city" list="pk-cities" autoComplete="address-level2" defaultValue={prefill.city} className={cls("city")} required />
              <datalist id="pk-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
              {err("city")}
            </div>
            <div>
              <label className="label" htmlFor="province">Province</label>
              <select id="province" name="province" defaultValue={prefill.province ?? ""} className={cls("province")}>
                <option value="">Select province</option>
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="postalCode">Postal code <span className="normal-case tracking-normal text-stone">(optional)</span></label>
              <input id="postalCode" name="postalCode" inputMode="numeric" autoComplete="postal-code" defaultValue={prefill.postalCode} className={cls("postalCode")} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="notes">Order notes <span className="normal-case tracking-normal text-stone">(optional)</span></label>
              <textarea id="notes" name="notes" rows={3} placeholder="Delivery instructions, preferred time…" className={cls("notes")} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl">Payment</h2>
          <div className="mt-5 divide-y divide-line border border-line bg-white/60">
            {([
              ["COD", "Cash on delivery", "Pay in cash when your order arrives."],
              ["BANK_TRANSFER", "Bank transfer", "We'll WhatsApp you our account details after you place the order. Your order ships once payment is received."],
            ] as const).map(([value, title, help]) => (
              <label key={value} className="flex cursor-pointer gap-4 px-4 py-4">
                <input type="radio" name="paymentMethod" value={value} checked={payment === value} onChange={() => setPayment(value)} className="mt-1 accent-ink" />
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  {(payment === value || value === "COD") && <span className="mt-1 block text-xs leading-relaxed text-stone">{help}</span>}
                </span>
              </label>
            ))}
          </div>
        </section>

        <div>
          <button type="submit" disabled={pending || list.length === 0} className="btn-primary w-full py-4">
            <Lock className="size-3.5" /> {pending ? "Placing order…" : `Place order · ${pkr(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-stone">
            By placing your order you agree to our <Link href="/terms" className="link-u">terms</Link> and <Link href="/shipping-returns" className="link-u">returns policy</Link>.
          </p>
        </div>
      </form>

      <aside className="hidden lg:block">
        <div className="sticky top-28 border border-line bg-white/60 p-6">
          <h2 className="font-display text-2xl">Order summary</h2>
          <div className="mt-2">{summary}</div>
        </div>
      </aside>
    </div>
  );
}
