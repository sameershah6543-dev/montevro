import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { normaliseOrderNumber, phonesMatch } from "@/lib/order-access";
import { OrderTimeline } from "@/components/store/OrderTimeline";
import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { OrderSummaryList } from "@/components/store/OrderSummaryList";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Track your order", description: "Check the status of your Montevro order." };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ order?: string; phone?: string }> }) {
  const sp = await searchParams;
  const orderQ = sp.order?.slice(0, 30) ?? "";
  const phoneQ = sp.phone?.slice(0, 20) ?? "";

  let order = null;
  let notFoundMsg = false;
  if (orderQ && phoneQ) {
    const found = await db.order.findUnique({
      where: { number: normaliseOrderNumber(orderQ) },
      include: { items: true, history: { orderBy: { createdAt: "asc" } } },
    });
    if (found && phonesMatch(found.phone, phoneQ)) order = found;
    else notFoundMsg = true;
  }

  return (
    <div className="container-x max-w-4xl py-14 lg:py-20">
      <div className="text-center">
        <p className="eyebrow">Customer care</p>
        <h1 className="h-display mt-3 text-4xl sm:text-5xl">Track your order</h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-ink-soft">Enter your order number and the mobile number used at checkout.</p>
      </div>

      <form method="get" className="mx-auto mt-10 grid max-w-2xl gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="order" className="label">Order number</label>
          <input id="order" name="order" defaultValue={orderQ} placeholder="MV-10042" className="input" required />
        </div>
        <div>
          <label htmlFor="phone" className="label">Mobile number</label>
          <input id="phone" name="phone" type="tel" defaultValue={phoneQ} placeholder="0300 1234567" className="input" required />
        </div>
        <button className="btn-primary self-end">
          <Search className="size-4" /> Track
        </button>
      </form>

      {notFoundMsg && (
        <p role="alert" className="mx-auto mt-8 max-w-2xl border border-line bg-white/60 px-5 py-4 text-center text-sm">
          We couldn't find an order matching those details. Check the number on your confirmation, or{" "}
          <a href={whatsappLink(`Hi, I need help tracking order ${orderQ}`)} target="_blank" rel="noopener" className="link-u">message us on WhatsApp</a>.
        </p>
      )}

      {order && (
        <div className="mt-14 grid gap-8 md:grid-cols-[1fr_1fr]">
          <div className="border border-line bg-white/60 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Order {order.number}</p>
                <p className="mt-1 text-xs text-stone">Placed {formatDate(order.createdAt)}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="mt-8">
              <OrderTimeline status={order.status} history={order.history} courier={order.courier} trackingNumber={order.trackingNumber} />
            </div>
          </div>
          <div className="border border-line bg-white/60 p-6">
            <h2 className="font-display text-2xl">Items</h2>
            <OrderSummaryList order={order} />
            <Link href={`/receipt/${order.number}?phone=${encodeURIComponent(phoneQ)}`} className="btn-outline mt-6 w-full">View receipt</Link>
          </div>
        </div>
      )}
    </div>
  );
}
