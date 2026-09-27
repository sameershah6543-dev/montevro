import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AccountNav } from "@/components/store/AccountNav";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  return (
    <div className="container-x py-10 lg:py-16">
      <p className="eyebrow">My account</p>
      <h1 className="h-display mt-2 text-4xl sm:text-5xl">Hello, {user.name.split(" ")[0]}</h1>
      <div className="mt-8 grid gap-8 lg:mt-12 lg:grid-cols-[220px_1fr] lg:gap-14">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
