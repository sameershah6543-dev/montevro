import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { lowStockVariants } from "@/lib/inventory";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin | Montevro" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [pendingOrders, low, unreadMessages] = await Promise.all([
    db.order.count({ where: { status: "PENDING" } }),
    lowStockVariants(500),
    db.contactMessage.count({ where: { handled: false } }),
  ]);
  return (
    <AdminShell userName={user.name} badges={{ pendingOrders, lowStock: low.length, unreadMessages }}>
      {children}
    </AdminShell>
  );
}
