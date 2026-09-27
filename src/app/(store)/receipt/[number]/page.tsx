import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth";
import { formatDate, pkr } from "@/lib/format";
import { phonesMatch } from "@/lib/order-access";
import { site } from "@/lib/site";
import { STATUS_LABEL } from "@/lib/orders";
import { PAYMENT_LABEL } from "@/components/store/OrderSummaryList";
import { PrintButton } from "@/components/store/PrintButton";

export const metadata: Metadata = { title: "Receipt", robots: { index: false } };

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ phone?: string }>;
}) {
  const [{ number }, { phone }, session] = await Promise.all([params, searchParams, getSession()]);
  const order = await db.order.findUnique({ where: { number: decodeURIComponent(number) }, include: { items: true } });
  const allowed = order && ((session && (order.userId === session.userId || isAdminRole(session.role))) || phonesMatch(order.phone, phone));
  if (!order || !allowed) notFound();

  return (
    <div className="container-x max-w-3xl py-10 print:max-w-none print:p-0">
      {/* Hide store chrome (announcement bar, header, footer, drawers) when printing */}
      <style>{`@media print { body > *:not(main) { display: none !important; } }`}</style>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/track?order=${order.number}${phone ? `&phone=${encodeURIComponent(phone)}` : ""}`} className="link-u text-xs uppercase tracking-widest">
          ← Back to order
        </Link>
        <PrintButton />
      </div>

      <article className="border border-line bg-white p-6 sm:p-10 print:border-0">
        <header className="flex flex-col justify-between gap-6 border-b border-line pb-8 sm:flex-row">
          <div>
            <p className="font-display text-3xl tracking-[0.3em]">MONTEVRO</p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.4em] text-stone">The Leather Specialist</p>
            <p className="mt-4 text-xs leading-relaxed text-stone">
              {site.url.replace(/^https?:\/\//, "")}<br />
              {site.whatsappDisplay} · {site.email}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="eyebrow">Receipt</p>
            <p className="mt-1 font-display text-2xl">{order.number}</p>
            <p className="mt-2 text-xs text-stone">Date: {formatDate(order.createdAt)}</p>
            <p className="text-xs text-stone">Status: {STATUS_LABEL[order.status]}</p>
          </div>
        </header>

        <section className="grid gap-6 py-8 text-sm sm:grid-cols-2">
          <div>
            <p className="eyebrow">Bill to</p>
            <p className="mt-2 leading-relaxed">
              {order.customerName}<br />
              {order.addressLine1}{order.addressLine2 ? `, ${order.addressLine2}` : ""}<br />
              {order.city}{order.province ? `, ${order.province}` : ""}{order.postalCode ? ` ${order.postalCode}` : ""}<br />
              {order.phone}{order.email ? <><br />{order.email}</> : null}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="eyebrow">Payment</p>
            <p className="mt-2">{PAYMENT_LABEL[order.paymentMethod]}</p>
            <p className="text-stone">{order.paymentStatus === "PAID" ? "Paid" : order.paymentStatus === "REFUNDED" ? "Refunded" : "Unpaid"}</p>
            {order.trackingNumber && (
              <p className="mt-2 text-xs text-stone">{order.courier} #{order.trackingNumber}</p>
            )}
          </div>
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-line text-left text-[10px] uppercase tracking-[0.18em] text-stone">
              <th className="py-3 font-medium">Item</th>
              <th className="py-3 text-center font-medium">Size</th>
              <th className="py-3 text-center font-medium">Qty</th>
              <th className="hidden py-3 text-right font-medium sm:table-cell">Price</th>
              <th className="py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-b border-line">
                <td className="py-3 pr-2">{i.productName}</td>
                <td className="py-3 text-center">{i.size}</td>
                <td className="py-3 text-center">{i.quantity}</td>
                <td className="hidden py-3 text-right sm:table-cell">{pkr(i.unitPrice)}</td>
                <td className="py-3 text-right">{pkr(i.unitPrice * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto mt-6 max-w-xs space-y-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{pkr(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between"><dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>-{pkr(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt>Shipping</dt><dd>{order.shippingFee ? pkr(order.shippingFee) : "Free"}</dd></div>
          <div className="flex justify-between border-t border-ink pt-3 text-base font-medium"><dt>Total</dt><dd>{pkr(order.total)}</dd></div>
        </dl>

        <footer className="mt-12 border-t border-line pt-6 text-center text-xs text-stone">
          Thank you for choosing Montevro. Exchanges within 7 days of delivery — see {site.url.replace(/^https?:\/\//, "")}/shipping-returns
        </footer>
      </article>
    </div>
  );
}
