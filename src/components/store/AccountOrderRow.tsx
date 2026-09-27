import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatDate, pkr } from "@/lib/format";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { Order, OrderItem } from "@/generated/prisma/client";

export function AccountOrderRow({ order }: { order: Order & { items: OrderItem[] } }) {
  const pairs = order.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <Link href={`/account/orders/${order.number}`} className="group flex items-center gap-4 border border-line bg-white/60 p-4 transition-colors hover:border-ink sm:p-5">
      <div className="flex -space-x-4">
        {order.items.slice(0, 3).map((i) => (
          <div key={i.id} className="relative aspect-[4/5] w-12 overflow-hidden border-2 border-ivory bg-cream sm:w-14">
            {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-cover" />}
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm font-medium">{order.number}</p>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 truncate text-xs text-stone">
          {formatDate(order.createdAt)} · {pairs} {pairs === 1 ? "pair" : "pairs"} · {pkr(order.total)}
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-stone transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
