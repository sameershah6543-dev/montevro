import Image from "next/image";
import { pkr } from "@/lib/format";
import type { Order, OrderItem } from "@/generated/prisma/client";

export function OrderSummaryList({ order }: { order: Order & { items: OrderItem[] } }) {
  return (
    <div>
      <ul className="divide-y divide-line">
        {order.items.map((i) => (
          <li key={i.id} className="flex gap-4 py-4">
            <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-cream">
              {i.image && <Image src={i.image} alt={i.productName} fill sizes="64px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">{i.productName}</p>
              <p className="mt-0.5 text-xs text-stone">EU {i.size} · Qty {i.quantity}</p>
            </div>
            <p className="text-sm">{pkr(i.unitPrice * i.quantity)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-3 space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{pkr(order.subtotal)}</dd></div>
        {order.discount > 0 && (
          <div className="flex justify-between text-success"><dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>-{pkr(order.discount)}</dd></div>
        )}
        <div className="flex justify-between"><dt>Shipping</dt><dd>{order.shippingFee ? pkr(order.shippingFee) : "Free"}</dd></div>
        <div className="flex justify-between border-t border-line pt-3 text-base font-medium"><dt>Total</dt><dd>{pkr(order.total)}</dd></div>
      </dl>
    </div>
  );
}

export const PAYMENT_LABEL = { COD: "Cash on delivery", BANK_TRANSFER: "Bank transfer", CARD: "Card" } as const;
