import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { whatsappLink } from "@/lib/site";
import { pkr } from "@/lib/format";
import { OrderSummaryList, PAYMENT_LABEL } from "@/components/store/OrderSummaryList";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

const TWO_HOURS = 2 * 60 * 60 * 1000;

export default async function OrderSuccessPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const [order, session] = await Promise.all([
    db.order.findUnique({ where: { number: decodeURIComponent(number) }, include: { items: true } }),
    getSession(),
  ]);
  if (!order) notFound();

  const canSeeDetails = (session && order.userId === session.userId) || Date.now() - order.createdAt.getTime() < TWO_HOURS;
  const wa = whatsappLink(`Hi Montevro, I just placed order ${order.number}.`);

  return (
    <div className="container-x max-w-3xl py-14 lg:py-20">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-cognac" strokeWidth={1.2} />
        <p className="eyebrow mt-6">Order {order.number}</p>
        <h1 className="h-display mt-3 text-4xl sm:text-5xl">Thank you{canSeeDetails ? `, ${order.customerName.split(" ")[0]}` : ""}.</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
          Your order has been received. We'll confirm it with you on WhatsApp or by phone shortly.
        </p>
      </div>

      {canSeeDetails && (
        <div className="mt-12 grid gap-8 md:grid-cols-[1fr_260px]">
          <div className="border border-line bg-white/60 p-6">
            <h2 className="font-display text-2xl">Your order</h2>
            <OrderSummaryList order={order} />
          </div>
          <div className="space-y-6 text-sm">
            <div>
              <p className="eyebrow">Delivering to</p>
              <p className="mt-2 leading-relaxed">
                {order.customerName}<br />
                {order.addressLine1}{order.addressLine2 ? <>, {order.addressLine2}</> : null}<br />
                {order.city}{order.province ? `, ${order.province}` : ""}<br />
                {order.phone}
              </p>
            </div>
            <div>
              <p className="eyebrow">Payment</p>
              <p className="mt-2">{PAYMENT_LABEL[order.paymentMethod]}</p>
              {order.paymentMethod === "BANK_TRANSFER" && (
                <p className="mt-1 text-xs text-stone">We'll WhatsApp you our bank details. Please send {pkr(order.total)} and share the receipt.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 border-t border-line pt-10">
        <h2 className="font-display text-2xl">What happens next</h2>
        <ol className="mt-5 grid gap-5 text-sm sm:grid-cols-3">
          {[
            ["1", "Confirmation", "We call or WhatsApp you to confirm size and address."],
            ["2", "Dispatch", "Your pair is packed and handed to the courier within 1–2 working days."],
            ["3", "Delivery", "Delivered in 2–5 working days. Pay on delivery if you chose COD."],
          ].map(([n, t, d]) => (
            <li key={n} className="border border-line p-5">
              <p className="font-display text-3xl text-cognac">{n}</p>
              <p className="mt-2 font-medium">{t}</p>
              <p className="mt-1 text-stone">{d}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a href={wa} target="_blank" rel="noopener" className="btn-primary">
          <MessageCircle className="size-4" /> Message us on WhatsApp
        </a>
        <Link href={`/track?order=${order.number}`} className="btn-outline">Track order</Link>
        {canSeeDetails && (
          <Link href={`/receipt/${order.number}?phone=${encodeURIComponent(order.phone)}`} className="btn-outline">View receipt</Link>
        )}
      </div>
      <p className="mt-8 text-center">
        <Link href="/shop" className="link-u text-xs uppercase tracking-widest">Continue shopping</Link>
      </p>
    </div>
  );
}
