import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, MessageCircle, Phone } from "lucide-react";
import { Card, Field, PageHeader, Pill, StatusBadge, adminInput, smallBtn } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { addOrderNote, changeOrderStatus, updatePayment, updateShipping } from "@/lib/actions/admin-orders";
import { db } from "@/lib/db";
import { formatDateTime, pkr } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/orders";
import { normalisePhone } from "@/lib/notify/whatsapp";
import { site } from "@/lib/site";
import type { OrderStatus } from "@/generated/prisma/client";

export const metadata = { title: "Order" };

const COURIERS = ["TCS", "Leopards", "M&P", "PostEx", "Trax", "BlueEx", "Call Courier", "Pakistan Post", "Self delivery"];

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      history: { orderBy: { createdAt: "desc" } },
      notifications: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, email: true } },
    },
  });
  if (!order) notFound();

  const cost = order.items.reduce((s, i) => s + i.unitCost * i.quantity, 0);
  const itemsRevenue = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const grossProfit = order.total - order.shippingFee - cost;
  const waText = `Assalam-o-Alaikum ${order.customerName}, this is Montevro regarding your order ${order.number} (${pkr(order.total)}). `;
  const waHref = `https://wa.me/${normalisePhone(order.phone)}?text=${encodeURIComponent(waText)}`;
  const statuses = Object.keys(STATUS_LABEL) as OrderStatus[];

  return (
    <>
      <Link href="/admin/orders" className="mb-3 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-stone hover:text-ink">
        <ArrowLeft className="size-3.5" /> Orders
      </Link>
      <PageHeader
        title={`Order ${order.number}`}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <Pill tone={order.paymentStatus === "PAID" ? "good" : order.paymentStatus === "REFUNDED" ? "bad" : "warn"}>
              {order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentMethod.replace("_", " ").toLowerCase()} · {order.paymentStatus.toLowerCase()}
            </Pill>
            <span>Placed {formatDateTime(order.createdAt)}</span>
          </span>
        }
        actions={
          <>
            <a href={waHref} target="_blank" rel="noopener" className={smallBtn}>
              <MessageCircle className="size-3.5" /> WhatsApp customer
            </a>
            <Link href={`/admin/orders/${order.id}/invoice`} className={smallBtn}>
              <FileText className="size-3.5" /> Invoice / receipt
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card title="Items" bodyClassName="p-0 sm:p-0">
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex gap-4 px-4 py-4 sm:px-5">
                  <div className="relative size-16 shrink-0 overflow-hidden bg-cream">
                    {i.image && <Image src={i.image} alt={i.productName} fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{i.productName}</p>
                    <p className="text-xs text-stone">EU {i.size} · Qty {i.quantity}</p>
                    <p className="mt-1 text-xs text-stone">
                      Price {pkr(i.unitPrice)} · Cost {pkr(i.unitCost)} · Profit{" "}
                      <span className="text-ink">{pkr((i.unitPrice - i.unitCost) * i.quantity)}</span>
                    </p>
                  </div>
                  <p className="shrink-0 text-sm tabular-nums">{pkr(i.unitPrice * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-line px-4 py-4 text-sm sm:px-5">
              <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd className="tabular-nums">{pkr(order.subtotal)}</dd></div>
              {order.discount > 0 && (
                <div className="flex justify-between"><dt className="text-stone">Discount {order.couponCode && `(${order.couponCode})`}</dt><dd className="tabular-nums">−{pkr(order.discount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-stone">Shipping</dt><dd className="tabular-nums">{order.shippingFee ? pkr(order.shippingFee) : "Free"}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-medium"><dt>Total</dt><dd className="tabular-nums">{pkr(order.total)}</dd></div>
              <div className="flex justify-between pt-1 text-xs text-stone">
                <dt>Cost of goods {pkr(cost)} · Items {pkr(itemsRevenue)}</dt>
                <dd className="tabular-nums">Gross profit {pkr(grossProfit)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Timeline">
            <ol className="relative space-y-4 border-l border-line pl-5">
              {order.history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-white bg-ink" aria-hidden />
                  <p className="text-sm">
                    <span className="font-medium">{STATUS_LABEL[h.status]}</span>
                    {h.note && <span className="text-ink-soft"> — {h.note}</span>}
                  </p>
                  <p className="text-xs text-stone">{formatDateTime(h.createdAt)}</p>
                </li>
              ))}
            </ol>
            <ActionForm action={addOrderNote} resetOnSuccess className="mt-5 flex flex-col gap-2 sm:flex-row">
              <input type="hidden" name="orderId" value={order.id} />
              <input name="note" placeholder="Add an internal note (not shown to the customer)" className={adminInput} maxLength={500} />
              <SubmitButton variant="small">Add note</SubmitButton>
            </ActionForm>
          </Card>

          <Card title="Notifications">
            {order.notifications.length === 0 ? (
              <p className="text-sm text-stone">No notifications sent for this order.</p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {order.notifications.map((n) => (
                  <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span className="min-w-0">
                      <span className="font-medium capitalize">{n.channel}</span> <span className="text-stone">→ {n.recipient} · {n.event}</span>
                      {n.error && <span className="block text-xs text-danger">{n.error}</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      <Pill tone={n.status === "sent" ? "good" : n.status === "failed" ? "bad" : "neutral"}>{n.status}</Pill>
                      <span className="text-xs text-stone">{formatDateTime(n.createdAt)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Update status">
            <ActionForm action={changeOrderStatus} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <Field label="Status">
                <select key={order.status} name="status" defaultValue={order.status} className={adminInput}>
                  {statuses.map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Note (optional)">
                <input name="note" className={adminInput} maxLength={500} placeholder="e.g. Confirmed on call" />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="notify" value="1" defaultChecked={!!order.email} disabled={!order.email} />
                Email the customer {order.email ? "" : "(no email on order)"}
              </label>
              <p className="text-xs text-stone">Cancelling or returning puts the stock back automatically.</p>
              <SubmitButton className="w-full">Save status</SubmitButton>
            </ActionForm>
          </Card>

          <Card title="Customer">
            <p className="text-sm font-medium">{order.customerName}</p>
            <p className="mt-1 text-sm">
              <a href={`tel:${order.phone}`} className="inline-flex items-center gap-1.5 hover:text-cognac"><Phone className="size-3.5" /> {order.phone}</a>
            </p>
            {order.email && <p className="mt-1 break-all text-sm text-ink-soft">{order.email}</p>}
            <p className="mt-1 text-xs text-stone">{order.user ? "Registered customer" : "Guest checkout"}</p>
            <div className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-ink-soft">
              <p>{order.addressLine1}</p>
              {order.addressLine2 && <p>{order.addressLine2}</p>}
              <p>{[order.city, order.province, order.postalCode].filter(Boolean).join(", ")}</p>
            </div>
            {order.notes && <p className="mt-3 border-l-2 border-cognac bg-cream/50 px-3 py-2 text-sm">“{order.notes}”</p>}
          </Card>

          <Card title="Shipping">
            <ActionForm action={updateShipping} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <Field label="Courier">
                <input name="courier" list="couriers" defaultValue={order.courier ?? ""} className={adminInput} placeholder="TCS, Leopards…" />
                <datalist id="couriers">{COURIERS.map((c) => <option key={c} value={c} />)}</datalist>
              </Field>
              <Field label="Tracking number">
                <input name="trackingNumber" defaultValue={order.trackingNumber ?? ""} className={adminInput} />
              </Field>
              <SubmitButton variant="small" className="w-full">Save shipping</SubmitButton>
            </ActionForm>
            <p className="mt-3 text-xs text-stone">
              Customer tracking page: <a className="underline" href={`${site.url}/track?order=${order.number}`} target="_blank" rel="noopener">/track?order={order.number}</a>
            </p>
          </Card>

          <Card title="Payment">
            <ActionForm action={updatePayment} className="flex gap-2">
              <input type="hidden" name="orderId" value={order.id} />
              <select key={order.paymentStatus} name="paymentStatus" defaultValue={order.paymentStatus} className={adminInput} aria-label="Payment status">
                <option value="UNPAID">Unpaid</option>
                <option value="PAID">Paid</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <SubmitButton variant="small">Save</SubmitButton>
            </ActionForm>
            <p className="mt-2 text-xs text-stone">COD orders are marked paid automatically when delivered.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
