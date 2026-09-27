import clsx from "clsx";
import { STATUS_LABEL } from "@/lib/orders";
import type { OrderStatus } from "@/generated/prisma/client";

const TONE: Record<OrderStatus, string> = {
  PENDING: "bg-sand text-ink",
  CONFIRMED: "bg-cream text-cognac border border-cognac/30",
  PROCESSING: "bg-cream text-cognac border border-cognac/30",
  SHIPPED: "bg-ink text-ivory",
  DELIVERED: "bg-success/10 text-success border border-success/30",
  CANCELLED: "bg-danger/10 text-danger border border-danger/30",
  RETURNED: "bg-warning/10 text-warning border border-warning/30",
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={clsx("inline-block px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em]", TONE[status], className)}>
      {STATUS_LABEL[status]}
    </span>
  );
}
