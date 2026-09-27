import "server-only";
import { db } from "@/lib/db";
import { pkr } from "@/lib/format";
import { site } from "@/lib/site";
import { sendWhatsApp, type SendResult } from "./whatsapp";
import { sendEmail } from "./email";
import type { Order, OrderItem, OrderStatus } from "@/generated/prisma/client";

type OrderWithItems = Order & { items: OrderItem[] };

const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);

async function log(channel: string, recipient: string, event: string, message: string, r: SendResult, orderId?: string) {
  if (!r.ok && !r.skipped) console.error(`[notify] ${channel} → ${recipient} failed: ${r.error}`);
  await db.notificationLog.create({
    data: {
      channel,
      recipient,
      event,
      message,
      orderId,
      status: r.ok ? "sent" : r.skipped ? "skipped" : "failed",
      error: r.ok ? null : r.error,
    },
  });
}

export function orderText(o: OrderWithItems) {
  const lines = o.items.map((i) => `• ${i.productName} — EU ${i.size} × ${i.quantity} = ${pkr(i.unitPrice * i.quantity)}`);
  return [
    `🛍️ *New Montevro order ${o.number}*`,
    ``,
    ...lines,
    ``,
    `Subtotal: ${pkr(o.subtotal)}`,
    o.discount ? `Discount${o.couponCode ? ` (${o.couponCode})` : ""}: -${pkr(o.discount)}` : null,
    `Shipping: ${o.shippingFee ? pkr(o.shippingFee) : "Free"}`,
    `*Total: ${pkr(o.total)}* (${o.paymentMethod === "COD" ? "Cash on delivery" : o.paymentMethod.replace("_", " ")})`,
    ``,
    `👤 ${o.customerName}`,
    `📞 ${o.phone}`,
    `📍 ${o.addressLine1}${o.addressLine2 ? ", " + o.addressLine2 : ""}, ${o.city}`,
    o.notes ? `📝 ${o.notes}` : null,
    ``,
    `${site.url}/admin/orders/${o.id}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

/** Never throws; every attempt is written to NotificationLog (visible in Admin → Settings). */
export async function notifyNewOrder(order: OrderWithItems) {
  const text = orderText(order);
  const tasks: Promise<unknown>[] = [];

  const adminWa = process.env.WHATSAPP_ADMIN_NUMBER || site.whatsapp;
  tasks.push(sendWhatsApp(adminWa, text).then((r) => log("whatsapp", adminWa, "order.created", text, r, order.id)));

  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (adminEmail) {
    const html = `<pre style="font:14px/1.5 system-ui">${esc(text)}</pre>`;
    tasks.push(
      sendEmail(adminEmail, `New order ${order.number} — ${pkr(order.total)}`, html).then((r) =>
        log("email", adminEmail, "order.created", `New order ${order.number}`, r, order.id),
      ),
    );
  }

  if (order.email) {
    tasks.push(
      sendEmail(order.email, `Your Montevro order ${order.number} is confirmed`, customerEmailHtml(order)).then((r) =>
        log("email", order.email!, "order.customer_receipt", `Receipt ${order.number}`, r, order.id),
      ),
    );
  }

  const results = await Promise.allSettled(tasks);
  for (const r of results) if (r.status === "rejected") console.error("[notify] order.created:", r.reason);
}

const STATUS_COPY: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "has been confirmed",
  SHIPPED: "is on its way",
  DELIVERED: "has been delivered",
  CANCELLED: "has been cancelled",
};

export async function notifyStatusChange(order: Order, status: OrderStatus) {
  const copy = STATUS_COPY[status];
  if (!copy || !order.email) return;
  const track = `${site.url}/track?order=${order.number}`;
  const extra =
    status === "SHIPPED" && order.trackingNumber ? `<p>Courier: ${esc(order.courier ?? "")} — Tracking #${esc(order.trackingNumber)}</p>` : "";
  const r = await sendEmail(
    order.email,
    `Order ${order.number} ${copy}`,
    `<p>Hi ${esc(order.customerName)},</p><p>Your order <b>${order.number}</b> ${copy}.</p>${extra}<p><a href="${track}">Track your order</a></p><p>— Montevro</p>`,
  );
  await log("email", order.email, `order.${status.toLowerCase()}`, `Order ${order.number} ${copy}`, r, order.id);
}

export async function sendTestWhatsApp() {
  const to = process.env.WHATSAPP_ADMIN_NUMBER || site.whatsapp;
  const text = "✅ Montevro test: WhatsApp order alerts are working.";
  const r = await sendWhatsApp(to, text);
  await log("whatsapp", to, "test", text, r);
  return r;
}

function customerEmailHtml(o: OrderWithItems) {
  const rows = o.items
    .map((i) => `<tr><td>${esc(i.productName)} (EU ${i.size}) × ${i.quantity}</td><td align="right">${pkr(i.unitPrice * i.quantity)}</td></tr>`)
    .join("");
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#1c1917">
  <h1 style="letter-spacing:.2em;font-weight:400">MONTEVRO</h1>
  <p>Thank you, ${esc(o.customerName)}. We've received your order <b>${o.number}</b>.</p>
  <table width="100%" cellpadding="6" style="border-collapse:collapse;font-family:system-ui;font-size:14px">${rows}
  <tr><td>Shipping</td><td align="right">${o.shippingFee ? pkr(o.shippingFee) : "Free"}</td></tr>
  ${o.discount ? `<tr><td>Discount</td><td align="right">-${pkr(o.discount)}</td></tr>` : ""}
  <tr><td><b>Total</b></td><td align="right"><b>${pkr(o.total)}</b></td></tr></table>
  <p style="font-family:system-ui;font-size:14px">Track your order any time: <a href="${site.url}/track?order=${o.number}">${site.url}/track</a></p></div>`;
}
