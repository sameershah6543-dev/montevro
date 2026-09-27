import clsx from "clsx";
import { Check, X } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { STATUS_FLOW, STATUS_LABEL } from "@/lib/orders";
import type { OrderStatus } from "@/generated/prisma/client";

const STEP_COPY: Record<OrderStatus, string> = {
  PENDING: "We've received your order.",
  CONFIRMED: "Your order is confirmed.",
  PROCESSING: "Your pair is being prepared and packed.",
  SHIPPED: "Handed to the courier.",
  DELIVERED: "Delivered. Enjoy your new pair.",
  CANCELLED: "This order was cancelled.",
  RETURNED: "This order was returned.",
};

export function OrderTimeline({
  status,
  history,
  courier,
  trackingNumber,
}: {
  status: OrderStatus;
  history: { status: OrderStatus; createdAt: Date; note?: string | null }[];
  courier?: string | null;
  trackingNumber?: string | null;
}) {
  const reached = new Map<OrderStatus, Date>();
  for (const h of history) if (!reached.has(h.status)) reached.set(h.status, h.createdAt);

  const isVoid = status === "CANCELLED" || status === "RETURNED";
  const currentIdx = STATUS_FLOW.indexOf(status);
  // Highest step reached before voiding
  const lastIdx = isVoid ? Math.max(0, ...STATUS_FLOW.map((s, i) => (reached.has(s) ? i : 0))) : currentIdx;

  const steps: { status: OrderStatus; done: boolean; current: boolean; date?: Date }[] = STATUS_FLOW.map((s, i) => ({
    status: s,
    done: i <= lastIdx,
    current: !isVoid && i === currentIdx,
    date: reached.get(s),
  }));
  const visible = isVoid ? steps.filter((s) => s.done) : steps;

  return (
    <ol className="relative">
      {visible.map((s, i) => (
        <li key={s.status} className="relative flex gap-4 pb-7 last:pb-0">
          {(i < visible.length - 1 || isVoid) && (
            <span className={clsx("absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-px", s.done ? "bg-ink" : "bg-line")} aria-hidden />
          )}
          <span
            className={clsx(
              "relative z-10 grid size-6 shrink-0 place-items-center rounded-full border",
              s.done ? "border-ink bg-ink text-ivory" : "border-line bg-ivory text-stone",
              s.current && "ring-4 ring-cognac/20",
            )}
          >
            {s.done ? <Check className="size-3.5" /> : <span className="size-1.5 rounded-full bg-line" />}
          </span>
          <div className="-mt-0.5 min-w-0">
            <p className={clsx("text-sm", s.done ? "font-medium" : "text-stone")}>{STATUS_LABEL[s.status]}</p>
            {s.done && <p className="text-xs text-stone">{STEP_COPY[s.status]}</p>}
            {s.date && <p className="mt-0.5 text-xs text-stone">{formatDateTime(s.date)}</p>}
            {s.status === "SHIPPED" && s.done && trackingNumber && (
              <p className="mt-1.5 text-xs">
                {courier ? `${courier} · ` : ""}Tracking <span className="font-medium">#{trackingNumber}</span>
              </p>
            )}
          </div>
        </li>
      ))}
      {isVoid && (
        <li className="relative flex gap-4">
          <span className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full border border-danger bg-danger text-ivory">
            <X className="size-3.5" />
          </span>
          <div className="-mt-0.5">
            <p className="text-sm font-medium text-danger">{STATUS_LABEL[status]}</p>
            <p className="text-xs text-stone">{STEP_COPY[status]}</p>
            {reached.get(status) && <p className="mt-0.5 text-xs text-stone">{formatDateTime(reached.get(status)!)}</p>}
          </div>
        </li>
      )}
    </ol>
  );
}
