import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, isAdminRole } from "@/lib/auth";
import { AuthShell } from "@/components/store/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const session = await getSession();
  if (session) redirect(next?.startsWith("/") && !next.startsWith("//") ? next : isAdminRole(session.role) ? "/admin" : "/account");
  return (
    <AuthShell eyebrow="Welcome back" title="Sign in" image="/products/black-chelsea-round-3.jpg">
      <LoginForm next={next ?? ""} />
    </AuthShell>
  );
}
