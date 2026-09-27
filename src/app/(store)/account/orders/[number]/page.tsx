import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { whatsappLink } from "@/lib/site";
import { OrderTimeline } from "@/components/store/OrderTimeline";
import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { OrderSummaryList, PAYMENT_LABEL } from "@/components/store/OrderSummaryList";

export default async function AccountOrderDetail({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const user = await requireUser("/account/orders");
  const order = await db.order.findFirst({
    where: { number: decodeURIComponent(number), userId: user.id },
    include: { items: true, history: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();

  return (
    <div>
      <Link href="/account/orders" className="link-u text-xs uppercase tracking-widest">← All orders</Link>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl">{order.number}</h2>
          <p className="text-xs text-stone">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="border border-line bg-white/60 p-6">
          <p className="eyebrow mb-6">Progress</p>
          <OrderTimeline status={order.status} history={order.history} courier={order.courier} trackingNumber={order.trackingNumber} />
        </div>
        <div className="border border-line bg-white/60 p-6">
          <p className="eyebrow">Items</p>
          <OrderSummaryList order={order} />
        </div>
        <div className="grid gap-6 border border-line bg-white/60 p-6 text-sm sm:grid-cols-2 xl:col-span-2">
          <div>
            <p className="eyebrow">Delivery address</p>
            <p className="mt-2 leading-relaxed">
              {order.customerName}<br />
              {order.addressLine1}{order.addressLine2 ? `, ${order.addressLine2}` : ""}<br />
              {order.city}{order.province ? `, ${order.province}` : ""}<br />
              {order.phone}
            </p>
          </div>
          <div>
            <p className="eyebrow">Payment</p>
            <p className="mt-2">{PAYMENT_LABEL[order.paymentMethod]}</p>
            <p className="text-stone">{order.paymentStatus === "PAID" ? "Paid" : order.paymentStatus === "REFUNDED" ? "Refunded" : "Unpaid"}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={`/receipt/${order.number}`} className="btn-outline">View receipt</Link>
        <a href={whatsappLink(`Hi Montevro, I have a question about order ${order.number}.`)} target="_blank" rel="noopener" className="btn-outline">
          <MessageCircle className="size-4" /> Need help?
        </a>
      </div>
    </div>
  );
}
