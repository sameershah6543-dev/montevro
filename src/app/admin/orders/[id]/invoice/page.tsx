import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/admin/forms";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, pkr } from "@/lib/format";
import { site } from "@/lib/site";
import { STATUS_LABEL } from "@/lib/orders";

export const metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href={`/admin/orders/${order.id}`} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-stone hover:text-ink">
          <ArrowLeft className="size-3.5" /> Back to order
        </Link>
        <PrintButton />
      </div>

      <article className="border border-line bg-white p-6 text-ink sm:p-10 print:border-0 print:p-0">
        <header className="flex flex-col gap-6 border-b border-ink pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-3xl tracking-[0.3em]">MONTEVRO</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.4em] text-stone">{site.tagline}</p>
            <p className="mt-4 text-xs leading-relaxed text-ink-soft">
              WhatsApp {site.whatsappDisplay}
              <br />
              {site.email}
              <br />
              {site.url.replace(/^https?:\/\//, "")}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone">{order.paymentStatus === "PAID" ? "Receipt" : "Invoice"}</p>
            <p className="mt-1 text-2xl font-medium">{order.number}</p>
            <p className="mt-2 text-xs text-ink-soft">Date: {formatDate(order.createdAt, { dateStyle: "long" })}</p>
            <p className="text-xs text-ink-soft">Status: {STATUS_LABEL[order.status]}</p>
            <p className="text-xs text-ink-soft">
              Payment: {order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentMethod.replace("_", " ").toLowerCase()} ({order.paymentStatus.toLowerCase()})
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 py-6 text-sm sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-stone">Bill & ship to</p>
            <p className="font-medium">{order.customerName}</p>
            <p>{order.addressLine1}</p>
            {order.addressLine2 && <p>{order.addressLine2}</p>}
            <p>{[order.city, order.province, order.postalCode].filter(Boolean).join(", ")}</p>
            <p className="mt-1">{order.phone}</p>
            {order.email && <p>{order.email}</p>}
          </div>
          {(order.courier || order.trackingNumber) && (
            <div className="sm:text-right">
              <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-stone">Shipment</p>
              {order.courier && <p>{order.courier}</p>}
              {order.trackingNumber && <p>Tracking # {order.trackingNumber}</p>}
            </div>
          )}
        </section>

        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-y border-line text-left text-[11px] uppercase tracking-[0.16em] text-stone">
                <th className="py-2 pr-2 font-medium">Item</th>
                <th className="px-2 py-2 font-medium">Size</th>
                <th className="px-2 py-2 text-right font-medium">Qty</th>
                <th className="px-2 py-2 text-right font-medium">Price</th>
                <th className="py-2 pl-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {order.items.map((i) => (
                <tr key={i.id}>
                  <td className="py-2.5 pr-2">{i.productName}</td>
                  <td className="px-2 py-2.5">EU {i.size}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{i.quantity}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{pkr(i.unitPrice)}</td>
                  <td className="py-2.5 pl-2 text-right tabular-nums">{pkr(i.unitPrice * i.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd className="tabular-nums">{pkr(order.subtotal)}</dd></div>
          {order.discount > 0 && (
            <div className="flex justify-between"><dt className="text-stone">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd className="tabular-nums">−{pkr(order.discount)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-stone">Shipping</dt><dd className="tabular-nums">{order.shippingFee ? pkr(order.shippingFee) : "Free"}</dd></div>
          <div className="flex justify-between border-t border-ink pt-2 text-base font-medium"><dt>Total</dt><dd className="tabular-nums">{pkr(order.total)}</dd></div>
        </dl>

        <footer className="mt-10 border-t border-line pt-4 text-center text-xs text-stone">
          Thank you for choosing Montevro. Exchanges within 7 days of delivery — see {site.url.replace(/^https?:\/\//, "")}/shipping-returns.
          <br />
          Printed {formatDateTime(new Date())}
        </footer>
      </article>
    </div>
  );
}
