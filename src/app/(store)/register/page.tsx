import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthShell } from "@/components/store/AuthShell";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getSession()) redirect("/account");
  return (
    <AuthShell eyebrow="Join Montevro" title="Create account" image="/products/brown-round-chelsea-4.jpg">
      <RegisterForm next={next ?? ""} />
    </AuthShell>
  );
}
